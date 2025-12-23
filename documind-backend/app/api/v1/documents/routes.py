"""
Document upload and management API routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Depends, Body, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse, Response
from typing import Optional, List
from pydantic import Field
import os
import time
import glob
import structlog
from pathlib import Path
from datetime import datetime

from app.core.config import settings
from app.core.dependencies import require_auth
from app.workers.tasks import process_document_async, security_scan_async
from app.database.models import Document as DocumentModel, Tag as TagModel
from app.utils.activity_logger import log_activity
from app.services.storage import get_storage_service, StorageService
from .schemas import (
    DocumentUploadResponse, 
    DocumentResponse,
    DocumentUpdate,
    DocumentInsightsResponse,
    DocumentSummaryResponse,
    DocumentEntitiesResponse,
    DocumentComparisonResponse,
    ComparisonSimilarityResponse,
    ComparisonDifferenceResponse,
    ComparisonExampleResponse,
    ComparisonDifferenceDocumentResponse
)
from app.api.v1.tags.schemas import TagAssignRequest
from app.services.retrieval import RetrievalService
from app.services.llm import LLMService
from app.services.generation import GenerationService
from app.services.generation.exceptions import GenerationError

logger = structlog.get_logger(__name__)

router = APIRouter()


def get_storage() -> StorageService:
    """Dependency to get storage service instance"""
    return get_storage_service(
        provider=settings.STORAGE_PROVIDER,
        base_path=settings.STORAGE_BASE_PATH,
        endpoint=settings.STORAGE_ENDPOINT,
        access_key=settings.STORAGE_ACCESS_KEY,
        secret_key=settings.STORAGE_SECRET_KEY,
        bucket_name=settings.STORAGE_BUCKET_NAME,
        secure=settings.STORAGE_SECURE,
        region=settings.STORAGE_REGION
    )


async def _get_user_document(document_id: str, user_id: str) -> DocumentModel:
    """Helper to get a document that belongs to a specific user"""
    from bson import ObjectId
    
    # Try to convert document_id to ObjectId if it's a valid ObjectId string
    try:
        doc_object_id = ObjectId(document_id)
        doc = await DocumentModel.find_one(
            DocumentModel.id == doc_object_id,
            DocumentModel.uploaded_by == user_id
        )
    except (ValueError, TypeError):
        # If not a valid ObjectId, try string match
        doc = await DocumentModel.find_one(
            DocumentModel.id == document_id,
            DocumentModel.uploaded_by == user_id
        )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload document",
    description="Upload a document file and trigger processing pipeline"
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    current_user: dict = Depends(require_auth),
):
    """
    Upload a document file and start processing pipeline
    
    Args:
        file: The document file to upload
        project_id: Optional project ID to associate with the document
        
    Returns:
        DocumentUploadResponse with document metadata
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Get file extension
        file_ext = Path(file.filename).suffix.lower().lstrip('.')
        
        # Validate file type
        allowed_extensions = settings.ALLOWED_EXTENSIONS
        if isinstance(allowed_extensions, str):
            allowed_extensions = [ext.strip() for ext in allowed_extensions.split(",")]
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size {file_size} exceeds maximum allowed size {settings.MAX_UPLOAD_SIZE}"
            )
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        user_id = current_user["id"]
        
        # Validate project_id if provided (must belong to user)
        # Handle empty string, "null" string, or None
        validated_project_id = None
        if project_id and project_id.strip() and project_id.lower() != "null":
            from app.database.models import Project as ProjectModel
            from bson import ObjectId
            
            project_id_clean = project_id.strip()
            logger.info(
                "validating_project_for_upload",
                project_id=project_id_clean,
                user_id=user_id
            )
            
            # Try to convert project_id to ObjectId if it's a valid ObjectId string
            try:
                project_object_id = ObjectId(project_id_clean)
                # Try with ObjectId first
                project = await ProjectModel.find_one(
                    ProjectModel.id == project_object_id,
                    ProjectModel.created_by == user_id
                )
                # If not found, try with string comparison for created_by
                if not project:
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_object_id,
                        ProjectModel.created_by == str(user_id)
                    )
            except (ValueError, TypeError) as e:
                logger.warning(
                    "project_id_not_valid_objectid",
                    project_id=project_id_clean,
                    error=str(e)
                )
                # If not a valid ObjectId, try string match
                project = await ProjectModel.find_one(
                    ProjectModel.id == project_id_clean,
                    ProjectModel.created_by == user_id
                )
                # If still not found, try with string comparison for created_by
                if not project:
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_id_clean,
                        ProjectModel.created_by == str(user_id)
                    )
            
            if not project:
                # Log all projects for this user for debugging
                user_projects = await ProjectModel.find(
                    ProjectModel.created_by == user_id
                ).to_list()
                logger.error(
                    "project_not_found_for_upload",
                    requested_project_id=project_id_clean,
                    user_id=user_id,
                    user_project_ids=[str(p.id) for p in user_projects]
                )
                raise HTTPException(
                    status_code=404,
                    detail="Project not found or access denied"
                )
            # Use the validated project_id (keep original format)
            validated_project_id = project_id_clean
            logger.info(
                "project_validated_for_upload",
                project_id=validated_project_id,
                project_name=project.name
            )
        
        # Store document metadata in MongoDB first to get the ID
        document = DocumentModel(
            name=file.filename,
            status="processing",
            uploaded_by=user_id,
            size=file_size,
            type=file_ext,
            project_id=validated_project_id,
            file_path=None,  # Will be set after saving
            tags=[],  # Initialize empty tags list
            metadata={}
        )
        await document.insert()
        document_id = str(document.id)
        
        # Get storage service
        storage = get_storage()
        
        # Generate storage path (use document_id as prefix for organization)
        storage_path = f"{document_id}/{file.filename}"
        
        # Upload file to storage (local, MinIO, S3, or R2)
        stored_path = await storage.upload_file(
            file_content=file_content,
            file_path=storage_path,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Update document with storage path
        document.file_path = stored_path
        await document.save()
        
        logger.info(
            "document_uploaded",
            document_id=document_id,
            filename=file.filename,
            size=file_size,
            file_type=file_ext,
            storage_path=stored_path,
            storage_provider=settings.STORAGE_PROVIDER
        )
        
        # Log activity
        await log_activity(
            activity_type="upload",
            title="New document uploaded",
            description=f"{file.filename} was uploaded",
            user_id=user_id,
            organization_id=current_user.get("organization_id"),
            document_id=document_id,
            project_id=validated_project_id,
            status="success",
            metadata={"filename": file.filename, "size": file_size, "type": file_ext}
        )
        
        # For background tasks, we need to download the file temporarily
        # or pass the storage service. For now, download it for processing.
        # In production, you might want to refactor workers to use storage service directly.
        temp_file_path = None
        if settings.STORAGE_PROVIDER != "local":
            # For cloud storage, download to temp file for processing
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
            temp_file_path = temp_file.name
            file_data = await storage.download_file(stored_path)
            temp_file.write(file_data)
            temp_file.close()
        else:
            # For local storage, use the actual path
            temp_file_path = os.path.join(settings.STORAGE_BASE_PATH, stored_path)
        
        # Start security scan in background
        background_tasks.add_task(
            security_scan_async,
            document_id=document_id,
            file_path=temp_file_path,
            metadata={"project_id": validated_project_id, "storage_path": stored_path}
        )
        
        # Start document processing in background (after security scan)
        # Note: In production, you'd want to wait for security scan to complete first
        background_tasks.add_task(
            process_document_async,
            document_id=document_id,
            file_path=temp_file_path,
            file_type=file_ext,
            metadata={"project_id": validated_project_id, "filename": file.filename, "storage_path": stored_path}
        )
        
        return DocumentUploadResponse(
            id=document_id,
            name=file.filename,
            status="processing",
            uploaded_at=document.uploaded_at,
            size=file_size,
            type=file_ext,
            project_id=validated_project_id,
            metadata={}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("document_upload_failed", error=str(e), filename=file.filename if file else None)
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")


def get_generation_service() -> GenerationService:
    """Dependency to get generation service instance"""
    retrieval_service = RetrievalService()
    llm_service = LLMService()
    generation_service = GenerationService(
        retrieval_service=retrieval_service,
        llm_service=llm_service
    )
    return generation_service


@router.get(
    "/{document_id}/insights",
    response_model=DocumentInsightsResponse,
    summary="Get document insights",
    description="Get AI-generated insights (summary, entities, suggested questions) for a document using RAG pipeline"
)
async def get_document_insights(
    document_id: str,
    generation_service: GenerationService = Depends(get_generation_service),
    current_user: dict = Depends(require_auth)
):
    """
    Get AI-generated insights for a document (filtered by authenticated user)
    
    Args:
        document_id: Document ID
        generation_service: Generation service instance
        
    Returns:
        DocumentInsightsResponse with summary, entities, and suggested questions
    """
    user_id = current_user["id"]
    doc = await _get_user_document(document_id, user_id)
    
    # Check if document is ready
    from app.workers.tasks import task_queue
    task_id = f"doc_process_{document_id}"
    task = task_queue.get_task(task_id)
    
    if task:
        task_status = task.get("status")
        if task_status != "completed":
            raise HTTPException(
                status_code=400, 
                detail=f"Document is not ready. Current status: {task_status}"
            )
    elif doc.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready. Current status: {doc.status}"
        )
    
    try:
        # Get collection name from settings (use the same pattern as query endpoint)
        collection_name = getattr(settings, "VECTOR_STORE_COLLECTION_PREFIX", "documind_documents")
        
        # Generate summary using RAG pipeline
        summary_data = await generation_service.generate_summary(
            document_id=document_id,
            collection_name=collection_name,
            top_k=20  # Retrieve more chunks for comprehensive summary
        )
        
        # Generate entities using RAG pipeline
        entities_data = await generation_service.generate_entities(
            document_id=document_id,
            collection_name=collection_name,
            top_k=100  # Increased to retrieve more chunks for comprehensive entity extraction
        )
        
        summary_response = DocumentSummaryResponse(
            executiveSummary=summary_data["executiveSummary"],
            keyPoints=summary_data["keyPoints"],
            generatedAt=summary_data["generatedAt"]
        )
        
        # Format entities response
        from app.api.v1.documents.schemas import EntityResponse, MonetaryEntityResponse
        
        entities_response = DocumentEntitiesResponse(
            organizations=[
                EntityResponse(**org) for org in entities_data.get("organizations", [])
            ],
            people=[
                EntityResponse(**person) for person in entities_data.get("people", [])
            ],
            dates=[
                EntityResponse(**date) for date in entities_data.get("dates", [])
            ],
            monetaryValues=[
                MonetaryEntityResponse(**monetary) for monetary in entities_data.get("monetaryValues", [])
            ],
            locations=[
                EntityResponse(**location) for location in entities_data.get("locations", [])
            ]
        )
        
        # Generate suggested questions (can be enhanced later)
        suggested_questions = [
            "What are the main topics discussed in this document?",
            "What are the key findings or conclusions?",
            "What recommendations are provided?",
            "What are the most important points to remember?"
        ]
        
        return DocumentInsightsResponse(
            summary=summary_response,
            entities=entities_response,
            suggestedQuestions=suggested_questions
        )
        
    except GenerationError as e:
        # Handle generation-specific errors (e.g., document not indexed)
        logger.warning("insights_generation_failed", error=str(e), document_id=document_id)
        error_message = str(e)
        if "No content found" in error_message:
            # Document not indexed yet
            raise HTTPException(
                status_code=404,
                detail=f"Document content not found. The document may not be indexed yet. "
                       f"Please wait for document processing to complete (status should be 'ready')."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate insights: {error_message}"
            )
    except Exception as e:
        logger.exception("insights_generation_failed", error=str(e), document_id=document_id)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document",
    description="Get document metadata by ID"
)
async def get_document(
    document_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Get document metadata (filtered by authenticated user)
    
    Args:
        document_id: Document ID
        
    Returns:
        DocumentResponse with document metadata
    """
    user_id = current_user["id"]
    from bson import ObjectId
    
    # Try to convert document_id to ObjectId if it's a valid ObjectId string
    try:
        doc_object_id = ObjectId(document_id)
        doc = await DocumentModel.find_one(
            DocumentModel.id == doc_object_id,
            DocumentModel.uploaded_by == user_id
        )
    except (ValueError, TypeError):
        # If not a valid ObjectId, try string match
        doc = await DocumentModel.find_one(
            DocumentModel.id == document_id,
            DocumentModel.uploaded_by == user_id
        )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check task status to get current processing status
    from app.workers.tasks import task_queue
    task_id = f"doc_process_{document_id}"
    task = task_queue.get_task(task_id)
    
    # Update status based on task (task is a dict)
    if task:
        task_status = task.get("status")
        if task_status == "completed":
            doc.status = "ready"
            await doc.save()
        elif task_status == "failed":
            doc.status = "error"
            await doc.save()
        elif task_status == "processing":
            doc.status = "processing"
            await doc.save()
    
    return DocumentResponse(
        id=str(doc.id),
        name=doc.name,
        status=doc.status,
        uploaded_at=doc.uploaded_at,
        uploaded_by=doc.uploaded_by,
        size=doc.size,
        type=doc.type,
        project_id=doc.project_id,
        tags=doc.tags,
        metadata=doc.metadata
    )


@router.options(
    "/{document_id}/download",
    summary="CORS preflight for document download"
)
async def download_document_options(request: Request):
    """Handle CORS preflight request"""
    origin = request.headers.get("origin")
    cors_origin = "*"
    if origin:
        allowed_origins = settings.CORS_ORIGINS
        if isinstance(allowed_origins, str):
            allowed_origins = [o.strip() for o in allowed_origins.split(",")]
        if origin in allowed_origins:
            cors_origin = origin
    
    return Response(
        content="",
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )


@router.get(
    "/{document_id}/download",
    summary="Download document",
    description="Download or view document file"
)
async def download_document(
    document_id: str,
    request: Request,
    current_user: dict = Depends(require_auth),
    storage: StorageService = Depends(get_storage)
):
    """
    Download or view document file (filtered by authenticated user)
    Returns signed URL for cloud storage or direct file for local storage
    
    Args:
        document_id: Document ID
        
    Returns:
        Redirect to signed URL (cloud storage) or File response (local storage)
    """
    user_id = current_user["id"]
    doc = await _get_user_document(document_id, user_id)
    
    if not doc.file_path:
        raise HTTPException(
            status_code=404,
            detail=f"Document file path not set for document {document_id}"
        )
    
    logger.info(
        "document_download_requested",
        document_id=document_id,
        document_name=doc.name,
        storage_path=doc.file_path,
        storage_provider=settings.STORAGE_PROVIDER
    )
    
    # Check if file exists in storage
    file_exists = await storage.file_exists(doc.file_path)
    if not file_exists:
        raise HTTPException(
            status_code=404,
            detail=f"Document file not found in storage: {doc.file_path}"
        )
    
    # For cloud storage (MinIO, S3, R2), return signed URL
    if settings.STORAGE_PROVIDER in ["minio", "s3", "r2"]:
        signed_url = await storage.get_signed_url(
            file_path=doc.file_path,
            expiration=settings.STORAGE_SIGNED_URL_EXPIRATION
        )
        
        logger.info(
            "signed_url_generated",
            document_id=document_id,
            storage_path=doc.file_path
        )
        
        # Redirect to signed URL
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=signed_url, status_code=302)
    
    # For local storage, download and serve file directly
    file_content = await storage.download_file(doc.file_path)
    
    # Determine media type based on file extension
    file_ext = Path(doc.name).suffix.lower()
    media_types = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.tiff': 'image/tiff',
        '.bmp': 'image/bmp',
    }
    media_type = media_types.get(file_ext, 'application/octet-stream')
    
    logger.info(
        "document_downloaded",
        document_id=document_id,
        filename=doc.name,
        storage_path=doc.file_path
    )
    
    # Get origin from request for CORS header
    origin = request.headers.get("origin")
    cors_origin = "*"
    if origin:
        # Check if origin is in allowed origins
        allowed_origins = settings.CORS_ORIGINS
        if isinstance(allowed_origins, str):
            allowed_origins = [o.strip() for o in allowed_origins.split(",")]
        if origin in allowed_origins:
            cors_origin = origin
    
    # Create response with explicit CORS headers
    # Use inline disposition to display in browser, not download
    # Remove Content-Disposition header entirely for PDFs to prevent forced downloads
    # Explicitly remove X-Frame-Options to allow embedding in iframes/embeds (needed for PDF viewer)
    headers = {
        "Content-Type": media_type,
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "Content-Type",
        "X-Content-Type-Options": "nosniff",  # Prevent MIME type sniffing
        "Cache-Control": "public, max-age=3600",  # Cache the PDF
    }
    
    # For PDFs, don't include Content-Disposition to allow inline viewing
    # Only add it for non-PDF files that should be downloaded
    if media_type != "application/pdf":
        headers["Content-Disposition"] = f'inline; filename="{doc.name}"'
    
    # Create response
    response = Response(
        content=file_content,
        media_type=media_type,
        headers=headers
    )
    
    # Explicitly remove X-Frame-Options header if middleware added it
    # This allows PDFs to be embedded in iframes/objects from different origins
    if "X-Frame-Options" in response.headers:
        del response.headers["X-Frame-Options"]
    
    return response


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document",
    description="Update document metadata (name, project_id)"
)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user: dict = Depends(require_auth)
):
    """
    Update document metadata (filtered by authenticated user)
    
    Args:
        document_id: Document ID
        document_update: Document update data
        
    Returns:
        Updated document
    """
    user_id = current_user["id"]
    doc = await DocumentModel.find_one(
        DocumentModel.id == document_id,
        DocumentModel.uploaded_by == user_id
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Update fields if provided
        if document_update.name is not None:
            doc.name = document_update.name
        
        # Handle project_id update (including None to remove from project)
        update_dict = document_update.model_dump(exclude_unset=True)
        if 'project_id' in update_dict:
            project_id_value = document_update.project_id
            # Validate project belongs to user if provided
            if project_id_value:
                from app.database.models import Project as ProjectModel
                project = await ProjectModel.find_one(
                    ProjectModel.id == project_id_value,
                    ProjectModel.created_by == user_id
                )
                if not project:
                    raise HTTPException(
                        status_code=404,
                        detail="Project not found or access denied"
                    )
            doc.project_id = project_id_value
        
        await doc.save()
        
        logger.info(
            "document_updated",
            document_id=document_id,
            name=doc.name,
            project_id=doc.project_id
        )
        
        return DocumentResponse(
            id=str(doc.id),
            name=doc.name,
            status=doc.status,
            uploaded_at=doc.uploaded_at,
            uploaded_by=doc.uploaded_by,
            size=doc.size,
            type=doc.type,
            project_id=doc.project_id,
            tags=doc.tags,
            metadata=doc.metadata
        )
    
    except Exception as e:
        logger.exception("document_update_failed", document_id=document_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update document: {str(e)}"
        )


@router.get(
    "/",
    summary="List documents",
    description="List all documents with optional filtering"
)
async def list_documents(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_auth)
):
    """
    List documents with optional filtering (filtered by authenticated user)
    
    Args:
        project_id: Optional project ID filter (use "null" or empty string to filter for documents with no project)
        status: Optional status filter (processing, ready, error)
        
    Returns:
        List of documents
    """
    user_id = current_user["id"]
    
    # Build query using Beanie query builder (always filter by user)
    if project_id is not None:
        # Handle explicit None/null filtering
        if project_id == "null" or project_id == "":
            # Filter for documents with no project (project_id is None) for this user
            documents = await DocumentModel.find(
                DocumentModel.uploaded_by == user_id,
                DocumentModel.project_id == None
            ).to_list()
        else:
            # Validate project belongs to user
            from app.database.models import Project as ProjectModel
            from bson import ObjectId
            
            project_id_clean = project_id.strip() if project_id else project_id
            
            # Try to convert project_id to ObjectId if it's a valid ObjectId string
            try:
                project_object_id = ObjectId(project_id_clean)
                # Try with ObjectId first
                project = await ProjectModel.find_one(
                    ProjectModel.id == project_object_id,
                    ProjectModel.created_by == user_id
                )
                # If not found, try with string comparison for created_by
                if not project:
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_object_id,
                        ProjectModel.created_by == str(user_id)
                    )
                # Use ObjectId for document query
                filter_project_id = project_object_id
            except (ValueError, TypeError):
                # If not a valid ObjectId, try string match
                project = await ProjectModel.find_one(
                    ProjectModel.id == project_id_clean,
                    ProjectModel.created_by == user_id
                )
                # If still not found, try with string comparison for created_by
                if not project:
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_id_clean,
                        ProjectModel.created_by == str(user_id)
                    )
                # Use string for document query
                filter_project_id = project_id_clean
            
            if not project:
                # Log all projects for this user for debugging
                user_projects = await ProjectModel.find(
                    ProjectModel.created_by == user_id
                ).to_list()
                logger.error(
                    "project_not_found_for_list",
                    requested_project_id=project_id_clean,
                    user_id=user_id,
                    user_project_ids=[str(p.id) for p in user_projects]
                )
                raise HTTPException(
                    status_code=404,
                    detail="Project not found or access denied"
                )
            
            # Filter for specific project and user
            # Try both ObjectId and string matching for project_id in documents
            try:
                documents = await DocumentModel.find(
                    DocumentModel.uploaded_by == user_id,
                    DocumentModel.project_id == filter_project_id
                ).to_list()
            except Exception:
                # Fallback: try string comparison
                documents = await DocumentModel.find(
                    DocumentModel.uploaded_by == user_id,
                    DocumentModel.project_id == project_id_clean
                ).to_list()
    else:
        # No project filter - get all documents for this user
        documents = await DocumentModel.find(
            DocumentModel.uploaded_by == user_id
        ).to_list()
    
    # Apply status filter if provided
    if status:
        documents = [doc for doc in documents if doc.status == status]
    
    # Update status from task queue
    from app.workers.tasks import task_queue
    for doc in documents:
        task_id = f"doc_process_{str(doc.id)}"
        task = task_queue.get_task(task_id)
        if task:
            # task is a dict, so access with bracket notation
            task_status = task.get("status")
            if task_status == "completed" and doc.status != "ready":
                doc.status = "ready"
                await doc.save()
            elif task_status == "failed" and doc.status != "error":
                doc.status = "error"
                await doc.save()
            elif task_status == "processing" and doc.status != "processing":
                doc.status = "processing"
                await doc.save()
    
    return {
        "documents": [
            DocumentResponse(
                id=str(d.id),
                name=d.name,
                status=d.status,
                uploaded_at=d.uploaded_at,
                uploaded_by=d.uploaded_by,
                size=d.size,
                type=d.type,
                project_id=d.project_id,
                tags=d.tags,
                metadata=d.metadata
            )
            for d in documents
        ],
        "total": len(documents)
    }


@router.get(
    "/recent",
    summary="Get recent documents",
    description="Get recently uploaded documents for the current user (sorted by upload date, most recent first)"
)
async def get_recent_documents(
    limit: int = 10,
    current_user: dict = Depends(require_auth)
):
    """
    Get recent documents for the current user
    
    Args:
        limit: Maximum number of documents to return (default: 10)
        
    Returns:
        List of recent documents
    """
    user_id = current_user["id"]
    
    # Get recent documents sorted by upload date (most recent first)
    documents = await DocumentModel.find(
        DocumentModel.uploaded_by == user_id
    ).sort(-DocumentModel.uploaded_at).limit(limit).to_list()
    
    # Update status from task queue
    from app.workers.tasks import task_queue
    for doc in documents:
        task_id = f"doc_process_{str(doc.id)}"
        task = task_queue.get_task(task_id)
        if task:
            task_status = task.get("status")
            if task_status == "completed" and doc.status != "ready":
                doc.status = "ready"
                await doc.save()
            elif task_status == "failed" and doc.status != "error":
                doc.status = "error"
                await doc.save()
            elif task_status == "processing" and doc.status != "processing":
                doc.status = "processing"
                await doc.save()
    
    return {
        "documents": [
            DocumentResponse(
                id=str(d.id),
                name=d.name,
                status=d.status,
                uploaded_at=d.uploaded_at,
                uploaded_by=d.uploaded_by,
                size=d.size,
                type=d.type,
                project_id=d.project_id,
                tags=d.tags,
                metadata=d.metadata
            )
            for d in documents
        ],
        "total": len(documents)
    }


@router.get(
    "/health",
    summary="Get document health status",
    description="Get document health metrics including errors, stuck documents, and failed uploads"
)
async def get_document_health(
    current_user: dict = Depends(require_auth)
):
    """
    Get document health status for the current user
    
    Returns:
        Document health metrics including:
        - Processing errors
        - Stuck documents (processing >1 hour)
        - Failed uploads
        - Storage warnings
    """
    user_id = current_user["id"]
    from datetime import timedelta
    
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    # Get all user documents
    all_documents = await DocumentModel.find(
        DocumentModel.uploaded_by == user_id
    ).to_list()
    
    # Update status from task queue
    from app.workers.tasks import task_queue
    for doc in all_documents:
        task_id = f"doc_process_{str(doc.id)}"
        task = task_queue.get_task(task_id)
        if task:
            task_status = task.get("status")
            if task_status == "completed" and doc.status != "ready":
                doc.status = "ready"
                await doc.save()
            elif task_status == "failed" and doc.status != "error":
                doc.status = "error"
                await doc.save()
            elif task_status == "processing" and doc.status != "processing":
                doc.status = "processing"
                await doc.save()
    
    # Find processing errors
    error_documents = [d for d in all_documents if d.status == "error"]
    
    # Find stuck documents (processing for >1 hour)
    stuck_documents = [
        d for d in all_documents
        if d.status == "processing" and d.uploaded_at < one_hour_ago
    ]
    
    # Calculate storage usage
    total_storage_bytes = sum(d.size for d in all_documents)
    storage_limit_bytes = 10 * 1024 * 1024 * 1024  # 10 GB default
    storage_percentage = (total_storage_bytes / storage_limit_bytes) * 100 if storage_limit_bytes > 0 else 0
    storage_warning = storage_percentage > 80
    
    return {
        "total_documents": len(all_documents),
        "error_count": len(error_documents),
        "stuck_count": len(stuck_documents),
        "storage_warning": storage_warning,
        "storage_percentage": round(storage_percentage, 2),
        "errors": [
            {
                "id": str(d.id),
                "name": d.name,
                "status": d.status,
                "uploaded_at": d.uploaded_at.isoformat(),
            }
            for d in error_documents[:10]  # Limit to 10 most recent errors
        ],
        "stuck": [
            {
                "id": str(d.id),
                "name": d.name,
                "status": d.status,
                "uploaded_at": d.uploaded_at.isoformat(),
                "hours_stuck": round((now - d.uploaded_at).total_seconds() / 3600, 1),
            }
            for d in stuck_documents[:10]  # Limit to 10 most recent stuck documents
        ],
    }


@router.post(
    "/compare",
    response_model=DocumentComparisonResponse,
    summary="Compare documents",
    description="Compare multiple documents and generate similarities and differences using RAG pipeline"
)
async def compare_documents(
    document_ids: List[str] = Body(..., description="List of document IDs to compare (minimum 2)"),
    generation_service: GenerationService = Depends(get_generation_service),
    current_user: dict = Depends(require_auth)
):
    """
    Compare multiple documents and generate similarities and differences
    
    Args:
        document_ids: List of document IDs to compare (must be at least 2)
        generation_service: Generation service instance
        
    Returns:
        DocumentComparisonResponse with similarities and differences
    """
    if len(document_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 documents are required for comparison"
        )
    
    # Check if all documents exist and are ready
    from app.workers.tasks import task_queue
    documents = []
    missing_docs = []
    not_ready_docs = []
    
    user_id = current_user["id"]
    
    for doc_id in document_ids:
        doc = await DocumentModel.find_one(
            DocumentModel.id == doc_id,
            DocumentModel.uploaded_by == user_id
        )
        if not doc:
            missing_docs.append(doc_id)
            continue
        
        documents.append(doc)
        task_id = f"doc_process_{doc_id}"
        task = task_queue.get_task(task_id)
        
        if task:
            task_status = task.get("status")
            if task_status != "completed":
                not_ready_docs.append(f"{doc.name} (status: {task_status})")
        elif doc.status != "ready":
            not_ready_docs.append(f"{doc.name} (status: {doc.status})")
    
    if missing_docs:
        raise HTTPException(
            status_code=404,
            detail=f"Documents not found: {', '.join(missing_docs)}"
        )
    
    if not_ready_docs:
        raise HTTPException(
            status_code=400,
            detail=f"Some documents are not ready: {', '.join(not_ready_docs)}"
        )
    
    try:
        # Get collection name from settings
        collection_name = getattr(settings, "VECTOR_STORE_COLLECTION_PREFIX", "documind_documents")
        
        # Build document name map
        document_name_map = {str(doc.id): doc.name for doc in documents}
        
        # Generate comparison
        comparison_data = await generation_service.generate_comparison(
            document_ids=document_ids,
            collection_name=collection_name,
            document_name_map=document_name_map
        )
        
        # Format response
        similarities = [
            ComparisonSimilarityResponse(
                aspect=s["aspect"],
                description=s["description"],
                documents=s["documents"],
                examples=[
                    ComparisonExampleResponse(
                        documentId=ex["document_id"],
                        documentName=ex["document_name"],
                        text=ex["text"],
                        page=ex.get("page")
                    )
                    for ex in s.get("examples", [])
                ]
            )
            for s in comparison_data.get("similarities", [])
        ]
        
        differences = [
            ComparisonDifferenceResponse(
                aspect=d["aspect"],
                description=d["description"],
                documents=[
                    ComparisonDifferenceDocumentResponse(
                        id=doc["id"],
                        name=doc["name"],
                        value=doc["value"],
                        page=doc.get("page")
                    )
                    for doc in d.get("documents", [])
                ]
            )
            for d in comparison_data.get("differences", [])
        ]
        
        return DocumentComparisonResponse(
            documentIds=document_ids,
            similarities=similarities,
            differences=differences,
            generatedAt=datetime.utcnow()
        )
        
    except GenerationError as e:
        logger.warning("comparison_generation_failed", error=str(e), document_ids=document_ids)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate comparison: {str(e)}"
        )
    except Exception as e:
        logger.exception("comparison_generation_failed", error=str(e), document_ids=document_ids)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate comparison: {str(e)}"
        )


@router.delete(
    "/{document_id}",
    summary="Delete document",
    description="Delete a document and all its associated data (chunks, embeddings, file)"
)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(require_auth),
    storage: StorageService = Depends(get_storage)
):
    """
    Delete a document and all its associated data (filtered by authenticated user)
    
    Args:
        document_id: Document ID to delete
        
    Returns:
        Success message
    """
    user_id = current_user["id"]
    doc = await _get_user_document(document_id, user_id)
    
    try:
        # Step 1: Delete file from storage
        storage_path = doc.file_path
        if storage_path:
            try:
                deleted = await storage.delete_file(storage_path)
                if deleted:
                    logger.info("document_file_deleted", document_id=document_id, storage_path=storage_path)
                else:
                    logger.warning("document_file_deletion_failed", document_id=document_id, storage_path=storage_path)
            except Exception as e:
                logger.warning("document_file_deletion_failed", document_id=document_id, storage_path=storage_path, error=str(e))
        
        # Step 2: Delete chunks from vector store
        try:
            from app.services.vector_store import VectorStoreService
            from app.services.embeddings import EmbeddingService
            
            # Initialize vector store service
            embedding_service = EmbeddingService()
            vector_store = VectorStoreService(dimension=embedding_service.get_embedding_dimension())
            
            # Get collection name
            collection_name = getattr(settings, "VECTOR_STORE_COLLECTION_PREFIX", "documind_documents")
            tenant_id = doc.metadata.get("tenant_id") if doc.metadata else None
            
            # Find all chunks for this document using a search with metadata filter
            # We use a dummy embedding (all zeros) and a very high top_k to get all chunks
            dummy_embedding = [0.0] * embedding_service.get_embedding_dimension()
            
            # Search with filter to find all chunks for this document
            # Use a very high top_k to ensure we get all chunks
            search_result = await vector_store.search(
                query_embedding=dummy_embedding,
                collection_name=collection_name,
                top_k=10000,  # Very high limit to get all chunks
                tenant_id=tenant_id,
                filter={"document_id": document_id}
            )
            
            # Extract chunk IDs from search results
            chunk_ids = search_result.ids if search_result.ids else []
            
            # If we found chunks, delete them
            if chunk_ids:
                await vector_store.delete_documents(
                    document_ids=chunk_ids,
                    collection_name=collection_name,
                    tenant_id=tenant_id
                )
                logger.info(
                    "document_chunks_deleted",
                    document_id=document_id,
                    chunk_count=len(chunk_ids),
                    collection_name=collection_name
                )
            else:
                logger.info("no_chunks_found_for_document", document_id=document_id)
                
        except Exception as e:
            # Log error but don't fail the deletion - document metadata will still be deleted
            logger.warning(
                "document_chunks_deletion_failed",
                document_id=document_id,
                error=str(e)
            )
        
        # Step 3: Clean up tasks
        from app.workers.tasks import task_queue
        task_id = f"doc_process_{document_id}"
        security_task_id = f"security_scan_{document_id}"
        
        try:
            if task_id in task_queue.tasks:
                del task_queue.tasks[task_id]
            if security_task_id in task_queue.tasks:
                del task_queue.tasks[security_task_id]
        except Exception as e:
            logger.warning("task_cleanup_failed", document_id=document_id, error=str(e))
        
        # Step 4: Remove from MongoDB
        await doc.delete()
        
        logger.info("document_deleted", document_id=document_id)
        
        return JSONResponse(
            status_code=200,
            content={"message": "Document deleted successfully", "document_id": document_id}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("document_deletion_failed", document_id=document_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.post(
    "/{document_id}/tags",
    summary="Assign tags to document",
    description="Assign one or more tags to a document"
)
async def assign_tags_to_document(
    document_id: str,
    tag_request: TagAssignRequest,
    current_user: dict = Depends(require_auth)
):
    """
    Assign tags to a document (filtered by authenticated user)
    
    Args:
        document_id: Document ID
        tag_request: Tag assignment request with list of tag IDs
        
    Returns:
        Success message with assigned tags
    """
    user_id = current_user["id"]
    doc = await _get_user_document(document_id, user_id)
    
    try:
        # Validate that all tags exist and belong to the user
        invalid_tags = []
        from bson import ObjectId
        
        for tag_id in tag_request.tag_ids:
            # Try ObjectId first, then string
            try:
                tag_object_id = ObjectId(tag_id)
                tag = await TagModel.find_one(
                    TagModel.id == tag_object_id,
                    TagModel.created_by == user_id
                )
            except (ValueError, TypeError):
                tag = await TagModel.find_one(
                    TagModel.id == tag_id,
                    TagModel.created_by == user_id
                )
            
            if not tag:
                invalid_tags.append(tag_id)
        
        if invalid_tags:
            raise HTTPException(
                status_code=404,
                detail=f"Tags not found or access denied: {', '.join(invalid_tags)}"
            )
        
        # Add tags (avoid duplicates)
        added_tags = []
        for tag_id in tag_request.tag_ids:
            if tag_id not in doc.tags:
                doc.tags.append(tag_id)
                added_tags.append(tag_id)
        
        await doc.save()
        
        logger.info(
            "tags_assigned_to_document",
            document_id=document_id,
            tag_ids=added_tags
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Tags assigned successfully",
                "document_id": document_id,
                "assigned_tags": added_tags,
                "all_tags": doc.tags
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tag_assignment_failed", document_id=document_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign tags: {str(e)}"
        )


@router.delete(
    "/{document_id}/tags/{tag_id}",
    summary="Remove tag from document",
    description="Remove a tag from a document"
)
async def remove_tag_from_document(
    document_id: str,
    tag_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Remove a tag from a document (filtered by authenticated user)
    
    Args:
        document_id: Document ID
        tag_id: Tag ID to remove
        
    Returns:
        Success message
    """
    user_id = current_user["id"]
    doc = await _get_user_document(document_id, user_id)
    
    try:
        # Check if tag is assigned to document
        if tag_id not in doc.tags:
            raise HTTPException(
                status_code=404,
                detail=f"Tag '{tag_id}' is not assigned to this document"
            )
        
        # Remove tag
        doc.tags.remove(tag_id)
        await doc.save()
        
        logger.info(
            "tag_removed_from_document",
            document_id=document_id,
            tag_id=tag_id
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Tag removed successfully",
                "document_id": document_id,
                "tag_id": tag_id
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tag_removal_failed", document_id=document_id, tag_id=tag_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove tag: {str(e)}"
        )

