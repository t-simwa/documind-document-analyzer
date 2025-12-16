"""
Tags API routes
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
import structlog
import time

from app.database.models import Tag as TagModel
from .schemas import (
    TagCreate,
    TagUpdate,
    TagResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# Initialize default tags if none exist
async def _initialize_default_tags():
    """Initialize default tags if none exist"""
    count = await TagModel.count()
    if count == 0:
        default_tags = [
            TagModel(
                name="Important",
                color="#ef4444",
            ),
            TagModel(
                name="Review",
                color="#f59e0b",
            ),
            TagModel(
                name="Archive",
                color="#6b7280",
            ),
        ]
        for tag in default_tags:
            await tag.insert()
        logger.info("default_tags_initialized", count=len(default_tags))


@router.get(
    "/",
    response_model=List[TagResponse],
    summary="List tags",
    description="List all tags"
)
async def list_tags():
    """
    List all tags
    
    Returns:
        List of all tags
    """
    try:
        # Initialize default tags if needed
        await _initialize_default_tags()
        
        tags = await TagModel.find_all().to_list()
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
    description="Create a new tag"
)
async def create_tag(tag: TagCreate):
    """
    Create a new tag
    
    Args:
        tag: Tag creation data
        
    Returns:
        Created tag
    """
    try:
        # Check if tag with same name already exists
        existing_tag = await TagModel.find_one(TagModel.name == tag.name)
        if existing_tag:
            raise HTTPException(
                status_code=400,
                detail=f"Tag with name '{tag.name}' already exists"
            )
        
        # Create new tag
        new_tag = TagModel(
            name=tag.name,
            color=tag.color or "#6b7280",  # Default gray color
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
    description="Get a tag by ID"
)
async def get_tag(tag_id: str):
    """
    Get tag by ID
    
    Args:
        tag_id: Tag ID
        
    Returns:
        Tag details
    """
    try:
        from bson import ObjectId
        tag = await TagModel.get(ObjectId(tag_id))
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
    description="Update a tag"
)
async def update_tag(tag_id: str, tag_update: TagUpdate):
    """
    Update a tag
    
    Args:
        tag_id: Tag ID
        tag_update: Tag update data
        
    Returns:
        Updated tag
    """
    try:
        tag = await TagModel.get(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Check if new name conflicts with existing tag
        if tag_update.name:
            existing_tag = await TagModel.find_one(
                TagModel.name == tag_update.name,
                TagModel.id != tag.id
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
    description="Delete a tag and remove it from all documents"
)
async def delete_tag(tag_id: str):
    """
    Delete a tag
    
    Args:
        tag_id: Tag ID to delete
        
    Returns:
        Success message
    """
    try:
        from app.database.models import Document as DocumentModel
        
        tag = await TagModel.get(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Remove tag from all documents
        tag_id_str = str(tag.id)
        # Find documents that contain this tag
        all_documents = await DocumentModel.find_all().to_list()
        
        removed_count = 0
        for doc in all_documents:
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

