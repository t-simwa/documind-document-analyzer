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
from datetime import datetime
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
from app.database import connect_to_mongo, close_mongo_connection

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Initialize rate limiter (import from rate_limit module)
from app.core.rate_limit import limiter

# Create FastAPI application with enhanced OpenAPI documentation
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## DocuMind AI - Secure Enterprise Document Analysis Platform
    
    A comprehensive API for document analysis, querying, and management.
    
    ### Features
    - 📄 Document upload and processing
    - 🔍 AI-powered document querying
    - 📊 Analytics and insights
    - 👥 Multi-user organization support
    - 🔐 Secure authentication and authorization
    - ☁️ Cloud storage integration
    
    ### API Standards
    - **JSON API Standard**: All responses follow JSON API specification
    - **Error Handling**: Standardized error codes and messages
    - **Pagination**: Consistent pagination format across all list endpoints
    - **Filtering**: Advanced filtering with multiple operators
    - **Sorting**: Multi-field sorting support
    
    ### Authentication
    Most endpoints require authentication via Bearer token in the Authorization header.
    
    ### Versioning
    Current API version: **v1**
    - Base URL: `/api/v1`
    - Version is specified in the URL path
    - Backward compatibility maintained within major versions
    
    ### Error Codes
    Standard error codes are used across all endpoints:
    - `VALIDATION_ERROR` (422): Request validation failed
    - `AUTHENTICATION_REQUIRED` (401): Authentication required
    - `INSUFFICIENT_PERMISSIONS` (403): Access denied
    - `RESOURCE_NOT_FOUND` (404): Resource not found
    - `RATE_LIMIT_EXCEEDED` (429): Too many requests
    - `INTERNAL_SERVER_ERROR` (500): Server error
    
    For more information, visit our [documentation](https://docs.documind.ai).
    """,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    openapi_tags=[
        {
            "name": "Health",
            "description": "Health check and system status endpoints"
        },
        {
            "name": "Authentication",
            "description": "User authentication and authorization"
        },
        {
            "name": "Documents",
            "description": "Document management and processing"
        },
        {
            "name": "Query",
            "description": "AI-powered document querying"
        },
        {
            "name": "Projects",
            "description": "Project organization and management"
        },
        {
            "name": "Collections",
            "description": "Vector store collections management"
        },
        {
            "name": "Analyses",
            "description": "Saved analyses and insights"
        },
        {
            "name": "Activity",
            "description": "Activity feed and audit logs"
        },
        {
            "name": "Metrics",
            "description": "Analytics and metrics"
        },
        {
            "name": "Cloud Storage",
            "description": "Cloud storage integration (Google Drive, OneDrive, Box, SharePoint)"
        },
        {
            "name": "Organizations",
            "description": "Organization management"
        },
        {
            "name": "Tags",
            "description": "Tag management"
        },
        {
            "name": "System",
            "description": "System administration endpoints"
        },
        {
            "name": "Developer",
            "description": "Developer API key management"
        },
        {
            "name": "Audit",
            "description": "Audit log endpoints"
        }
    ],
    servers=[
        {
            "url": settings.API_V1_PREFIX,
            "description": "API v1 Base URL"
        }
    ] if settings.DEBUG else []
)

# Add rate limit exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add custom exception handler
@app.exception_handler(DocuMindException)
async def documind_exception_handler(request: Request, exc: DocuMindException):
    """Handle custom application exceptions with standardized error format"""
    logger.error(
        "application_error",
        error_type=type(exc).__name__,
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
    )
    
    # Generate request ID if available
    request_id = getattr(request.state, "request_id", None)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "type": type(exc).__name__,
                "details": exc.details,
            },
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id
        },
    )

# Add CORS middleware
# Ensure CORS_ORIGINS is a list (it might be a string from env)
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

# In development, allow all localhost origins for easier testing
if settings.DEBUG:
    # Add common localhost ports if not already present
    common_localhost_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ]
    for origin in common_localhost_origins:
        if origin not in cors_origins:
            cors_origins.append(origin)

cors_methods = settings.CORS_METHODS
if isinstance(cors_methods, str):
    cors_methods = [method.strip() for method in cors_methods.split(",") if method.strip()]

cors_headers = settings.CORS_HEADERS
if isinstance(cors_headers, str) and cors_headers != "*":
    cors_headers = [header.strip() for header in cors_headers.split(",") if header.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=cors_methods,
    allow_headers=cors_headers,
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
    
    # Connect to MongoDB
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.error("database_startup_failed", error=str(e))
        # Don't fail startup if database connection fails (for development)
        if settings.ENVIRONMENT == "production":
            raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("application_shutdown")
    
    # Close MongoDB connection
    await close_mongo_connection()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )

