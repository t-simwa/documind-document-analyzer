"""
Metrics API schemas
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentMetric(BaseModel):
    """Document metric item"""
    label: str
    value: str  # Formatted string (e.g., "1,247")
    change: float  # Percentage change
    trend: str  # "up", "down", or "neutral"


class StorageMetric(BaseModel):
    """Storage usage metric"""
    used_gb: float
    limit_gb: float
    percentage: float
    used_formatted: str  # Formatted string (e.g., "2.4 GB")
    limit_formatted: str  # Formatted string (e.g., "10 GB")


class DocumentMetricsResponse(BaseModel):
    """Response for document metrics"""
    metrics: List[DocumentMetric]
    total_documents: int
    processed_this_month: int
    storage_used_gb: float


class StorageMetricsResponse(BaseModel):
    """Response for storage metrics"""
    storage: StorageMetric
    breakdown: Optional[dict] = None  # Optional breakdown by file type, etc.

