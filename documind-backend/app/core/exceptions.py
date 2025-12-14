"""
Custom exception classes for the application
"""

from typing import Any, Dict, Optional


class DocuMindException(Exception):
    """Base exception for all application exceptions"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(DocuMindException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(message, status_code=404)


class ValidationError(DocuMindException):
    """Validation error exception"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, details=details)


class AuthenticationError(DocuMindException):
    """Authentication error exception"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class AuthorizationError(DocuMindException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=403)


class RateLimitError(DocuMindException):
    """Rate limit exceeded exception"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429)


class ProcessingError(DocuMindException):
    """Document processing error exception"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class SecurityScanError(DocuMindException):
    """Security scan error exception"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

