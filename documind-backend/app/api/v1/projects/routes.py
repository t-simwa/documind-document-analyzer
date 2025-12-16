"""
Project management API routes
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
import structlog

from .schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectHierarchyResponse,
    ProjectListResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# In-memory project storage (in production, use a database)
projects_store: dict = {}

# Initialize default project if store is empty
def _initialize_default_project():
    """Initialize default project if none exists"""
    if not projects_store:
        default_project = {
            "id": "1",
            "name": "Default Project",
            "description": "Default project for documents",
            "parent_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        }
        projects_store["1"] = default_project
        logger.info("default_project_initialized", project_id="1")

# Initialize on module load
_initialize_default_project()


def _count_documents_for_project(project_id: str) -> int:
    """Count documents for a project"""
    from app.api.v1.documents.routes import documents_store
    count = 0
    for doc in documents_store.values():
        if doc.get("project_id") == project_id:
            count += 1
    return count


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=201,
    summary="Create project",
    description="Create a new project"
)
async def create_project(project: ProjectCreate):
    """
    Create a new project
    
    Args:
        project: Project creation data
        
    Returns:
        Created project
    """
    try:
        # Validate parent_id if provided
        if project.parent_id:
            if project.parent_id not in projects_store:
                raise HTTPException(
                    status_code=400,
                    detail=f"Parent project not found: {project.parent_id}"
                )
            # Prevent circular references (check if parent is a descendant of the new project)
            # This check will be done after project creation, but we validate parent exists here
        
        # Generate project ID
        import time
        project_id = str(int(time.time() * 1000))
        
        # Create project metadata
        now = datetime.utcnow()
        project_data = {
            "id": project_id,
            "name": project.name,
            "description": project.description,
            "parent_id": project.parent_id,
            "created_at": now,
            "updated_at": now,
            "created_by": "user1",  # In production, get from auth context
        }
        
        projects_store[project_id] = project_data
        
        logger.info("project_created", project_id=project_id, name=project.name)
        
        return ProjectResponse(
            id=project_id,
            name=project_data["name"],
            description=project_data["description"],
            parent_id=project_data["parent_id"],
            created_at=project_data["created_at"],
            updated_at=project_data["updated_at"],
            created_by=project_data["created_by"],
            document_count=0
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
    limit: int = Query(50, ge=1, le=100, description="Items per page")
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
        projects_list = list(projects_store.values())
        
        # Calculate pagination
        total = len(projects_list)
        start = (page - 1) * limit
        end = start + limit
        
        # Get paginated projects
        paginated_projects = projects_list[start:end]
        
        # Count documents for each project
        for project_data in paginated_projects:
            project_data["document_count"] = _count_documents_for_project(project_data["id"])
        
        # Convert to response format
        projects = [
            ProjectResponse(
                id=p["id"],
                name=p["name"],
                description=p.get("description"),
                parent_id=p.get("parent_id"),
                created_at=p["created_at"],
                updated_at=p["updated_at"],
                created_by=p["created_by"],
                document_count=p.get("document_count", 0)
            )
            for p in paginated_projects
        ]
        
        return ProjectListResponse(
            projects=projects,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit,  # Ceiling division
                "hasNext": end < total,
                "hasPrev": page > 1,
            }
        )
    
    except Exception as e:
        logger.exception("project_list_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list projects: {str(e)}"
        )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project",
    description="Get a project by ID"
)
async def get_project(project_id: str):
    """
    Get project by ID
    
    Args:
        project_id: Project ID
        
    Returns:
        Project details
    """
    if project_id not in projects_store:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = projects_store[project_id]
    project_data["document_count"] = _count_documents_for_project(project_id)
    
    return ProjectResponse(
        id=project_data["id"],
        name=project_data["name"],
        description=project_data.get("description"),
        parent_id=project_data.get("parent_id"),
        created_at=project_data["created_at"],
        updated_at=project_data["updated_at"],
        created_by=project_data["created_by"],
        document_count=project_data.get("document_count", 0)
    )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project",
    description="Update a project"
)
async def update_project(project_id: str, project_update: ProjectUpdate):
    """
    Update a project
    
    Args:
        project_id: Project ID
        project_update: Project update data
        
    Returns:
        Updated project
    """
    if project_id not in projects_store:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = projects_store[project_id]
    
    try:
        # Update fields if provided
        if project_update.name is not None:
            project_data["name"] = project_update.name
        if project_update.description is not None:
            project_data["description"] = project_update.description
        
        project_data["updated_at"] = datetime.utcnow()
        
        logger.info("project_updated", project_id=project_id)
        
        project_data["document_count"] = _count_documents_for_project(project_id)
        
        return ProjectResponse(
            id=project_data["id"],
            name=project_data["name"],
            description=project_data.get("description"),
            parent_id=project_data.get("parent_id"),
            created_at=project_data["created_at"],
            updated_at=project_data["updated_at"],
            created_by=project_data["created_by"],
            document_count=project_data.get("document_count", 0)
        )
    
    except Exception as e:
        logger.exception("project_update_failed", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete(
    "/{project_id}",
    summary="Delete project",
    description="Delete a project and reassign its documents to default project"
)
async def delete_project(project_id: str):
    """
    Delete a project
    
    Args:
        project_id: Project ID to delete
        
    Returns:
        Success message
    """
    if project_id not in projects_store:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = projects_store[project_id]
    
    try:
        # Check if project has children
        children = [
            p for p in projects_store.values()
            if p.get("parent_id") == project_id
        ]
        
        if children:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project with {len(children)} child project(s). Please delete or reassign child projects first."
            )
        
        # Reassign documents to default project (ID "1" or first available project)
        from app.api.v1.documents.routes import documents_store
        
        default_project_id = None
        # Try to find default project (ID "1")
        if "1" in projects_store and "1" != project_id:
            default_project_id = "1"
        else:
            # Find first available project that's not the one being deleted
            for pid, pdata in projects_store.items():
                if pid != project_id:
                    default_project_id = pid
                    break
        
        reassigned_count = 0
        if default_project_id:
            for doc in documents_store.values():
                if doc.get("project_id") == project_id:
                    doc["project_id"] = default_project_id
                    reassigned_count += 1
        
        # Delete the project
        del projects_store[project_id]
        
        logger.info(
            "project_deleted",
            project_id=project_id,
            reassigned_documents=reassigned_count
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Project deleted successfully",
                "project_id": project_id,
                "reassigned_documents": reassigned_count
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_deletion_failed", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete project: {str(e)}"
        )


@router.get(
    "/hierarchy",
    response_model=List[ProjectHierarchyResponse],
    summary="Get project hierarchy",
    description="Get all projects in hierarchical structure"
)
async def get_project_hierarchy():
    """
    Get projects in hierarchical structure
    
    Returns:
        List of root projects with their children
    """
    try:
        # Build project map
        project_map = {}
        for project_data in projects_store.values():
            project_map[project_data["id"]] = {
                **project_data,
                "document_count": _count_documents_for_project(project_data["id"]),
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
                # Child project
                parent = project_map.get(parent_id)
                if parent:
                    parent["children"].append(project_data)
                else:
                    # Parent not found, treat as root
                    roots.append(project_data)
        
        # Convert to response format recursively
        def build_hierarchy_response(project_data: dict) -> ProjectHierarchyResponse:
            children = [
                build_hierarchy_response(child)
                for child in project_data.get("children", [])
            ]
            
            return ProjectHierarchyResponse(
                id=project_data["id"],
                name=project_data["name"],
                description=project_data.get("description"),
                parent_id=project_data.get("parent_id"),
                created_at=project_data["created_at"],
                updated_at=project_data["updated_at"],
                created_by=project_data["created_by"],
                document_count=project_data.get("document_count", 0),
                children=children
            )
        
        return [build_hierarchy_response(root) for root in roots]
    
    except Exception as e:
        logger.exception("project_hierarchy_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get project hierarchy: {str(e)}"
        )

