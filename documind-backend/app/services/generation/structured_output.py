"""
Structured output schemas for generation responses
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from datetime import datetime


class InsightType(str, Enum):
    """Types of insights that can be generated"""
    SUMMARY = "summary"
    ENTITIES = "entities"
    KEY_POINTS = "key_points"
    SUGGESTED_QUESTIONS = "suggested_questions"


class Citation(BaseModel):
    """Citation reference to source document/chunk"""
    index: int = Field(..., description="Citation index number")
    document_id: str = Field(..., description="Source document ID")
    chunk_id: str = Field(..., description="Source chunk ID")
    page: Optional[int] = Field(None, description="Page number if available")
    score: float = Field(0.0, description="Relevance score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @field_validator("index")
    @classmethod
    def validate_index(cls, v):
        if v < 1:
            raise ValueError("Citation index must be >= 1")
        return v
    
    @field_validator("score")
    @classmethod
    def validate_score(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Score must be between 0.0 and 1.0")
        return v


class KeyPoint(BaseModel):
    """Key point extracted from document"""
    text: str = Field(..., description="Key point text")
    importance: float = Field(0.5, ge=0.0, le=1.0, description="Importance score (0-1)")
    citations: List[int] = Field(default_factory=list, description="Citation indices")
    
    @field_validator("citations")
    @classmethod
    def validate_citations(cls, v):
        if not all(isinstance(c, int) and c >= 1 for c in v):
            raise ValueError("All citation indices must be integers >= 1")
        return v


class Entity(BaseModel):
    """Named entity extracted from document"""
    text: str = Field(..., description="Entity text")
    type: str = Field(..., description="Entity type (person, organization, date, location, etc.)")
    value: Optional[Any] = Field(None, description="Parsed value (e.g., date object, monetary value)")
    citations: List[int] = Field(default_factory=list, description="Citation indices where entity appears")
    
    @field_validator("citations")
    @classmethod
    def validate_citations(cls, v):
        if not all(isinstance(c, int) and c >= 1 for c in v):
            raise ValueError("All citation indices must be integers >= 1")
        return v


class GenerationResponse(BaseModel):
    """Structured response from generation service"""
    answer: str = Field(..., description="Generated answer text")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    confidence: float = Field(0.5, ge=0.0, le=1.0, description="Confidence score (0-1)")
    key_points: List[KeyPoint] = Field(default_factory=list, description="Extracted key points")
    entities: List[Entity] = Field(default_factory=list, description="Extracted entities")
    model: str = Field(..., description="LLM model used")
    provider: str = Field(..., description="LLM provider used")
    usage: Dict[str, Any] = Field(default_factory=dict, description="Token usage information")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Generation timestamp")
    
    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v):
        if not v or not v.strip():
            raise ValueError("Answer cannot be empty")
        return v.strip()
    
    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Confidence must be between 0.0 and 1.0")
        return v
    
    def get_citation_by_index(self, index: int) -> Optional[Citation]:
        """Get citation by index number"""
        for citation in self.citations:
            if citation.index == index:
                return citation
        return None
    
    def has_citations(self) -> bool:
        """Check if response has citations"""
        return len(self.citations) > 0
    
    def get_citation_count(self) -> int:
        """Get number of citations"""
        return len(self.citations)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return self.model_dump()
    
    def to_markdown(self) -> str:
        """Convert to markdown format"""
        md = f"{self.answer}\n\n"
        
        if self.citations:
            md += "## Sources\n\n"
            for citation in self.citations:
                page_info = f", Page {citation.page}" if citation.page else ""
                md += f"- [Citation {citation.index}] Document: {citation.document_id}{page_info}\n"
        
        if self.key_points:
            md += "\n## Key Points\n\n"
            for point in self.key_points:
                md += f"- {point.text}\n"
        
        return md

