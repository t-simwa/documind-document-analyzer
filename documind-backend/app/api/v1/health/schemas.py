"""
Health check endpoint schemas
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional


class HealthResponse(BaseModel):
    """Basic health check response"""
    status: str = Field(..., description="Health status: healthy or unhealthy")
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ReadinessResponse(BaseModel):
    """Readiness check response"""
    status: str = Field(..., description="Readiness status: ready or not_ready")
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    checks: Dict[str, Any] = Field(
        default_factory=dict,
        description="Individual service readiness checks"
    )


class LivenessResponse(BaseModel):
    """Liveness check response"""
    status: str = Field(..., description="Liveness status: alive or dead")
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    uptime_seconds: Optional[float] = Field(None, description="Application uptime in seconds")

