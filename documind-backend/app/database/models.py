"""
MongoDB models using Beanie ODM
"""

from beanie import Document as BeanieDocument
from pydantic import Field
from typing import Optional, List
from datetime import datetime


class User(BeanieDocument):
    """User model"""
    email: str = Field(..., unique=True)
    name: str
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = ["email"]


class Organization(BeanieDocument):
    """Organization model"""
    name: str
    slug: str = Field(..., unique=True)
    plan: str = "free"  # free, pro, enterprise
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "organizations"
        indexes = ["slug"]


class Project(BeanieDocument):
    """Project model"""
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    organization_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "projects"
        indexes = ["organization_id", "parent_id", "created_by"]


class Document(BeanieDocument):
    """Document model"""
    name: str
    status: str = "processing"  # processing, ready, error
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: str
    size: int  # in bytes
    type: str  # file extension
    project_id: Optional[str] = None
    organization_id: Optional[str] = None
    file_path: Optional[str] = None
    tags: List[str] = Field(default_factory=list)  # List of tag IDs
    metadata: dict = Field(default_factory=dict)
    
    class Settings:
        name = "documents"
        indexes = ["project_id", "organization_id", "uploaded_by", "status", "tags"]


class Tag(BeanieDocument):
    """Tag model"""
    name: str
    color: Optional[str] = None  # Hex color code
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tags"
        indexes = ["organization_id", "name"]


class DocumentTag(BeanieDocument):
    """Document-Tag junction model (for many-to-many relationship)"""
    document_id: str
    tag_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "document_tags"
        indexes = [
            ("document_id", "tag_id"),  # Compound index
            "document_id",
            "tag_id"
        ]

