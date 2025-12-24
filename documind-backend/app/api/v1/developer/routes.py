"""
Developer API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List

from app.api.v1.developer.schemas import (
    APIKeyCreateRequest,
    APIKeyResponse,
    APIKeyCreateResponse,
    APIKeyListResponse,
    APIUsageStatsResponse,
    APIDocumentationResponse
)
from app.core.dependencies import require_auth
from app.core.security import generate_api_key, hash_api_key, verify_api_key
from app.core.config import settings
from app.database.models import APIKey, AuditLog, QueryHistory
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


@router.get(
    "/keys",
    response_model=APIKeyListResponse,
    summary="List API keys",
    description="Get all API keys for the current user",
    tags=["Developer"]
)
async def list_api_keys(
    current_user: dict = Depends(require_auth)
) -> APIKeyListResponse:
    """List all API keys for the current user"""
    user_id = current_user["id"]
    
    # Get all keys for the user
    keys = await APIKey.find(APIKey.user_id == user_id).sort(-APIKey.created_at).to_list()
    
    # Convert to response format
    key_responses = [
        APIKeyResponse(
            id=str(key.id),
            name=key.name,
            key_prefix=key.key_prefix,
            last_used_at=key.last_used_at,
            expires_at=key.expires_at,
            is_active=key.is_active,
            scopes=key.scopes,
            created_at=key.created_at,
            updated_at=key.updated_at
        )
        for key in keys
    ]
    
    return APIKeyListResponse(
        keys=key_responses,
        total=len(key_responses)
    )


@router.post(
    "/keys",
    response_model=APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create API key",
    description="Create a new API key for the current user",
    tags=["Developer"]
)
async def create_api_key(
    request: APIKeyCreateRequest,
    current_user: dict = Depends(require_auth)
) -> APIKeyCreateResponse:
    """Create a new API key"""
    user_id = current_user["id"]
    
    # Generate API key
    api_key = generate_api_key()
    key_prefix = api_key[:16]  # First 16 characters for display
    key_hash = hash_api_key(api_key)
    
    # Create API key document
    api_key_doc = APIKey(
        user_id=user_id,
        name=request.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        expires_at=request.expires_at,
        scopes=request.scopes,
        is_active=True
    )
    await api_key_doc.insert()
    
    # Log the creation
    try:
        audit_log = AuditLog(
            action="api_key.created",
            user_id=user_id,
            user_email=current_user.get("email"),
            resource_type="api_key",
            resource_id=str(api_key_doc.id),
            status="success",
            metadata={"name": request.name, "key_prefix": key_prefix}
        )
        await audit_log.insert()
    except Exception:
        pass  # Don't fail if audit logging fails
    
    return APIKeyCreateResponse(
        id=str(api_key_doc.id),
        name=api_key_doc.name,
        api_key=api_key,  # Only shown once
        key_prefix=api_key_doc.key_prefix,
        expires_at=api_key_doc.expires_at,
        scopes=api_key_doc.scopes,
        created_at=api_key_doc.created_at
    )


@router.delete(
    "/keys/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke API key",
    description="Revoke (delete) an API key",
    tags=["Developer"]
)
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(require_auth)
):
    """Revoke an API key"""
    user_id = current_user["id"]
    
    # Find the key
    try:
        from bson import ObjectId
        key = await APIKey.get(ObjectId(key_id))
    except Exception:
        raise NotFoundError("API key not found")
    
    # Verify ownership
    if key.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to revoke this API key"
        )
    
    # Delete the key
    await key.delete()
    
    # Log the revocation
    try:
        audit_log = AuditLog(
            action="api_key.revoked",
            user_id=user_id,
            user_email=current_user.get("email"),
            resource_type="api_key",
            resource_id=key_id,
            status="success",
            metadata={"name": key.name, "key_prefix": key.key_prefix}
        )
        await audit_log.insert()
    except Exception:
        pass  # Don't fail if audit logging fails


@router.get(
    "/usage",
    response_model=APIUsageStatsResponse,
    summary="Get API usage statistics",
    description="Get API usage statistics for the current user",
    tags=["Developer"]
)
async def get_api_usage(
    current_user: dict = Depends(require_auth),
    days: int = 30
) -> APIUsageStatsResponse:
    """Get API usage statistics"""
    user_id = current_user["id"]
    
    # Calculate date range
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)
    
    # Get audit logs for API usage
    logs = await AuditLog.find(
        AuditLog.user_id == user_id,
        AuditLog.created_at >= period_start,
        AuditLog.action.startswith("api.")
    ).to_list()
    
    # Calculate statistics
    total_requests = len(logs)
    successful_requests = sum(1 for log in logs if log.status == "success")
    failed_requests = total_requests - successful_requests
    success_rate = round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2)
    
    # Group by endpoint
    requests_by_endpoint = {}
    for log in logs:
        endpoint = log.metadata.get("endpoint", "unknown")
        requests_by_endpoint[endpoint] = requests_by_endpoint.get(endpoint, 0) + 1
    
    # Group by date
    requests_by_date = {}
    for log in logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        requests_by_date[date_str] = requests_by_date.get(date_str, 0) + 1
    
    return APIUsageStatsResponse(
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=failed_requests,
        success_rate_percent=success_rate,
        requests_by_endpoint=requests_by_endpoint,
        requests_by_date=requests_by_date,
        period_start=period_start,
        period_end=period_end
    )


@router.get(
    "/docs",
    response_model=APIDocumentationResponse,
    summary="Get API documentation",
    description="Get API documentation and usage information",
    tags=["Developer"]
)
async def get_api_documentation(
    current_user: dict = Depends(require_auth)
) -> APIDocumentationResponse:
    """Get API documentation"""
    base_url = f"{settings.API_V1_PREFIX}"
    
    # Common endpoints
    endpoints = [
        {
            "method": "GET",
            "path": "/documents",
            "description": "List documents",
            "authentication": "Required"
        },
        {
            "method": "POST",
            "path": "/documents",
            "description": "Upload a document",
            "authentication": "Required"
        },
        {
            "method": "GET",
            "path": "/documents/{id}",
            "description": "Get document details",
            "authentication": "Required"
        },
        {
            "method": "POST",
            "path": "/query",
            "description": "Query documents",
            "authentication": "Required"
        },
        {
            "method": "GET",
            "path": "/projects",
            "description": "List projects",
            "authentication": "Required"
        },
    ]
    
    return APIDocumentationResponse(
        version=settings.APP_VERSION,
        base_url=base_url,
        endpoints=endpoints,
        authentication={
            "type": "Bearer Token",
            "header": "Authorization: Bearer <api_key>",
            "description": "Include your API key in the Authorization header"
        },
        rate_limits={
            "per_minute": settings.RATE_LIMIT_PER_MINUTE,
            "per_hour": settings.RATE_LIMIT_PER_HOUR,
            "description": "Rate limits are applied per API key"
        },
        examples={
            "curl": f"curl -H 'Authorization: Bearer YOUR_API_KEY' {base_url}/documents",
            "python": f"import requests\nheaders = {{'Authorization': 'Bearer YOUR_API_KEY'}}\nresponse = requests.get('{base_url}/documents', headers=headers)"
        }
    )

