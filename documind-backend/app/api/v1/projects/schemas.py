"""
Project API schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, max_length=1000, description="Project description")
    parent_id: Optional[str] = Field(None, description="Parent project ID for hierarchical structure")


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    parent_id: Optional[str] = Field(None, description="Parent project ID for hierarchical structure")


class ProjectResponse(BaseModel):
    """Project response schema"""
    id: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    document_count: int = 0
    
    class Config:
        from_attributes = True


class ProjectHierarchyResponse(ProjectResponse):
    """Project response with children for hierarchical structure"""
    children: List['ProjectHierarchyResponse'] = []


class ProjectListResponse(BaseModel):
    """Response schema for project list"""
    projects: List[ProjectResponse]
    pagination: dict


# Update forward reference
ProjectHierarchyResponse.model_rebuild()

