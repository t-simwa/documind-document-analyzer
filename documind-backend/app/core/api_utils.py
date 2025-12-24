"""
API utility functions for pagination, filtering, and sorting
Provides standardized utilities for consistent API behavior
"""

from typing import Any, Dict, List, Optional, Tuple
from fastapi import Query
from pydantic import BaseModel
from beanie import Document
from beanie.operators import In, NotIn, Gt, Gte, Lt, Lte, Eq, Ne, Regex

from app.schemas.common import PaginationMeta, FilterParam, SortParam


def create_pagination_meta(
    page: int,
    limit: int,
    total: int
) -> PaginationMeta:
    """
    Create pagination metadata
    
    Args:
        page: Current page number (1-indexed)
        limit: Items per page
        total: Total number of items
        
    Returns:
        PaginationMeta object
    """
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    has_next = (page * limit) < total
    has_prev = page > 1
    
    return PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


def parse_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
) -> Tuple[int, int]:
    """
    Parse pagination query parameters
    
    Args:
        page: Page number (default: 1)
        limit: Items per page (default: 20, max: 100)
        
    Returns:
        Tuple of (page, limit)
    """
    return page, limit


def parse_filter_params(
    filters: Optional[str] = Query(
        None,
        description="JSON string of filter parameters. Format: [{\"field\": \"name\", \"operator\": \"eq\", \"value\": \"test\"}]"
    )
) -> List[FilterParam]:
    """
    Parse filter query parameters
    
    Args:
        filters: JSON string of filter parameters
        
    Returns:
        List of FilterParam objects
    """
    if not filters:
        return []
    
    try:
        import json
        filter_list = json.loads(filters)
        if isinstance(filter_list, list):
            return [FilterParam(**f) if isinstance(f, dict) else f for f in filter_list]
        elif isinstance(filter_list, dict):
            return [FilterParam(**filter_list)]
        return []
    except (json.JSONDecodeError, ValueError, TypeError):
        return []


def parse_sort_params(
    sort: Optional[str] = Query(
        None,
        description="Sort parameters. Format: \"field:direction\" or \"field\" (defaults to asc). Multiple sorts: \"field1:asc,field2:desc\""
    )
) -> List[SortParam]:
    """
    Parse sort query parameters
    
    Args:
        sort: Sort string in format "field:direction" or comma-separated for multiple sorts
        
    Returns:
        List of SortParam objects
    """
    if not sort:
        return []
    
    sort_params = []
    for sort_item in sort.split(','):
        sort_item = sort_item.strip()
        if ':' in sort_item:
            field, direction = sort_item.split(':', 1)
            sort_params.append(SortParam(field=field.strip(), direction=direction.strip().lower()))
        else:
            sort_params.append(SortParam(field=sort_item.strip(), direction="asc"))
    
    return sort_params


def apply_filters_to_query(
    query,
    filters: List[FilterParam],
    model_class: type[Document]
) -> Any:
    """
    Apply filters to a Beanie query
    
    Args:
        query: Beanie query object
        filters: List of FilterParam objects
        model_class: Beanie model class
        
    Returns:
        Modified query object
    """
    for filter_param in filters:
        field = filter_param.field
        operator = filter_param.operator.lower()
        value = filter_param.value
        
        # Get the field from the model
        if not hasattr(model_class, field):
            continue
        
        model_field = getattr(model_class, field)
        
        # Apply operator
        if operator == "eq":
            query = query.find(model_field == value)
        elif operator == "ne":
            query = query.find(model_field != value)
        elif operator == "gt":
            query = query.find(model_field > value)
        elif operator == "gte":
            query = query.find(model_field >= value)
        elif operator == "lt":
            query = query.find(model_field < value)
        elif operator == "lte":
            query = query.find(model_field <= value)
        elif operator == "in":
            if isinstance(value, list):
                query = query.find(In(model_field, value))
            else:
                query = query.find(model_field == value)
        elif operator == "nin":
            if isinstance(value, list):
                query = query.find(NotIn(model_field, value))
            else:
                query = query.find(model_field != value)
        elif operator == "contains":
            # For string fields, use regex for case-insensitive contains
            query = query.find(Regex(model_field, f".*{value}.*", "i"))
        elif operator == "starts_with":
            query = query.find(Regex(model_field, f"^{value}.*", "i"))
        elif operator == "ends_with":
            query = query.find(Regex(model_field, f".*{value}$", "i"))
    
    return query


def apply_sort_to_query(
    query,
    sort_params: List[SortParam],
    model_class: type[Document],
    default_sort: Optional[Tuple[str, str]] = None
) -> Any:
    """
    Apply sorting to a Beanie query
    
    Args:
        query: Beanie query object
        sort_params: List of SortParam objects
        model_class: Beanie model class
        default_sort: Optional default sort tuple (field, direction)
        
    Returns:
        Modified query object
    """
    if not sort_params and default_sort:
        field, direction = default_sort
        if hasattr(model_class, field):
            model_field = getattr(model_class, field)
            if direction.lower() == "desc":
                query = query.sort(-model_field)
            else:
                query = query.sort(model_field)
        return query
    
    for sort_param in sort_params:
        field = sort_param.field
        direction = sort_param.direction.lower()
        
        if not hasattr(model_class, field):
            continue
        
        model_field = getattr(model_class, field)
        
        if direction == "desc":
            query = query.sort(-model_field)
        else:
            query = query.sort(model_field)
    
    return query


def create_error_response(
    code: str,
    message: str,
    error_type: str = "Error",
    details: Optional[List[Dict[str, Any]]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response
    
    Args:
        code: Error code (from ErrorCode enum)
        message: Error message
        error_type: Error type name
        details: Optional list of error details
        request_id: Optional request ID for tracking
        
    Returns:
        Dictionary representing error response
    """
    from datetime import datetime
    
    return {
        "error": {
            "code": code,
            "message": message,
            "type": error_type,
            "details": details or []
        },
        "timestamp": datetime.utcnow(),
        "request_id": request_id
    }


def create_success_response(
    data: Any = None,
    message: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        message: Optional success message
        meta: Optional metadata
        
    Returns:
        Dictionary representing success response
    """
    from datetime import datetime
    
    return {
        "data": data,
        "message": message,
        "meta": meta or {},
        "timestamp": datetime.utcnow()
    }


def create_paginated_response(
    items: List[Any],
    page: int,
    limit: int,
    total: int,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized paginated response
    
    Args:
        items: List of items for current page
        page: Current page number
        limit: Items per page
        total: Total number of items
        meta: Optional additional metadata
        
    Returns:
        Dictionary representing paginated response
    """
    pagination = create_pagination_meta(page, limit, total)
    
    return {
        "data": items,
        "pagination": pagination.model_dump(),
        "meta": meta or {}
    }

