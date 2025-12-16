"""
Health check endpoints
"""

import time
from fastapi import APIRouter
from datetime import datetime

from app.core.config import settings
from app.api.v1.health.schemas import HealthResponse, ReadinessResponse, LivenessResponse
from app.database import get_client

router = APIRouter(tags=["Health"])

# Track application start time for uptime calculation
_start_time = time.time()


async def check_database() -> str:
    """Check database connectivity"""
    try:
        client = get_client()
        if client is None:
            return "not_ready"
        # Ping the database
        await client.admin.command('ping')
        return "ready"
    except Exception:
        return "not_ready"


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness check",
    description="Returns readiness status including dependency checks"
)
async def readiness_check() -> ReadinessResponse:
    """
    Readiness check endpoint.
    Returns ready status if the API is ready to accept traffic.
    Includes checks for critical dependencies.
    """
    checks = {
        "api": "ready",
        "database": await check_database(),
        # Add more checks as dependencies are added
        # "redis": check_redis(),
    }
    
    # Determine overall status
    all_ready = all(
        status == "ready" for status in checks.values()
    )
    
    return ReadinessResponse(
        status="ready" if all_ready else "not_ready",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        checks=checks
    )


@router.get(
    "/live",
    response_model=LivenessResponse,
    summary="Liveness check",
    description="Returns liveness status and uptime"
)
async def liveness_check() -> LivenessResponse:
    """
    Liveness check endpoint.
    Returns alive status if the API process is running.
    Includes uptime information.
    """
    uptime = time.time() - _start_time
    
    return LivenessResponse(
        status="alive",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        uptime_seconds=round(uptime, 2)
    )

