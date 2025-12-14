"""
Response formatting utilities
"""

import re
from typing import Dict, Any, Optional
import structlog

from .structured_output import GenerationResponse, Citation

logger = structlog.get_logger(__name__)


class ResponseFormatter:
    """Format generation responses with markdown and citations"""
    
    def __init__(self, citation_format: str = "[Citation: {index}]"):
        """
        Initialize response formatter
        
        Args:
            citation_format: Format string for citations
        """
        self.citation_format = citation_format
    
    def format_markdown(
        self,
        response: GenerationResponse,
        include_citations: bool = True,
        include_key_points: bool = True,
        include_entities: bool = False
    ) -> str:
        """
        Format response as markdown
        
        Args:
            response: Generation response
            include_citations: Whether to include citations section
            include_key_points: Whether to include key points section
            include_entities: Whether to include entities section
            
        Returns:
            Formatted markdown string
        """
        md_parts = []
        
        # Main answer
        md_parts.append(response.answer)
        
        # Citations section
        if include_citations and response.citations:
            md_parts.append("\n\n## Sources\n\n")
            for citation in response.citations:
                page_info = f", Page {citation.page}" if citation.page else ""
                doc_name = citation.metadata.get("document_name", citation.document_id)
                md_parts.append(
                    f"- **[{self.citation_format.format(index=citation.index)}]** "
                    f"{doc_name}{page_info}\n"
                )
        
        # Key points section
        if include_key_points and response.key_points:
            md_parts.append("\n\n## Key Points\n\n")
            for point in response.key_points:
                md_parts.append(f"- {point.text}\n")
        
        # Entities section
        if include_entities and response.entities:
            md_parts.append("\n\n## Extracted Entities\n\n")
            # Group entities by type
            entities_by_type: Dict[str, list] = {}
            for entity in response.entities:
                if entity.type not in entities_by_type:
                    entities_by_type[entity.type] = []
                entities_by_type[entity.type].append(entity)
            
            for entity_type, entities in entities_by_type.items():
                md_parts.append(f"### {entity_type.title()}\n\n")
                for entity in entities:
                    md_parts.append(f"- {entity.text}\n")
                md_parts.append("\n")
        
        return "".join(md_parts).strip()
    
    def format_citations_inline(
        self,
        text: str,
        citations: list[Citation]
    ) -> str:
        """
        Format citations inline in text
        
        Args:
            text: Text with citation markers
            citations: List of citations
            
        Returns:
            Text with formatted citations
        """
        # Find all citation markers
        pattern = r'\[Citation:\s*(\d+)\]'
        
        def replace_citation(match):
            index = int(match.group(1))
            citation = next((c for c in citations if c.index == index), None)
            if citation:
                page_info = f", p. {citation.page}" if citation.page else ""
                return f"[{index}]{page_info}"
            return match.group(0)
        
        return re.sub(pattern, replace_citation, text, flags=re.IGNORECASE)
    
    def extract_structured_data(
        self,
        response: GenerationResponse
    ) -> Dict[str, Any]:
        """
        Extract structured data from response
        
        Args:
            response: Generation response
            
        Returns:
            Dictionary with structured data
        """
        return {
            "answer": response.answer,
            "citations": [
                {
                    "index": c.index,
                    "document_id": c.document_id,
                    "page": c.page,
                    "score": c.score
                }
                for c in response.citations
            ],
            "key_points": [
                {
                    "text": kp.text,
                    "importance": kp.importance,
                    "citations": kp.citations
                }
                for kp in response.key_points
            ],
            "entities": [
                {
                    "text": e.text,
                    "type": e.type,
                    "value": e.value
                }
                for e in response.entities
            ],
            "confidence": response.confidence,
            "metadata": response.metadata
        }
    
    def manage_response_length(
        self,
        text: str,
        max_length: int = 5000,
        truncate_at: str = "sentence"
    ) -> str:
        """
        Manage response length by truncating if needed
        
        Args:
            text: Text to truncate
            max_length: Maximum length in characters
            truncate_at: Where to truncate ("sentence", "word", "character")
            
        Returns:
            Truncated text
        """
        if len(text) <= max_length:
            return text
        
        if truncate_at == "character":
            return text[:max_length] + "..."
        elif truncate_at == "word":
            words = text[:max_length].split()
            return " ".join(words[:-1]) + "..."
        elif truncate_at == "sentence":
            # Try to truncate at sentence boundary
            truncated = text[:max_length]
            # Find last sentence ending
            last_period = truncated.rfind(".")
            last_exclamation = truncated.rfind("!")
            last_question = truncated.rfind("?")
            last_sentence_end = max(last_period, last_exclamation, last_question)
            
            if last_sentence_end > max_length * 0.8:  # If sentence end is reasonably close
                return truncated[:last_sentence_end + 1]
            else:
                return truncated + "..."
        else:
            return text[:max_length] + "..."

