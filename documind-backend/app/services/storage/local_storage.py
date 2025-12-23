"""
Local filesystem storage service
Stores files on the local filesystem (fallback/default)
"""

import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import quote
import structlog

from app.services.storage.base import StorageService

logger = structlog.get_logger()


class LocalStorageService(StorageService):
    """Local filesystem storage implementation"""
    
    def __init__(
        self,
        base_path: str = "./uploads",
        secret_key: str = "local-storage-secret-key-change-in-production"
    ):
        """
        Initialize local storage service
        
        Args:
            base_path: Base directory for file storage
            secret_key: Secret key for signed URL generation
        """
        self.base_path = os.path.abspath(base_path)
        self.secret_key = secret_key.encode() if isinstance(secret_key, str) else secret_key
        
        # Create base directory if it doesn't exist
        os.makedirs(self.base_path, exist_ok=True)
        
        logger.info(
            "local_storage_initialized",
            base_path=self.base_path
        )
    
    async def upload_file(
        self,
        file_content: bytes,
        file_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> str:
        """Upload file to local filesystem"""
        # Ensure file_path doesn't have leading slash
        file_path = file_path.lstrip("/")
        
        # Create full path
        full_path = os.path.join(self.base_path, file_path)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write file
        with open(full_path, "wb") as f:
            f.write(file_content)
        
        logger.info(
            "file_uploaded_local",
            file_path=file_path,
            full_path=full_path,
            size=len(file_content)
        )
        
        return file_path
    
    async def download_file(self, file_path: str) -> bytes:
        """Download file from local filesystem"""
        file_path = file_path.lstrip("/")
        full_path = os.path.join(self.base_path, file_path)
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(full_path, "rb") as f:
            return f.read()
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from local filesystem"""
        file_path = file_path.lstrip("/")
        full_path = os.path.join(self.base_path, file_path)
        
        if os.path.exists(full_path):
            os.remove(full_path)
            logger.info("file_deleted_local", file_path=file_path)
            return True
        
        return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists in local filesystem"""
        file_path = file_path.lstrip("/")
        full_path = os.path.join(self.base_path, file_path)
        return os.path.exists(full_path)
    
    async def get_signed_url(
        self,
        file_path: str,
        expiration: int = 3600
    ) -> str:
        """
        Generate a signed URL for local storage
        For local storage, we generate a simple token-based URL
        In production, you'd want to use a proper URL signing mechanism
        """
        # Generate expiration timestamp
        expires_at = datetime.utcnow() + timedelta(seconds=expiration)
        expires_timestamp = int(expires_at.timestamp())
        
        # Create signature
        message = f"{file_path}:{expires_timestamp}".encode()
        signature = hmac.new(self.secret_key, message, hashlib.sha256).hexdigest()
        
        # Return signed URL (in production, this would be a proper API endpoint)
        # For now, return a token-based URL
        signed_url = f"/api/v1/files/download?path={quote(file_path)}&expires={expires_timestamp}&signature={signature}"
        
        return signed_url
    
    async def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes"""
        file_path = file_path.lstrip("/")
        full_path = os.path.join(self.base_path, file_path)
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        return os.path.getsize(full_path)

