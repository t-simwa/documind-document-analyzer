"""
Activity API schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ActivityResponse(BaseModel):
    """Activity response schema"""
    id: str
    type: str
    title: str
    description: str
    user_id: str
    user_name: Optional[str] = None
    organization_id: Optional[str] = None
    document_id: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    """Activity list response schema"""
    activities: list[ActivityResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class ActivityFilter(BaseModel):
    """Activity filter schema"""
    type: Optional[str] = None  # Filter by activity type
    user_id: Optional[str] = None  # Filter by user
    organization_id: Optional[str] = None  # Filter by organization
    document_id: Optional[str] = None  # Filter by document
    project_id: Optional[str] = None  # Filter by project
    status: Optional[str] = None  # Filter by status
    start_date: Optional[datetime] = None  # Filter by start date
    end_date: Optional[datetime] = None  # Filter by end date

