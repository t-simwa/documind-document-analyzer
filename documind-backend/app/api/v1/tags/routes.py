"""
Tags API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
import structlog
import time

from app.database.models import Tag as TagModel
from app.core.dependencies import require_auth
from .schemas import (
    TagCreate,
    TagUpdate,
    TagResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# Initialize default tags if none exist for a user
async def _initialize_default_tags(user_id: str):
    """Initialize default tags if none exist for a user"""
    count = await TagModel.find(TagModel.created_by == user_id).count()
    if count == 0:
        default_tags = [
            TagModel(
                name="Important",
                color="#ef4444",
                created_by=user_id,
            ),
            TagModel(
                name="Review",
                color="#f59e0b",
                created_by=user_id,
            ),
            TagModel(
                name="Archive",
                color="#6b7280",
                created_by=user_id,
            ),
        ]
        for tag in default_tags:
            await tag.insert()
        logger.info("default_tags_initialized", count=len(default_tags), user_id=user_id)


@router.get(
    "/",
    response_model=List[TagResponse],
    summary="List tags",
    description="List all tags for the authenticated user"
)
async def list_tags(current_user: dict = Depends(require_auth)):
    """
    List all tags for the authenticated user
    
    Returns:
        List of all tags for the user
    """
    try:
        user_id = current_user["id"]
        # Initialize default tags if needed
        await _initialize_default_tags(user_id)
        
        tags = await TagModel.find(TagModel.created_by == user_id).to_list()
        return [
            TagResponse(
                id=str(tag.id),
                name=tag.name,
                color=tag.color,
                created_at=tag.created_at
            )
            for tag in tags
        ]
    except Exception as e:
        logger.exception("tag_list_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list tags: {str(e)}"
        )


@router.post(
    "/",
    response_model=TagResponse,
    status_code=201,
    summary="Create tag",
    description="Create a new tag for the authenticated user"
)
async def create_tag(tag: TagCreate, current_user: dict = Depends(require_auth)):
    """
    Create a new tag for the authenticated user
    
    Args:
        tag: Tag creation data
        
    Returns:
        Created tag
    """
    try:
        user_id = current_user["id"]
        # Check if tag with same name already exists for this user
        existing_tag = await TagModel.find_one(
            TagModel.name == tag.name,
            TagModel.created_by == user_id
        )
        if existing_tag:
            raise HTTPException(
                status_code=400,
                detail=f"Tag with name '{tag.name}' already exists"
            )
        
        # Create new tag
        new_tag = TagModel(
            name=tag.name,
            color=tag.color or "#6b7280",  # Default gray color
            created_by=user_id,
        )
        await new_tag.insert()
        
        logger.info("tag_created", tag_id=str(new_tag.id), name=tag.name)
        
        return TagResponse(
            id=str(new_tag.id),
            name=new_tag.name,
            color=new_tag.color,
            created_at=new_tag.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tag_creation_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create tag: {str(e)}"
        )


@router.get(
    "/{tag_id}",
    response_model=TagResponse,
    summary="Get tag",
    description="Get a tag by ID (must belong to authenticated user)"
)
async def get_tag(tag_id: str, current_user: dict = Depends(require_auth)):
    """
    Get tag by ID (must belong to authenticated user)
    
    Args:
        tag_id: Tag ID
        
    Returns:
        Tag details
    """
    try:
        user_id = current_user["id"]
        from bson import ObjectId
        
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
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return TagResponse(
            id=str(tag.id),
            name=tag.name,
            color=tag.color,
            created_at=tag.created_at
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.exception("tag_get_failed", tag_id=tag_id, error=str(e))
        raise HTTPException(status_code=404, detail="Tag not found")


@router.put(
    "/{tag_id}",
    response_model=TagResponse,
    summary="Update tag",
    description="Update a tag (must belong to authenticated user)"
)
async def update_tag(tag_id: str, tag_update: TagUpdate, current_user: dict = Depends(require_auth)):
    """
    Update a tag (must belong to authenticated user)
    
    Args:
        tag_id: Tag ID
        tag_update: Tag update data
        
    Returns:
        Updated tag
    """
    try:
        user_id = current_user["id"]
        from bson import ObjectId
        
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
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Check if new name conflicts with existing tag for this user
        if tag_update.name:
            existing_tag = await TagModel.find_one(
                TagModel.name == tag_update.name,
                TagModel.id != tag.id,
                TagModel.created_by == user_id
            )
            if existing_tag:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag with name '{tag_update.name}' already exists"
                )
        
        # Update fields if provided
        if tag_update.name is not None:
            tag.name = tag_update.name
        if tag_update.color is not None:
            tag.color = tag_update.color
        
        await tag.save()
        
        logger.info("tag_updated", tag_id=tag_id)
        
        return TagResponse(
            id=str(tag.id),
            name=tag.name,
            color=tag.color,
            created_at=tag.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tag_update_failed", tag_id=tag_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update tag: {str(e)}"
        )


@router.delete(
    "/{tag_id}",
    summary="Delete tag",
    description="Delete a tag and remove it from all user's documents"
)
async def delete_tag(tag_id: str, current_user: dict = Depends(require_auth)):
    """
    Delete a tag (must belong to authenticated user)
    
    Args:
        tag_id: Tag ID to delete
        
    Returns:
        Success message
    """
    try:
        user_id = current_user["id"]
        from app.database.models import Document as DocumentModel
        from bson import ObjectId
        
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
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Remove tag from all documents owned by this user
        tag_id_str = str(tag.id)
        # Find documents that contain this tag and belong to the user
        user_documents = await DocumentModel.find(
            DocumentModel.uploaded_by == user_id
        ).to_list()
        
        removed_count = 0
        for doc in user_documents:
            if tag_id_str in doc.tags:
                doc.tags.remove(tag_id_str)
                await doc.save()
                removed_count += 1
        
        # Delete the tag
        await tag.delete()
        
        logger.info(
            "tag_deleted",
            tag_id=tag_id,
            removed_from_documents=removed_count
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Tag deleted successfully",
                "tag_id": tag_id,
                "removed_from_documents": removed_count
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tag_deletion_failed", tag_id=tag_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete tag: {str(e)}"
        )

