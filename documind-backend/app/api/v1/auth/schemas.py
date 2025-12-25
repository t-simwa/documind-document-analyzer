"""
Authentication API schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UserResponse(BaseModel):
    """User response"""
    id: str
    email: str
    name: str
    is_active: bool
    is_superuser: bool
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    """Current user response"""
    user: UserResponse


# Email Verification Schemas
class VerifyEmailRequest(BaseModel):
    """Email verification request"""
    token: str = Field(..., description="Email verification token")


class VerifyEmailResponse(BaseModel):
    """Email verification response"""
    message: str
    email_verified: bool


class ResendVerificationResponse(BaseModel):
    """Resend verification email response"""
    message: str


# Password Reset Schemas
class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Forgot password response"""
    message: str


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100)


class ResetPasswordResponse(BaseModel):
    """Reset password response"""
    message: str


# SSO Schemas
class SSOInitiateRequest(BaseModel):
    """SSO initiation request"""
    provider: str = Field(..., description="SSO provider (google, microsoft, okta)")
    redirect_uri: Optional[str] = None


class SSOInitiateResponse(BaseModel):
    """SSO initiation response"""
    authorization_url: str
    state: str


class SSOCallbackRequest(BaseModel):
    """SSO callback request"""
    provider: str = Field(..., description="SSO provider")
    code: str = Field(..., description="Authorization code from provider")
    state: str = Field(..., description="State token for CSRF protection")
    redirect_uri: Optional[str] = None


class SSOCallbackResponse(BaseModel):
    """SSO callback response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Two-Factor Authentication Schemas
class TwoFactorSetupResponse(BaseModel):
    """2FA setup response"""
    secret: str  # TOTP secret key
    qr_code_url: str  # QR code URL for authenticator app
    backup_codes: list[str]  # Backup codes for recovery


class TwoFactorVerifyRequest(BaseModel):
    """2FA verification request"""
    code: str = Field(..., description="TOTP code from authenticator app")
    backup_code: Optional[str] = Field(None, description="Backup code (alternative to TOTP code)")


class TwoFactorVerifyResponse(BaseModel):
    """2FA verification response"""
    verified: bool
    message: str


class TwoFactorDisableRequest(BaseModel):
    """2FA disable request"""
    password: str = Field(..., description="User password for verification")
