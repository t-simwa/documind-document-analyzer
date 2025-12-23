"""
MinIO storage service (S3-compatible)
Works with MinIO, AWS S3, Cloudflare R2, and other S3-compatible services
"""

import os
from typing import Optional
from datetime import timedelta
from urllib.parse import urlparse
import structlog

try:
    from minio import Minio
    from minio.error import S3Error
    from minio.commonconfig import Tags
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False

from app.services.storage.base import StorageService

logger = structlog.get_logger()


class MinIOStorageService(StorageService):
    """MinIO/S3-compatible storage implementation"""
    
    def __init__(
        self,
        endpoint: str = "localhost:9000",
        access_key: str = "minioadmin",
        secret_key: str = "minioadmin",
        bucket_name: str = "documind",
        secure: bool = False,
        region: Optional[str] = None
    ):
        """
        Initialize MinIO/S3 storage service
        
        Args:
            endpoint: MinIO/S3 endpoint (e.g., "localhost:9000" or "s3.amazonaws.com")
            access_key: Access key ID
            secret_key: Secret access key
            bucket_name: Bucket name for storing files
            secure: Use HTTPS (True) or HTTP (False)
            region: AWS region (for S3) or None for MinIO
        """
        if not MINIO_AVAILABLE:
            raise ImportError(
                "minio package not installed. Install it with: pip install minio"
            )
        
        # Handle endpoint URL format (remove protocol and path if present)
        # MinIO client expects just hostname:port or hostname (no path)
        endpoint_clean = endpoint
        parsed_url = None
        
        # Parse URL if it contains protocol
        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            parsed_url = urlparse(endpoint)
            endpoint_clean = parsed_url.netloc  # Extract hostname:port (no path)
            secure = endpoint.startswith("https://")
        else:
            # If no protocol, check if there's a path component
            if "/" in endpoint:
                # Split on first / to remove path
                endpoint_clean = endpoint.split("/")[0]
        
        self.endpoint = endpoint_clean
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket_name = bucket_name
        self.secure = secure
        self.region = region
        
        # Initialize MinIO client
        self.client = Minio(
            endpoint=endpoint_clean,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
            region=region
        )
        
        # Create bucket if it doesn't exist
        self._ensure_bucket_exists()
        
        logger.info(
            "minio_storage_initialized",
            endpoint=endpoint,
            bucket_name=bucket_name,
            secure=secure
        )
    
    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info("bucket_created", bucket_name=self.bucket_name)
        except S3Error as e:
            logger.error("bucket_creation_failed", bucket_name=self.bucket_name, error=str(e))
            raise
    
    async def upload_file(
        self,
        file_content: bytes,
        file_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> str:
        """Upload file to MinIO/S3"""
        # Ensure file_path doesn't have leading slash
        file_path = file_path.lstrip("/")
        
        # Default content type
        if not content_type:
            content_type = "application/octet-stream"
        
        try:
            from io import BytesIO
            
            # Upload file
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=file_path,
                data=BytesIO(file_content),
                length=len(file_content),
                content_type=content_type,
                metadata=metadata or {}
            )
            
            logger.info(
                "file_uploaded_minio",
                file_path=file_path,
                bucket=self.bucket_name,
                size=len(file_content)
            )
            
            return file_path
            
        except S3Error as e:
            logger.error("file_upload_failed", file_path=file_path, error=str(e))
            raise Exception(f"Failed to upload file: {str(e)}")
    
    async def download_file(self, file_path: str) -> bytes:
        """Download file from MinIO/S3"""
        file_path = file_path.lstrip("/")
        
        try:
            response = self.client.get_object(self.bucket_name, file_path)
            file_content = response.read()
            response.close()
            response.release_conn()
            
            return file_content
            
        except S3Error as e:
            logger.error("file_download_failed", file_path=file_path, error=str(e))
            raise FileNotFoundError(f"File not found: {file_path}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from MinIO/S3"""
        file_path = file_path.lstrip("/")
        
        try:
            self.client.remove_object(self.bucket_name, file_path)
            logger.info("file_deleted_minio", file_path=file_path)
            return True
            
        except S3Error as e:
            logger.error("file_delete_failed", file_path=file_path, error=str(e))
            return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists in MinIO/S3"""
        file_path = file_path.lstrip("/")
        
        try:
            self.client.stat_object(self.bucket_name, file_path)
            return True
        except S3Error:
            return False
    
    async def get_signed_url(
        self,
        file_path: str,
        expiration: int = 3600
    ) -> str:
        """Generate a presigned URL for temporary file access"""
        file_path = file_path.lstrip("/")
        
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=file_path,
                expires=timedelta(seconds=expiration)
            )
            
            return url
            
        except S3Error as e:
            logger.error("signed_url_generation_failed", file_path=file_path, error=str(e))
            raise Exception(f"Failed to generate signed URL: {str(e)}")
    
    async def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes"""
        file_path = file_path.lstrip("/")
        
        try:
            stat = self.client.stat_object(self.bucket_name, file_path)
            return stat.size
            
        except S3Error as e:
            logger.error("file_stat_failed", file_path=file_path, error=str(e))
            raise FileNotFoundError(f"File not found: {file_path}")

