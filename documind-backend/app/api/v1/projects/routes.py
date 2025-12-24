"""
Project management API routes
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
import structlog

from app.database.models import Project as ProjectModel, Document as DocumentModel, User as UserModel
from app.core.dependencies import require_auth
from app.utils.activity_logger import log_activity
from .schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectHierarchyResponse,
    ProjectListResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

async def _count_documents_for_project(project_id: str, user_id: str) -> int:
    """Count documents for a project (filtered by user)"""
    count = await DocumentModel.find(
        DocumentModel.project_id == project_id,
        DocumentModel.uploaded_by == user_id
    ).count()
    return count


async def _is_project_favorited(project_id: str, user_id: str) -> bool:
    """Check if a project is favorited by the user"""
    try:
        user = await UserModel.find_one(UserModel.id == user_id)
        if user and user.favorite_project_ids:
            return str(project_id) in user.favorite_project_ids
        return False
    except Exception:
        return False


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=201,
    summary="Create project",
    description="Create a new project"
)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(require_auth)
):
    """
    Create a new project
    
    Args:
        project: Project creation data
        
    Returns:
        Created project
    """
    try:
        user_id = current_user["id"]
        
        # Validate and normalize parent_id if provided (must belong to same user)
        parent_id_str = None
        if project.parent_id:
            # Convert to string and strip whitespace
            parent_id_str = str(project.parent_id).strip()
            if parent_id_str and parent_id_str.lower() not in ["null", "none", ""]:
                # Try to find parent project - handle both ObjectId and string formats
                from bson import ObjectId
                try:
                    # Try ObjectId conversion first
                    parent_oid = ObjectId(parent_id_str)
                    parent = await ProjectModel.find_one(
                        ProjectModel.id == parent_oid,
                        ProjectModel.created_by == user_id
                    )
                except Exception:
                    # If ObjectId conversion fails, try string match
                    parent = await ProjectModel.find_one(
                        ProjectModel.id == parent_id_str,
                        ProjectModel.created_by == user_id
                    )
                
            if not parent:
                raise HTTPException(
                        status_code=404,
                        detail=f"Parent project not found or access denied"
                )
                # Store parent_id as string for consistency
                parent_id_str = str(parent.id)
            else:
                parent_id_str = None
        
        # Create new project
        new_project = ProjectModel(
            name=project.name,
            description=project.description,
            parent_id=parent_id_str,
            created_by=user_id,
        )
        await new_project.insert()
        
        logger.info(
            "project_created",
            project_id=str(new_project.id),
            name=new_project.name,
            parent_id=parent_id_str,
            user_id=user_id
        )
        
        # Log activity
        await log_activity(
            activity_type="project",
            title="Project created",
            description=f"New project '{new_project.name}' was created",
            user_id=user_id,
            organization_id=current_user.get("organization_id"),
            project_id=str(new_project.id),
            status="success",
            metadata={"project_name": new_project.name, "parent_id": parent_id_str}
        )
        
        document_count = await _count_documents_for_project(str(new_project.id), user_id)
        is_favorite = await _is_project_favorited(str(new_project.id), user_id)
        
        return ProjectResponse(
            id=str(new_project.id),
            name=new_project.name,
            description=new_project.description,
            parent_id=new_project.parent_id,
            created_at=new_project.created_at,
            updated_at=new_project.updated_at,
            created_by=new_project.created_by,
            document_count=document_count,
            is_favorite=is_favorite
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_creation_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get(
    "/",
    response_model=ProjectListResponse,
    summary="List projects",
    description="List all projects with optional pagination"
)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_auth)
):
    """
    List projects with pagination
    
    Args:
        page: Page number (1-indexed)
        limit: Items per page
        
    Returns:
        List of projects with pagination info
    """
    try:
        user_id = current_user["id"]
        
        # Calculate pagination (filtered by user)
        total = await ProjectModel.find(ProjectModel.created_by == user_id).count()
        skip = (page - 1) * limit
        
        # Get paginated projects (filtered by user)
        projects_list = await ProjectModel.find(
            ProjectModel.created_by == user_id
        ).skip(skip).limit(limit).to_list()
        
        # Convert to response format with document counts
        projects = []
        for project in projects_list:
            document_count = await _count_documents_for_project(str(project.id), user_id)
            is_favorite = await _is_project_favorited(str(project.id), user_id)
            projects.append(
            ProjectResponse(
                    id=str(project.id),
                    name=project.name,
                    description=project.description,
                    parent_id=project.parent_id,
                    created_at=project.created_at,
                    updated_at=project.updated_at,
                    created_by=project.created_by,
                    document_count=document_count,
                    is_favorite=is_favorite
                )
            )
        
        # Use standardized pagination utility
        from app.core.api_utils import create_pagination_meta
        
        pagination_meta = create_pagination_meta(page, limit, total)
        
        return ProjectListResponse(
            data=projects,
            pagination=pagination_meta,
            meta={}
        )
    
    except Exception as e:
        logger.exception("project_list_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list projects: {str(e)}"
        )


@router.get(
    "/hierarchy",
    response_model=List[ProjectHierarchyResponse],
    summary="Get project hierarchy",
    description="Get all projects in hierarchical structure"
)
async def get_project_hierarchy(
    current_user: dict = Depends(require_auth)
):
    """
    Get projects in hierarchical structure
    
    Returns:
        List of root projects with their children
    """
    try:
        user_id = current_user["id"]
        
        # Get all projects for this user
        all_projects = await ProjectModel.find(
            ProjectModel.created_by == user_id
        ).to_list()
        
        # Build project map with document counts
        project_map = {}
        for project in all_projects:
            document_count = await _count_documents_for_project(str(project.id), user_id)
            # Ensure parent_id is converted to string (handle both ObjectId and string)
            parent_id_str = None
            if project.parent_id:
                if isinstance(project.parent_id, str):
                    parent_id_str = project.parent_id
                else:
                    # Convert ObjectId to string
                    parent_id_str = str(project.parent_id)
            
            project_map[str(project.id)] = {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "parent_id": parent_id_str,  # Store as string consistently
                "created_at": project.created_at,
                "updated_at": project.updated_at,
                "created_by": project.created_by,
                "document_count": document_count,
                "children": []
            }
        
        # Build hierarchy
        roots = []
        for project_id, project_data in project_map.items():
            parent_id = project_data.get("parent_id")
            if not parent_id:
                # Root project
                roots.append(project_data)
            else:
                # Child project - parent_id is already a string from project_map
                parent_id_str = str(parent_id).strip() if parent_id else None
                if parent_id_str:
                    parent = project_map.get(parent_id_str)
                    if parent:
                        parent["children"].append(project_data)
                        logger.debug(
                            "child_project_linked",
                            child_id=project_id,
                            child_name=project_data["name"],
                            parent_id=parent_id_str,
                            parent_name=parent["name"]
                        )
                    else:
                        # Parent not found (might be deleted or belongs to different user), treat as root
                        logger.warning(
                            "parent_project_not_found_in_hierarchy",
                            project_id=project_id,
                            project_name=project_data["name"],
                            parent_id=parent_id_str,
                            available_parents=list(project_map.keys()),
                            all_project_ids=[str(p.id) for p in all_projects]
                        )
                        roots.append(project_data)
                else:
                    # Invalid parent_id, treat as root
                    logger.warning("invalid_parent_id", project_id=project_id, parent_id=parent_id)
                    roots.append(project_data)
        
        # Sort roots and children by name for consistent ordering
        roots.sort(key=lambda x: x["name"].lower())
        for project_data in project_map.values():
            if project_data.get("children"):
                project_data["children"].sort(key=lambda x: x["name"].lower())
        
        # Get user's favorite projects
        user = await UserModel.find_one(UserModel.id == user_id)
        favorite_ids = set(user.favorite_project_ids) if user and user.favorite_project_ids else set()
        
        # Convert to response format recursively
        def build_hierarchy_response(project_data: dict) -> ProjectHierarchyResponse:
            children = [
                build_hierarchy_response(child)
                for child in project_data.get("children", [])
            ]
            
            project_id_str = str(project_data["id"])
            is_favorite = project_id_str in favorite_ids
            
            return ProjectHierarchyResponse(
                id=project_data["id"],
                name=project_data["name"],
                description=project_data.get("description"),
                parent_id=project_data.get("parent_id"),
                created_at=project_data["created_at"],
                updated_at=project_data["updated_at"],
                created_by=project_data["created_by"],
                document_count=project_data.get("document_count", 0),
                is_favorite=is_favorite,
                children=children
            )
        
        return [build_hierarchy_response(root) for root in roots]
    
    except Exception as e:
        logger.exception("project_hierarchy_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get project hierarchy: {str(e)}"
        )


@router.get(
    "/favorites",
    response_model=ProjectListResponse,
    summary="Get favorite projects",
    description="Get all projects favorited by the current user"
)
async def get_favorite_projects(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_auth)
):
    """
    Get favorite projects for the current user
    
    Args:
        page: Page number (1-indexed)
        limit: Items per page
        
    Returns:
        List of favorite projects with pagination info
    """
    try:
        user_id = current_user["id"]
        
        # Get user's favorite project IDs
        # Handle both ObjectId and string formats
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        user = None
        try:
            # Try ObjectId first
            try:
                user_oid = ObjectId(user_id)
                user = await UserModel.find_one(UserModel.id == user_oid)
            except (ValueError, TypeError):
                # Fallback to string match
                user = await UserModel.find_one(UserModel.id == user_id)
        except DocumentNotFound:
            user = None
        
        if not user or not user.favorite_project_ids:
            return ProjectListResponse(
                projects=[],
                pagination={
                    "page": page,
                    "limit": limit,
                    "total": 0,
                    "totalPages": 0,
                    "hasNext": False,
                    "hasPrev": False,
                }
            )
        
        favorite_ids = [str(pid) for pid in user.favorite_project_ids]
        
        # Calculate pagination
        total = len(favorite_ids)
        skip = (page - 1) * limit
        
        # Get paginated favorite project IDs
        paginated_ids = favorite_ids[skip:skip + limit]
        
        # Fetch projects (only those owned by the user)
        projects_list = []
        for project_id in paginated_ids:
            try:
                from bson import ObjectId
                # Try ObjectId first
                try:
                    project_oid = ObjectId(project_id)
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_oid,
                        ProjectModel.created_by == user_id
                    )
                except (ValueError, TypeError):
                    # Fallback to string match
                    project = await ProjectModel.find_one(
                        ProjectModel.id == project_id,
                        ProjectModel.created_by == user_id
                    )
                
                if project:
                    projects_list.append(project)
            except Exception as e:
                logger.warning("failed_to_fetch_favorite_project", project_id=project_id, error=str(e))
                continue
        
        # Convert to response format with document counts
        projects = []
        for project in projects_list:
            document_count = await _count_documents_for_project(str(project.id), user_id)
            projects.append(
                ProjectResponse(
                    id=str(project.id),
                    name=project.name,
                    description=project.description,
                    parent_id=project.parent_id,
                    created_at=project.created_at,
                    updated_at=project.updated_at,
                    created_by=project.created_by,
                    document_count=document_count,
                    is_favorite=True  # All projects in this list are favorites
                )
            )
        
        return ProjectListResponse(
            projects=projects,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit,
                "hasNext": (skip + limit) < total,
                "hasPrev": page > 1,
            }
        )
    
    except Exception as e:
        logger.exception("favorite_projects_list_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list favorite projects: {str(e)}"
        )


@router.post(
    "/{project_id}/favorite",
    response_model=ProjectResponse,
    summary="Toggle project favorite",
    description="Add or remove a project from favorites"
)
async def toggle_project_favorite(
    project_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Toggle favorite status for a project
    
    Args:
        project_id: Project ID to favorite/unfavorite
        
    Returns:
        Updated project with favorite status
    """
    try:
        user_id = current_user["id"]
        
        # Verify project exists and belongs to user
        from bson import ObjectId
        project = None
        try:
            project_oid = ObjectId(project_id)
            project = await ProjectModel.find_one(
                ProjectModel.id == project_oid,
                ProjectModel.created_by == user_id
            )
        except (ValueError, TypeError):
            project = await ProjectModel.find_one(
                ProjectModel.id == project_id,
                ProjectModel.created_by == user_id
            )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        
        # Get user and update favorites
        # Handle both ObjectId and string formats
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        user = None
        try:
            # Try ObjectId first
            try:
                user_oid = ObjectId(user_id)
                user = await UserModel.find_one(UserModel.id == user_oid)
            except (ValueError, TypeError):
                # Fallback to string match
                user = await UserModel.find_one(UserModel.id == user_id)
        except DocumentNotFound:
            user = None
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        project_id_str = str(project.id)
        
        # Initialize favorite_project_ids if it doesn't exist
        if not user.favorite_project_ids:
            user.favorite_project_ids = []
        
        # Toggle favorite status
        if project_id_str in user.favorite_project_ids:
            # Remove from favorites
            user.favorite_project_ids = [pid for pid in user.favorite_project_ids if str(pid) != project_id_str]
            is_favorite = False
            action = "unfavorited"
        else:
            # Add to favorites
            user.favorite_project_ids.append(project_id_str)
            is_favorite = True
            action = "favorited"
        
        user.updated_at = datetime.utcnow()
        await user.save()
        
        logger.info(
            "project_favorite_toggled",
            project_id=project_id_str,
            user_id=user_id,
            is_favorite=is_favorite,
            action=action
        )
        
        document_count = await _count_documents_for_project(project_id_str, user_id)
        
        return ProjectResponse(
            id=project_id_str,
            name=project.name,
            description=project.description,
            parent_id=project.parent_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            created_by=project.created_by,
            document_count=document_count,
            is_favorite=is_favorite
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_favorite_toggle_failed", project_id=project_id, user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to toggle project favorite: {str(e)}"
        )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project",
    description="Get a project by ID"
)
async def get_project(
    project_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Get project by ID
    
    Args:
        project_id: Project ID
        
    Returns:
        Project details
    """
    user_id = current_user["id"]
    
    project = await ProjectModel.find_one(
        ProjectModel.id == project_id,
        ProjectModel.created_by == user_id
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document_count = await _count_documents_for_project(project_id, user_id)
    is_favorite = await _is_project_favorited(project_id, user_id)
    
    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        parent_id=project.parent_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        created_by=project.created_by,
        document_count=document_count,
        is_favorite=is_favorite
    )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project",
    description="Update a project"
)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(require_auth)
):
    """
    Update a project
    
    Args:
        project_id: Project ID
        project_update: Project update data
        
    Returns:
        Updated project
    """
    user_id = current_user["id"]
    
    # Handle ObjectId conversion for project lookup
    from bson import ObjectId
    project = None
    
    try:
        # Try ObjectId conversion first
        project_oid = ObjectId(project_id)
        project = await ProjectModel.find_one(
            ProjectModel.id == project_oid,
            ProjectModel.created_by == user_id
        )
    except Exception:
        # If ObjectId conversion fails, try string match
        project = await ProjectModel.find_one(
            ProjectModel.id == project_id,
            ProjectModel.created_by == user_id
        )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    try:
        project_id_str = str(project.id)
        
        # Validate parent_id if provided (including None/null to remove parent)
        # Check if parent_id was explicitly set in the request
        update_dict = project_update.model_dump(exclude_unset=True)
        parent_id_provided = 'parent_id' in update_dict
        
        if parent_id_provided:
            parent_id_value = project_update.parent_id
            # Prevent setting self as parent (only if not None)
            if parent_id_value is not None and str(parent_id_value) == project_id_str:
                raise HTTPException(
                    status_code=400,
                    detail="Project cannot be its own parent"
                )
            # Validate parent exists if provided (not None) and belongs to user
            if parent_id_value is not None:
                # Normalize parent_id to string
                parent_id_str = str(parent_id_value).strip()
                
                # Try ObjectId conversion for parent lookup
                parent = None
                try:
                    parent_oid = ObjectId(parent_id_str)
                    parent = await ProjectModel.find_one(
                        ProjectModel.id == parent_oid,
                        ProjectModel.created_by == user_id
                    )
                except Exception:
                    # If ObjectId conversion fails, try string match
                    parent = await ProjectModel.find_one(
                        ProjectModel.id == parent_id_str,
                        ProjectModel.created_by == user_id
                    )
                
                if not parent:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Parent project not found or access denied"
                    )
                
                # Prevent circular references - check if the new parent is a descendant of this project
                async def is_descendant(ancestor_id: str, potential_descendant_id: str) -> bool:
                    """Check if potential_descendant_id is a descendant of ancestor_id"""
                    if ancestor_id == potential_descendant_id:
                        return True
                    # Get all projects for this user and filter manually to handle both ObjectId and string formats
                    all_user_projects = await ProjectModel.find(
                        ProjectModel.created_by == user_id
                    ).to_list()
                    # Get all direct children of ancestor
                    children = []
                    for child in all_user_projects:
                        if str(child.id) == ancestor_id:
                            continue
                        child_parent_id = child.parent_id
                        if child_parent_id:
                            child_parent_str = str(child_parent_id)
                            if child_parent_str == ancestor_id:
                                children.append(child)
                    # Recursively check each child
                    for child in children:
                        if await is_descendant(str(child.id), potential_descendant_id):
                            return True
                    return False
                
                # Check if the new parent is a descendant of this project
                if await is_descendant(project_id_str, parent_id_str):
                    raise HTTPException(
                        status_code=400,
                        detail="Cannot set a descendant project as parent (circular reference)"
                    )
        
        # Update fields if provided
        if project_update.name is not None:
            project.name = project_update.name
        if project_update.description is not None:
            project.description = project_update.description
        
        # Handle parent_id update (including None to remove parent)
        # Check if parent_id was explicitly provided in the request
        if 'parent_id' in update_dict:
            old_parent_id = project.parent_id
            # Normalize parent_id to string (or None)
            parent_id_to_set = None
            if project_update.parent_id is not None:
                parent_id_to_set = str(project_update.parent_id).strip()
                if not parent_id_to_set or parent_id_to_set.lower() in ["null", "none", ""]:
                    parent_id_to_set = None
            
            project.parent_id = parent_id_to_set
            logger.info(
                "project_parent_updated",
                project_id=project_id_str,
                old_parent_id=str(old_parent_id) if old_parent_id else None,
                new_parent_id=parent_id_to_set,
                user_id=user_id
            )
        
        project.updated_at = datetime.utcnow()
        await project.save()
        
        logger.info("project_updated", project_id=project_id_str, parent_id=project.parent_id, user_id=user_id)
        
        document_count = await _count_documents_for_project(project_id_str, user_id)
        is_favorite = await _is_project_favorited(project_id_str, user_id)
        
        return ProjectResponse(
            id=str(project.id),
            name=project.name,
            description=project.description,
            parent_id=project.parent_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            created_by=project.created_by,
            document_count=document_count,
            is_favorite=is_favorite
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_update_failed", project_id=project_id, user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete(
    "/{project_id}",
    summary="Delete project",
    description="Delete a project and reassign its documents to another project or remove project association"
)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Delete a project
    
    Args:
        project_id: Project ID to delete
        
    Returns:
        Success message
    """
    user_id = current_user["id"]
    
    # Handle ObjectId conversion for project lookup
    from bson import ObjectId
    project = None
    
    try:
        # Try ObjectId conversion first
        project_oid = ObjectId(project_id)
        project = await ProjectModel.find_one(
            ProjectModel.id == project_oid,
            ProjectModel.created_by == user_id
        )
    except Exception:
        # If ObjectId conversion fails, try string match
        project = await ProjectModel.find_one(
            ProjectModel.id == project_id,
            ProjectModel.created_by == user_id
        )
    
    if not project:
        logger.warning("project_not_found_for_deletion", project_id=project_id, user_id=user_id)
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    try:
        project_id_str = str(project.id)
        
        # Check if project has children (for this user)
        # Need to check both ObjectId and string formats for parent_id
        all_user_projects = await ProjectModel.find(
            ProjectModel.created_by == user_id
        ).to_list()
        
        child_projects = []
        for child in all_user_projects:
            # Skip self
            if str(child.id) == project_id_str:
                continue
            child_parent_id = child.parent_id
            if child_parent_id:
                # Convert to string for comparison
                child_parent_str = str(child_parent_id)
                if child_parent_str == project_id_str:
                    child_projects.append(child)
        
        if child_projects:
            logger.warning(
                "cannot_delete_project_with_children",
                project_id=project_id_str,
                children_count=len(child_projects)
            )
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project with {len(child_projects)} child project(s). Please delete or reassign child projects first."
            )
        
        # Reassign documents to another project if available, otherwise set project_id to null
        # Only consider other projects owned by this user
        other_project = await ProjectModel.find_one(
            ProjectModel.id != project.id,
            ProjectModel.created_by == user_id
        )
        
        reassigned_count = 0
        # Get all documents for this user and filter by project_id
        all_user_documents = await DocumentModel.find(
            DocumentModel.uploaded_by == user_id
        ).to_list()
        
        # Filter documents manually to handle both ObjectId and string project_id formats
        project_documents = []
        for doc in all_user_documents:
            doc_project_id = doc.project_id
            if doc_project_id:
                doc_project_str = str(doc_project_id)
                if doc_project_str == project_id_str:
                    project_documents.append(doc)
        
        if other_project:
            # Reassign to another project
            default_project_id = str(other_project.id)
            for doc in project_documents:
                doc.project_id = default_project_id
                await doc.save()
                reassigned_count += 1
            logger.info("documents_reassigned", project_id=project_id_str, target_project_id=default_project_id, count=reassigned_count)
        else:
            # No other projects exist, remove project association from documents
            for doc in project_documents:
                doc.project_id = None
                await doc.save()
                reassigned_count += 1
            logger.info("documents_unassigned", project_id=project_id_str, count=reassigned_count)
        
        # Delete the project
        await project.delete()
        
        logger.info(
            "project_deleted",
            project_id=project_id_str,
            project_name=project.name,
            user_id=user_id,
            reassigned_documents=reassigned_count
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Project deleted successfully",
                "project_id": project_id_str,
                "reassigned_documents": reassigned_count
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_deletion_failed", project_id=project_id, user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete project: {str(e)}"
        )

