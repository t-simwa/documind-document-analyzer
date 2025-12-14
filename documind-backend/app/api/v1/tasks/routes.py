"""
Background task status endpoints
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.workers.tasks import task_queue

router = APIRouter(tags=["Tasks"])


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of a background task
    """
    task = task_queue.get_task(task_id)
    
    if task is None:
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

