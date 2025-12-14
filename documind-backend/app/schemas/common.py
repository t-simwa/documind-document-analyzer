"""
Common Pydantic schemas for API responses
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ErrorDetail(BaseModel):
    """Error detail schema"""
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response schema"""
    error: Dict[str, Any] = Field(
        ...,
        description="Error information",
        example={
            "message": "An error occurred",
            "type": "ValidationError",
            "details": {}
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseModel):
    """Standard success response schema"""
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthStatus(BaseModel):
    """Health check status schema"""
    status: str = Field(..., description="Health status: healthy, unhealthy, degraded")
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    uptime_seconds: Optional[float] = None


class SystemStatus(BaseModel):
    """System status schema for detailed health checks"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    uptime_seconds: float
    services: Dict[str, Any] = Field(
        default_factory=dict,
        description="Status of various services (database, redis, etc.)"
    )

