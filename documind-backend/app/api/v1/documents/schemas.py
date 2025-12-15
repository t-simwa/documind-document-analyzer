"""
Document API schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload"""
    id: str
    name: str
    status: str
    uploaded_at: datetime
    size: int
    type: str
    project_id: Optional[str] = None
    metadata: Dict[str, Any] = {}


class DocumentResponse(BaseModel):
    """Document response schema"""
    id: str
    name: str
    status: str
    uploaded_at: datetime
    uploaded_by: str
    size: int
    type: str
    project_id: Optional[str] = None
    tags: list = []
    metadata: Dict[str, Any] = {}


# Insights schemas
class DocumentSummaryResponse(BaseModel):
    """Document summary response schema"""
    executiveSummary: str
    keyPoints: List[str]
    generatedAt: datetime


class EntityResponse(BaseModel):
    """Entity response schema"""
    text: str
    context: Optional[str] = None
    page: Optional[int] = None
    count: Optional[int] = None


class MonetaryEntityResponse(EntityResponse):
    """Monetary entity response schema"""
    value: float
    currency: str
    formatted: str


class DocumentEntitiesResponse(BaseModel):
    """Document entities response schema"""
    organizations: List[EntityResponse] = []
    people: List[EntityResponse] = []
    dates: List[EntityResponse] = []
    monetaryValues: List[MonetaryEntityResponse] = []
    locations: Optional[List[EntityResponse]] = []


class DocumentInsightsResponse(BaseModel):
    """Document insights response schema"""
    summary: DocumentSummaryResponse
    entities: DocumentEntitiesResponse
    suggestedQuestions: List[str] = []


# Comparison schemas
class ComparisonExampleResponse(BaseModel):
    """Comparison example response schema"""
    documentId: str
    documentName: str
    text: str
    page: Optional[int] = None


class ComparisonSimilarityResponse(BaseModel):
    """Comparison similarity response schema"""
    aspect: str
    description: str
    documents: List[str]  # document IDs
    examples: List[ComparisonExampleResponse] = []


class ComparisonDifferenceDocumentResponse(BaseModel):
    """Comparison difference document response schema"""
    id: str
    name: str
    value: str
    page: Optional[int] = None


class ComparisonDifferenceResponse(BaseModel):
    """Comparison difference response schema"""
    aspect: str
    description: str
    documents: List[ComparisonDifferenceDocumentResponse]


class DocumentComparisonResponse(BaseModel):
    """Document comparison response schema"""
    documentIds: List[str]
    similarities: List[ComparisonSimilarityResponse] = []
    differences: List[ComparisonDifferenceResponse] = []
    generatedAt: datetime

