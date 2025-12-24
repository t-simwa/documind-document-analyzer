"""
Common Pydantic schemas for API responses
JSON API Standard compliant schemas for consistent API responses
"""

from typing import Any, Dict, Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

# Type variable for generic responses
T = TypeVar('T')


class ErrorCode(str, Enum):
    """Standardized error codes for API responses"""
    # 400 - Bad Request
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"
    
    # 401 - Unauthorized
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    
    # 403 - Forbidden
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    ACCESS_DENIED = "ACCESS_DENIED"
    
    # 404 - Not Found
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    ENDPOINT_NOT_FOUND = "ENDPOINT_NOT_FOUND"
    
    # 409 - Conflict
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    
    # 422 - Unprocessable Entity
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY"
    
    # 429 - Too Many Requests
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # 500 - Internal Server Error
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    PROCESSING_ERROR = "PROCESSING_ERROR"
    
    # 503 - Service Unavailable
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"


class ErrorDetail(BaseModel):
    """Error detail schema following JSON API standard"""
    field: Optional[str] = Field(None, description="Field name that caused the error")
    message: str = Field(..., description="Human-readable error message")
    code: Optional[str] = Field(None, description="Machine-readable error code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field": "email",
                "message": "Invalid email format",
                "code": "INVALID_FORMAT"
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response schema following JSON API standard"""
    error: Dict[str, Any] = Field(
        ...,
        description="Error information object",
        example={
            "code": "VALIDATION_ERROR",
            "message": "Validation failed",
            "type": "ValidationError",
            "details": [
                {
                    "field": "email",
                    "message": "Invalid email format",
                    "code": "INVALID_FORMAT"
                }
            ]
        }
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the error occurred"
    )
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "type": "ValidationError",
                    "details": []
                },
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456"
            }
        }


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response schema following JSON API standard"""
    data: Optional[T] = Field(None, description="Response data")
    message: Optional[str] = Field(None, description="Success message")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of the response"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": {},
                "message": "Operation completed successfully",
                "meta": {},
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata following JSON API standard"""
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    limit: int = Field(..., ge=1, description="Number of items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "total": 100,
                "total_pages": 5,
                "has_next": True,
                "has_prev": False
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response schema following JSON API standard"""
    data: List[T] = Field(..., description="List of items in the current page")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 100,
                    "total_pages": 5,
                    "has_next": True,
                    "has_prev": False
                },
                "meta": {}
            }
        }


class FilterParam(BaseModel):
    """Filter parameter schema"""
    field: str = Field(..., description="Field name to filter on")
    operator: str = Field(
        default="eq",
        description="Filter operator: eq, ne, gt, gte, lt, lte, in, nin, contains, starts_with, ends_with"
    )
    value: Any = Field(..., description="Filter value")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field": "status",
                "operator": "eq",
                "value": "active"
            }
        }


class SortParam(BaseModel):
    """Sort parameter schema"""
    field: str = Field(..., description="Field name to sort by")
    direction: str = Field(
        default="asc",
        description="Sort direction: asc or desc"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "field": "created_at",
                "direction": "desc"
            }
        }


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

