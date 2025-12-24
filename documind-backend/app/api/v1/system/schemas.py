"""
System API endpoint schemas
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional


class SystemStatsResponse(BaseModel):
    """System statistics response"""
    version: str
    uptime_seconds: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    database: Dict[str, Any] = Field(default_factory=dict)
    users: Dict[str, Any] = Field(default_factory=dict)
    documents: Dict[str, Any] = Field(default_factory=dict)
    projects: Dict[str, Any] = Field(default_factory=dict)
    storage: Dict[str, Any] = Field(default_factory=dict)
    queries: Dict[str, Any] = Field(default_factory=dict)

