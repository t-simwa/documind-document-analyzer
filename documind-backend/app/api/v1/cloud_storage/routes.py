"""
Cloud storage connectors API routes
"""

import secrets
import structlog
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import base64
import hashlib

from app.core.config import settings
from app.core.dependencies import require_auth
from app.database.models import CloudStorageConnection, Document as DocumentModel
from app.services.cloud_storage import (
    GoogleDriveService,
    OneDriveService,
    BoxService,
    SharePointService
)
from app.workers.tasks import process_document_async, security_scan_async
from app.services.storage import get_storage_service
from app.utils.activity_logger import log_activity
from .schemas import (
    CloudStorageConnectionResponse,
    CloudStorageConnectionListResponse,
    OAuthInitiateRequest,
    OAuthInitiateResponse,
    OAuthCallbackRequest,
    CloudFileListResponse,
    CloudFileResponse,
    CloudFileImportRequest,
    CloudFileImportResponse
)

logger = structlog.get_logger(__name__)
router = APIRouter()


def _get_encryption_key() -> bytes:
    """Get encryption key for OAuth tokens"""
    key = settings.OAUTH_TOKEN_ENCRYPTION_KEY or settings.SECRET_KEY
    # Convert to 32-byte key for Fernet
    key_bytes = key.encode() if isinstance(key, str) else key
    if len(key_bytes) < 32:
        # Pad or hash to 32 bytes
        key_bytes = hashlib.sha256(key_bytes).digest()
    else:
        key_bytes = key_bytes[:32]
    return base64.urlsafe_b64encode(key_bytes)


def _encrypt_token(token: str) -> str:
    """Encrypt OAuth token for storage"""
    f = Fernet(_get_encryption_key())
    return f.encrypt(token.encode()).decode()


def _decrypt_token(encrypted_token: str) -> str:
    """Decrypt OAuth token from storage"""
    f = Fernet(_get_encryption_key())
    return f.decrypt(encrypted_token.encode()).decode()


