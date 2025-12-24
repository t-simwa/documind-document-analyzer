"""
Cloud storage API schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CloudStorageConnectionResponse(BaseModel):
    """Cloud storage connection response"""
    id: str
    provider: str
    account_email: Optional[str] = None
    account_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_sync_at: Optional[datetime] = None


class CloudStorageConnectionListResponse(BaseModel):
    """List of cloud storage connections"""
    connections: List[CloudStorageConnectionResponse]


class OAuthInitiateRequest(BaseModel):
    """OAuth initiation request"""
    provider: str = Field(..., description="Cloud storage provider: google_drive, onedrive, box, sharepoint")
    redirect_uri: Optional[str] = None


class OAuthInitiateResponse(BaseModel):
    """OAuth initiation response"""
    authorization_url: str
    state: str


class OAuthCallbackRequest(BaseModel):
    """OAuth callback request"""
    provider: str
    code: str
    state: str
    redirect_uri: Optional[str] = None


class CloudFileResponse(BaseModel):
    """Cloud file response"""
    id: str
    name: str
    size: int
    mime_type: str
    modified_time: Optional[datetime] = None
    web_view_link: Optional[str] = None
    is_folder: bool = False
    parent_id: Optional[str] = None


class CloudFileListResponse(BaseModel):
    """Cloud file list response"""
    files: List[CloudFileResponse]
    next_page_token: Optional[str] = None


class CloudFileImportRequest(BaseModel):
    """Cloud file import request"""
    provider: str
    file_id: str
    project_id: Optional[str] = None


class CloudFileImportResponse(BaseModel):
    """Cloud file import response"""
    document_id: str
    name: str
    status: str
    message: str

