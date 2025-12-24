"""
System API routes
"""

import time
from fastapi import APIRouter, Depends
from datetime import datetime

from app.api.v1.system.schemas import SystemStatsResponse
from app.core.config import settings
from app.core.dependencies import require_auth
from app.database.models import User, Document, Project, QueryHistory
from app.database import get_client

router = APIRouter()

# Track application start time for uptime calculation
_start_time = time.time()


@router.get(
    "/stats",
    response_model=SystemStatsResponse,
    summary="Get system statistics",
    description="Returns comprehensive system statistics including database, users, documents, projects, storage, and queries",
    tags=["System"]
)
async def get_system_stats(
    current_user: dict = Depends(require_auth)
) -> SystemStatsResponse:
    """
    Get system statistics.
    Requires authentication.
    """
    uptime = time.time() - _start_time
    
    # Check database connection
    try:
        client = get_client()
        if client:
            await client.admin.command('ping')
            db_status = "connected"
        else:
            db_status = "disconnected"
    except Exception:
        db_status = "disconnected"
    
    # Get counts from database
    try:
        user_count = await User.count()
        document_count = await Document.count()
        project_count = await Project.count()
        query_count = await QueryHistory.count()
        
        # Get document status breakdown
        processing_count = await Document.find(Document.status == "processing").count()
        ready_count = await Document.find(Document.status == "ready").count()
        error_count = await Document.find(Document.status == "error").count()
        
        # Get storage statistics
        documents = await Document.find_all().to_list()
        total_storage_bytes = sum(doc.size for doc in documents)
        total_storage_mb = round(total_storage_bytes / (1024 * 1024), 2)
        
        # Get query statistics
        successful_queries = await QueryHistory.find(QueryHistory.success == True).count()
        failed_queries = await QueryHistory.find(QueryHistory.success == False).count()
        success_rate = round((successful_queries / query_count * 100) if query_count > 0 else 0, 2)
        
    except Exception as e:
        # If database query fails, return zeros
        user_count = 0
        document_count = 0
        project_count = 0
        query_count = 0
        processing_count = 0
        ready_count = 0
        error_count = 0
        total_storage_bytes = 0
        total_storage_mb = 0
        successful_queries = 0
        failed_queries = 0
        success_rate = 0
    
    return SystemStatsResponse(
        version=settings.APP_VERSION,
        uptime_seconds=round(uptime, 2),
        timestamp=datetime.utcnow(),
        database={
            "status": db_status,
            "name": settings.DATABASE_NAME
        },
        users={
            "total": user_count
        },
        documents={
            "total": document_count,
            "processing": processing_count,
            "ready": ready_count,
            "error": error_count
        },
        projects={
            "total": project_count
        },
        storage={
            "total_bytes": total_storage_bytes,
            "total_mb": total_storage_mb
        },
        queries={
            "total": query_count,
            "successful": successful_queries,
            "failed": failed_queries,
            "success_rate_percent": success_rate
        }
    )

