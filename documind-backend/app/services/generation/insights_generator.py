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
        content = "\n\n".join([chunk.content for chunk in chunks])
        
        system_prompt = """You are an expert at extracting named entities from documents. Extract all important entities including:
- Organizations and companies
- People and names
- Dates and time periods
- Monetary values and amounts
- Locations and places
- Technical terms and concepts

Return the entities in a structured format."""
        
        user_prompt = f"""Extract all important entities from the following document content:

{content[:8000]}

Please identify and list:
1. Organizations/Companies
2. People/Names
3. Dates
4. Monetary values
5. Locations
6. Other important entities

Format: For each entity, provide: [TYPE] Entity Name (Value if applicable)"""
        
        try:
            config = LLMConfig(
                temperature=0.2,  # Very low temperature for factual extraction
                max_tokens=2000
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse entities from response
            entities = self._parse_entities_from_response(response.content, chunks)
            return entities
        except Exception as e:
            logger.error("Error extracting entities", error=str(e))
            # Fallback: simple regex-based extraction
            return self._extract_entities_simple(content, chunks)
    
    def _parse_entities_from_response(
        self,
        response_text: str,
        chunks: List[ContextChunk]
    ) -> List[Entity]:
        """Parse entities from LLM response"""
        entities = []
        entity_types = {
            "organization": ["organization", "company", "org"],
            "person": ["person", "people", "name"],
            "date": ["date", "time"],
            "monetary": ["monetary", "money", "amount", "currency"],
            "location": ["location", "place"],
        }
        
        lines = response_text.split("\n")
        current_type = None
        
        for line in lines:
            line_lower = line.lower()
            
            # Detect entity type
            for entity_type, keywords in entity_types.items():
                if any(keyword in line_lower for keyword in keywords):
                    current_type = entity_type
                    break
            
            # Extract entity text
            if "]" in line and "(" in line:
                # Format: [TYPE] Entity Name (Value)
                match = re.search(r'\[.*?\]\s*(.+?)\s*\((.+?)\)', line)
                if match:
                    text = match.group(1).strip()
                    value = match.group(2).strip()
                    entities.append(Entity(
                        text=text,
                        type=current_type or "other",
                        value=self._parse_value(value, current_type),
                        citations=[]
                    ))
            elif ":" in line:
                # Format: TYPE: Entity Name
                parts = line.split(":", 1)
                if len(parts) == 2:
                    text = parts[1].strip()
                    if text:
                        entities.append(Entity(
                            text=text,
                            type=current_type or "other",
                            value=None,
                            citations=[]
                        ))
        
        return entities
    
    def _parse_value(self, value_str: str, entity_type: Optional[str]) -> Any:
        """Parse entity value based on type"""
        if entity_type == "date":
            # Try to parse date
            try:
                # Simple date parsing (can be enhanced)
                return value_str
            except:
                return value_str
        elif entity_type == "monetary":
            # Try to parse monetary value
            match = re.search(r'[\d,]+\.?\d*', value_str)
            if match:
                return match.group(0)
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
            entities.append(Entity(
                text=date,
                type="date",
                value=date,
                citations=[]
            ))
        
        # Extract monetary values
        money_pattern = r'\$[\d,]+\.?\d*'
        money_values = re.findall(money_pattern, content)
        for money in set(money_values):
            entities.append(Entity(
                text=money,
                type="monetary",
                value=money,
                citations=[]
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

