"""
Dependency injection for FastAPI routes
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Dependency to get the current authenticated user.
    Returns None if no authentication is provided (for optional auth endpoints).
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise AuthenticationError("Invalid authentication credentials")
    
    # Extract user information from token payload
    # This will be expanded when user authentication is implemented
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    return {
        "id": user_id,
        "email": payload.get("email"),
        "permissions": payload.get("permissions", []),
    }


async def require_auth(
    current_user: Optional[dict] = Depends(get_current_user)
) -> dict:
    """
    Dependency that requires authentication.
    Raises an error if the user is not authenticated.
    """
    if current_user is None:
        raise AuthenticationError("Authentication required")
    return current_user


async def require_permission(permission: str):
    """
    Dependency factory to require a specific permission.
    Usage: Depends(require_permission("read:documents"))
    """
    async def permission_checker(
        current_user: dict = Depends(require_auth)
    ) -> dict:
        user_permissions = current_user.get("permissions", [])
        if permission not in user_permissions:
            raise AuthorizationError(f"Permission required: {permission}")
        return current_user
    
    return permission_checker

