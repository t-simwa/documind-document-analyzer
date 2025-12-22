"""
Saved analyses API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import structlog

from app.core.dependencies import require_auth
from app.database.models import SavedAnalysis as SavedAnalysisModel, Document as DocumentModel
from .schemas import (
    SavedAnalysisCreate,
    SavedAnalysisUpdate,
    SavedAnalysisResponse,
    SavedAnalysisListResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=SavedAnalysisListResponse,
    summary="List saved analyses",
    description="List all saved cross-document analyses for the authenticated user"
)
async def list_saved_analyses(current_user: dict = Depends(require_auth)):
    """
    List all saved analyses for the authenticated user
    
    Returns:
        List of saved analyses
    """
    try:
        user_id = current_user["id"]
        
        # Get all saved analyses for the user, sorted by most recent first
        analyses = await SavedAnalysisModel.find(
            SavedAnalysisModel.user_id == user_id
        ).sort(-SavedAnalysisModel.created_at).to_list()
        
        return SavedAnalysisListResponse(
            analyses=[
                SavedAnalysisResponse(
                    id=str(analysis.id),
                    document_ids=analysis.document_ids,
                    document_names=analysis.document_names,
                    has_comparison=analysis.has_comparison,
                    has_patterns=analysis.has_patterns,
                    has_contradictions=analysis.has_contradictions,
                    has_messages=analysis.has_messages,
                    created_at=analysis.created_at,
                    updated_at=analysis.updated_at
                )
                for analysis in analyses
            ],
            total=len(analyses)
        )
    except Exception as e:
        logger.exception("failed_to_list_analyses", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list saved analyses: {str(e)}"
        )


@router.post(
    "/",
    response_model=SavedAnalysisResponse,
    status_code=201,
    summary="Create or update saved analysis",
    description="Create a new saved analysis or update existing one"
)
async def create_or_update_saved_analysis(
    analysis: SavedAnalysisCreate,
    current_user: dict = Depends(require_auth)
):
    """
    Create or update a saved analysis
    
    Args:
        analysis: Analysis creation data
        
    Returns:
        Created or updated analysis
    """
    try:
        user_id = current_user["id"]
        
        # Validate that all documents belong to the user
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        for doc_id in analysis.document_ids:
            doc = None
            try:
                # Try ObjectId first
                try:
                    object_id = ObjectId(doc_id)
                    doc = await DocumentModel.find_one(
                        DocumentModel.id == object_id,
                        DocumentModel.uploaded_by == user_id
                    )
                except (ValueError, TypeError, DocumentNotFound):
                    # Fallback to string ID search
                    doc = await DocumentModel.find_one(
                        DocumentModel.id == doc_id,
                        DocumentModel.uploaded_by == user_id
                    )
            except Exception as e:
                logger.error("error_finding_document_in_analysis", doc_id=doc_id, error=str(e))
            
            if not doc:
                raise HTTPException(
                    status_code=403,
                    detail=f"Document {doc_id} not found or access denied"
                )
        
        # Create a unique key from sorted document IDs
        sorted_doc_ids = sorted(analysis.document_ids)
        
        # Check if analysis already exists for this document set
        # We need to check if the document_ids array matches (order-independent)
        all_user_analyses = await SavedAnalysisModel.find(
            SavedAnalysisModel.user_id == user_id
        ).to_list()
        
        existing = None
        for analysis_item in all_user_analyses:
            if sorted(analysis_item.document_ids) == sorted_doc_ids:
                existing = analysis_item
                break
        
        if existing:
            # Update existing analysis
            existing.has_comparison = analysis.has_comparison
            existing.has_patterns = analysis.has_patterns
            existing.has_contradictions = analysis.has_contradictions
            existing.has_messages = analysis.has_messages
            existing.document_names = analysis.document_names
            from datetime import datetime
            existing.updated_at = datetime.utcnow()
            await existing.save()
            
            logger.info("analysis_updated", analysis_id=str(existing.id), user_id=user_id)
            
            return SavedAnalysisResponse(
                id=str(existing.id),
                document_ids=existing.document_ids,
                document_names=existing.document_names,
                has_comparison=existing.has_comparison,
                has_patterns=existing.has_patterns,
                has_contradictions=existing.has_contradictions,
                has_messages=existing.has_messages,
                created_at=existing.created_at,
                updated_at=existing.updated_at
            )
        else:
            # Create new analysis
            new_analysis = SavedAnalysisModel(
                user_id=user_id,
                document_ids=sorted_doc_ids,
                document_names=analysis.document_names,
                has_comparison=analysis.has_comparison,
                has_patterns=analysis.has_patterns,
                has_contradictions=analysis.has_contradictions,
                has_messages=analysis.has_messages
            )
            await new_analysis.insert()
            
            logger.info("analysis_created", analysis_id=str(new_analysis.id), user_id=user_id)
            
            return SavedAnalysisResponse(
                id=str(new_analysis.id),
                document_ids=new_analysis.document_ids,
                document_names=new_analysis.document_names,
                has_comparison=new_analysis.has_comparison,
                has_patterns=new_analysis.has_patterns,
                has_contradictions=new_analysis.has_contradictions,
                has_messages=new_analysis.has_messages,
                created_at=new_analysis.created_at,
                updated_at=new_analysis.updated_at
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("failed_to_create_analysis", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create or update saved analysis: {str(e)}"
        )


@router.get(
    "/{analysis_id}",
    response_model=SavedAnalysisResponse,
    summary="Get saved analysis",
    description="Get a saved analysis by ID"
)
async def get_saved_analysis(
    analysis_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Get a saved analysis by ID
    
    Args:
        analysis_id: Analysis ID
        
    Returns:
        Saved analysis
    """
    try:
        user_id = current_user["id"]
        from bson import ObjectId
        
        # Try ObjectId first, then string
        try:
            analysis_object_id = ObjectId(analysis_id)
            analysis = await SavedAnalysisModel.find_one(
                SavedAnalysisModel.id == analysis_object_id,
                SavedAnalysisModel.user_id == user_id
            )
        except (ValueError, TypeError):
            analysis = await SavedAnalysisModel.find_one(
                SavedAnalysisModel.id == analysis_id,
                SavedAnalysisModel.user_id == user_id
            )
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return SavedAnalysisResponse(
            id=str(analysis.id),
            document_ids=analysis.document_ids,
            document_names=analysis.document_names,
            has_comparison=analysis.has_comparison,
            has_patterns=analysis.has_patterns,
            has_contradictions=analysis.has_contradictions,
            has_messages=analysis.has_messages,
            created_at=analysis.created_at,
            updated_at=analysis.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("failed_to_get_analysis", analysis_id=analysis_id, error=str(e))
        raise HTTPException(status_code=404, detail="Analysis not found")


@router.delete(
    "/{analysis_id}",
    summary="Delete saved analysis",
    description="Delete a saved analysis"
)
async def delete_saved_analysis(
    analysis_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Delete a saved analysis
    
    Args:
        analysis_id: Analysis ID to delete
        
    Returns:
        Success message
    """
    try:
        user_id = current_user["id"]
        from bson import ObjectId
        
        # Try ObjectId first, then string
        try:
            analysis_object_id = ObjectId(analysis_id)
            analysis = await SavedAnalysisModel.find_one(
                SavedAnalysisModel.id == analysis_object_id,
                SavedAnalysisModel.user_id == user_id
            )
        except (ValueError, TypeError):
            analysis = await SavedAnalysisModel.find_one(
                SavedAnalysisModel.id == analysis_id,
                SavedAnalysisModel.user_id == user_id
            )
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        await analysis.delete()
        
        logger.info("analysis_deleted", analysis_id=analysis_id, user_id=user_id)
        
        return JSONResponse(
            status_code=200,
            content={"message": "Analysis deleted successfully", "analysis_id": analysis_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("failed_to_delete_analysis", analysis_id=analysis_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete analysis: {str(e)}"
        )

