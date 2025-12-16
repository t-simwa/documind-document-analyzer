"""
Dependency injection for FastAPI routes
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.database.models import User

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
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    # Fetch user from database to ensure they still exist and are active
    try:
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        # Try to convert to ObjectId first (MongoDB format)
        try:
            object_id = ObjectId(user_id)
            try:
                user = await User.get(object_id)
            except DocumentNotFound:
                user = None
        except (ValueError, TypeError):
            # If conversion fails, try finding by string ID
            user = await User.find_one(User.id == user_id)
        
        if not user:
            raise AuthenticationError("User not found")
        if not user.is_active:
            raise AuthenticationError("User account is inactive")
    except AuthenticationError:
        raise
    except Exception as e:
        raise AuthenticationError(f"Invalid authentication credentials: {str(e)}")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_superuser": user.is_superuser,
        "organization_id": user.organization_id,
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

