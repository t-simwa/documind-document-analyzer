"""
Document upload and management API routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import os
import time
import structlog
from pathlib import Path
from datetime import datetime

from app.core.config import settings
from app.workers.tasks import process_document_async, security_scan_async
from .schemas import (
    DocumentUploadResponse, 
    DocumentResponse,
    DocumentInsightsResponse,
    DocumentSummaryResponse,
    DocumentEntitiesResponse
)
from app.services.retrieval import RetrievalService
from app.services.llm import LLMService
from app.services.generation import GenerationService
from app.services.generation.exceptions import GenerationError

logger = structlog.get_logger(__name__)

router = APIRouter()

# In-memory document storage (in production, use a database)
documents_store: dict = {}


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
        
        # Generate document ID (use timestamp format to match frontend expectations)
        import time
        document_id = str(int(time.time() * 1000))  # Timestamp in milliseconds
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(
            "document_uploaded",
            document_id=document_id,
            filename=file.filename,
            size=file_size,
            file_type=file_ext
        )
        
        # Store document metadata
        document_metadata = {
            "id": document_id,
            "name": file.filename,
            "status": "processing",
            "uploaded_at": datetime.utcnow(),
            "size": file_size,
            "type": file_ext,
            "project_id": project_id,
            "file_path": file_path,
            "metadata": {}
        }
        documents_store[document_id] = document_metadata
        
        # Start security scan in background
        background_tasks.add_task(
            security_scan_async,
            document_id=document_id,
            file_path=file_path,
            metadata={"project_id": project_id}
        )
        
        # Start document processing in background (after security scan)
        # Note: In production, you'd want to wait for security scan to complete first
        background_tasks.add_task(
            process_document_async,
            document_id=document_id,
            file_path=file_path,
            file_type=file_ext,
            metadata={"project_id": project_id, "filename": file.filename}
        )
        
        return DocumentUploadResponse(
            id=document_id,
            name=file.filename,
            status="processing",
            uploaded_at=document_metadata["uploaded_at"],
            size=file_size,
            type=file_ext,
            project_id=project_id,
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
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Get AI-generated insights for a document
    
    Args:
        document_id: Document ID
        generation_service: Generation service instance
        
    Returns:
        DocumentInsightsResponse with summary, entities, and suggested questions
    """
    # Check if document exists
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_store[document_id]
    
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
    elif doc.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready. Current status: {doc.get('status')}"
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
        
        # Generate entities and suggested questions
        # For now, return empty entities and suggested questions
        # These can be enhanced later with dedicated generation methods
        summary_response = DocumentSummaryResponse(
            executiveSummary=summary_data["executiveSummary"],
            keyPoints=summary_data["keyPoints"],
            generatedAt=summary_data["generatedAt"]
        )
        
        entities_response = DocumentEntitiesResponse(
            organizations=[],
            people=[],
            dates=[],
            monetaryValues=[],
            locations=[]
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
async def get_document(document_id: str):
    """
    Get document metadata
    
    Args:
        document_id: Document ID
        
    Returns:
        DocumentResponse with document metadata
    """
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_store[document_id]
    
    # Check task status to get current processing status
    from app.workers.tasks import task_queue
    task_id = f"doc_process_{document_id}"
    task = task_queue.get_task(task_id)
    
    # Update status based on task (task is a dict)
    if task:
        task_status = task.get("status")
        if task_status == "completed":
            doc["status"] = "ready"
        elif task_status == "failed":
            doc["status"] = "error"
        else:
            doc["status"] = "processing"
    
    return DocumentResponse(
        id=doc["id"],
        name=doc["name"],
        status=doc["status"],
        uploaded_at=doc["uploaded_at"],
        uploaded_by="user1",  # In production, get from auth context
        size=doc["size"],
        type=doc["type"],
        project_id=doc.get("project_id"),
        tags=[],
        metadata=doc.get("metadata", {})
    )


@router.get(
    "/",
    summary="List documents",
    description="List all documents with optional filtering"
)
async def list_documents(
    project_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List documents with optional filtering
    
    Args:
        project_id: Optional project ID filter
        status: Optional status filter (processing, ready, error)
        
    Returns:
        List of documents
    """
    documents = list(documents_store.values())
    
    # Apply filters
    if project_id:
        documents = [d for d in documents if d.get("project_id") == project_id]
    
    if status:
        documents = [d for d in documents if d.get("status") == status]
    
    # Update status from task queue
    from app.workers.tasks import task_queue
    for doc in documents:
        task_id = f"doc_process_{doc['id']}"
        task = task_queue.get_task(task_id)
        if task:
            # task is a dict, so access with bracket notation
            if task.get("status") == "completed":
                doc["status"] = "ready"
            elif task.get("status") == "failed":
                doc["status"] = "error"
            elif task.get("status") == "processing":
                doc["status"] = "processing"
    
    return {
        "documents": [
            DocumentResponse(
                id=d["id"],
                name=d["name"],
                status=d["status"],
                uploaded_at=d["uploaded_at"],
                uploaded_by="user1",
                size=d["size"],
                type=d["type"],
                project_id=d.get("project_id"),
                tags=[],
                metadata=d.get("metadata", {})
            )
            for d in documents
        ],
        "total": len(documents)
    }

