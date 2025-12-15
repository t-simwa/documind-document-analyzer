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
    
    async def generate_comparison(
        self,
        chunks_by_document: Dict[str, List[ContextChunk]],
        document_name_map: Dict[str, str],
        max_similarities: int = 5,
        max_differences: int = 5
    ) -> Dict[str, Any]:
        """
        Generate comparison analysis (similarities and differences) across multiple documents
        
        Args:
            chunks_by_document: Dictionary mapping document IDs to their chunks
            document_name_map: Dictionary mapping document IDs to document names
            max_similarities: Maximum number of similarities to generate
            max_differences: Maximum number of differences to generate
            
        Returns:
            Dictionary with 'similarities' and 'differences' lists
        """
        # Combine all chunks with document context
        all_chunks_with_doc = []
        for doc_id, chunks in chunks_by_document.items():
            for chunk in chunks:
                all_chunks_with_doc.append({
                    "document_id": doc_id,
                    "document_name": document_name_map.get(doc_id, doc_id),
                    "chunk": chunk
                })
        
        # Generate similarities
        similarities = await self._generate_similarities(
            chunks_by_document,
            document_name_map,
            max_similarities
        )
        
        # Generate differences
        differences = await self._generate_differences(
            chunks_by_document,
            document_name_map,
            max_differences
        )
        
        return {
            "similarities": similarities,
            "differences": differences
        }
    
    async def _generate_similarities(
        self,
        chunks_by_document: Dict[str, List[ContextChunk]],
        document_name_map: Dict[str, str],
        max_similarities: int
    ) -> List[Dict[str, Any]]:
        """Generate similarities across documents"""
        # Prepare content for each document
        doc_contents = {}
        for doc_id, chunks in chunks_by_document.items():
            doc_name = document_name_map.get(doc_id, doc_id)
            content = "\n\n".join([chunk.content for chunk in chunks])
            doc_contents[doc_id] = {
                "name": doc_name,
                "content": content[:15000]  # Limit content size
            }
        
        # Build prompt
        system_prompt = """You are an expert at analyzing documents and identifying similarities across multiple documents. Focus on common themes, shared concepts, similar approaches, and overlapping information."""
        
        content_sections = []
        for doc_id, doc_data in doc_contents.items():
            content_sections.append(f"Document: {doc_data['name']} (ID: {doc_id})\n{doc_data['content']}\n")
        
        user_prompt = f"""Analyze the following documents and identify {max_similarities} key similarities across them.

{''.join(content_sections)}

For each similarity, provide:
1. Aspect: A brief name for the similarity (e.g., "Strategic Focus", "Key Stakeholders")
2. Description: A detailed description of the similarity
3. Documents: List of document IDs where this similarity appears
4. Examples: Specific examples from each document with page numbers if available

Format your response as:
SIMILARITY 1:
Aspect: [aspect name]
Description: [description]
Documents: [comma-separated document IDs]
Examples:
- Document [name]: [example text] (Page: [page number if available])
- Document [name]: [example text] (Page: [page number if available])

SIMILARITY 2:
...

Generate {max_similarities} similarities."""
        
        try:
            config = LLMConfig(
                temperature=0.3,
                max_tokens=4000
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            return self._parse_similarities_from_response(
                response.content,
                list(chunks_by_document.keys()),
                document_name_map,
                chunks_by_document
            )
        except Exception as e:
            logger.error("Error generating similarities", error=str(e))
            return []
    
    async def _generate_differences(
        self,
        chunks_by_document: Dict[str, List[ContextChunk]],
        document_name_map: Dict[str, str],
        max_differences: int
    ) -> List[Dict[str, Any]]:
        """Generate differences across documents"""
        # Prepare content for each document
        doc_contents = {}
        for doc_id, chunks in chunks_by_document.items():
            doc_name = document_name_map.get(doc_id, doc_id)
            content = "\n\n".join([chunk.content for chunk in chunks])
            doc_contents[doc_id] = {
                "name": doc_name,
                "content": content[:15000]  # Limit content size
            }
        
        # Build prompt
        system_prompt = """You are an expert at analyzing documents and identifying differences across multiple documents. Focus on contrasting information, different approaches, varying values, and conflicting details."""
        
        content_sections = []
        for doc_id, doc_data in doc_contents.items():
            content_sections.append(f"Document: {doc_data['name']} (ID: {doc_id})\n{doc_data['content']}\n")
        
        user_prompt = f"""Analyze the following documents and identify {max_differences} key differences between them.

{''.join(content_sections)}

For each difference, provide:
1. Aspect: A brief name for the difference (e.g., "Timeline", "Budget Allocation")
2. Description: A detailed description of the difference
3. Documents: For each document, provide the specific value or claim with page number if available

Format your response as:
DIFFERENCE 1:
Aspect: [aspect name]
Description: [description]
Documents:
- Document [name] (ID: [id]): [specific value/claim] (Page: [page number if available])
- Document [name] (ID: [id]): [specific value/claim] (Page: [page number if available])

DIFFERENCE 2:
...

Generate {max_differences} differences."""
        
        try:
            config = LLMConfig(
                temperature=0.3,
                max_tokens=4000
            )
            
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            return self._parse_differences_from_response(
                response.content,
                list(chunks_by_document.keys()),
                document_name_map,
                chunks_by_document
            )
        except Exception as e:
            logger.error("Error generating differences", error=str(e))
            return []
    
    def _parse_similarities_from_response(
        self,
        response_text: str,
        document_ids: List[str],
        document_name_map: Dict[str, str],
        chunks_by_document: Dict[str, List[ContextChunk]]
    ) -> List[Dict[str, Any]]:
        """Parse similarities from LLM response"""
        similarities = []
        
        # Split by "SIMILARITY" markers
        similarity_sections = re.split(r'SIMILARITY\s+\d+:', response_text, flags=re.IGNORECASE)
        
        for section in similarity_sections[1:]:  # Skip first empty section
            aspect_match = re.search(r'Aspect:\s*(.+?)(?:\n|$)', section, re.IGNORECASE)
            description_match = re.search(r'Description:\s*(.+?)(?:\n(?:Documents|Examples):|$)', section, re.IGNORECASE | re.DOTALL)
            documents_match = re.search(r'Documents:\s*(.+?)(?:\nExamples:|$)', section, re.IGNORECASE)
            
            if not aspect_match or not description_match:
                continue
            
            aspect = aspect_match.group(1).strip()
            description = description_match.group(1).strip()
            
            # Extract document IDs
            doc_ids_found = []
            if documents_match:
                doc_ids_str = documents_match.group(1).strip()
                # Try to find document IDs in the string
                for doc_id in document_ids:
                    if doc_id in doc_ids_str:
                        doc_ids_found.append(doc_id)
            
            # If no specific IDs found, use all documents
            if not doc_ids_found:
                doc_ids_found = document_ids.copy()
            
            # Extract examples
            examples = []
            example_lines = re.findall(r'-\s*Document\s+([^:]+):\s*(.+?)(?:\s*\(Page:\s*(\d+)\)|$)', section, re.IGNORECASE)
            for doc_name, text, page in example_lines:
                # Find document ID by name
                doc_id = None
                for d_id, d_name in document_name_map.items():
                    if d_name.strip() == doc_name.strip():
                        doc_id = d_id
                        break
                
                if not doc_id:
                    # Try to match by partial name
                    for d_id, d_name in document_name_map.items():
                        if doc_name.strip() in d_name or d_name in doc_name.strip():
                            doc_id = d_id
                            break
                
                if doc_id:
                    examples.append({
                        "document_id": doc_id,
                        "document_name": document_name_map.get(doc_id, doc_id),
                        "text": text.strip(),
                        "page": int(page) if page else None
                    })
            
            similarities.append({
                "aspect": aspect,
                "description": description,
                "documents": doc_ids_found,
                "examples": examples[:3]  # Limit to 3 examples
            })
        
        return similarities[:max(len(similarities), 5)]
    
    def _parse_differences_from_response(
        self,
        response_text: str,
        document_ids: List[str],
        document_name_map: Dict[str, str],
        chunks_by_document: Dict[str, List[ContextChunk]]
    ) -> List[Dict[str, Any]]:
        """Parse differences from LLM response"""
        differences = []
        
        # Split by "DIFFERENCE" markers
        difference_sections = re.split(r'DIFFERENCE\s+\d+:', response_text, flags=re.IGNORECASE)
        
        for section in difference_sections[1:]:  # Skip first empty section
            aspect_match = re.search(r'Aspect:\s*(.+?)(?:\n|$)', section, re.IGNORECASE)
            description_match = re.search(r'Description:\s*(.+?)(?:\nDocuments:|$)', section, re.IGNORECASE | re.DOTALL)
            
            if not aspect_match or not description_match:
                continue
            
            aspect = aspect_match.group(1).strip()
            description = description_match.group(1).strip()
            
            # Extract document-specific values
            doc_values = []
            doc_lines = re.findall(
                r'-\s*Document\s+([^(]+?)\s*\(ID:\s*([^)]+)\):\s*(.+?)(?:\s*\(Page:\s*(\d+)\)|$)',
                section,
                re.IGNORECASE
            )
            
            for doc_name, doc_id, value, page in doc_lines:
                doc_values.append({
                    "id": doc_id.strip(),
                    "name": document_name_map.get(doc_id.strip(), doc_name.strip()),
                    "value": value.strip(),
                    "page": int(page) if page else None
                })
            
            # If no structured format found, try simpler pattern
            if not doc_values:
                doc_lines_simple = re.findall(
                    r'-\s*Document\s+([^:]+):\s*(.+?)(?:\s*\(Page:\s*(\d+)\)|$)',
                    section,
                    re.IGNORECASE
                )
                for doc_name, value, page in doc_lines_simple:
                    # Find document ID by name
                    doc_id = None
                    for d_id, d_name in document_name_map.items():
                        if d_name.strip() == doc_name.strip():
                            doc_id = d_id
                            break
                    
                    if doc_id:
                        doc_values.append({
                            "id": doc_id,
                            "name": document_name_map.get(doc_id, doc_id),
                            "value": value.strip(),
                            "page": int(page) if page else None
                        })
            
            if doc_values:
                differences.append({
                    "aspect": aspect,
                    "description": description,
                    "documents": doc_values
                })
        
        return differences[:max(len(differences), 5)]

