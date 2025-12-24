"""
Collections API schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CollectionResponse(BaseModel):
    """Collection response"""
    name: str = Field(..., description="Collection name")
    full_name: Optional[str] = Field(None, description="Full collection name with tenant prefix")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Collection metadata")
    document_count: int = Field(0, description="Number of documents in the collection")


class CollectionListResponse(BaseModel):
    """List of collections response"""
    collections: List[CollectionResponse]
    total: int = Field(..., description="Total number of collections")


class CollectionCreateRequest(BaseModel):
    """Create collection request"""
    name: str = Field(..., description="Collection name", min_length=1, max_length=100)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional collection metadata")


class CollectionCreateResponse(BaseModel):
    """Create collection response"""
    name: str
    message: str
    success: bool = True


class CollectionDeleteResponse(BaseModel):
    """Delete collection response"""
    message: str
    success: bool = True

