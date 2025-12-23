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
    created_by: str  # User who created the tag
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tags"
        indexes = ["organization_id", "name", "created_by"]


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


class SavedAnalysis(BeanieDocument):
    """Saved cross-document analysis model"""
    user_id: str  # User who created the analysis
    document_ids: List[str]  # List of document IDs in the analysis
    document_names: List[str]  # List of document names for display
    has_comparison: bool = False
    has_patterns: bool = False
    has_contradictions: bool = False
    has_messages: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "saved_analyses"
        indexes = ["user_id", "document_ids", "created_at"]


class OrganizationMember(BeanieDocument):
    """Organization member model for proper role management (Future Enhancement)"""
    organization_id: str
    user_id: str
    role: str = "analyst"  # admin, analyst, viewer
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    invited_by: Optional[str] = None  # User ID who invited this member
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "organization_members"
        indexes = [
            ("organization_id", "user_id"),  # Compound index for unique membership
            "organization_id",
            "user_id",
            "role"
        ]


class Activity(BeanieDocument):
    """Activity log model for tracking user and system events"""
    type: str  # upload, process, query, project, error, complete, etc.
    title: str
    description: str
    user_id: str  # User who performed the action
    user_name: Optional[str] = None  # Cached user name for faster queries
    organization_id: Optional[str] = None
    document_id: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None  # success, error, processing
    metadata: dict = Field(default_factory=dict)  # Additional context
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "activities"
        indexes = [
            "user_id",
            "organization_id",
            "type",
            "created_at",
            ("user_id", "created_at"),  # Compound index for user activity queries
            ("organization_id", "created_at"),  # Compound index for org activity queries
        ]