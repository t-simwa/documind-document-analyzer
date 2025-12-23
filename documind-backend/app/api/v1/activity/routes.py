"""
Activity feed API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
import structlog
from beanie.operators import Or

from app.core.dependencies import require_auth
from app.database.models import Activity as ActivityModel, User as UserModel
from .schemas import ActivityResponse, ActivityListResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=ActivityListResponse,
    summary="Get activity feed",
    description="Get activity feed with optional filtering and pagination"
)
async def get_activity_feed(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    organization_id: Optional[str] = Query(None, description="Filter by organization ID"),
    document_id: Optional[str] = Query(None, description="Filter by document ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    current_user: dict = Depends(require_auth)
):
    """
    Get activity feed for the authenticated user
    
    Args:
        page: Page number (default: 1)
        limit: Items per page (default: 20, max: 100)
        type: Filter by activity type (upload, process, query, project, error, complete)
        user_id: Filter by user ID
        organization_id: Filter by organization ID
        document_id: Filter by document ID
        project_id: Filter by project ID
        status: Filter by status (success, error, processing)
        start_date: Filter activities from this date
        end_date: Filter activities until this date
        
    Returns:
        ActivityListResponse with paginated activities
    """
    try:
        current_user_id = current_user["id"]
        user_org_id = current_user.get("organization_id")
        is_admin = current_user.get("is_superuser", False)
        
        # Build query conditions list for Beanie's find()
        query_conditions = []
        
        # Build base access filter using Beanie query syntax
        if not is_admin:
            if user_org_id:
                # For users with org: show their activities OR org activities
                query_conditions.append(
                    Or(
                        ActivityModel.user_id == current_user_id,
                        ActivityModel.organization_id == user_org_id
                    )
                )
            else:
                # For users without org: only their activities
                query_conditions.append(ActivityModel.user_id == current_user_id)
        
        # Add additional filters
        if type:
            query_conditions.append(ActivityModel.type == type)
        
        # Only allow filtering by user_id if admin
        if user_id and is_admin:
            query_conditions.append(ActivityModel.user_id == user_id)
        
        if organization_id:
            query_conditions.append(ActivityModel.organization_id == organization_id)
        
        if document_id:
            query_conditions.append(ActivityModel.document_id == document_id)
        
        if project_id:
            query_conditions.append(ActivityModel.project_id == project_id)
        
        if status:
            query_conditions.append(ActivityModel.status == status)
        
        # Date range filters
        if start_date:
            query_conditions.append(ActivityModel.created_at >= start_date)
        if end_date:
            query_conditions.append(ActivityModel.created_at <= end_date)
        
        # Build query - Beanie's find() accepts multiple conditions
        if query_conditions:
            if len(query_conditions) == 1:
                query = ActivityModel.find(query_conditions[0])
            else:
                # Multiple conditions are ANDed together by default
                query = ActivityModel.find(*query_conditions)
        else:
            query = ActivityModel.find()
        
        # Get total count
        total = await query.count()
        
        # Apply pagination and sorting
        skip = (page - 1) * limit
        activities = await query.sort(-ActivityModel.created_at).skip(skip).limit(limit).to_list()
        
        # Convert to response format
        activity_responses = [
            ActivityResponse(
                id=str(activity.id),
                type=activity.type,
                title=activity.title,
                description=activity.description,
                user_id=activity.user_id,
                user_name=activity.user_name,
                organization_id=activity.organization_id,
                document_id=activity.document_id,
                project_id=activity.project_id,
                status=activity.status,
                metadata=activity.metadata,
                created_at=activity.created_at
            )
            for activity in activities
        ]
        
        return ActivityListResponse(
            activities=activity_responses,
            total=total,
            page=page,
            limit=limit,
            has_more=(skip + limit) < total
        )
    
    except Exception as e:
        logger.exception("activity_feed_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch activity feed: {str(e)}"
        )

