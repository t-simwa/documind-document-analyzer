"""
Tags API schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TagBase(BaseModel):
    """Base tag schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Tag name")
    color: Optional[str] = Field(None, description="Tag color in hex format (e.g., #ef4444)")


class TagCreate(TagBase):
    """Schema for creating a tag"""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, description="Tag color in hex format")


class TagResponse(BaseModel):
    """Tag response schema"""
    id: str
    name: str
    color: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TagAssignRequest(BaseModel):
    """Schema for assigning tags to a document"""
    tag_ids: list[str] = Field(..., min_items=1, description="List of tag IDs to assign")

