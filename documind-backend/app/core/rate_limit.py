"""
Rate limiting middleware using slowapi
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

from app.core.config import settings

# Custom key function to exclude OPTIONS requests from rate limiting
def rate_limit_key_func(request: Request) -> str:
    """Get rate limit key, excluding OPTIONS requests"""
    # OPTIONS requests (CORS preflight) should not be rate limited
    if request.method == "OPTIONS":
        return "options"  # All OPTIONS requests share the same key (effectively unlimited)
    return get_remote_address(request)

# Initialize rate limiter
limiter = Limiter(
    key_func=rate_limit_key_func,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"] if settings.RATE_LIMIT_ENABLED else [],
)


def get_rate_limiter() -> Limiter:
    """Get the rate limiter instance"""
    return limiter


def get_rate_limit_exceeded_handler():
    """Get the rate limit exceeded handler"""
    return _rate_limit_exceeded_handler

