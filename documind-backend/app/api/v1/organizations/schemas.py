"""
Organization API schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class OrganizationBase(BaseModel):
    """Base organization schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    slug: Optional[str] = Field(None, min_length=1, max_length=100, description="Organization slug (auto-generated if not provided)")


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization"""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    plan: Optional[str] = Field(None, pattern="^(free|pro|enterprise)$")


class OrganizationResponse(BaseModel):
    """Organization response schema"""
    id: str
    name: str
    slug: str
    plan: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OrganizationMemberResponse(BaseModel):
    """Organization member response schema"""
    user_id: str
    email: str
    name: str
    role: str  # admin, analyst, viewer
    joined_at: datetime
    
    class Config:
        from_attributes = True


class OrganizationMemberListResponse(BaseModel):
    """Response schema for organization member list"""
    members: List[OrganizationMemberResponse]
    total: int


class InviteMemberRequest(BaseModel):
    """Schema for inviting a member"""
    email: EmailStr = Field(..., description="Email address of the user to invite")
    role: str = Field(..., pattern="^(admin|analyst|viewer)$", description="Role to assign")


class UpdateMemberRoleRequest(BaseModel):
    """Schema for updating a member's role"""
    role: str = Field(..., pattern="^(admin|analyst|viewer)$", description="New role to assign")


class OrganizationSettingsResponse(BaseModel):
    """Organization settings response schema"""
    organization_id: str
    data_retention_days: Optional[int] = Field(None, ge=1, le=3650, description="Data retention period in days")
    require_2fa: bool = False
    allow_guest_access: bool = False
    max_users: Optional[int] = Field(None, ge=1, description="Maximum number of users")
    created_at: datetime
    updated_at: datetime


class OrganizationSettingsUpdate(BaseModel):
    """Schema for updating organization settings"""
    data_retention_days: Optional[int] = Field(None, ge=1, le=3650)
    require_2fa: Optional[bool] = None
    allow_guest_access: Optional[bool] = None
    max_users: Optional[int] = Field(None, ge=1)

