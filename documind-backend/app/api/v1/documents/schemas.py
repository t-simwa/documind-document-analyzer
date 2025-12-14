"""
Document API schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload"""
    id: str
    name: str
    status: str
    uploaded_at: datetime
    size: int
    type: str
    project_id: Optional[str] = None
    metadata: Dict[str, Any] = {}


class DocumentResponse(BaseModel):
    """Document response schema"""
    id: str
    name: str
    status: str
    uploaded_at: datetime
    uploaded_by: str
    size: int
    type: str
    project_id: Optional[str] = None
    tags: list = []
    metadata: Dict[str, Any] = {}

