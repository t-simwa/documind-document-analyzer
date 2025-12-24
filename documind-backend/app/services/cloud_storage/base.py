"""
Base classes for cloud storage providers
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class CloudFile:
    """Represents a file in cloud storage"""
    id: str
    name: str
    size: int
    mime_type: str
    modified_time: Optional[datetime] = None
    web_view_link: Optional[str] = None
    download_url: Optional[str] = None
    is_folder: bool = False
    parent_id: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class CloudStorageProvider(ABC):
    """Abstract base class for cloud storage providers"""
    
    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
    
    @abstractmethod
    async def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Generate OAuth authorization URL"""
        pass
    
    @abstractmethod
    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access/refresh tokens"""
        pass
    
    @abstractmethod
    async def refresh_access_token(self) -> Dict[str, Any]:
        """Refresh the access token using refresh token"""
        pass
    
    @abstractmethod
    async def get_user_info(self) -> Dict[str, Any]:
        """Get authenticated user information"""
        pass
    
    @abstractmethod
    async def list_files(self, folder_id: Optional[str] = None, page_token: Optional[str] = None) -> tuple[List[CloudFile], Optional[str]]:
        """List files in a folder. Returns (files, next_page_token)"""
        pass
    
    @abstractmethod
    async def get_file(self, file_id: str) -> CloudFile:
        """Get file metadata"""
        pass
    
    @abstractmethod
    async def download_file(self, file_id: str) -> bytes:
        """Download file content as bytes"""
        pass
    
    @abstractmethod
    async def search_files(self, query: str, folder_id: Optional[str] = None) -> List[CloudFile]:
        """Search for files"""
        pass

