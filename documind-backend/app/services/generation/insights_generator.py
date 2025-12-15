"""
Pre-built insights generation service
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog

from app.services.llm import LLMService, LLMConfig
from .structured_output import Entity, KeyPoint, InsightType
from .prompt_engine import ContextChunk

logger = structlog.get_logger(__name__)


class InsightsGenerator:
    """Generate pre-built insights from documents"""
    
    def __init__(self, llm_service: LLMService):
        """
        Initialize insights generator
        
        Args:
            llm_service: LLM service instance
        """
        self.llm_service = llm_service
    
    async def generate_summary(
        self,
        chunks: List[ContextChunk],
        max_length: int = 500
    ) -> str:
        """
        Generate automatic summary from document chunks
        
        Args:
            chunks: Document chunks to summarize
            max_length: Maximum summary length in words
            
        Returns:
            Generated summary text
        """
        # Combine chunk content
        content = "\n\n".join([chunk.content for chunk in chunks])
        
        system_prompt = """You are an expert at summarizing documents. Create a concise, informative summary that captures the main points and key information."""
        
        user_prompt = f"""Please provide a comprehensive summary of the following document content in approximately {max_length} words:

{content[:10000]}  # Limit content to avoid token limits

Summary:"""
        
        try:
            config = LLMConfig(
                temperature=0.3,  # Lower temperature for more factual summaries
                max_tokens=min(max_length * 2, 1000)
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            return response.content.strip()
        except Exception as e:
            logger.error("Error generating summary", error=str(e))
            # Fallback: simple extraction
            sentences = content.split(". ")[:5]
            return ". ".join(sentences) + "."
    
    async def extract_entities(
        self,
        chunks: List[ContextChunk]
    ) -> List[Entity]:
        """
        Extract entities (organizations, people, dates, monetary values) from chunks
        
        Args:
            chunks: Document chunks to extract entities from
            
        Returns:
            List of extracted entities
        """
        # Build content with chunk markers for citation tracking
        content_parts = []
        for i, chunk in enumerate(chunks):
            content_parts.append(f"[Chunk {i+1}]\n{chunk.content}")
        
        content = "\n\n".join(content_parts)
        
        system_prompt = """You are an expert at extracting named entities from documents. Extract all important entities including:
- Organizations and companies
- People and names
- Dates and time periods
- Monetary values and amounts
- Locations and places

For each entity, identify which chunk(s) it appears in. Return entities in a structured format."""
        
        # Increase content limit significantly for comprehensive extraction
        # Process in batches if content is very long
        content_limit = 50000  # Increased from 12000 to capture more content
        content_to_process = content[:content_limit] if len(content) <= content_limit else content
        
        # If content is very long, we'll process it but the LLM will still get a substantial amount
        user_prompt = f"""Extract ALL entities from the following document content. Each section is marked with [Chunk N] to indicate its source.

IMPORTANT: Extract EVERY entity you find, not just a few. Be thorough and comprehensive.

{content_to_process}

Please identify and list ALL entities in this format:
[ORGANIZATION] Entity Name (appears in Chunk N)
[PERSON] Person Name (appears in Chunk N)
[DATE] Date Value (appears in Chunk N)
[MONETARY] Amount Value (appears in Chunk N)
[LOCATION] Location Name (appears in Chunk N)

Extract ALL unique entities found throughout the entire document. Include:
- All organization names, companies, institutions
- All person names, individuals mentioned
- All dates, deadlines, time periods
- All monetary values, amounts, financial figures
- All locations, places, addresses, cities, countries

List every entity you can find, even if it appears multiple times."""
        
        try:
            config = LLMConfig(
                temperature=0.2,  # Very low temperature for factual extraction
                max_tokens=8000  # Significantly increased to capture all entities
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse entities from response and map to chunks
            entities = self._parse_entities_from_response(response.content, chunks)
            return entities
        except Exception as e:
            logger.error("Error extracting entities", error=str(e))
            # Fallback: simple regex-based extraction
            content_plain = "\n\n".join([chunk.content for chunk in chunks])
            return self._extract_entities_simple(content_plain, chunks)
    
    def _parse_entities_from_response(
        self,
        response_text: str,
        chunks: List[ContextChunk]
    ) -> List[Entity]:
        """Parse entities from LLM response and map to chunks"""
        entities = []
        entity_type_map = {
            "organization": "organization",
            "person": "person",
            "people": "person",
            "date": "date",
            "monetary": "monetary",
            "money": "monetary",
            "location": "location",
            "place": "location"
        }
        
        lines = response_text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to match format: [TYPE] Entity Name (appears in Chunk N) or [TYPE] Entity Name (Value)
            # Pattern 1: [TYPE] Entity Name (appears in Chunk N)
            chunk_match = re.search(r'\[([A-Z]+)\]\s*(.+?)\s*\(appears?\s+in\s+Chunk\s+(\d+)\)', line, re.IGNORECASE)
            if chunk_match:
                entity_type_str = chunk_match.group(1).lower()
                entity_text = chunk_match.group(2).strip()
                chunk_num = int(chunk_match.group(3))
                
                # Map entity type
                entity_type = entity_type_map.get(entity_type_str, "other")
                
                # Find which chunks contain this entity
                citations = []
                if 1 <= chunk_num <= len(chunks):
                    citations.append(chunk_num)
                    # Also search other chunks for the same entity
                    entity_lower = entity_text.lower()
                    for i, chunk in enumerate(chunks):
                        if i + 1 != chunk_num and entity_lower in chunk.content.lower():
                            citations.append(i + 1)
                
                entities.append(Entity(
                    text=entity_text,
                    type=entity_type,
                    value=self._parse_value(entity_text, entity_type),
                    citations=citations if citations else [chunk_num] if 1 <= chunk_num <= len(chunks) else []
                ))
                continue
            
            # Pattern 2: [TYPE] Entity Name (Value)
            value_match = re.search(r'\[([A-Z]+)\]\s*(.+?)\s*\((.+?)\)', line)
            if value_match:
                entity_type_str = value_match.group(1).lower()
                entity_text = value_match.group(2).strip()
                value_str = value_match.group(3).strip()
                
                entity_type = entity_type_map.get(entity_type_str, "other")
                
                # Find chunks containing this entity
                citations = []
                entity_lower = entity_text.lower()
                for i, chunk in enumerate(chunks):
                    if entity_lower in chunk.content.lower():
                        citations.append(i + 1)
                
                entities.append(Entity(
                    text=entity_text,
                    type=entity_type,
                    value=self._parse_value(value_str, entity_type),
                    citations=citations if citations else []
                ))
                continue
            
            # Pattern 3: [TYPE] Entity Name (simple format)
            simple_match = re.search(r'\[([A-Z]+)\]\s*(.+?)(?:\s*$|\s*\()', line)
            if simple_match:
                entity_type_str = simple_match.group(1).lower()
                entity_text = simple_match.group(2).strip()
                
                entity_type = entity_type_map.get(entity_type_str, "other")
                
                # Find chunks containing this entity
                citations = []
                entity_lower = entity_text.lower()
                for i, chunk in enumerate(chunks):
                    if entity_lower in chunk.content.lower():
                        citations.append(i + 1)
                
                entities.append(Entity(
                    text=entity_text,
                    type=entity_type,
                    value=self._parse_value(entity_text, entity_type),
                    citations=citations if citations else []
                ))
                continue
            
            # Pattern 4: TYPE: Entity Name
            colon_match = re.search(r'^([A-Z]+):\s*(.+?)$', line)
            if colon_match:
                entity_type_str = colon_match.group(1).lower()
                entity_text = colon_match.group(2).strip()
                
                entity_type = entity_type_map.get(entity_type_str, "other")
                
                # Find chunks containing this entity
                citations = []
                entity_lower = entity_text.lower()
                for i, chunk in enumerate(chunks):
                    if entity_lower in chunk.content.lower():
                        citations.append(i + 1)
                
                if entity_text:
                    entities.append(Entity(
                        text=entity_text,
                        type=entity_type,
                        value=None,
                        citations=citations if citations else []
                    ))
        
        return entities
    
    def _parse_value(self, value_str: str, entity_type: Optional[str]) -> Any:
        """Parse entity value based on type"""
        if entity_type == "date":
            # Return date string as-is
            return value_str
        elif entity_type == "monetary":
            # Try to parse monetary value - extract number and currency
            # Remove currency symbols and commas, extract numeric value
            cleaned = value_str.replace(',', '').replace('$', '').replace('€', '').replace('£', '').strip()
            match = re.search(r'[\d]+\.?\d*', cleaned)
            if match:
                try:
                    return float(match.group(0))
                except ValueError:
                    return value_str
            return value_str
        else:
            return value_str
    
    def _extract_entities_simple(
        self,
        content: str,
        chunks: List[ContextChunk]
    ) -> List[Entity]:
        """Simple regex-based entity extraction as fallback"""
        entities = []
        
        # Extract dates (simple pattern)
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        dates = re.findall(date_pattern, content)
        for date in set(dates):
            # Find chunks containing this date
            citations = []
            for i, chunk in enumerate(chunks):
                if date in chunk.content:
                    citations.append(i + 1)
            
            entities.append(Entity(
                text=date,
                type="date",
                value=date,
                citations=citations if citations else []
            ))
        
        # Extract monetary values
        money_pattern = r'\$[\d,]+\.?\d*'
        money_values = re.findall(money_pattern, content)
        for money in set(money_values):
            # Find chunks containing this monetary value
            citations = []
            for i, chunk in enumerate(chunks):
                if money in chunk.content:
                    citations.append(i + 1)
            
            # Parse numeric value
            numeric_value = 0.0
            cleaned = money.replace(',', '').replace('$', '').strip()
            match = re.search(r'[\d]+\.?\d*', cleaned)
            if match:
                try:
                    numeric_value = float(match.group(0))
                except ValueError:
                    pass
            
            entities.append(Entity(
                text=money,
                type="monetary",
                value=numeric_value if numeric_value > 0 else money,
                citations=citations if citations else []
            ))
        
        return entities
    
    async def generate_key_points(
        self,
        chunks: List[ContextChunk],
        max_points: int = 5
    ) -> List[KeyPoint]:
        """
        Extract key points from document chunks
        
        Args:
            chunks: Document chunks
            max_points: Maximum number of key points
            
        Returns:
            List of key points
        """
        content = "\n\n".join([chunk.content for chunk in chunks])
        
        system_prompt = """You are an expert at identifying key points and main ideas from documents. Extract the most important points that summarize the document's main content."""
        
        user_prompt = f"""Extract the top {max_points} key points from the following document content:

{content[:8000]}

List each key point on a separate line, numbered 1-{max_points}."""
        
        try:
            config = LLMConfig(
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse key points from response
            key_points = self._parse_key_points_from_response(response.content)
            return key_points[:max_points]
        except Exception as e:
            logger.error("Error generating key points", error=str(e))
            # Fallback: extract first sentences from chunks
            return [
                KeyPoint(
                    text=chunk.content.split(". ")[0] + "." if ". " in chunk.content else chunk.content[:100],
                    importance=0.5,
                    citations=[i + 1]
                )
                for i, chunk in enumerate(chunks[:max_points])
            ]
    
    def _parse_key_points_from_response(self, response_text: str) -> List[KeyPoint]:
        """Parse key points from LLM response"""
        key_points = []
        lines = response_text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove numbering (1., 2., etc.)
            line = re.sub(r'^\d+[\.\)]\s*', '', line)
            if line:
                # Simple importance scoring (can be enhanced)
                importance = 0.7 if line.startswith(("*", "-", "•")) else 0.5
                key_points.append(KeyPoint(
                    text=line,
                    importance=importance,
                    citations=[]
                ))
        
        return key_points
    
    async def generate_suggested_questions(
        self,
        chunks: List[ContextChunk],
        max_questions: int = 5
    ) -> List[str]:
        """
        Generate suggested questions based on document content
        
        Args:
            chunks: Document chunks
            max_questions: Maximum number of questions
            
        Returns:
            List of suggested questions
        """
        content = "\n\n".join([chunk.content for chunk in chunks])
        
        system_prompt = """You are an expert at generating insightful questions about documents. Create questions that would help users explore and understand the document content better."""
        
        user_prompt = f"""Based on the following document content, generate {max_questions} insightful questions that users might want to ask:

{content[:8000]}

Generate questions that:
1. Explore key topics and themes
2. Ask about specific details or facts
3. Seek clarification on complex concepts
4. Compare or analyze different aspects

List each question on a separate line, numbered 1-{max_questions}."""
        
        try:
            config = LLMConfig(
                temperature=0.7,  # Higher temperature for more creative questions
                max_tokens=500
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse questions from response
            questions = self._parse_questions_from_response(response.content)
            return questions[:max_questions]
        except Exception as e:
            logger.error("Error generating suggested questions", error=str(e))
            # Fallback: generic questions
            return [
                "What is the main topic of this document?",
                "What are the key findings?",
                "What are the main conclusions?",
                "What are the important dates mentioned?",
                "Who are the key people or organizations mentioned?"
            ][:max_questions]
    
    def _parse_questions_from_response(self, response_text: str) -> List[str]:
        """Parse questions from LLM response"""
        questions = []
        lines = response_text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove numbering
            line = re.sub(r'^\d+[\.\)]\s*', '', line)
            # Remove question mark if at start (some formats)
            line = re.sub(r'^[Qq]:\s*', '', line)
            
            if line and line.endswith("?"):
                questions.append(line)
            elif line and not line.endswith("."):
                # Assume it's a question if it doesn't end with period
                questions.append(line + "?")
        
        return questions

