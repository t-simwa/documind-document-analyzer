"""
Metrics API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Tuple
from datetime import datetime, timedelta
import structlog

from app.core.dependencies import require_auth
from app.database.models import Document as DocumentModel, User as UserModel
from app.core.config import settings
from .schemas import DocumentMetricsResponse, StorageMetricsResponse, DocumentMetric, StorageMetric

logger = structlog.get_logger(__name__)

router = APIRouter()


def format_number(num: int) -> str:
    """Format number with commas"""
    return f"{num:,}"


def format_bytes_to_gb(bytes_size: int) -> float:
    """Convert bytes to GB"""
    return round(bytes_size / (1024 ** 3), 2)


def format_gb(num: float) -> str:
    """Format GB with 1 decimal place"""
    return f"{num:.1f} GB"


def calculate_percentage_change(current: int, previous: int) -> Tuple[float, str]:
    """
    Calculate percentage change between two values
    
    Returns:
        (change_percentage, trend)
    """
    if previous == 0:
        if current > 0:
            return (100.0, "up")
        return (0.0, "neutral")
    
    change = ((current - previous) / previous) * 100
    if change > 0:
        return (abs(change), "up")
    elif change < 0:
        return (abs(change), "down")
    else:
        return (0.0, "neutral")


@router.get(
    "/documents",
    response_model=DocumentMetricsResponse,
    summary="Get document metrics",
    description="Get document volume metrics for the current user"
)
async def get_document_metrics(
    current_user: dict = Depends(require_auth)
):
    """
    Get document metrics for the current user
    
    Returns:
        Document metrics including total documents, processed this month, and storage usage
    """
    try:
        user_id = current_user["id"]
        
        # Handle both ObjectId and string formats for user lookup
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        # Get all documents for this user
        all_documents = await DocumentModel.find(
            DocumentModel.uploaded_by == user_id
        ).to_list()
        
        # Calculate total documents
        total_documents = len(all_documents)
        
        # Calculate documents processed this month
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        documents_this_month = [
            doc for doc in all_documents
            if doc.uploaded_at >= start_of_month
        ]
        processed_this_month = len(documents_this_month)
        
        # Calculate documents processed last month (for comparison)
        if now.month == 1:
            start_of_last_month = datetime(now.year - 1, 12, 1)
            end_of_last_month = datetime(now.year, 1, 1)
        else:
            start_of_last_month = datetime(now.year, now.month - 1, 1)
            end_of_last_month = datetime(now.year, now.month, 1)
        
        documents_last_month = [
            doc for doc in all_documents
            if start_of_last_month <= doc.uploaded_at < end_of_last_month
        ]
        processed_last_month = len(documents_last_month)
        
        # Calculate storage used (sum of all document sizes)
        storage_used_bytes = sum(doc.size for doc in all_documents)
        storage_used_gb = format_bytes_to_gb(storage_used_bytes)
        
        # Calculate storage used last month (for comparison)
        # Get documents uploaded before this month
        documents_before_this_month = [
            doc for doc in all_documents
            if doc.uploaded_at < start_of_month
        ]
        storage_last_month_bytes = sum(doc.size for doc in documents_before_this_month)
        storage_last_month_gb = format_bytes_to_gb(storage_last_month_bytes)
        
        # Calculate percentage changes
        total_change, total_trend = calculate_percentage_change(
            total_documents,
            total_documents - processed_this_month  # Previous total
        )
        
        monthly_change, monthly_trend = calculate_percentage_change(
            processed_this_month,
            processed_last_month
        )
        
        storage_change, storage_trend = calculate_percentage_change(
            storage_used_gb * 1000,  # Convert to MB for better comparison
            storage_last_month_gb * 1000
        )
        
        # Build metrics
        metrics = [
            DocumentMetric(
                label="Total Documents",
                value=format_number(total_documents),
                change=total_change,
                trend=total_trend
            ),
            DocumentMetric(
                label="Processed This Month",
                value=format_number(processed_this_month),
                change=monthly_change,
                trend=monthly_trend
            ),
            DocumentMetric(
                label="Storage Used",
                value=format_gb(storage_used_gb),
                change=storage_change,
                trend=storage_trend
            )
        ]
        
        return DocumentMetricsResponse(
            metrics=metrics,
            total_documents=total_documents,
            processed_this_month=processed_this_month,
            storage_used_gb=storage_used_gb
        )
    
    except Exception as e:
        logger.exception("document_metrics_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch document metrics: {str(e)}"
        )


@router.get(
    "/storage",
    response_model=StorageMetricsResponse,
    summary="Get storage metrics",
    description="Get storage usage metrics for the current user"
)
async def get_storage_metrics(
    current_user: dict = Depends(require_auth)
):
    """
    Get storage usage metrics for the current user
    
    Returns:
        Storage metrics including used, limit, and percentage
    """
    try:
        user_id = current_user["id"]
        
        # Get all documents for this user
        all_documents = await DocumentModel.find(
            DocumentModel.uploaded_by == user_id
        ).to_list()
        
        # Calculate storage used (sum of all document sizes)
        storage_used_bytes = sum(doc.size for doc in all_documents)
        storage_used_gb = format_bytes_to_gb(storage_used_bytes)
        
        # Get storage limit (default 10 GB, can be configured per user/organization)
        # For now, use a default limit. In the future, this could come from user/organization settings
        storage_limit_gb = 10.0  # Default 10 GB limit
        
        # Calculate percentage
        storage_percentage = (storage_used_gb / storage_limit_gb) * 100 if storage_limit_gb > 0 else 0
        
        # Build storage metric
        storage = StorageMetric(
            used_gb=storage_used_gb,
            limit_gb=storage_limit_gb,
            percentage=round(storage_percentage, 1),
            used_formatted=format_gb(storage_used_gb),
            limit_formatted=format_gb(storage_limit_gb)
        )
        
        return StorageMetricsResponse(
            storage=storage,
            breakdown=None  # Can add breakdown by file type later
        )
    
    except Exception as e:
        logger.exception("storage_metrics_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch storage metrics: {str(e)}"
        )

