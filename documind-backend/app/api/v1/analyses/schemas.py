"""
Saved analyses API schemas
"""

from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class SavedAnalysisCreate(BaseModel):
    """Schema for creating a saved analysis"""
    document_ids: List[str] = Field(..., description="List of document IDs")
    document_names: List[str] = Field(..., description="List of document names")
    has_comparison: bool = Field(default=False, description="Whether analysis has comparison")
    has_patterns: bool = Field(default=False, description="Whether analysis has patterns")
    has_contradictions: bool = Field(default=False, description="Whether analysis has contradictions")
    has_messages: bool = Field(default=False, description="Whether analysis has messages")


class SavedAnalysisUpdate(BaseModel):
    """Schema for updating a saved analysis"""
    has_comparison: bool | None = None
    has_patterns: bool | None = None
    has_contradictions: bool | None = None
    has_messages: bool | None = None


class SavedAnalysisResponse(BaseModel):
    """Schema for saved analysis response"""
    id: str
    document_ids: List[str]
    document_names: List[str]
    has_comparison: bool
    has_patterns: bool
    has_contradictions: bool
    has_messages: bool
    created_at: datetime
    updated_at: datetime


class SavedAnalysisListResponse(BaseModel):
    """Schema for list of saved analyses"""
    analyses: List[SavedAnalysisResponse]
    total: int

