"""
Storage service abstraction layer
Supports multiple storage backends: local, MinIO (S3-compatible), AWS S3, Cloudflare R2
"""

from app.services.storage.base import StorageService, StorageProvider
from app.services.storage.local_storage import LocalStorageService
from app.services.storage.minio_storage import MinIOStorageService

__all__ = [
    "StorageService",
    "StorageProvider",
    "LocalStorageService",
    "MinIOStorageService",
    "get_storage_service",
]


def get_storage_service(provider: str = "local", **kwargs) -> StorageService:
    """
    Factory function to get storage service instance
    
    Args:
        provider: Storage provider name ("local", "minio", "s3", "r2")
        **kwargs: Provider-specific configuration
        
    Returns:
        StorageService instance
    """
    provider = provider.lower()
    
    if provider == "local":
        # Local storage only needs base_path and secret_key
        local_kwargs = {
            "base_path": kwargs.get("base_path", "./uploads"),
            "secret_key": kwargs.get("secret_key", "local-storage-secret-key-change-in-production")
        }
        return LocalStorageService(**local_kwargs)
    elif provider in ["minio", "s3", "r2"]:
        # MinIO/S3/R2 storage needs endpoint, credentials, bucket, etc.
        # Filter out base_path as it's not used by MinIOStorageService
        minio_kwargs = {
            "endpoint": kwargs.get("endpoint", "localhost:9000"),
            "access_key": kwargs.get("access_key", ""),
            "secret_key": kwargs.get("secret_key", ""),
            "bucket_name": kwargs.get("bucket_name", "documind"),
            "secure": kwargs.get("secure", False),
            "region": kwargs.get("region", None)
        }
        return MinIOStorageService(**minio_kwargs)
    else:
        raise ValueError(f"Unknown storage provider: {provider}")

