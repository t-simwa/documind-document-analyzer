"""
Audit & Logging API endpoint schemas
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any


class AuditLogResponse(BaseModel):
    """Audit log entry response"""
    id: str
    action: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """List of audit logs"""
    logs: List[AuditLogResponse]
    total: int
    page: int = 1
    page_size: int = 50
    has_more: bool = False

