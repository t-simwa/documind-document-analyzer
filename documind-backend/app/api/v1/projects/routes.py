"""
Project management API routes
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
import structlog

from app.database.models import Project as ProjectModel, Document as DocumentModel
from .schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectHierarchyResponse,
    ProjectListResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

async def _count_documents_for_project(project_id: str) -> int:
    """Count documents for a project"""
    count = await DocumentModel.find(DocumentModel.project_id == project_id).count()
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
            parent = await ProjectModel.get(project.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=400,
                    detail=f"Parent project not found: {project.parent_id}"
                )
        
        # Create new project
        new_project = ProjectModel(
            name=project.name,
            description=project.description,
            parent_id=project.parent_id,
            created_by="user1",  # In production, get from auth context
        )
        await new_project.insert()
        
        logger.info("project_created", project_id=str(new_project.id), name=project.name)
        
        document_count = await _count_documents_for_project(str(new_project.id))
        
        return ProjectResponse(
            id=str(new_project.id),
            name=new_project.name,
            description=new_project.description,
            parent_id=new_project.parent_id,
            created_at=new_project.created_at,
            updated_at=new_project.updated_at,
            created_by=new_project.created_by,
            document_count=document_count
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
        # Calculate pagination
        total = await ProjectModel.count()
        skip = (page - 1) * limit
        
        # Get paginated projects
        projects_list = await ProjectModel.find_all().skip(skip).limit(limit).to_list()
        
        # Convert to response format with document counts
        projects = []
        for project in projects_list:
            document_count = await _count_documents_for_project(str(project.id))
            projects.append(
            ProjectResponse(
                    id=str(project.id),
                    name=project.name,
                    description=project.description,
                    parent_id=project.parent_id,
                    created_at=project.created_at,
                    updated_at=project.updated_at,
                    created_by=project.created_by,
                    document_count=document_count
                )
            )
        
        return ProjectListResponse(
            projects=projects,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit,  # Ceiling division
                "hasNext": (skip + limit) < total,
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
        # Get all projects
        all_projects = await ProjectModel.find_all().to_list()
        
        # Build project map with document counts
        project_map = {}
        for project in all_projects:
            document_count = await _count_documents_for_project(str(project.id))
            project_map[str(project.id)] = {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "parent_id": project.parent_id,
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
                # Child project
                parent = project_map.get(str(parent_id))
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
    project = await ProjectModel.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document_count = await _count_documents_for_project(project_id)
    
    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        parent_id=project.parent_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        created_by=project.created_by,
        document_count=document_count
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
    project = await ProjectModel.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Validate parent_id if provided (including None/null to remove parent)
        # Check if parent_id was explicitly set in the request
        update_dict = project_update.model_dump(exclude_unset=True)
        parent_id_provided = 'parent_id' in update_dict
        
        if parent_id_provided:
            parent_id_value = project_update.parent_id
            # Prevent setting self as parent (only if not None)
            if parent_id_value is not None and parent_id_value == project_id:
                raise HTTPException(
                    status_code=400,
                    detail="Project cannot be its own parent"
                )
            # Validate parent exists if provided (not None)
            if parent_id_value is not None:
                parent = await ProjectModel.get(parent_id_value)
                if not parent:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Parent project not found: {parent_id_value}"
                    )
                
                # Prevent circular references - check if the new parent is a descendant of this project
                async def is_descendant(ancestor_id: str, potential_descendant_id: str) -> bool:
                    """Check if potential_descendant_id is a descendant of ancestor_id"""
                    if ancestor_id == potential_descendant_id:
                        return True
                    # Get all direct children of ancestor
                    children = await ProjectModel.find(ProjectModel.parent_id == ancestor_id).to_list()
                    # Recursively check each child
                    for child in children:
                        if await is_descendant(str(child.id), potential_descendant_id):
                            return True
                    return False
                
                # Check if the new parent is a descendant of this project
                if await is_descendant(project_id, parent_id_value):
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
        update_dict = project_update.model_dump(exclude_unset=True)
        if 'parent_id' in update_dict:
            old_parent_id = project.parent_id
            project.parent_id = project_update.parent_id
            logger.info(
                "project_parent_updated",
                project_id=project_id,
                old_parent_id=old_parent_id,
                new_parent_id=project_update.parent_id
            )
        
        project.updated_at = datetime.utcnow()
        await project.save()
        
        logger.info("project_updated", project_id=project_id, parent_id=project.parent_id)
        
        document_count = await _count_documents_for_project(project_id)
        
        return ProjectResponse(
            id=str(project.id),
            name=project.name,
            description=project.description,
            parent_id=project.parent_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            created_by=project.created_by,
            document_count=document_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("project_update_failed", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete(
    "/{project_id}",
    summary="Delete project",
    description="Delete a project and reassign its documents to another project or remove project association"
)
async def delete_project(project_id: str):
    """
    Delete a project
    
    Args:
        project_id: Project ID to delete
        
    Returns:
        Success message
    """
    project = await ProjectModel.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Check if project has children
        children = await ProjectModel.find(ProjectModel.parent_id == project_id).to_list()
        
        if children:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project with {len(children)} child project(s). Please delete or reassign child projects first."
            )
        
        # Reassign documents to another project if available, otherwise set project_id to null
        other_project = await ProjectModel.find_one(ProjectModel.id != project_id)
        
        reassigned_count = 0
        documents = await DocumentModel.find(DocumentModel.project_id == project_id).to_list()
        
        if other_project:
            # Reassign to another project
            default_project_id = str(other_project.id)
            for doc in documents:
                doc.project_id = default_project_id
                await doc.save()
                reassigned_count += 1
        else:
            # No other projects exist, remove project association from documents
            for doc in documents:
                doc.project_id = None
                await doc.save()
                    reassigned_count += 1
        
        # Delete the project
        await project.delete()
        
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

