"""
Microsoft OneDrive OAuth and file operations service
"""

import httpx
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode
from datetime import datetime

from app.core.config import settings
from .base import CloudStorageProvider, CloudFile


class OneDriveService(CloudStorageProvider):
    """Microsoft OneDrive cloud storage provider"""
    
    AUTH_BASE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    API_BASE_URL = "https://graph.microsoft.com/v1.0/me"
    USER_INFO_URL = "https://graph.microsoft.com/v1.0/me"
    
    # Scopes required for file access
    SCOPES = [
        "Files.Read",
        "User.Read"
    ]
    
    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        super().__init__(access_token, refresh_token)
        self.client_id = settings.ONEDRIVE_CLIENT_ID
        self.client_secret = settings.ONEDRIVE_CLIENT_SECRET
    
    async def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Generate OneDrive OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "response_mode": "query",
            "scope": " ".join(self.SCOPES),
            "state": state
        }
        return f"{self.AUTH_BASE_URL}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access/refresh tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                    "scope": " ".join(self.SCOPES)
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def refresh_access_token(self) -> Dict[str, Any]:
        """Refresh the access token using refresh token"""
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                    "scope": " ".join(self.SCOPES)
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get authenticated user information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            response.raise_for_status()
            return response.json()
    
    async def list_files(self, folder_id: Optional[str] = None, page_token: Optional[str] = None) -> tuple[List[CloudFile], Optional[str]]:
        """List files in a folder"""
        if folder_id is None:
            folder_id = "root"
        
        url = f"{self.API_BASE_URL}/drive/items/{folder_id}/children"
        params = {"$top": 100}
        
        if page_token:
            url = page_token  # Microsoft Graph uses full URLs for pagination
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params if not page_token else None
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("value", []):
                # Skip folders
                if "folder" in item:
                    continue
                
                # Check if it's a supported file type
                mime_type = item.get("file", {}).get("mimeType", "")
                supported_types = [
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain",
                    "text/markdown",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "image/png",
                    "image/jpeg",
                    "image/jpg"
                ]
                
                if mime_type not in supported_types:
                    continue
                
                modified_time = None
                if item.get("lastModifiedDateTime"):
                    modified_time = datetime.fromisoformat(item["lastModifiedDateTime"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=mime_type,
                    modified_time=modified_time,
                    web_view_link=item.get("webUrl"),
                    parent_id=item.get("parentReference", {}).get("id")
                ))
            
            next_page = data.get("@odata.nextLink")
            return files, next_page
    
    async def get_file(self, file_id: str) -> CloudFile:
        """Get file metadata"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/drive/items/{file_id}",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            response.raise_for_status()
            item = response.json()
            
            modified_time = None
            if item.get("lastModifiedDateTime"):
                modified_time = datetime.fromisoformat(item["lastModifiedDateTime"].replace("Z", "+00:00"))
            
            return CloudFile(
                id=item["id"],
                name=item["name"],
                size=int(item.get("size", 0)),
                mime_type=item.get("file", {}).get("mimeType", ""),
                modified_time=modified_time,
                web_view_link=item.get("webUrl"),
                parent_id=item.get("parentReference", {}).get("id")
            )
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file content as bytes"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/drive/items/{file_id}/content",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            response.raise_for_status()
            return response.content
    
    async def search_files(self, query: str, folder_id: Optional[str] = None) -> List[CloudFile]:
        """Search for files"""
        search_url = f"{self.API_BASE_URL}/drive/root/search(q='{query}')"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                search_url,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("value", []):
                if "folder" in item:
                    continue
                
                mime_type = item.get("file", {}).get("mimeType", "")
                
                modified_time = None
                if item.get("lastModifiedDateTime"):
                    modified_time = datetime.fromisoformat(item["lastModifiedDateTime"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=mime_type,
                    modified_time=modified_time,
                    web_view_link=item.get("webUrl"),
                    parent_id=item.get("parentReference", {}).get("id")
                ))
            
            return files

