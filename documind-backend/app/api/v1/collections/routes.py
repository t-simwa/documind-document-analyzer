"""
Collections API routes
"""

import structlog
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional

from app.core.dependencies import require_auth
from app.services.vector_store import VectorStoreService
from app.services.vector_store.exceptions import VectorStoreError, VectorStoreNotFoundError
from .schemas import (
    CollectionListResponse,
    CollectionResponse,
    CollectionCreateRequest,
    CollectionCreateResponse,
    CollectionDeleteResponse
)

logger = structlog.get_logger(__name__)
router = APIRouter()


def get_vector_store() -> VectorStoreService:
    """Get vector store service instance"""
    return VectorStoreService()


@router.get(
    "",
    response_model=CollectionListResponse,
    summary="List collections",
    description="Get all collections/indexes from the vector store",
    status_code=status.HTTP_200_OK
)
async def list_collections(
    current_user: dict = Depends(require_auth),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    List all collections/indexes
    
    Returns a list of all collections in the vector store, optionally filtered by tenant.
    """
    try:
        # Use organization_id as tenant_id for multi-tenancy
        tenant_id = current_user.get("organization_id")
        
        collections_data = await vector_store.list_collections(tenant_id=tenant_id)
        
        # Convert to response format
        collections = [
            CollectionResponse(
                name=col["name"],
                full_name=col.get("full_name"),
                metadata=col.get("metadata", {}),
                document_count=col.get("document_count", 0)
            )
            for col in collections_data
        ]
        
        logger.info(
            "collections_listed",
            user_id=current_user["id"],
            count=len(collections),
            tenant_id=tenant_id
        )
        
        return CollectionListResponse(
            collections=collections,
            total=len(collections)
        )
    except VectorStoreError as e:
        logger.error("list_collections_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list collections: {str(e)}"
        )
    except Exception as e:
        logger.error("list_collections_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while listing collections"
        )


@router.post(
    "",
    response_model=CollectionCreateResponse,
    summary="Create collection",
    description="Create a new collection/index in the vector store",
    status_code=status.HTTP_201_CREATED
)
async def create_collection(
    request: CollectionCreateRequest,
    current_user: dict = Depends(require_auth),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    Create a new collection/index
    
    Creates a new collection in the vector store with the specified name and optional metadata.
    """
    try:
        # Validate collection name
        if not request.name or not request.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collection name cannot be empty"
            )
        
        # Sanitize collection name (remove special characters, spaces, etc.)
        sanitized_name = request.name.strip().lower().replace(" ", "_")
        # Remove any invalid characters
        sanitized_name = "".join(c for c in sanitized_name if c.isalnum() or c in ["_", "-"])
        
        if not sanitized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collection name must contain at least one alphanumeric character"
            )
        
        # Use organization_id as tenant_id for multi-tenancy
        tenant_id = current_user.get("organization_id")
        
        # Check if collection already exists
        exists = await vector_store.collection_exists(sanitized_name, tenant_id=tenant_id)
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Collection '{sanitized_name}' already exists"
            )
        
        # Create collection
        success = await vector_store.create_collection(
            collection_name=sanitized_name,
            tenant_id=tenant_id,
            metadata=request.metadata or {}
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create collection"
            )
        
        logger.info(
            "collection_created",
            user_id=current_user["id"],
            collection_name=sanitized_name,
            tenant_id=tenant_id
        )
        
        return CollectionCreateResponse(
            name=sanitized_name,
            message=f"Collection '{sanitized_name}' created successfully"
        )
    except HTTPException:
        raise
    except VectorStoreError as e:
        logger.error("create_collection_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create collection: {str(e)}"
        )
    except Exception as e:
        logger.error("create_collection_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the collection"
        )


@router.delete(
    "/{collection_id}",
    response_model=CollectionDeleteResponse,
    summary="Delete collection",
    description="Delete a collection/index from the vector store",
    status_code=status.HTTP_200_OK
)
async def delete_collection(
    collection_id: str,
    current_user: dict = Depends(require_auth),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    Delete a collection/index
    
    Permanently deletes a collection and all its documents from the vector store.
    This action cannot be undone.
    """
    try:
        if not collection_id or not collection_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collection ID cannot be empty"
            )
        
        # Sanitize collection name
        sanitized_name = collection_id.strip().lower().replace(" ", "_")
        sanitized_name = "".join(c for c in sanitized_name if c.isalnum() or c in ["_", "-"])
        
        if not sanitized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid collection ID"
            )
        
        # Use organization_id as tenant_id for multi-tenancy
        tenant_id = current_user.get("organization_id")
        
        # Check if collection exists
        exists = await vector_store.collection_exists(sanitized_name, tenant_id=tenant_id)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Collection '{sanitized_name}' not found"
            )
        
        # Delete collection
        success = await vector_store.delete_collection(
            collection_name=sanitized_name,
            tenant_id=tenant_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete collection"
            )
        
        logger.info(
            "collection_deleted",
            user_id=current_user["id"],
            collection_name=sanitized_name,
            tenant_id=tenant_id
        )
        
        return CollectionDeleteResponse(
            message=f"Collection '{sanitized_name}' deleted successfully",
            success=True
        )
    except HTTPException:
        raise
    except VectorStoreError as e:
        logger.error("delete_collection_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete collection: {str(e)}"
        )
    except Exception as e:
        logger.error("delete_collection_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the collection"
        )

