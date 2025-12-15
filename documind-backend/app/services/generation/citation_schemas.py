"""
Pydantic models for structured citation extraction using Gemini Structured Outputs
These models define the JSON schema for reliable citation extraction
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class CitationReference(BaseModel):
    """Reference to a citation in the answer"""
    citation_index: int = Field(
        description="The citation number referenced in the answer (e.g., 1, 2, 3)"
    )
    text_excerpt: Optional[str] = Field(
        default=None,
        description="The specific text excerpt from the answer that uses this citation"
    )


class StructuredAnswer(BaseModel):
    """
    Structured answer with citations extracted using Gemini Structured Outputs
    
    This model ensures reliable citation extraction by constraining the LLM
    to return citations in a structured JSON format.
    """
    answer: str = Field(
        description="The complete answer to the user's question. Include inline citation markers like [Citation: 1] where appropriate."
    )
    citations_used: List[CitationReference] = Field(
        default_factory=list,
        description="List of all citation indices that were referenced in the answer. Each citation should correspond to a context chunk."
    )
    confidence_level: Optional[str] = Field(
        default=None,
        description="Confidence level: 'high' if answer is well-supported, 'medium' if partially supported, 'low' if limited support"
    )

