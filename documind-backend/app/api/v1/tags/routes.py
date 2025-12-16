"""
Tags API routes
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
import structlog
import time

from .schemas import (
    TagCreate,
    TagUpdate,
    TagResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# In-memory tag storage (in production, use a database)
tags_store: dict = {}

# Initialize default tags if store is empty
def _initialize_default_tags():
    """Initialize default tags if none exist"""
    if not tags_store:
        default_tags = [
            {
                "id": "1",
                "name": "Important",
                "color": "#ef4444",
                "created_at": datetime.utcnow(),
            },
            {
                "id": "2",
                "name": "Review",
                "color": "#f59e0b",
                "created_at": datetime.utcnow(),
            },
            {
                "id": "3",
                "name": "Archive",
                "color": "#6b7280",
                "created_at": datetime.utcnow(),
            },
        ]
        for tag in default_tags:
            tags_store[tag["id"]] = tag
        logger.info("default_tags_initialized", count=len(default_tags))

# Initialize on module load
_initialize_default_tags()


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
        tags = [
            TagResponse(
                id=tag["id"],
                name=tag["name"],
                color=tag.get("color"),
                created_at=tag["created_at"]
            )
            for tag in tags_store.values()
        ]
        return tags
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
        for existing_tag in tags_store.values():
            if existing_tag["name"].lower() == tag.name.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag with name '{tag.name}' already exists"
                )
        
        # Generate tag ID
        tag_id = str(int(time.time() * 1000))
        
        # Create tag metadata
        tag_data = {
            "id": tag_id,
            "name": tag.name,
            "color": tag.color or "#6b7280",  # Default gray color
            "created_at": datetime.utcnow(),
        }
        
        tags_store[tag_id] = tag_data
        
        logger.info("tag_created", tag_id=tag_id, name=tag.name)
        
        return TagResponse(
            id=tag_data["id"],
            name=tag_data["name"],
            color=tag_data["color"],
            created_at=tag_data["created_at"]
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
    if tag_id not in tags_store:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    tag_data = tags_store[tag_id]
    
    return TagResponse(
        id=tag_data["id"],
        name=tag_data["name"],
        color=tag_data.get("color"),
        created_at=tag_data["created_at"]
    )


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
    if tag_id not in tags_store:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    tag_data = tags_store[tag_id]
    
    try:
        # Check if new name conflicts with existing tag
        if tag_update.name:
            for existing_id, existing_tag in tags_store.items():
                if existing_id != tag_id and existing_tag["name"].lower() == tag_update.name.lower():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tag with name '{tag_update.name}' already exists"
                    )
        
        # Update fields if provided
        if tag_update.name is not None:
            tag_data["name"] = tag_update.name
        if tag_update.color is not None:
            tag_data["color"] = tag_update.color
        
        logger.info("tag_updated", tag_id=tag_id)
        
        return TagResponse(
            id=tag_data["id"],
            name=tag_data["name"],
            color=tag_data.get("color"),
            created_at=tag_data["created_at"]
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
    if tag_id not in tags_store:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    try:
        # Remove tag from all documents
        from app.api.v1.documents.routes import documents_store
        
        removed_count = 0
        for doc in documents_store.values():
            if "tags" in doc and tag_id in doc["tags"]:
                doc["tags"].remove(tag_id)
                removed_count += 1
        
        # Delete the tag
        del tags_store[tag_id]
        
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

