"""
Background task status endpoints
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.workers.tasks import task_queue
from app.api.v1.documents.routes import documents_store

router = APIRouter(tags=["Tasks"])


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of a background task
    If task is not found (e.g., after server reload), check document status
    """
    task = task_queue.get_task(task_id)
    
    if task is None:
        # Task not found - might be due to server reload
        # Check if this is a document processing task and check document status
        if task_id.startswith("doc_process_"):
            document_id = task_id.replace("doc_process_", "")
            
            # Check in-memory store first
            if document_id in documents_store:
                doc = documents_store[document_id]
                # If document is ready, return a completed task status
                if doc.get("status") == "ready":
                    return {
                        "id": task_id,
                        "type": "document_processing",
                        "status": "completed",
                        "result": {
                            "document_id": document_id,
                            "status": "processed",
                            "step": "index"
                        },
                        "metadata": {"document_id": document_id}
                    }
                # If document is still processing, return processing status
                elif doc.get("status") == "processing":
                    return {
                        "id": task_id,
                        "type": "document_processing",
                        "status": "processing",
                        "result": {
                            "document_id": document_id,
                            "status": "processing"
                        },
                        "metadata": {"document_id": document_id}
                    }
                # If document has error status
                elif doc.get("status") == "error":
                    return {
                        "id": task_id,
                        "type": "document_processing",
                        "status": "failed",
                        "error": "Document processing failed",
                        "metadata": {"document_id": document_id}
                    }
            
        # Task not found and can't infer from document status
        # Return 404 - frontend will check document status as fallback
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
    
    return task


@router.get("/tasks")
async def list_tasks(
    task_type: Optional[str] = None,
    task_status: Optional[str] = None
):
    """
    List all background tasks with optional filtering
    """
    tasks = task_queue.list_tasks(
        task_type=task_type,
        status=task_status
    )
    
    return {
        "tasks": tasks,
        "count": len(tasks)
    }

