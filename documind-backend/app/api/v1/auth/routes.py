"""
Authentication API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta

from app.api.v1.auth.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserMeResponse,
)
from app.database.models import User
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.dependencies import require_auth

router = APIRouter()
security = HTTPBearer()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account and return access/refresh tokens",
    tags=["Authentication"],
)
async def register(request: UserRegisterRequest) -> TokenResponse:
    """Register a new user"""
    # Check if user already exists
    existing_user = await User.find_one(User.email == request.email)
    if existing_user:
        raise ValidationError("User with this email already exists")
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
    )
    await user.insert()
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=refresh_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login user",
    description="Authenticate user and return access/refresh tokens",
    tags=["Authentication"],
)
async def login(request: UserLoginRequest) -> TokenResponse:
    """Login user"""
    # Find user by email
    user = await User.find_one(User.email == request.email)
    if not user:
        raise AuthenticationError("Invalid email or password")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("User account is inactive")
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=refresh_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a refresh token",
    tags=["Authentication"],
)
async def refresh(request: RefreshTokenRequest) -> TokenResponse:
    """Refresh access token"""
    # Decode refresh token
    payload = decode_refresh_token(request.refresh_token)
    if payload is None:
        raise AuthenticationError("Invalid refresh token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid refresh token payload")
    
    # Verify user exists and is active
    try:
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        try:
            object_id = ObjectId(user_id)
            try:
                user = await User.get(object_id)
            except DocumentNotFound:
                user = None
        except (ValueError, TypeError):
            user = await User.find_one(User.id == user_id)
    except Exception:
        user = await User.find_one(User.id == user_id)
    
    if not user:
        raise AuthenticationError("User not found")
    
    if not user.is_active:
        raise AuthenticationError("User account is inactive")
    
    # Generate new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=refresh_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information",
    tags=["Authentication"],
)
async def get_current_user_info(
    current_user: dict = Depends(require_auth)
) -> UserMeResponse:
    """Get current user information"""
    # The current_user dict already contains user info from get_current_user dependency
    # But we need to fetch from DB to get timestamps (created_at, updated_at)
    user_id = current_user["id"]
    
    try:
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        # Convert string ID to ObjectId for Beanie
        try:
            object_id = ObjectId(user_id)
            try:
                user = await User.get(object_id)
            except DocumentNotFound:
                user = None
        except (ValueError, TypeError):
            # If ObjectId conversion fails, try finding by string ID
            user = await User.find_one(User.id == user_id)
    except Exception as e:
        # Fallback: try finding by string ID
        user = await User.find_one(User.id == user_id)
    
    if not user:
        raise AuthenticationError("User not found")
    
    # Log the organization_id for debugging
    import structlog
    logger = structlog.get_logger(__name__)
    logger.debug(
        "get_current_user_info",
        user_id=str(user.id),
        organization_id=user.organization_id
    )
    
    return UserMeResponse(
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "organization_id": user.organization_id,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    description="Logout the current user (client should discard tokens)",
    tags=["Authentication"],
)
async def logout(current_user: dict = Depends(require_auth)) -> dict:
    """Logout user"""
    # In a stateless JWT system, logout is handled client-side by discarding tokens
    # If you need server-side logout, you could maintain a token blacklist in Redis
    return {"message": "Logged out successfully"}

