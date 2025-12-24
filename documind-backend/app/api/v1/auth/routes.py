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
    VerifyEmailRequest,
    VerifyEmailResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SSOInitiateRequest,
    SSOInitiateResponse,
    SSOCallbackRequest,
    SSOCallbackResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    TwoFactorVerifyResponse,
    TwoFactorDisableRequest,
)
from app.database.models import User
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_verification_token,
    generate_reset_token,
)
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.dependencies import require_auth
from app.services.email import get_email_service
from app.services.sso import get_sso_service
from app.services.two_factor import get_two_factor_service

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
    verification_token = generate_verification_token()
    
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_token_expires_at=datetime.utcnow() + timedelta(days=1),
    )
    await user.insert()
    
    # Send verification email
    email_service = get_email_service()
    await email_service.send_verification_email(
        to_email=user.email,
        name=user.name,
        verification_token=verification_token
    )
    
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


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email address",
    description="Verify user email address using verification token",
    tags=["Authentication"],
)
async def verify_email(request: VerifyEmailRequest) -> VerifyEmailResponse:
    """Verify email address"""
    # Find user by verification token
    user = await User.find_one(User.email_verification_token == request.token)
    if not user:
        raise ValidationError("Invalid or expired verification token")
    
    # Check if token has expired
    if user.email_verification_token_expires_at and user.email_verification_token_expires_at < datetime.utcnow():
        raise ValidationError("Verification token has expired")
    
    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires_at = None
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return VerifyEmailResponse(
        message="Email verified successfully",
        email_verified=True
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Send password reset email to user",
    tags=["Authentication"],
)
async def forgot_password(request: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """Request password reset"""
    # Find user by email
    user = await User.find_one(User.email == request.email)
    if not user:
        # Don't reveal if user exists (security best practice)
        return ForgotPasswordResponse(
            message="If an account with that email exists, a password reset link has been sent."
        )
    
    # Generate reset token
    reset_token = generate_reset_token()
    user.password_reset_token = reset_token
    user.password_reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    user.updated_at = datetime.utcnow()
    await user.save()
    
    # Send password reset email
    email_service = get_email_service()
    await email_service.send_password_reset_email(
        to_email=user.email,
        name=user.name,
        reset_token=reset_token
    )
    
    return ForgotPasswordResponse(
        message="If an account with that email exists, a password reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="Reset user password using reset token",
    tags=["Authentication"],
)
async def reset_password(request: ResetPasswordRequest) -> ResetPasswordResponse:
    """Reset password"""
    # Find user by reset token
    user = await User.find_one(User.password_reset_token == request.token)
    if not user:
        raise ValidationError("Invalid or expired reset token")
    
    # Check if token has expired
    if user.password_reset_token_expires_at and user.password_reset_token_expires_at < datetime.utcnow():
        raise ValidationError("Reset token has expired")
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires_at = None
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return ResetPasswordResponse(
        message="Password reset successfully"
    )


@router.post(
    "/sso/initiate",
    response_model=SSOInitiateResponse,
    status_code=status.HTTP_200_OK,
    summary="Initiate SSO login",
    description="Start SSO authentication flow with OAuth2 provider",
    tags=["Authentication"],
)
async def sso_initiate(request: SSOInitiateRequest) -> SSOInitiateResponse:
    """Initiate SSO authentication"""
    sso_service = get_sso_service()
    
    try:
        authorization_url, state_token = await sso_service.initiate_oauth(
            provider=request.provider,
            redirect_uri=request.redirect_uri
        )
        
        return SSOInitiateResponse(
            authorization_url=authorization_url,
            state=state_token
        )
    except ValueError as e:
        raise ValidationError(str(e))


@router.post(
    "/sso/callback",
    response_model=SSOCallbackResponse,
    status_code=status.HTTP_200_OK,
    summary="SSO callback",
    description="Handle SSO callback and create/login user",
    tags=["Authentication"],
)
async def sso_callback(request: SSOCallbackRequest) -> SSOCallbackResponse:
    """Handle SSO callback"""
    sso_service = get_sso_service()
    
    try:
        # Exchange code for token
        token = await sso_service.exchange_code_for_token(
            provider=request.provider,
            code=request.code,
            redirect_uri=request.redirect_uri
        )
        
        # Get user info from provider
        user_info = await sso_service.get_user_info(
            provider=request.provider,
            access_token=token["access_token"]
        )
        
        # Find or create user
        user = await User.find_one(User.email == user_info["email"])
        
        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info["name"],
                hashed_password="",  # SSO users don't have passwords
                is_active=True,
                is_superuser=False,
                email_verified=True,  # SSO emails are pre-verified
                sso_provider=request.provider,
                sso_id=user_info["provider_id"],
            )
            await user.insert()
        else:
            # Update existing user with SSO info
            user.sso_provider = request.provider
            user.sso_id = user_info["provider_id"]
            user.email_verified = True
            user.updated_at = datetime.utcnow()
            await user.save()
        
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
        
        return SSOCallbackResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
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
    except ValueError as e:
        raise ValidationError(str(e))
    except Exception as e:
        raise AuthenticationError(f"SSO authentication failed: {str(e)}")


