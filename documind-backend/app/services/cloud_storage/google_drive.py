"""
Google Drive OAuth and file operations service
"""

import httpx
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode
from datetime import datetime

from app.core.config import settings
from .base import CloudStorageProvider, CloudFile


class GoogleDriveService(CloudStorageProvider):
    """Google Drive cloud storage provider"""
    
    AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    API_BASE_URL = "https://www.googleapis.com/drive/v3"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    # Scopes required for file access
    SCOPES = [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]
    
    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        super().__init__(access_token, refresh_token)
        self.client_id = settings.GOOGLE_DRIVE_CLIENT_ID
        self.client_secret = settings.GOOGLE_DRIVE_CLIENT_SECRET
    
    async def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Generate Google Drive OAuth authorization URL"""
        import structlog
        logger = structlog.get_logger(__name__)
        
        # Log the redirect URI being used for debugging
        logger.info("google_drive_auth_url", redirect_uri=redirect_uri, client_id=self.client_id[:10] + "...")
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        auth_url = f"{self.AUTH_BASE_URL}?{urlencode(params)}"
        logger.debug("google_drive_auth_url_generated", url_length=len(auth_url))
        return auth_url
    
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
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token"
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
        params = {
            "pageSize": 100,
            "fields": "nextPageToken, files(id, name, size, mimeType, modifiedTime, webViewLink, parents)",
            "q": "trashed=false"
        }
        
        if folder_id:
            params["q"] += f" and '{folder_id}' in parents"
        else:
            params["q"] += " and 'root' in parents"
        
        if page_token:
            params["pageToken"] = page_token
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("files", []):
                # Filter to only show supported file types
                mime_type = item.get("mimeType", "")
                if mime_type == "application/vnd.google-apps.folder":
                    continue  # Skip folders for now, or handle separately
                
                # Check if it's a supported document type
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
                if item.get("modifiedTime"):
                    modified_time = datetime.fromisoformat(item["modifiedTime"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=mime_type,
                    modified_time=modified_time,
                    web_view_link=item.get("webViewLink"),
                    parent_id=item.get("parents", [None])[0] if item.get("parents") else None
                ))
            
            return files, data.get("nextPageToken")
    
    async def get_file(self, file_id: str) -> CloudFile:
        """Get file metadata"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files/{file_id}",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={"fields": "id, name, size, mimeType, modifiedTime, webViewLink, parents"}
            )
            response.raise_for_status()
            item = response.json()
            
            modified_time = None
            if item.get("modifiedTime"):
                modified_time = datetime.fromisoformat(item["modifiedTime"].replace("Z", "+00:00"))
            
            return CloudFile(
                id=item["id"],
                name=item["name"],
                size=int(item.get("size", 0)),
                mime_type=item.get("mimeType", ""),
                modified_time=modified_time,
                web_view_link=item.get("webViewLink"),
                parent_id=item.get("parents", [None])[0] if item.get("parents") else None
            )
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file content as bytes"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files/{file_id}",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={"alt": "media"}
            )
            response.raise_for_status()
            return response.content
    
    async def search_files(self, query: str, folder_id: Optional[str] = None) -> List[CloudFile]:
        """Search for files"""
        search_query = f"name contains '{query}' and trashed=false"
        if folder_id:
            search_query += f" and '{folder_id}' in parents"
        
        params = {
            "q": search_query,
            "pageSize": 50,
            "fields": "files(id, name, size, mimeType, modifiedTime, webViewLink, parents)"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}/files",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            files = []
            for item in data.get("files", []):
                mime_type = item.get("mimeType", "")
                if mime_type == "application/vnd.google-apps.folder":
                    continue
                
                modified_time = None
                if item.get("modifiedTime"):
                    modified_time = datetime.fromisoformat(item["modifiedTime"].replace("Z", "+00:00"))
                
                files.append(CloudFile(
                    id=item["id"],
                    name=item["name"],
                    size=int(item.get("size", 0)),
                    mime_type=mime_type,
                    modified_time=modified_time,
                    web_view_link=item.get("webViewLink"),
                    parent_id=item.get("parents", [None])[0] if item.get("parents") else None
                ))
            
            return files