def _get_provider_service(provider: str, connection: CloudStorageConnection):
    """Get provider service instance"""
    access_token = _decrypt_token(connection.access_token)
    refresh_token = _decrypt_token(connection.refresh_token) if connection.refresh_token else None
    
    if provider == "google_drive":
        return GoogleDriveService(access_token, refresh_token)
    elif provider == "onedrive":
        return OneDriveService(access_token, refresh_token)
    elif provider == "box":
        return BoxService(access_token, refresh_token)
    elif provider == "sharepoint":
        tenant_id = connection.metadata.get("tenant_id") if connection.metadata else None
        site_id = connection.metadata.get("site_id") if connection.metadata else None
        return SharePointService(access_token, refresh_token, tenant_id, site_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


@router.get(
    "/connections",
    response_model=CloudStorageConnectionListResponse,
    summary="List cloud storage connections",
    description="Get all cloud storage connections for the current user"
)
async def list_connections(current_user: dict = Depends(require_auth)):
    """List all cloud storage connections"""
    user_id = current_user["id"]
    connections = await CloudStorageConnection.find(
        CloudStorageConnection.user_id == user_id,
        CloudStorageConnection.is_active == True
    ).to_list()
    
    return CloudStorageConnectionListResponse(
        connections=[
            CloudStorageConnectionResponse(
                id=str(conn.id),
                provider=conn.provider,
                account_email=conn.account_email,
                account_name=conn.account_name,
                is_active=conn.is_active,
                created_at=conn.created_at,
                last_sync_at=conn.last_sync_at
            )
            for conn in connections
        ]
    )


@router.post(
    "/oauth/initiate",
    response_model=OAuthInitiateResponse,
    summary="Initiate OAuth flow",
    description="Start OAuth authentication flow for a cloud storage provider"
)
async def initiate_oauth(
    request: OAuthInitiateRequest,
    current_user: dict = Depends(require_auth)
):
    """Initiate OAuth flow for cloud storage provider"""
    user_id = current_user["id"]
    
    # Generate state token
    state = secrets.token_urlsafe(32)
    
    # Get redirect URI - prioritize the one from request, fallback to settings
    if request.provider == "google_drive":
        redirect_uri = request.redirect_uri or settings.GOOGLE_DRIVE_REDIRECT_URI
        service = GoogleDriveService("", None)
    elif request.provider == "onedrive":
        redirect_uri = request.redirect_uri or settings.ONEDRIVE_REDIRECT_URI
        service = OneDriveService("", None)
    elif request.provider == "box":
        redirect_uri = request.redirect_uri or settings.BOX_REDIRECT_URI
        service = BoxService("", None)
    elif request.provider == "sharepoint":
        redirect_uri = request.redirect_uri or settings.ONEDRIVE_REDIRECT_URI
        service = SharePointService("", None)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")
    
    # Log the redirect URI being used for debugging
    logger.info(
        "oauth_initiate",
        provider=request.provider,
        redirect_uri=redirect_uri,
        from_request=request.redirect_uri is not None
    )
    
    # Generate authorization URL
    auth_url = await service.get_authorization_url(redirect_uri, state)
    
    # Log the authorization URL (without sensitive data)
    logger.info("oauth_authorization_url_generated", provider=request.provider)
    
    # Store state in user session or return it (frontend should store it)
    return OAuthInitiateResponse(
        authorization_url=auth_url,
        state=state
    )


@router.post(
    "/oauth/callback",
    response_model=CloudStorageConnectionResponse,
    summary="OAuth callback",
    description="Handle OAuth callback and store tokens"
)
async def oauth_callback(
    request: OAuthCallbackRequest,
    current_user: dict = Depends(require_auth)
):
    """Handle OAuth callback"""
    user_id = current_user["id"]
    
    # Get redirect URI
    redirect_uri = request.redirect_uri
    if not redirect_uri:
        if request.provider == "google_drive":
            redirect_uri = settings.GOOGLE_DRIVE_REDIRECT_URI
        elif request.provider == "onedrive":
            redirect_uri = settings.ONEDRIVE_REDIRECT_URI
        elif request.provider == "box":
            redirect_uri = settings.BOX_REDIRECT_URI
        elif request.provider == "sharepoint":
            redirect_uri = settings.ONEDRIVE_REDIRECT_URI
    
    # Create provider service and exchange code for tokens
    if request.provider == "google_drive":
        service = GoogleDriveService("", None)
    elif request.provider == "onedrive":
        service = OneDriveService("", None)
    elif request.provider == "box":
        service = BoxService("", None)
    elif request.provider == "sharepoint":
        service = SharePointService("", None)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")
    
    # Exchange code for tokens
    token_data = await service.exchange_code_for_tokens(request.code, redirect_uri)
    
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    
    # Create service with tokens to get user info
    if request.provider == "google_drive":
        service = GoogleDriveService(access_token, refresh_token)
    elif request.provider == "onedrive":
        service = OneDriveService(access_token, refresh_token)
    elif request.provider == "box":
        service = BoxService(access_token, refresh_token)
    elif request.provider == "sharepoint":
        service = SharePointService(access_token, refresh_token)
    
    user_info = await service.get_user_info()
    
    # Check if connection already exists
    existing = await CloudStorageConnection.find_one(
        CloudStorageConnection.user_id == user_id,
        CloudStorageConnection.provider == request.provider
    )
    
    token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    
    if existing:
        # Update existing connection
        existing.access_token = _encrypt_token(access_token)
        existing.refresh_token = _encrypt_token(refresh_token) if refresh_token else existing.refresh_token
        existing.token_expires_at = token_expires_at
        existing.account_email = user_info.get("email") or user_info.get("mail")
        existing.account_name = user_info.get("name") or user_info.get("displayName")
        existing.is_active = True
        existing.updated_at = datetime.utcnow()
        await existing.save()
        connection = existing
    else:
        # Create new connection
        connection = CloudStorageConnection(
            user_id=user_id,
            provider=request.provider,
            access_token=_encrypt_token(access_token),
            refresh_token=_encrypt_token(refresh_token) if refresh_token else None,
            token_expires_at=token_expires_at,
            account_email=user_info.get("email") or user_info.get("mail"),
            account_name=user_info.get("name") or user_info.get("displayName"),
            is_active=True
        )
        await connection.insert()
    
    await log_activity(
        user_id=user_id,
        activity_type="cloud_storage_connected",
        title=f"Connected {request.provider}",
        description=f"Successfully connected {request.provider} account",
        metadata={"provider": request.provider}
    )
    
    return CloudStorageConnectionResponse(
        id=str(connection.id),
        provider=connection.provider,
        account_email=connection.account_email,
        account_name=connection.account_name,
        is_active=connection.is_active,
        created_at=connection.created_at,
        last_sync_at=connection.last_sync_at
    )


@router.delete(
    "/connections/{connection_id}",
    summary="Disconnect cloud storage",
    description="Disconnect a cloud storage connection"
)
async def disconnect_connection(
    connection_id: str,
    current_user: dict = Depends(require_auth)
):
    """Disconnect cloud storage connection"""
    user_id = current_user["id"]
    
    connection = await CloudStorageConnection.find_one(
        CloudStorageConnection.id == connection_id,
        CloudStorageConnection.user_id == user_id
    )
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    connection.is_active = False
    await connection.save()
    
    await log_activity(
        user_id=user_id,
        activity_type="cloud_storage_disconnected",
        title=f"Disconnected {connection.provider}",
        description=f"Disconnected {connection.provider} account",
        metadata={"provider": connection.provider}
    )
    
    return {"message": "Connection disconnected successfully"}


@router.get(
    "/{provider}/files",
    response_model=CloudFileListResponse,
    summary="List files from cloud storage",
    description="List files from a connected cloud storage provider"
)
async def list_files(
    provider: str,
    folder_id: Optional[str] = Query(None, description="Folder ID to list files from"),
    page_token: Optional[str] = Query(None, description="Pagination token"),
    current_user: dict = Depends(require_auth)
):
    """List files from cloud storage"""
    user_id = current_user["id"]
    
    # Get connection
    connection = await CloudStorageConnection.find_one(
        CloudStorageConnection.user_id == user_id,
        CloudStorageConnection.provider == provider,
        CloudStorageConnection.is_active == True
    )
    
    if not connection:
        raise HTTPException(status_code=404, detail="No active connection found for this provider")
    
    # Check if token needs refresh
    if connection.token_expires_at and connection.token_expires_at < datetime.utcnow():
        service = _get_provider_service(provider, connection)
        token_data = await service.refresh_access_token()
        connection.access_token = _encrypt_token(token_data["access_token"])
        if token_data.get("refresh_token"):
            connection.refresh_token = _encrypt_token(token_data["refresh_token"])
        if token_data.get("expires_in"):
            connection.token_expires_at = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
        await connection.save()
        service = _get_provider_service(provider, connection)
    else:
        service = _get_provider_service(provider, connection)
    
    # List files
    files, next_page_token = await service.list_files(folder_id, page_token)
    
    return CloudFileListResponse(
        files=[
            CloudFileResponse(
                id=f.id,
                name=f.name,
                size=f.size,
                mime_type=f.mime_type,
                modified_time=f.modified_time,
                web_view_link=f.web_view_link,
                is_folder=f.is_folder,
                parent_id=f.parent_id
            )
            for f in files
        ],
        next_page_token=next_page_token
    )


@router.post(
    "/{provider}/import",
    response_model=CloudFileImportResponse,
    summary="Import file from cloud storage",
    description="Import a file from cloud storage and process it"
)
async def import_file(
    provider: str,
    request: CloudFileImportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_auth)
):
    """Import file from cloud storage"""
    user_id = current_user["id"]
    
    # Get connection
    connection = await CloudStorageConnection.find_one(
        CloudStorageConnection.user_id == user_id,
        CloudStorageConnection.provider == provider,
        CloudStorageConnection.is_active == True
    )
    
    if not connection:
        raise HTTPException(status_code=404, detail="No active connection found for this provider")
    
    # Check if token needs refresh
    if connection.token_expires_at and connection.token_expires_at < datetime.utcnow():
        service = _get_provider_service(provider, connection)
        token_data = await service.refresh_access_token()
        connection.access_token = _encrypt_token(token_data["access_token"])
        if token_data.get("refresh_token"):
            connection.refresh_token = _encrypt_token(token_data["refresh_token"])
        if token_data.get("expires_in"):
            connection.token_expires_at = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
        await connection.save()
        service = _get_provider_service(provider, connection)
    else:
        service = _get_provider_service(provider, connection)
    
    # Get file metadata
    cloud_file = await service.get_file(request.file_id)
    
    # Download file
    file_content = await service.download_file(request.file_id)
    
    # Get file extension
    file_ext = cloud_file.name.split(".")[-1].lower() if "." in cloud_file.name else ""
    
    # Validate file type
    allowed_extensions = settings.ALLOWED_EXTENSIONS
    if isinstance(allowed_extensions, str):
        allowed_extensions = [ext.strip() for ext in allowed_extensions.split(",")]
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Check file size
    if len(file_content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size {len(file_content)} exceeds maximum allowed size {settings.MAX_UPLOAD_SIZE}"
        )
    
    # Get storage service
    storage = get_storage_service(
        provider=settings.STORAGE_PROVIDER,
        base_path=settings.STORAGE_BASE_PATH,
        endpoint=settings.STORAGE_ENDPOINT,
        access_key=settings.STORAGE_ACCESS_KEY,
        secret_key=settings.STORAGE_SECRET_KEY,
        bucket_name=settings.STORAGE_BUCKET_NAME,
        secure=settings.STORAGE_SECURE,
        region=settings.STORAGE_REGION
    )
    
    # Store file
    import uuid
    import os
    from pathlib import Path
    document_id = str(uuid.uuid4())
    stored_path = f"documents/{user_id}/{document_id}/{cloud_file.name}"
    await storage.upload_file(stored_path, file_content)
    
    # Create document record
    document = DocumentModel(
        id=document_id,
        name=cloud_file.name,
        status="processing",
        uploaded_by=user_id,
        size=len(file_content),
        type=file_ext,
        project_id=request.project_id,
        file_path=stored_path,
        metadata={
            "source": "cloud_storage",
            "provider": provider,
            "cloud_file_id": request.file_id,
            "imported_at": datetime.utcnow().isoformat()
        }
    )
    await document.insert()
    
    # Start security scan
    temp_file_path = None
    if settings.STORAGE_PROVIDER != "local":
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{cloud_file.name}")
        temp_file_path = temp_file.name
        temp_file.write(file_content)
        temp_file.close()
    else:
        temp_file_path = os.path.join(settings.STORAGE_BASE_PATH, stored_path)
    
    background_tasks.add_task(
        security_scan_async,
        document_id=document_id,
        file_path=temp_file_path,
        metadata={"project_id": request.project_id, "storage_path": stored_path}
    )
    
    # Start document processing
    background_tasks.add_task(
        process_document_async,
        document_id=document_id,
        file_path=temp_file_path,
        file_type=file_ext,
        metadata={"project_id": request.project_id, "filename": cloud_file.name, "storage_path": stored_path}
    )
    
    await log_activity(
        user_id=user_id,
        activity_type="document_imported",
        title=f"Imported {cloud_file.name}",
        description=f"Imported file from {provider}",
        document_id=document_id,
        project_id=request.project_id,
        metadata={"provider": provider, "source": "cloud_storage"}
    )
    
    return CloudFileImportResponse(
        document_id=document_id,
        name=cloud_file.name,
        status="processing",
        message="File imported successfully and is being processed"
    )