@router.post(
    "/2fa/setup",
    response_model=TwoFactorSetupResponse,
    status_code=status.HTTP_200_OK,
    summary="Setup 2FA",
    description="Generate 2FA secret and QR code for authenticator app",
    tags=["Authentication"],
)
async def setup_2fa(current_user: dict = Depends(require_auth)) -> TwoFactorSetupResponse:
    """Setup 2FA"""
    user_id = current_user["id"]
    
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
    
    # Generate 2FA secret
    two_factor_service = get_two_factor_service()
    secret = two_factor_service.generate_secret()
    backup_codes = two_factor_service.generate_backup_codes()
    
    # Generate QR code
    qr_code_url = two_factor_service.generate_qr_code_url(
        secret=secret,
        email=user.email
    )
    
    # Store secret and backup codes (hashed) in user record
    # Note: In production, encrypt the secret before storing
    user.two_factor_secret = secret
    user.two_factor_backup_codes = [
        two_factor_service.hash_backup_code(code) for code in backup_codes
    ]
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return TwoFactorSetupResponse(
        secret=secret,
        qr_code_url=qr_code_url,
        backup_codes=backup_codes  # Return plain codes only once
    )


@router.post(
    "/2fa/verify",
    response_model=TwoFactorVerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify 2FA",
    description="Verify 2FA code during login",
    tags=["Authentication"],
)
async def verify_2fa(request: TwoFactorVerifyRequest, current_user: dict = Depends(require_auth)) -> TwoFactorVerifyResponse:
    """Verify 2FA code"""
    user_id = current_user["id"]
    
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
    
    if not user.two_factor_enabled or not user.two_factor_secret:
        raise ValidationError("2FA is not enabled for this user")
    
    two_factor_service = get_two_factor_service()
    verified = False
    
    # Try TOTP code first
    if request.code:
        verified = two_factor_service.verify_totp(
            secret=user.two_factor_secret,
            code=request.code
        )
    
    # Try backup code if TOTP failed
    if not verified and request.backup_code:
        verified = two_factor_service.verify_backup_code(
            code=request.backup_code,
            hashed_codes=user.two_factor_backup_codes
        )
        
        # Remove used backup code
        if verified:
            backup_code_hash = two_factor_service.hash_backup_code(request.backup_code)
            user.two_factor_backup_codes = [
                code for code in user.two_factor_backup_codes if code != backup_code_hash
            ]
            user.updated_at = datetime.utcnow()
            await user.save()
    
    if not verified:
        return TwoFactorVerifyResponse(
            verified=False,
            message="Invalid 2FA code"
        )
    
    # Enable 2FA if not already enabled
    if not user.two_factor_enabled:
        user.two_factor_enabled = True
        user.updated_at = datetime.utcnow()
        await user.save()
    
    return TwoFactorVerifyResponse(
        verified=True,
        message="2FA verified successfully"
    )

