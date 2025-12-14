"""
FastAPI application entry point
Main application setup with middleware, CORS, and route registration
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
import structlog

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.middleware import (
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
    ErrorHandlingMiddleware,
)
from app.core.exceptions import DocuMindException
from app.api.v1.router import api_router

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"] if settings.RATE_LIMIT_ENABLED else [],
)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Secure Enterprise Document Analysis Platform - Backend API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Add rate limit exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add custom exception handler
@app.exception_handler(DocuMindException)
async def documind_exception_handler(request: Request, exc: DocuMindException):
    """Handle custom application exceptions"""
    logger.error(
        "application_error",
        error_type=type(exc).__name__,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "type": type(exc).__name__,
                "details": exc.details,
            }
        },
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Add custom middleware (order matters - last added is first executed)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs" if settings.DEBUG else "disabled",
        "api_prefix": settings.API_V1_PREFIX,
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(
        "application_startup",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG,
    )
    
    # Create upload directory if it doesn't exist
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("upload_directory_created", path=settings.UPLOAD_DIR)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("application_shutdown")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )

