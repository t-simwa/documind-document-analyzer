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


class DocumentUpdate(BaseModel):
    """Schema for updating a document"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    project_id: Optional[str] = Field(None, description="Project ID to assign document to (use null to remove from project)")


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


# Status, Reindex, and Share schemas
class ProcessingStepStatus(BaseModel):
    """Processing step status schema"""
    step: str  # upload, security_scan, extract, ocr, chunk, embed, index
    status: str  # pending, in_progress, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class DocumentStatusResponse(BaseModel):
    """Document processing status response schema"""
    document_id: str
    status: str  # processing, ready, error
    current_step: Optional[str] = None
    progress: float = Field(0.0, ge=0.0, le=100.0)  # Progress percentage (0-100)
    steps: List[ProcessingStepStatus] = []
    queue_position: Optional[int] = None
    error_message: Optional[str] = None
    updated_at: datetime


class ReindexRequest(BaseModel):
    """Request schema for document reindexing"""
    force: bool = Field(False, description="Force reindex even if document is already indexed")


class ReindexResponse(BaseModel):
    """Response schema for document reindexing"""
    document_id: str
    message: str
    status: str  # queued, processing, completed
    started_at: datetime


class CreateShareLinkRequest(BaseModel):
    """Request schema for creating a share link"""
    permission: str = Field("view", description="Permission level: view, comment, edit")
    access: str = Field("anyone", description="Access level: anyone, team, specific")
    allowed_users: Optional[List[str]] = Field(None, description="List of user IDs if access is 'specific'")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date for the share link")


class ShareLinkResponse(BaseModel):
    """Response schema for share link"""
    id: str
    document_id: str
    share_token: str
    share_url: str
    permission: str
    access: str
    allowed_users: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    created_by: str
    is_active: bool

