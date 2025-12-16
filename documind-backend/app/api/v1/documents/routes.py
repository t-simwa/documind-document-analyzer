"""
Document upload and management API routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Depends, Body
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import Field
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
    DocumentEntitiesResponse,
    DocumentComparisonResponse,
    ComparisonSimilarityResponse,
    ComparisonDifferenceResponse,
    ComparisonExampleResponse,
    ComparisonDifferenceDocumentResponse
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


@router.post(
    "/compare",
    response_model=DocumentComparisonResponse,
    summary="Compare documents",
    description="Compare multiple documents and generate similarities and differences using RAG pipeline"
)
async def compare_documents(
    document_ids: List[str] = Body(..., description="List of document IDs to compare (minimum 2)"),
    generation_service: GenerationService = Depends(get_generation_service)
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
    
    # Check if all documents exist
    missing_docs = [doc_id for doc_id in document_ids if doc_id not in documents_store]
    if missing_docs:
        raise HTTPException(
            status_code=404,
            detail=f"Documents not found: {', '.join(missing_docs)}"
        )
    
    # Check if all documents are ready
    from app.workers.tasks import task_queue
    not_ready_docs = []
    for doc_id in document_ids:
        doc = documents_store[doc_id]
        task_id = f"doc_process_{doc_id}"
        task = task_queue.get_task(task_id)
        
        if task:
            task_status = task.get("status")
            if task_status != "completed":
                not_ready_docs.append(f"{doc.get('name', doc_id)} (status: {task_status})")
        elif doc.get("status") != "ready":
            not_ready_docs.append(f"{doc.get('name', doc_id)} (status: {doc.get('status')})")
    
    if not_ready_docs:
        raise HTTPException(
            status_code=400,
            detail=f"Some documents are not ready: {', '.join(not_ready_docs)}"
        )
    
    try:
        # Get collection name from settings
        collection_name = getattr(settings, "VECTOR_STORE_COLLECTION_PREFIX", "documind_documents")
        
        # Build document name map
        document_name_map = {}
        for doc_id in document_ids:
            if doc_id in documents_store:
                document_name_map[doc_id] = documents_store[doc_id].get("name", doc_id)
            else:
                document_name_map[doc_id] = doc_id
        
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
async def delete_document(document_id: str):
    """
    Delete a document and all its associated data
    
    Args:
        document_id: Document ID to delete
        
    Returns:
        Success message
    """
    # Check if document exists
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_store[document_id]
    
    try:
        # Step 1: Delete file from disk
        file_path = doc.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("document_file_deleted", document_id=document_id, file_path=file_path)
            except Exception as e:
                logger.warning("document_file_deletion_failed", document_id=document_id, file_path=file_path, error=str(e))
        
        # Step 2: Delete chunks from vector store
        try:
            from app.services.vector_store import VectorStoreService
            from app.services.embeddings import EmbeddingService
            
            # Initialize vector store service
            embedding_service = EmbeddingService()
            vector_store = VectorStoreService(dimension=embedding_service.get_embedding_dimension())
            
            # Get collection name
            collection_name = getattr(settings, "VECTOR_STORE_COLLECTION_PREFIX", "documind_documents")
            tenant_id = doc.get("metadata", {}).get("tenant_id") if doc.get("metadata") else None
            
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
        
        # Step 4: Remove from documents store
        del documents_store[document_id]
        
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

