"""
Audit & Logging API routes
"""

from fastapi import APIRouter, Depends, Query, Response
from datetime import datetime, timedelta
from typing import Optional, List
import csv
import io

from app.api.v1.audit.schemas import AuditLogResponse, AuditLogListResponse
from app.core.dependencies import require_auth
from app.database.models import AuditLog
from app.core.exceptions import AuthorizationError

router = APIRouter()


@router.get(
    "/logs",
    response_model=AuditLogListResponse,
    summary="Get audit logs",
    description="Get audit logs with filtering and pagination. Requires authentication.",
    tags=["Audit"]
)
async def get_audit_logs(
    current_user: dict = Depends(require_auth),
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    status: Optional[str] = Query(None, description="Filter by status (success, error, warning)"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page")
) -> AuditLogListResponse:
    """
    Get audit logs with filtering and pagination.
    
    Note: Regular users can only see their own logs.
    Superusers can see all logs.
    """
    user_id_filter = current_user["id"]
    is_superuser = current_user.get("is_superuser", False)
    
    # Build query
    query_filters = []
    
    # Regular users can only see their own logs
    if not is_superuser:
        query_filters.append(AuditLog.user_id == user_id_filter)
    elif user_id:  # Superusers can filter by user_id if provided
        query_filters.append(AuditLog.user_id == user_id)
    
    # Apply filters
    if action:
        query_filters.append(AuditLog.action == action)
    if resource_type:
        query_filters.append(AuditLog.resource_type == resource_type)
    if resource_id:
        query_filters.append(AuditLog.resource_id == resource_id)
    if status:
        query_filters.append(AuditLog.status == status)
    if start_date:
        query_filters.append(AuditLog.created_at >= start_date)
    if end_date:
        query_filters.append(AuditLog.created_at <= end_date)
    
    # Build query - Beanie's find() accepts multiple conditions
    if query_filters:
        if len(query_filters) == 1:
            query = AuditLog.find(query_filters[0])
        else:
            # Multiple conditions are ANDed together by default
            query = AuditLog.find(*query_filters)
    else:
        query = AuditLog.find()
    
    # Get total count
    total = await query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    logs = await query.sort(-AuditLog.created_at).skip(skip).limit(page_size).to_list()
    
    # Convert to response format
    log_responses = [
        AuditLogResponse(
            id=str(log.id),
            action=log.action,
            user_id=log.user_id,
            user_email=log.user_email,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            status=log.status,
            error_message=log.error_message,
            metadata=log.metadata,
            created_at=log.created_at
        )
        for log in logs
    ]
    
    has_more = (skip + len(logs)) < total
    
    return AuditLogListResponse(
        logs=log_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


@router.get(
    "/logs/export",
    summary="Export audit logs",
    description="Export audit logs as CSV. Requires authentication.",
    tags=["Audit"]
)
async def export_audit_logs(
    response: Response,
    current_user: dict = Depends(require_auth),
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    status: Optional[str] = Query(None, description="Filter by status (success, error, warning)"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    format: str = Query("csv", regex="^(csv|json)$", description="Export format (csv or json)")
) -> Response:
    """
    Export audit logs as CSV or JSON.
    
    Note: Regular users can only export their own logs.
    Superusers can export all logs.
    """
    user_id_filter = current_user["id"]
    is_superuser = current_user.get("is_superuser", False)
    
    # Build query (same as get_audit_logs)
    query_filters = []
    
    if not is_superuser:
        query_filters.append(AuditLog.user_id == user_id_filter)
    elif user_id:
        query_filters.append(AuditLog.user_id == user_id)
    
    if action:
        query_filters.append(AuditLog.action == action)
    if resource_type:
        query_filters.append(AuditLog.resource_type == resource_type)
    if resource_id:
        query_filters.append(AuditLog.resource_id == resource_id)
    if status:
        query_filters.append(AuditLog.status == status)
    if start_date:
        query_filters.append(AuditLog.created_at >= start_date)
    if end_date:
        query_filters.append(AuditLog.created_at <= end_date)
    
    # Build query - Beanie's find() accepts multiple conditions
    if query_filters:
        if len(query_filters) == 1:
            query = AuditLog.find(query_filters[0])
        else:
            # Multiple conditions are ANDed together by default
            query = AuditLog.find(*query_filters)
    else:
        query = AuditLog.find()
    
    # Get all logs (no pagination for export)
    logs = await query.sort(-AuditLog.created_at).to_list()
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Action", "User ID", "User Email", "Resource Type", "Resource ID",
            "IP Address", "User Agent", "Status", "Error Message", "Created At"
        ])
        
        # Write rows
        for log in logs:
            writer.writerow([
                str(log.id),
                log.action,
                log.user_id or "",
                log.user_email or "",
                log.resource_type or "",
                log.resource_id or "",
                log.ip_address or "",
                log.user_agent or "",
                log.status,
                log.error_message or "",
                log.created_at.isoformat()
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Set response headers
        response.headers["Content-Type"] = "text/csv"
        response.headers["Content-Disposition"] = f'attachment; filename="audit_logs_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        return Response(content=csv_content, media_type="text/csv")
    
    else:  # JSON format
        import json
        
        # Convert logs to dict
        logs_data = [
            {
                "id": str(log.id),
                "action": log.action,
                "user_id": log.user_id,
                "user_email": log.user_email,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "status": log.status,
                "error_message": log.error_message,
                "metadata": log.metadata,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ]
        
        json_content = json.dumps(logs_data, indent=2)
        
        # Set response headers
        response.headers["Content-Type"] = "application/json"
        response.headers["Content-Disposition"] = f'attachment; filename="audit_logs_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json"'
        
        return Response(content=json_content, media_type="application/json")

