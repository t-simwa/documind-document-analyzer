"""
Box OAuth and file operations service
"""

import httpx
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode
from datetime import datetime

from app.core.config import settings
from .base import CloudStorageProvider, CloudFile


class BoxService(CloudStorageProvider):
    """Box cloud storage provider"""
    
    AUTH_BASE_URL = "https://account.box.com/api/oauth2/authorize"
    TOKEN_URL = "https://api.box.com/oauth2/token"
    API_BASE_URL = "https://api.box.com/2.0"
    USER_INFO_URL = "https://api.box.com/2.0/users/me"
    
    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        super().__init__(access_token, refresh_token)
        self.client_id = settings.BOX_CLIENT_ID
        self.client_secret = settings.BOX_CLIENT_SECRET
    
    async def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Generate Box OAuth authorization URL"""
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "state": state
        }
        return f"{self.AUTH_BASE_URL}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access/refresh tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": redirect_uri
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
                    "grant_type": "refresh_token",
                    "refresh_token": self.refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
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
            data = response.json()
            return {
                "id": data.get("id"),
                "email": data.get("login"),
                "name": data.get("name")
            }
    
    async def list_files(self, folder_id: Optional[str] = None, page_token: Optional[str] = None) -> tuple[List[CloudFile], Optional[str]]:
        """List files in a folder"""
        if folder_id is None:
            folder_id = "0"  # Root folder
        
        url = f"{self.API_BASE_URL}/folders/{folder_id}/items"
        params = {"limit": 100}
        
        if page_token:
            params["marker"] = page_token
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("entries", []):
                # Skip folders
                if item.get("type") == "folder":
                    continue
                
                # Check if it's a supported file type
                extension = item.get("name", "").split(".")[-1].lower()
                supported_extensions = ["pdf", "docx", "txt", "md", "xlsx", "pptx", "png", "jpg", "jpeg"]
                
                if extension not in supported_extensions:
                    continue
                
                modified_time = None
                if item.get("modified_at"):
                    modified_time = datetime.fromisoformat(item["modified_at"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=item.get("type"),  # Box uses type field
                    modified_time=modified_time,
                    web_view_link=item.get("shared_link", {}).get("url") if item.get("shared_link") else None,
                    parent_id=item.get("parent", {}).get("id") if item.get("parent") else None
                ))
            
            next_page = None
            if data.get("entries") and len(data.get("entries", [])) == 100:
                # Box uses marker-based pagination
                next_page = data.get("entries", [])[-1].get("id")
            
            return files, next_page
    
    async def get_file(self, file_id: str) -> CloudFile:
        """Get file metadata"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files/{file_id}",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            response.raise_for_status()
            item = response.json()
            
            modified_time = None
            if item.get("modified_at"):
                modified_time = datetime.fromisoformat(item["modified_at"].replace("Z", "+00:00"))
            
            return CloudFile(
                id=item["id"],
                name=item["name"],
                size=int(item.get("size", 0)),
                mime_type=item.get("type", ""),
                modified_time=modified_time,
                web_view_link=item.get("shared_link", {}).get("url") if item.get("shared_link") else None,
                parent_id=item.get("parent", {}).get("id") if item.get("parent") else None
            )
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file content as bytes"""
        # First get download URL
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files/{file_id}/content",
                headers={"Authorization": f"Bearer {self.access_token}"},
                follow_redirects=True
            )
            response.raise_for_status()
            return response.content
    
    async def search_files(self, query: str, folder_id: Optional[str] = None) -> List[CloudFile]:
        """Search for files"""
        url = f"{self.API_BASE_URL}/search"
        params = {
            "query": query,
            "limit": 50,
            "type": "file"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("entries", []):
                if item.get("type") == "folder":
                    continue
                
                modified_time = None
                if item.get("modified_at"):
                    modified_time = datetime.fromisoformat(item["modified_at"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=item.get("type", ""),
                    modified_time=modified_time,
                    web_view_link=item.get("shared_link", {}).get("url") if item.get("shared_link") else None,
                    parent_id=item.get("parent", {}).get("id") if item.get("parent") else None
                ))
            
            return files

