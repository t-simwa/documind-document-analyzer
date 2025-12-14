"""
Main API router for v1 endpoints
Aggregates all v1 route modules
"""

from fastapi import APIRouter
from datetime import datetime

from app.api.v1.health import routes as health_routes
from app.api.v1.health.schemas import HealthResponse
from app.api.v1.tasks import routes as tasks_routes
from app.api.v1.query import routes as query_routes
from app.core.config import settings

# Create main v1 router
api_router = APIRouter()

# Root health check endpoint (without /health prefix)
@api_router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic health check",
    description="Returns basic health status of the API",
    tags=["Health"]
)
async def health_check() -> HealthResponse:
    """Basic health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow()
    )

# Include health sub-routes with /health prefix
api_router.include_router(
    health_routes.router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    tasks_routes.router,
    prefix="/tasks",
    tags=["Tasks"]
)

api_router.include_router(
    query_routes.router,
    prefix="/query",
    tags=["Query"]
)

# Additional routers will be added here as they are implemented
# api_router.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(documents_routes.router, prefix="/documents", tags=["Documents"])
# api_router.include_router(query_routes.router, prefix="/query", tags=["Query"])

