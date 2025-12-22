"""
Custom middleware for the FastAPI application
"""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.exceptions import DocuMindException

logger = structlog.get_logger()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Only set X-Frame-Options for non-download endpoints
        # PDF downloads need to be embeddable in iframes/embeds
        # Check both the request path and response headers to ensure we don't block PDFs
        is_download_endpoint = "/download" in request.url.path
        is_pdf_response = response.headers.get("Content-Type", "").startswith("application/pdf")
        
        if not is_download_endpoint and not is_pdf_response:
            response.headers["X-Frame-Options"] = "DENY"
        else:
            # Explicitly remove X-Frame-Options for PDF downloads
            if "X-Frame-Options" in response.headers:
                del response.headers["X-Frame-Options"]
        
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests and responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Skip logging for OPTIONS requests (CORS preflight)
        if request.method != "OPTIONS":
            # Log request
            logger.info(
                "request_started",
                method=request.method,
                path=request.url.path,
                client_ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Skip logging for OPTIONS requests (CORS preflight)
        if request.method != "OPTIONS":
            # Log response
            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Handle exceptions and return appropriate error responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except DocuMindException as e:
            logger.error(
                "application_error",
                error_type=type(e).__name__,
                message=e.message,
                status_code=e.status_code,
                details=e.details,
                path=request.url.path,
            )
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": {
                        "message": e.message,
                        "type": type(e).__name__,
                        "details": e.details,
                    }
                },
            )
        except Exception as e:
            logger.exception(
                "unhandled_exception",
                error_type=type(e).__name__,
                message=str(e),
                path=request.url.path,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "message": "Internal server error",
                        "type": "InternalServerError",
                        "details": {"detail": str(e)} if settings.DEBUG else {},
                    }
                },
            )

