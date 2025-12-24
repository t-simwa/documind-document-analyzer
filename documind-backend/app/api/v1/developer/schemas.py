"""
Developer API endpoint schemas
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any


class APIKeyCreateRequest(BaseModel):
    """Request to create a new API key"""
    name: str = Field(..., description="User-friendly name for the API key")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date")
    scopes: List[str] = Field(default_factory=list, description="API scopes/permissions")


class APIKeyResponse(BaseModel):
    """API key response (without the actual key for security)"""
    id: str
    name: str
    key_prefix: str
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    scopes: List[str]
    created_at: datetime
    updated_at: datetime


class APIKeyCreateResponse(BaseModel):
    """Response when creating a new API key (includes the key only once)"""
    id: str
    name: str
    api_key: str  # The actual key (only shown once)
    key_prefix: str
    expires_at: Optional[datetime] = None
    scopes: List[str]
    created_at: datetime
    message: str = "Save this API key securely. It will not be shown again."


class APIKeyListResponse(BaseModel):
    """List of API keys"""
    keys: List[APIKeyResponse]
    total: int


class APIUsageStatsResponse(BaseModel):
    """API usage statistics"""
    total_requests: int
    successful_requests: int
    failed_requests: int
    success_rate_percent: float
    requests_by_endpoint: Dict[str, int] = Field(default_factory=dict)
    requests_by_date: Dict[str, int] = Field(default_factory=dict)
    period_start: datetime
    period_end: datetime


class APIDocumentationResponse(BaseModel):
    """API documentation response"""
    version: str
    base_url: str
    endpoints: List[Dict[str, Any]] = Field(default_factory=list)
    authentication: Dict[str, Any] = Field(default_factory=dict)
    rate_limits: Dict[str, Any] = Field(default_factory=dict)
    examples: Dict[str, Any] = Field(default_factory=dict)

