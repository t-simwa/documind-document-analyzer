"""
Organization management API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
import structlog
import re
import unicodedata

from app.database.models import (
    Organization as OrganizationModel,
    User as UserModel,
    Project as ProjectModel,
    Document as DocumentModel
)
from app.core.dependencies import require_auth
from .schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberResponse,
    OrganizationMemberListResponse,
    InviteMemberRequest,
    UpdateMemberRoleRequest,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdate
)

logger = structlog.get_logger(__name__)

router = APIRouter()


def _generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from organization name"""
    # Convert to lowercase
    slug = name.lower()
    # Remove accents
    slug = unicodedata.normalize('NFKD', slug).encode('ascii', 'ignore').decode('ascii')
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


async def _require_org_admin(org_id: str, user_id: str) -> OrganizationModel:
    """Require user to be admin of the organization"""
    # Try to find organization by ID (handle both ObjectId and string)
    from bson import ObjectId
    from beanie.exceptions import DocumentNotFound
    
    org = None
    try:
        # Try ObjectId first
        try:
            object_id = ObjectId(org_id)
            org = await OrganizationModel.get(object_id)
        except (ValueError, TypeError, DocumentNotFound):
            # Fallback to string ID search
            org = await OrganizationModel.find_one(OrganizationModel.id == org_id)
    except Exception as e:
        logger.error("error_finding_organization_in_require_admin", org_id=org_id, error=str(e))
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if user is admin (for now, check if user is in the org and is superuser)
    # In a full implementation, we'd check OrganizationMember with role='admin'
    # Try to find user by ID (handle both ObjectId and string)
    user = None
    try:
        # Try ObjectId first
        try:
            user_object_id = ObjectId(user_id)
            user = await UserModel.get(user_object_id)
        except (ValueError, TypeError, DocumentNotFound):
            # Fallback to string ID search
            user = await UserModel.find_one(UserModel.id == user_id)
    except Exception as e:
        logger.error("error_finding_user_in_require_admin", user_id=user_id, error=str(e))
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # For MVP: user must be in the organization and be superuser
    # TODO: Implement proper role-based check with OrganizationMember model
    if user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Access denied: User is not a member of this organization")
    
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Access denied: Admin role required")
    
    return org


@router.post(
    "/",
    response_model=OrganizationResponse,
    status_code=201,
    summary="Create organization",
    description="Create a new organization"
)
async def create_organization(
    org: OrganizationCreate,
    current_user: dict = Depends(require_auth)
):
    """
    Create a new organization
    
    Args:
        org: Organization creation data
        
    Returns:
        Created organization
    """
    try:
        user_id = current_user["id"]
        
        # Generate slug if not provided
        slug = org.slug or _generate_slug(org.name)
        
        # Ensure slug is unique
        existing_org = await OrganizationModel.find_one(OrganizationModel.slug == slug)
        if existing_org:
            # Append number if slug exists
            counter = 1
            original_slug = slug
            while existing_org:
                slug = f"{original_slug}-{counter}"
                existing_org = await OrganizationModel.find_one(OrganizationModel.slug == slug)
                counter += 1
        
        # Create new organization
        new_org = OrganizationModel(
            name=org.name,
            slug=slug,
            plan="free"
        )
        await new_org.insert()
        
        # Update user's organization_id and set as admin
        # Try multiple ways to find the user (string ID vs ObjectId)
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        user = None
        try:
            # Try ObjectId first
            try:
                object_id = ObjectId(user_id)
                user = await UserModel.get(object_id)
            except (ValueError, TypeError, DocumentNotFound):
                # Fallback to string ID search
                user = await UserModel.find_one(UserModel.id == user_id)
        except Exception as e:
            logger.error("error_finding_user_for_org", user_id=user_id, error=str(e))
        
        if user:
            logger.info(
                "before_user_update",
                user_id=str(user.id),
                current_org_id=user.organization_id,
                new_org_id=str(new_org.id)
            )
            # Update the user object
            user.organization_id = str(new_org.id)
            user.is_superuser = True  # Creator is admin
            # Use replace() to ensure the update is persisted
            await user.replace()
            # Reload user to ensure we have the latest data
            try:
                reloaded_user = await UserModel.get(user.id)
                logger.info(
                    "user_updated_with_organization",
                    user_id=str(user.id),
                    organization_id=str(new_org.id),
                    organization_id_in_user=str(reloaded_user.organization_id) if reloaded_user else "reload_failed",
                    is_superuser=reloaded_user.is_superuser if reloaded_user else None
                )
            except Exception as e:
                logger.error("error_reloading_user", user_id=str(user.id), error=str(e))
        else:
            logger.warning("user_not_found_for_org_creation", user_id=user_id)
        
        logger.info(
            "organization_created",
            organization_id=str(new_org.id),
            organization_name=new_org.name,
            slug=slug,
            user_id=user_id
        )
        
        return OrganizationResponse(
            id=str(new_org.id),
            name=new_org.name,
            slug=new_org.slug,
            plan=new_org.plan,
            created_at=new_org.created_at,
            updated_at=new_org.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_creation_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create organization: {str(e)}"
        )


