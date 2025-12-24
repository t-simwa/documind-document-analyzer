"""
Custom exception classes for the application
Standardized exceptions with error codes following JSON API standard
"""

from typing import Any, Dict, Optional, List
from app.schemas.common import ErrorCode, ErrorDetail


class DocuMindException(Exception):
    """Base exception for all application exceptions"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[List[Dict[str, Any]]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or ErrorCode.INTERNAL_SERVER_ERROR.value
        self.details = details or []
        super().__init__(self.message)


class NotFoundError(DocuMindException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(
            message,
            status_code=404,
            error_code=ErrorCode.RESOURCE_NOT_FOUND.value,
            details=[{
                "field": "id",
                "message": message,
                "code": ErrorCode.RESOURCE_NOT_FOUND.value
            }]
        )


class ValidationError(DocuMindException):
    """Validation error exception"""
    
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[List[Dict[str, Any]]] = None
    ):
        error_details = details or [{
            "message": message,
            "code": ErrorCode.VALIDATION_ERROR.value
        }]
        super().__init__(
            message,
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR.value,
            details=error_details
        )


class AuthenticationError(DocuMindException):
    """Authentication error exception"""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message,
            status_code=401,
            error_code=ErrorCode.AUTHENTICATION_REQUIRED.value,
            details=[{
                "message": message,
                "code": ErrorCode.AUTHENTICATION_REQUIRED.value
            }]
        )


class AuthorizationError(DocuMindException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message,
            status_code=403,
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS.value,
            details=[{
                "message": message,
                "code": ErrorCode.INSUFFICIENT_PERMISSIONS.value
            }]
        )


class RateLimitError(DocuMindException):
    """Rate limit exceeded exception"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message,
            status_code=429,
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED.value,
            details=[{
                "message": message,
                "code": ErrorCode.RATE_LIMIT_EXCEEDED.value
            }]
        )


class ProcessingError(DocuMindException):
    """Document processing error exception"""
    
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        error_details = details or [{
            "message": message,
            "code": ErrorCode.PROCESSING_ERROR.value
        }]
        super().__init__(
            message,
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR.value,
            details=error_details
        )


class SecurityScanError(DocuMindException):
    """Security scan error exception"""
    
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        error_details = details or [{
            "message": message,
            "code": ErrorCode.PROCESSING_ERROR.value
        }]
        super().__init__(
            message,
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR.value,
            details=error_details
        )


class ConflictError(DocuMindException):
    """Resource conflict exception"""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[List[Dict[str, Any]]] = None):
        error_details = details or [{
            "message": message,
            "code": ErrorCode.RESOURCE_CONFLICT.value
        }]
        super().__init__(
            message,
            status_code=409,
            error_code=ErrorCode.RESOURCE_CONFLICT.value,
            details=error_details
        )

