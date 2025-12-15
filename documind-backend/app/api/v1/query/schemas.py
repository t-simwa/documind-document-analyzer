"""
Query API schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class QueryRequest(BaseModel):
    """Request schema for query endpoint"""
    query: str = Field(..., description="User query/question", min_length=1)
    collection_name: str = Field(..., description="Collection name to search")
    document_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to limit search")
    generate_insights: bool = Field(False, description="Whether to generate additional insights")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous conversation messages")
    
    # Retrieval configuration
    top_k: Optional[int] = Field(None, description="Number of documents to retrieve")
    search_type: Optional[str] = Field(None, description="Search type: vector, keyword, hybrid")
    rerank_enabled: Optional[bool] = Field(None, description="Enable re-ranking")
    
    # LLM configuration
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="LLM temperature")
    max_tokens: Optional[int] = Field(None, ge=1, description="Maximum tokens in response")


class CitationResponse(BaseModel):
    """Citation response schema"""
    index: int
    document_id: str
    chunk_id: str
    page: Optional[int] = None
    score: float
    metadata: Dict[str, Any] = {}


class KeyPointResponse(BaseModel):
    """Key point response schema"""
    text: str
    importance: float
    citations: List[int] = []


class EntityResponse(BaseModel):
    """Entity response schema"""
    text: str
    type: str
    value: Optional[Any] = None
    citations: List[int] = []


class QueryResponse(BaseModel):
    """Response schema for query endpoint"""
    answer: str
    citations: List[CitationResponse] = []
    confidence: float
    key_points: List[KeyPointResponse] = []
    entities: List[EntityResponse] = []
    patterns: Optional[List[DocumentPatternResponse]] = None  # For cross-document queries
    contradictions: Optional[List[DocumentContradictionResponse]] = None  # For cross-document queries
    model: str
    provider: str
    usage: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    generated_at: datetime


class QueryHistoryItem(BaseModel):
    """Query history item schema"""
    id: str
    query: str
    answer: str
    collection_name: str
    document_ids: List[str] = []
    created_at: datetime
    metadata: Dict[str, Any] = {}


class QueryHistoryResponse(BaseModel):
    """Query history response schema"""
    items: List[QueryHistoryItem]
    total: int


# Cross-Document Analysis Schemas
class PatternExampleResponse(BaseModel):
    """Pattern example response schema"""
    document_id: str
    document_name: str
    text: str
    page: Optional[int] = None


class DocumentPatternResponse(BaseModel):
    """Document pattern response schema"""
    type: str  # "theme", "entity", "trend", "relationship"
    description: str
    documents: List[str]  # document IDs
    occurrences: int
    examples: List[PatternExampleResponse] = []
    confidence: float  # 0-1


class ContradictionDocumentResponse(BaseModel):
    """Contradiction document claim schema"""
    id: str
    name: str
    claim: str
    page: Optional[int] = None
    section: Optional[str] = None


class DocumentContradictionResponse(BaseModel):
    """Document contradiction response schema"""
    type: str  # "factual", "temporal", "quantitative", "categorical"
    description: str
    documents: List[ContradictionDocumentResponse]
    severity: str  # "low", "medium", "high"
    confidence: float  # 0-1