@router.get(
    "/{org_id}",
    response_model=OrganizationResponse,
    summary="Get organization",
    description="Get an organization by ID"
)
async def get_organization(
    org_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Get organization by ID
    
    Args:
        org_id: Organization ID
        
    Returns:
        Organization details
    """
    try:
        user_id = current_user["id"]
        
        # Try to find organization by ID (handle both ObjectId and string)
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        org = None
        try:
            # Try ObjectId first
            try:
                object_id = ObjectId(org_id)
                org = await OrganizationModel.get(object_id)
            except (ValueError, TypeError, DocumentNotFound):
                # Fallback to string ID search
                org = await OrganizationModel.find_one(OrganizationModel.id == org_id)
        except Exception as e:
            logger.error("error_finding_organization", org_id=org_id, error=str(e))
        
        if not org:
            logger.warning("organization_not_found", org_id=org_id, user_id=user_id)
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Check if user belongs to this organization
        user = await UserModel.find_one(UserModel.id == user_id)
        if user and user.organization_id != org_id and not user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return OrganizationResponse(
            id=str(org.id),
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            created_at=org.created_at,
            updated_at=org.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_get_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get organization: {str(e)}"
        )


@router.put(
    "/{org_id}",
    response_model=OrganizationResponse,
    summary="Update organization",
    description="Update an organization"
)
async def update_organization(
    org_id: str,
    org_update: OrganizationUpdate,
    current_user: dict = Depends(require_auth)
):
    """
    Update organization
    
    Args:
        org_id: Organization ID
        org_update: Organization update data
        
    Returns:
        Updated organization
    """
    try:
        user_id = current_user["id"]
        
        # Require admin access
        org = await _require_org_admin(org_id, user_id)
        
        # Update fields
        if org_update.name is not None:
            org.name = org_update.name
        if org_update.plan is not None:
            org.plan = org_update.plan
        
        org.updated_at = datetime.utcnow()
        await org.save()
        
        logger.info(
            "organization_updated",
            organization_id=org_id,
            user_id=user_id
        )
        
        return OrganizationResponse(
            id=str(org.id),
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            created_at=org.created_at,
            updated_at=org.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_update_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.get(
    "/{org_id}/members",
    response_model=OrganizationMemberListResponse,
    summary="List organization members",
    description="List all members of an organization"
)
async def list_organization_members(
    org_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    List all members of an organization
    
    Args:
        org_id: Organization ID
        
    Returns:
        List of organization members
    """
    try:
        user_id = current_user["id"]
        
        # Try to find organization by ID (handle both ObjectId and string)
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        org = None
        try:
            # Try ObjectId first
            try:
                object_id = ObjectId(org_id)
                org = await OrganizationModel.get(object_id)
            except (ValueError, TypeError, DocumentNotFound):
                # Fallback to string ID search
                org = await OrganizationModel.find_one(OrganizationModel.id == org_id)
        except Exception as e:
            logger.error("error_finding_organization_for_members", org_id=org_id, error=str(e))
        
        if not org:
            logger.warning("organization_not_found_for_members", org_id=org_id, user_id=user_id)
            raise HTTPException(status_code=404, detail="Organization not found")
        
        user = await UserModel.find_one(UserModel.id == user_id)
        if user and user.organization_id != org_id and not user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all users in this organization
        # For MVP: users with organization_id matching
        # TODO: Implement OrganizationMember model for proper role management
        members_list = await UserModel.find(
            UserModel.organization_id == org_id,
            UserModel.is_active == True
        ).to_list()
        
        members = []
        for member in members_list:
            # Determine role (for MVP: superuser = admin, others = analyst)
            # TODO: Get actual role from OrganizationMember model
            role = "admin" if member.is_superuser else "analyst"
            
            members.append(
                OrganizationMemberResponse(
                    user_id=str(member.id),
                    email=member.email,
                    name=member.name,
                    role=role,
                    joined_at=member.created_at  # Use created_at as joined_at for MVP
                )
            )
        
        return OrganizationMemberListResponse(
            members=members,
            total=len(members)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_members_list_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list organization members: {str(e)}"
        )


@router.post(
    "/{org_id}/members",
    response_model=OrganizationMemberResponse,
    status_code=201,
    summary="Invite member",
    description="Invite a user to join the organization"
)
async def invite_member(
    org_id: str,
    invite: InviteMemberRequest,
    current_user: dict = Depends(require_auth)
):
    """
    Invite a user to join the organization
    
    Args:
        org_id: Organization ID
        invite: Invitation data
        
    Returns:
        Invited member details
    """
    try:
        user_id = current_user["id"]
        
        # Require admin access
        org = await _require_org_admin(org_id, user_id)
        
        # Check if user exists
        user = await UserModel.find_one(UserModel.email == invite.email)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User with email {invite.email} not found. User must register first."
            )
        
        # Check if user is already in an organization
        if user.organization_id and user.organization_id != org_id:
            raise HTTPException(
                status_code=400,
                detail="User is already a member of another organization"
            )
        
        # Add user to organization
        user.organization_id = org_id
        # For MVP: set is_superuser based on role
        # TODO: Use OrganizationMember model for proper role management
        if invite.role == "admin":
            user.is_superuser = True
        await user.save()
        
        logger.info(
            "member_invited",
            organization_id=org_id,
            user_id=str(user.id),
            email=invite.email,
            role=invite.role,
            invited_by=user_id
        )
        
        return OrganizationMemberResponse(
            user_id=str(user.id),
            email=user.email,
            name=user.name,
            role=invite.role,
            joined_at=datetime.utcnow()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("member_invite_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to invite member: {str(e)}"
        )


@router.delete(
    "/{org_id}/members/{user_id}",
    summary="Remove member",
    description="Remove a member from the organization"
)
async def remove_member(
    org_id: str,
    user_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Remove a member from the organization
    
    Args:
        org_id: Organization ID
        user_id: User ID to remove
        
    Returns:
        Success message
    """
    try:
        current_user_id = current_user["id"]
        
        # Require admin access
        org = await _require_org_admin(org_id, current_user_id)
        
        # Prevent self-removal
        if user_id == current_user_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove yourself from the organization"
            )
        
        # Get user to remove
        user = await UserModel.find_one(UserModel.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.organization_id != org_id:
            raise HTTPException(
                status_code=400,
                detail="User is not a member of this organization"
            )
        
        # Remove user from organization
        user.organization_id = None
        user.is_superuser = False  # Reset superuser status
        await user.save()
        
        logger.info(
            "member_removed",
            organization_id=org_id,
            user_id=user_id,
            removed_by=current_user_id
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Member removed successfully",
                "user_id": user_id
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("member_removal_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove member: {str(e)}"
        )


@router.put(
    "/{org_id}/members/{user_id}/role",
    response_model=OrganizationMemberResponse,
    summary="Update member role",
    description="Update a member's role in the organization"
)
async def update_member_role(
    org_id: str,
    user_id: str,
    role_update: UpdateMemberRoleRequest,
    current_user: dict = Depends(require_auth)
):
    """
    Update a member's role in the organization
    
    Args:
        org_id: Organization ID
        user_id: User ID
        role_update: Role update data
        
    Returns:
        Updated member details
    """
    try:
        current_user_id = current_user["id"]
        
        # Require admin access
        org = await _require_org_admin(org_id, current_user_id)
        
        # Get user to update
        user = await UserModel.find_one(UserModel.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.organization_id != org_id:
            raise HTTPException(
                status_code=400,
                detail="User is not a member of this organization"
            )
        
        # Update role (for MVP: use is_superuser)
        # TODO: Use OrganizationMember model for proper role management
        user.is_superuser = (role_update.role == "admin")
        await user.save()
        
        logger.info(
            "member_role_updated",
            organization_id=org_id,
            user_id=user_id,
            new_role=role_update.role,
            updated_by=current_user_id
        )
        
        return OrganizationMemberResponse(
            user_id=str(user.id),
            email=user.email,
            name=user.name,
            role=role_update.role,
            joined_at=user.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("member_role_update_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update member role: {str(e)}"
        )


@router.get(
    "/{org_id}/settings",
    response_model=OrganizationSettingsResponse,
    summary="Get organization settings",
    description="Get organization settings"
)
async def get_organization_settings(
    org_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Get organization settings
    
    Args:
        org_id: Organization ID
        
    Returns:
        Organization settings
    """
    try:
        user_id = current_user["id"]
        
        # Try to find organization by ID (handle both ObjectId and string)
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        org = None
        try:
            # Try ObjectId first
            try:
                object_id = ObjectId(org_id)
                org = await OrganizationModel.get(object_id)
            except (ValueError, TypeError, DocumentNotFound):
                # Fallback to string ID search
                org = await OrganizationModel.find_one(OrganizationModel.id == org_id)
        except Exception as e:
            logger.error("error_finding_organization_for_settings", org_id=org_id, error=str(e))
        
        if not org:
            logger.warning("organization_not_found_for_settings", org_id=org_id, user_id=user_id)
            raise HTTPException(status_code=404, detail="Organization not found")
        
        user = await UserModel.find_one(UserModel.id == user_id)
        if user and user.organization_id != org_id and not user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # For MVP: return default settings
        # TODO: Create OrganizationSettings model
        return OrganizationSettingsResponse(
            organization_id=org_id,
            data_retention_days=None,
            require_2fa=False,
            allow_guest_access=False,
            max_users=None,
            created_at=org.created_at,
            updated_at=org.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_settings_get_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get organization settings: {str(e)}"
        )


@router.put(
    "/{org_id}/settings",
    response_model=OrganizationSettingsResponse,
    summary="Update organization settings",
    description="Update organization settings"
)
async def update_organization_settings(
    org_id: str,
    settings_update: OrganizationSettingsUpdate,
    current_user: dict = Depends(require_auth)
):
    """
    Update organization settings
    
    Args:
        org_id: Organization ID
        settings_update: Settings update data
        
    Returns:
        Updated organization settings
    """
    try:
        user_id = current_user["id"]
        
        # Require admin access
        org = await _require_org_admin(org_id, user_id)
        
        # For MVP: just update the organization's updated_at
        # TODO: Create OrganizationSettings model and store actual settings
        org.updated_at = datetime.utcnow()
        await org.save()
        
        logger.info(
            "organization_settings_updated",
            organization_id=org_id,
            user_id=user_id
        )
        
        # Return settings (for MVP: return defaults with any updates)
        return OrganizationSettingsResponse(
            organization_id=org_id,
            data_retention_days=settings_update.data_retention_days,
            require_2fa=settings_update.require_2fa if settings_update.require_2fa is not None else False,
            allow_guest_access=settings_update.allow_guest_access if settings_update.allow_guest_access is not None else False,
            max_users=settings_update.max_users,
            created_at=org.created_at,
            updated_at=org.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("organization_settings_update_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update organization settings: {str(e)}"
        )

