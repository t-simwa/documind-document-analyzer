"""
Activity logging utility
Creates activity log entries for user and system events
"""

from typing import Optional
from datetime import datetime
import structlog

from app.database.models import Activity as ActivityModel, User as UserModel

logger = structlog.get_logger(__name__)


async def log_activity(
    activity_type: str,
    title: str,
    description: str,
    user_id: str,
    organization_id: Optional[str] = None,
    document_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    metadata: Optional[dict] = None
) -> Optional[str]:
    """
    Log an activity event
    
    Args:
        activity_type: Type of activity (upload, process, query, project, error, complete)
        title: Activity title
        description: Activity description
        user_id: User ID who performed the action
        organization_id: Optional organization ID
        document_id: Optional document ID
        project_id: Optional project ID
        status: Optional status (success, error, processing)
        metadata: Optional metadata dictionary
        
    Returns:
        Activity ID if successful, None otherwise
    """
    try:
        # Get user name for caching
        user_name = None
        try:
            user = await UserModel.get(user_id)
            user_name = user.name
        except Exception:
            # If user not found, continue without name
            pass
        
        # Create activity entry
        activity = ActivityModel(
            type=activity_type,
            title=title,
            description=description,
            user_id=user_id,
            user_name=user_name,
            organization_id=organization_id,
            document_id=document_id,
            project_id=project_id,
            status=status,
            metadata=metadata or {}
        )
        
        await activity.insert()
        
        logger.info(
            "activity_logged",
            activity_id=str(activity.id),
            activity_type=activity_type,
            user_id=user_id
        )
        
        return str(activity.id)
    
    except Exception as e:
        logger.error(
            "activity_logging_failed",
            error=str(e),
            activity_type=activity_type,
            user_id=user_id
        )
        # Don't fail the main operation if activity logging fails
        return None

