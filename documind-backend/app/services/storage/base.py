"""
Base storage service interface
All storage implementations must inherit from this class
"""

from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
from enum import Enum


class StorageProvider(str, Enum):
    """Storage provider types"""
    LOCAL = "local"
    MINIO = "minio"
    S3 = "s3"
    R2 = "r2"


class StorageService(ABC):
    """Base class for storage service implementations"""
    
    @abstractmethod
    async def upload_file(
        self,
        file_content: bytes,
        file_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload a file to storage
        
        Args:
            file_content: File content as bytes
            file_path: Destination path/key in storage
            content_type: MIME type of the file
            metadata: Optional metadata dictionary
            
        Returns:
            Storage path/key where file was saved
        """
        pass
    
    @abstractmethod
    async def download_file(self, file_path: str) -> bytes:
        """
        Download a file from storage
        
        Args:
            file_path: Storage path/key of the file
            
        Returns:
            File content as bytes
        """
        pass
    
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_path: Storage path/key of the file
            
        Returns:
            True if file was deleted, False otherwise
        """
        pass
    
    @abstractmethod
    async def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists in storage
        
        Args:
            file_path: Storage path/key of the file
            
        Returns:
            True if file exists, False otherwise
        """
        pass
    
    @abstractmethod
    async def get_signed_url(
        self,
        file_path: str,
        expiration: int = 3600
    ) -> str:
        """
        Generate a signed URL for temporary file access
        
        Args:
            file_path: Storage path/key of the file
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Signed URL string
        """
        pass
    
    @abstractmethod
    async def get_file_size(self, file_path: str) -> int:
        """
        Get file size in bytes
        
        Args:
            file_path: Storage path/key of the file
            
        Returns:
            File size in bytes
        """
        pass

