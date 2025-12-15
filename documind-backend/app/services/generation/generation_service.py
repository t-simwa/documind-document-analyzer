"""
Main generation service that orchestrates retrieval, prompt engineering, LLM calls, and response formatting
"""

from typing import List, Dict, Any, Optional, AsyncIterator, Tuple
import structlog
import re

from app.services.retrieval import RetrievalService, RetrievalConfig, RetrievalResult, SearchType
from app.services.llm import LLMService, LLMConfig
from .prompt_engine import PromptEngine, ContextChunk
from .structured_output import GenerationResponse, Citation, KeyPoint, Entity
from .citation_schemas import StructuredAnswer
from .response_formatter import ResponseFormatter
from .insights_generator import InsightsGenerator
from .exceptions import GenerationError, GenerationValidationError
from app.core.config import settings

logger = structlog.get_logger(__name__)


class GenerationService:
    """Main generation service for document Q&A"""
    
    def __init__(
        self,
        retrieval_service: RetrievalService,
        llm_service: LLMService,
        prompt_engine: Optional[PromptEngine] = None,
        response_formatter: Optional[ResponseFormatter] = None,
        insights_generator: Optional[InsightsGenerator] = None
    ):
        """
        Initialize generation service
        
        Args:
            retrieval_service: Retrieval service instance
            llm_service: LLM service instance
            prompt_engine: Prompt engine instance (optional, creates default if not provided)
            response_formatter: Response formatter instance (optional, creates default if not provided)
            insights_generator: Insights generator instance (optional, creates default if not provided)
        """
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service
        self.prompt_engine = prompt_engine or PromptEngine()
        self.response_formatter = response_formatter or ResponseFormatter()
        self.insights_generator = insights_generator or InsightsGenerator(llm_service)
    
    async def generate_answer(
        self,
        query: str,
        collection_name: str,
        document_ids: Optional[List[str]] = None,
        retrieval_config: Optional[RetrievalConfig] = None,
        llm_config: Optional[LLMConfig] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        generate_insights: bool = False,
        tenant_id: Optional[str] = None
    ) -> GenerationResponse:
        """
        Generate answer to query using retrieved context
        
        Args:
            query: User query/question
            collection_name: Collection name to search
            document_ids: Optional list of document IDs to limit search
            retrieval_config: Retrieval configuration
            llm_config: LLM configuration
            conversation_history: Previous conversation messages
            generate_insights: Whether to generate additional insights
            tenant_id: Optional tenant ID
            
        Returns:
            GenerationResponse with answer, citations, and metadata
        """
        if not query or not query.strip():
            raise GenerationValidationError("Query cannot be empty")
        
        logger.info("Generating answer", query=query[:100], collection=collection_name, document_ids=document_ids)
        
        # Use default retrieval config if not provided
        if retrieval_config is None:
            from app.services.retrieval import RetrievalConfig
            retrieval_config = RetrievalConfig()
        
        # Increase top_k for more comprehensive context (better for exhaustive answers)
        # Higher top_k helps find related information even if not exact matches
        if retrieval_config.top_k < 20:
            logger.debug(
                "Increasing top_k for comprehensive answer",
                old_value=retrieval_config.top_k,
                new_value=20
            )
            retrieval_config.top_k = 20
        
        # Enable query expansion to find related terms and synonyms
        # This helps find information even if the exact words aren't used
        if not retrieval_config.query_expansion_enabled:
            retrieval_config.query_expansion_enabled = True
            logger.debug("Enabled query expansion for better retrieval")
        
        # Add document_ids filter to retrieval config if provided
        if document_ids:
            # ChromaDB uses $in operator for filtering by multiple values
            if retrieval_config.metadata_filter is None:
                retrieval_config.metadata_filter = {}
            # For ChromaDB, we need to use $in operator for document_id filtering
            # ChromaDB format: {"document_id": {"$in": ["id1", "id2"]}}
            if len(document_ids) == 1:
                retrieval_config.metadata_filter["document_id"] = document_ids[0]
            else:
                retrieval_config.metadata_filter["document_id"] = {"$in": document_ids}
            logger.debug("Added document_id filter to retrieval config", filter=retrieval_config.metadata_filter)
        
        # Step 1: Retrieve relevant chunks
        retrieval_result = await self.retrieval_service.retrieve(
            query=query,
            collection_name=collection_name,
            config=retrieval_config,
            tenant_id=tenant_id
        )
        
        if not retrieval_result.documents:
            logger.warning("No documents retrieved for query", query=query, document_ids=document_ids)
            return GenerationResponse(
                answer="I couldn't find any relevant information in the documents to answer your question. Please try rephrasing your query or check if the relevant documents have been uploaded and indexed.",
                citations=[],
                confidence=0.0,
                key_points=[],
                entities=[],
                model=self.llm_service.llm.model,
                provider=self.llm_service.provider.value,
                usage={},
                metadata={"retrieval_count": 0, "document_ids": document_ids}
            )
        
        # Step 2: Convert retrieval results to context chunks
        context_chunks = self._convert_to_context_chunks(retrieval_result)
        
        # Check if we should use structured outputs (Gemini only)
        # This needs to be checked BEFORE building messages
        use_structured_outputs = (
            settings.USE_GEMINI_STRUCTURED_OUTPUTS and
            self.llm_service.provider.value == "gemini"
        )
        
        # Step 3: Build prompt with context
        messages = self.prompt_engine.build_chat_messages(
            query=query,
            chunks=context_chunks,
            conversation_history=conversation_history,
            use_structured_outputs=use_structured_outputs
        )
        
        # Step 4: Generate answer using LLM
        # Ensure LLM config allows for thorough, complete answers
        if llm_config is None:
            llm_config = LLMConfig()
            # Set optimized defaults for accuracy and thoroughness
            llm_config.max_tokens = 8000  # Increased for comprehensive answers (was 4000, increased to prevent truncation)
            llm_config.temperature = 0.3  # Lower for more accurate, deterministic responses
        else:
            # Adjust if values are too restrictive for thorough answers
            if llm_config.max_tokens < 6000:
                # Increase max_tokens to allow for more comprehensive answers (prevent truncation)
                logger.debug(
                    "Increasing max_tokens for thorough answer",
                    old_value=llm_config.max_tokens,
                    new_value=8000
                )
                llm_config.max_tokens = 8000
            
            # Lower temperature if too high for accuracy-focused responses
            if llm_config.temperature > 0.5:
                # Lower temperature for more accurate, focused responses
                logger.debug(
                    "Lowering temperature for accuracy",
                    old_value=llm_config.temperature,
                    new_value=0.3
                )
                llm_config.temperature = 0.3
        
        structured_schema = None
        if use_structured_outputs:
            # Get JSON schema from Pydantic model
            structured_schema = StructuredAnswer.model_json_schema()
            logger.info("Using Gemini Structured Outputs for citation extraction")
        
        try:
            llm_response = await self.llm_service.generate_chat(
                messages=messages,
                config=llm_config,
                structured_output_schema=structured_schema if use_structured_outputs else None
            )
        except Exception as e:
            logger.error("LLM generation failed", error=str(e))
            raise GenerationError(f"Failed to generate answer: {str(e)}")
        
        # Step 5: Extract citations and answer from response
        citations = []
        citation_indices = []
        final_answer = llm_response.content  # Default to raw content
        
        if use_structured_outputs and llm_response.metadata.get("structured_output"):
            # Parse structured output from Gemini
            try:
                structured_data = llm_response.metadata["structured_output"]
                structured_answer = StructuredAnswer.model_validate(structured_data)
                
                # Use the answer from structured output (this is the properly formatted answer)
                final_answer = structured_answer.answer
                
                # Defensive check: ensure answer is not JSON string
                if isinstance(final_answer, str) and final_answer.strip().startswith('{'):
                    try:
                        import json
                        parsed = json.loads(final_answer)
                        if isinstance(parsed, dict) and "answer" in parsed:
                            final_answer = parsed["answer"]
                            logger.warning("Extracted answer from nested JSON string")
                    except (json.JSONDecodeError, TypeError):
                        pass  # Not JSON, use as-is
                
                # Ensure answer is a string, not dict or other type
                if not isinstance(final_answer, str):
                    final_answer = str(final_answer)
                    logger.warning("Converted answer to string", original_type=type(final_answer).__name__)
                
                # Extract citations from structured output
                for citation_ref in structured_answer.citations_used:
                    idx = citation_ref.citation_index
                    if 1 <= idx <= len(context_chunks):
                        citation_indices.append(idx)
                        chunk = context_chunks[idx - 1]
                        citations.append(
                            Citation(
                                index=idx,
                                document_id=chunk.document_id,
                                chunk_id=chunk.chunk_id,
                                page=chunk.metadata.get("page"),
                                score=chunk.score,
                                metadata=chunk.metadata
                            )
                        )
                
                logger.info(
                    "Extracted citations from structured output",
                    citation_count=len(citations),
                    confidence=structured_answer.confidence_level,
                    answer_length=len(final_answer)
                )
            except Exception as e:
                logger.warning("Failed to parse structured output, falling back to regex", error=str(e))
                # Fall back to regex extraction
                # Also check if content is raw JSON and extract answer
                if isinstance(llm_response.content, str) and llm_response.content.strip().startswith('{'):
                    try:
                        import json
                        parsed = json.loads(llm_response.content)
                        if isinstance(parsed, dict) and "answer" in parsed:
                            final_answer = parsed["answer"]
                            logger.info("Extracted answer from fallback JSON parsing")
                    except (json.JSONDecodeError, TypeError):
                        pass  # Not JSON, use as-is
                citation_indices = self.prompt_engine.extract_citations_from_response(final_answer)
        else:
            # Use regex-based citation extraction (fallback or non-Gemini providers)
            # Check if content is raw JSON (shouldn't happen, but defensive check)
            if isinstance(llm_response.content, str) and llm_response.content.strip().startswith('{'):
                try:
                    import json
                    parsed = json.loads(llm_response.content)
                    if isinstance(parsed, dict) and "answer" in parsed:
                        final_answer = parsed["answer"]
                        logger.info("Extracted answer from JSON in non-structured output")
                except (json.JSONDecodeError, TypeError):
                    pass  # Not JSON, use as-is
            citation_indices = self.prompt_engine.extract_citations_from_response(final_answer)
        
        # Build citations if not already built from structured output
        if not citations:
            for idx in citation_indices:
                if 1 <= idx <= len(context_chunks):
                    chunk = context_chunks[idx - 1]
                    citations.append(
                        Citation(
                            index=idx,
                            document_id=chunk.document_id,
                            chunk_id=chunk.chunk_id,
                            page=chunk.metadata.get("page"),
                            score=chunk.score,
                            metadata=chunk.metadata
                        )
                    )
        
        # Step 6: Generate additional insights if requested
        key_points = []
        entities = []
        
        if generate_insights:
            try:
                key_points = await self.insights_generator.generate_key_points(context_chunks)
                entities = await self.insights_generator.extract_entities(context_chunks)
            except Exception as e:
                logger.warning("Failed to generate insights", error=str(e))
                # Continue without insights
        
        # Step 7: Calculate confidence score
        confidence = self._calculate_confidence(retrieval_result.scores, len(citations))
        
        # Step 7.5: Clean and format the answer
        # Ensure answer is clean text, properly formatted
        if not isinstance(final_answer, str):
            final_answer = str(final_answer)
        
        # Remove any remaining JSON artifacts
        final_answer = final_answer.strip()
        
        # Final defensive check: if answer still looks like JSON, try to extract
        if final_answer.startswith('{') and '"answer"' in final_answer:
            try:
                import json
                parsed = json.loads(final_answer)
                if isinstance(parsed, dict) and "answer" in parsed:
                    final_answer = parsed["answer"]
                    logger.warning("Final cleanup: extracted answer from JSON string")
            except (json.JSONDecodeError, TypeError):
                pass  # Not valid JSON, use as-is
        
        # Step 8: Build response
        response = GenerationResponse(
            answer=final_answer.strip(),  # Use extracted answer from structured output if available, ensure clean
            citations=citations,
            confidence=confidence,
            key_points=key_points,
            entities=entities,
            model=llm_response.model,
            provider=llm_response.provider,
            usage=llm_response.usage,
            metadata={
                "retrieval_count": len(context_chunks),
                "retrieval_scores": retrieval_result.scores[:5],  # Top 5 scores
                "query": query
            }
        )
        
        logger.info(
            "Answer generated",
            query=query[:100],
            answer_length=len(response.answer),
            citations=len(citations),
            confidence=confidence
        )
        
        return response
    
    async def generate_answer_stream(
        self,
        query: str,
        collection_name: str,
        document_ids: Optional[List[str]] = None,
        retrieval_config: Optional[RetrievalConfig] = None,
        llm_config: Optional[LLMConfig] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        tenant_id: Optional[str] = None
    ) -> AsyncIterator[str]:
        """
        Generate streaming answer to query
        
        Args:
            query: User query/question
            collection_name: Collection name to search
            document_ids: Optional list of document IDs to limit search
            retrieval_config: Retrieval configuration
            llm_config: LLM configuration (must have stream=True)
            conversation_history: Previous conversation messages
            tenant_id: Optional tenant ID
            
        Yields:
            String chunks of generated answer
        """
        if not query or not query.strip():
            raise GenerationValidationError("Query cannot be empty")
        
        # Step 1: Retrieve relevant chunks
        retrieval_result = await self.retrieval_service.retrieve(
            query=query,
            collection_name=collection_name,
            config=retrieval_config,
            tenant_id=tenant_id
        )
        
        if not retrieval_result.documents:
            yield "I couldn't find any relevant information in the documents to answer your question."
            return
        
        # Filter by document_ids if provided
        if document_ids:
            filtered_docs = []
            filtered_metadata = []
            filtered_scores = []
            filtered_ids = []
            
            for i, metadata in enumerate(retrieval_result.metadata):
                doc_id = metadata.get("document_id")
                if doc_id in document_ids:
                    filtered_docs.append(retrieval_result.documents[i])
                    filtered_metadata.append(metadata)
                    filtered_scores.append(retrieval_result.scores[i])
                    filtered_ids.append(retrieval_result.ids[i])
            
            if not filtered_docs:
                yield "I couldn't find any relevant information in the specified documents to answer your question."
                return
            
            retrieval_result.documents = filtered_docs
            retrieval_result.metadata = filtered_metadata
            retrieval_result.scores = filtered_scores
            retrieval_result.ids = filtered_ids
        
        # Step 2: Convert to context chunks
        context_chunks = self._convert_to_context_chunks(retrieval_result)
        
        # Step 3: Build prompt
        messages = self.prompt_engine.build_chat_messages(
            query=query,
            chunks=context_chunks,
            conversation_history=conversation_history
        )
        
        # Step 4: Stream answer
        if llm_config is None:
            llm_config = LLMConfig(stream=True)
        else:
            llm_config.stream = True
        
        try:
            async for chunk in self.llm_service.generate_chat_stream(
                messages=messages,
                config=llm_config
            ):
                yield chunk
        except Exception as e:
            logger.error("LLM streaming failed", error=str(e))
            yield f"\n\n[Error: Failed to generate answer: {str(e)}]"
    
    def _convert_to_context_chunks(
        self,
        retrieval_result: RetrievalResult
    ) -> List[ContextChunk]:
        """Convert retrieval result to context chunks"""
        chunks = []
        
        for i, (doc, metadata, score) in enumerate(zip(
            retrieval_result.documents,
            retrieval_result.metadata,
            retrieval_result.scores
        )):
            chunk = ContextChunk(
                content=doc,
                document_id=metadata.get("document_id", "unknown"),
                chunk_id=metadata.get("chunk_id", f"chunk_{i}"),
                metadata=metadata,
                score=float(score) if score is not None else 0.0
            )
            chunks.append(chunk)
        
        return chunks
    
    async def generate_summary(
        self,
        document_id: str,
        collection_name: str,
        top_k: int = 20,
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate document summary using RAG pipeline
        
        Args:
            document_id: Document ID to summarize
            collection_name: Collection name to search
            top_k: Number of chunks to retrieve (default: 20 for comprehensive summary)
            tenant_id: Optional tenant ID
            
        Returns:
            Dictionary with executiveSummary, keyPoints, and generatedAt
        """
        logger.info("Generating summary", document_id=document_id, collection=collection_name)
        
        # Use a very broad query to retrieve diverse content from the document
        # A generic query helps retrieve chunks from different parts of the document
        summary_query = "document content information details topics themes findings conclusions recommendations"
        
        # Configure retrieval for comprehensive summary
        retrieval_config = RetrievalConfig()
        retrieval_config.top_k = top_k * 2  # Retrieve more chunks, we'll filter after
        retrieval_config.search_type = SearchType.HYBRID  # Use hybrid search for better coverage
        retrieval_config.query_expansion_enabled = True
        
        # Try with metadata filter first
        retrieval_config.metadata_filter = {"document_id": document_id}
        logger.debug("Starting retrieval with document_id filter", document_id=document_id, filter=retrieval_config.metadata_filter)
        
        # Step 1: Retrieve relevant chunks
        retrieval_result = await self.retrieval_service.retrieve(
            query=summary_query,
            collection_name=collection_name,
            config=retrieval_config,
            tenant_id=tenant_id
        )
        
        # Filter by document_id in memory (fallback if metadata filter didn't work)
        if retrieval_result and retrieval_result.documents:
            filtered_docs = []
            filtered_metadata = []
            filtered_scores = []
            filtered_ids = []
            filtered_distances = []
            
            for i, metadata in enumerate(retrieval_result.metadata):
                doc_id = metadata.get("document_id")
                if doc_id == document_id:
                    filtered_docs.append(retrieval_result.documents[i])
                    filtered_metadata.append(metadata)
                    filtered_scores.append(retrieval_result.scores[i])
                    filtered_ids.append(retrieval_result.ids[i])
                    if retrieval_result.distances:
                        filtered_distances.append(retrieval_result.distances[i])
            
            # If we found filtered results, use them
            if filtered_docs:
                original_count = len(retrieval_result.documents)
                retrieval_result = RetrievalResult(
                    ids=filtered_ids,
                    documents=filtered_docs,
                    metadata=filtered_metadata,
                    scores=filtered_scores,
                    distances=filtered_distances if filtered_distances else [1.0 - s for s in filtered_scores],
                    search_type=retrieval_result.search_type,
                    vector_scores=retrieval_result.vector_scores[:len(filtered_docs)] if retrieval_result.vector_scores else None,
                    keyword_scores=retrieval_result.keyword_scores[:len(filtered_docs)] if retrieval_result.keyword_scores else None
                )
                logger.debug("Filtered results by document_id", original_count=original_count, filtered_count=len(filtered_docs))
            else:
                # No matches after filtering - document might not be indexed
                logger.warning(
                    "No content found for document after filtering",
                    document_id=document_id,
                    collection=collection_name,
                    retrieved_count=len(retrieval_result.documents),
                    sample_metadata=retrieval_result.metadata[0] if retrieval_result.metadata else None
                )
                retrieval_result = None
        
        if not retrieval_result or not retrieval_result.documents:
            logger.warning(
                "No content found for document",
                document_id=document_id,
                collection=collection_name,
                retrieved_count=len(retrieval_result.documents) if retrieval_result else 0
            )
            raise GenerationError(
                f"No content found for document {document_id}. "
                f"The document may not be indexed yet, or indexing may still be in progress. "
                f"Please ensure the document processing is complete (status: 'ready'). "
                f"If the document was recently uploaded, please wait a few moments for indexing to complete."
            )
        
        # Step 2: Convert to context chunks
        context_chunks = self._convert_to_context_chunks(retrieval_result)
        
        # Step 3: Build summary-specific prompt
        summary_prompt = """Based on the following document content, generate a comprehensive summary in the following format:

1. **Executive Summary**: Write 2-3 paragraphs that provide a high-level overview of the document. Include the main purpose, key themes, and most important findings.

2. **Key Points**: Extract and list 5-7 most important key points from the document. Each point should be a concise sentence that captures a significant finding, recommendation, or insight.

Format your response as:
EXECUTIVE_SUMMARY:
[Your executive summary here]

KEY_POINTS:
1. [First key point]
2. [Second key point]
..."""

        # Build messages with summary prompt
        system_prompt = self.prompt_engine.build_system_prompt(
            custom_instructions="You are an expert document analyst. Generate clear, comprehensive summaries that capture the essence of the document."
        )
        
        context_string = self.prompt_engine.build_context_string(context_chunks, include_metadata=True)
        user_prompt = f"{context_string}\n\n{summary_prompt}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Step 4: Generate summary using LLM
        llm_config = LLMConfig(temperature=0.3, max_tokens=1500)  # Lower temperature for more consistent summaries
        
        try:
            llm_response = await self.llm_service.generate_chat(
                messages=messages,
                config=llm_config
            )
            
            summary_text = llm_response.content
            
            # Parse the response to extract executive summary and key points
            executive_summary = ""
            key_points = []
            
            # Try to parse structured format
            if "EXECUTIVE_SUMMARY:" in summary_text:
                parts = summary_text.split("KEY_POINTS:")
                if len(parts) == 2:
                    executive_summary = parts[0].replace("EXECUTIVE_SUMMARY:", "").strip()
                    key_points_text = parts[1].strip()
                    
                    # Extract numbered key points
                    point_pattern = r'\d+\.\s*(.+?)(?=\d+\.|$)'
                    matches = re.findall(point_pattern, key_points_text, re.DOTALL)
                    key_points = [match.strip() for match in matches if match.strip()]
            else:
                # Fallback: use entire response as executive summary, try to extract key points
                lines = summary_text.split('\n')
                summary_lines = []
                in_key_points = False
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check if this looks like a key point (starts with number or bullet)
                    if re.match(r'^[\d\-•*]\s+', line) or in_key_points:
                        in_key_points = True
                        # Clean up the line
                        cleaned = re.sub(r'^[\d\-•*]\s+', '', line)
                        if cleaned:
                            key_points.append(cleaned)
                    else:
                        summary_lines.append(line)
                
                executive_summary = '\n\n'.join(summary_lines)
                
                # If no key points found, generate them from the summary
                if not key_points:
                    # Use insights generator to extract key points
                    try:
                        key_points = await self.insights_generator.generate_key_points(context_chunks)
                        key_points = [kp.text for kp in key_points] if key_points else []
                    except Exception as e:
                        logger.warning("Failed to generate key points", error=str(e))
                        key_points = []
            
            # Ensure we have at least something
            if not executive_summary:
                executive_summary = summary_text[:500] + "..." if len(summary_text) > 500 else summary_text
            
            if not key_points:
                # Fallback: create key points from summary
                sentences = executive_summary.split('. ')
                key_points = [s.strip() + '.' for s in sentences[:7] if s.strip() and len(s.strip()) > 20]
            
            # Limit key points to 7
            key_points = key_points[:7]
            
            from datetime import datetime
            return {
                "executiveSummary": executive_summary,
                "keyPoints": key_points,
                "generatedAt": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error("Summary generation failed", error=str(e), document_id=document_id)
            raise GenerationError(f"Failed to generate summary: {str(e)}")
    
    async def generate_entities(
        self,
        document_id: str,
        collection_name: str,
        top_k: int = 100,  # Increased default to retrieve more chunks
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate document entities using RAG pipeline
        
        Args:
            document_id: Document ID to extract entities from
            collection_name: Collection name to search
            top_k: Number of chunks to retrieve (default: 100 for comprehensive extraction)
            tenant_id: Optional tenant ID
            
        Returns:
            Dictionary with organizations, people, dates, monetaryValues, and locations
        """
        logger.info("Generating entities", document_id=document_id, collection=collection_name)
        
        # Use multiple broad queries to retrieve diverse content from different parts of the document
        # This helps ensure we get comprehensive coverage
        entity_queries = [
            "organizations companies institutions corporations",
            "people names individuals persons",
            "dates time periods deadlines schedules",
            "monetary values amounts money currency financial",
            "locations places addresses cities countries regions"
        ]
        
        # Configure retrieval for comprehensive entity extraction
        retrieval_config = RetrievalConfig()
        retrieval_config.top_k = top_k * 3  # Retrieve significantly more chunks (300 by default)
        retrieval_config.search_type = SearchType.HYBRID  # Use hybrid search for better coverage
        retrieval_config.query_expansion_enabled = True
        
        # Try with metadata filter first
        retrieval_config.metadata_filter = {"document_id": document_id}
        logger.debug("Starting retrieval for entities with document_id filter", document_id=document_id)
        
        # Step 1: Retrieve chunks using multiple queries to get comprehensive coverage
        all_chunks = {}
        all_metadata = {}
        all_scores = {}
        all_ids = {}
        all_distances = {}
        
        for query in entity_queries:
            retrieval_result = await self.retrieval_service.retrieve(
                query=query,
                collection_name=collection_name,
                config=retrieval_config,
                tenant_id=tenant_id
            )
            
            if retrieval_result and retrieval_result.documents:
                # Collect unique chunks by ID
                for i, chunk_id in enumerate(retrieval_result.ids):
                    if chunk_id not in all_chunks:
                        all_chunks[chunk_id] = retrieval_result.documents[i]
                        all_metadata[chunk_id] = retrieval_result.metadata[i]
                        all_scores[chunk_id] = retrieval_result.scores[i]
                        all_ids[chunk_id] = chunk_id
                        if retrieval_result.distances:
                            all_distances[chunk_id] = retrieval_result.distances[i]
        
        # Create combined retrieval result
        if all_chunks:
            retrieval_result = RetrievalResult(
                ids=list(all_ids.values()),
                documents=list(all_chunks.values()),
                metadata=list(all_metadata.values()),
                scores=list(all_scores.values()),
                distances=list(all_distances.values()) if all_distances else [1.0 - s for s in all_scores.values()],
                search_type=SearchType.HYBRID,
                vector_scores=None,
                keyword_scores=None
            )
        else:
            # Fallback: single query retrieval
            entities_query = "document content information details names organizations people dates monetary values locations places"
            retrieval_result = await self.retrieval_service.retrieve(
                query=entities_query,
                collection_name=collection_name,
                config=retrieval_config,
                tenant_id=tenant_id
            )
        
        # Filter by document_id in memory (fallback if metadata filter didn't work)
        if retrieval_result and retrieval_result.documents:
            filtered_docs = []
            filtered_metadata = []
            filtered_scores = []
            filtered_ids = []
            filtered_distances = []
            
            for i, metadata in enumerate(retrieval_result.metadata):
                doc_id = metadata.get("document_id")
                if doc_id == document_id:
                    filtered_docs.append(retrieval_result.documents[i])
                    filtered_metadata.append(metadata)
                    filtered_scores.append(retrieval_result.scores[i])
                    filtered_ids.append(retrieval_result.ids[i])
                    if retrieval_result.distances:
                        filtered_distances.append(retrieval_result.distances[i])
            
            # If we found filtered results, use them
            if filtered_docs:
                original_count = len(retrieval_result.documents)
                retrieval_result = RetrievalResult(
                    ids=filtered_ids,
                    documents=filtered_docs,
                    metadata=filtered_metadata,
                    scores=filtered_scores,
                    distances=filtered_distances if filtered_distances else [1.0 - s for s in filtered_scores],
                    search_type=retrieval_result.search_type,
                    vector_scores=retrieval_result.vector_scores[:len(filtered_docs)] if retrieval_result.vector_scores else None,
                    keyword_scores=retrieval_result.keyword_scores[:len(filtered_docs)] if retrieval_result.keyword_scores else None
                )
                logger.debug("Filtered results by document_id for entities", original_count=original_count, filtered_count=len(filtered_docs))
                
                # Try to retrieve additional chunks if we have a limited set
                # Use a very broad query with high top_k to get more chunks
                if len(filtered_docs) < 100:  # If we have fewer than 100 chunks, try to get more
                    logger.debug("Attempting to retrieve more chunks for comprehensive entity extraction", current_count=len(filtered_docs))
                    broad_config = RetrievalConfig()
                    broad_config.top_k = 500  # Very high limit to get all chunks
                    broad_config.search_type = SearchType.HYBRID
                    broad_config.metadata_filter = {"document_id": document_id}
                    
                    broad_result = await self.retrieval_service.retrieve(
                        query="all content document text information",
                        collection_name=collection_name,
                        config=broad_config,
                        tenant_id=tenant_id
                    )
                    
                    if broad_result and broad_result.documents:
                        # Merge additional chunks
                        existing_ids = set(filtered_ids)
                        for i, chunk_id in enumerate(broad_result.ids):
                            if chunk_id not in existing_ids:
                                doc_id = broad_result.metadata[i].get("document_id")
                                if doc_id == document_id:
                                    filtered_docs.append(broad_result.documents[i])
                                    filtered_metadata.append(broad_result.metadata[i])
                                    filtered_scores.append(broad_result.scores[i])
                                    filtered_ids.append(chunk_id)
                                    if broad_result.distances:
                                        filtered_distances.append(broad_result.distances[i])
                                    existing_ids.add(chunk_id)
                        
                        # Update retrieval result with merged chunks
                        if len(filtered_docs) > original_count:
                            retrieval_result = RetrievalResult(
                                ids=filtered_ids,
                                documents=filtered_docs,
                                metadata=filtered_metadata,
                                scores=filtered_scores,
                                distances=filtered_distances if filtered_distances else [1.0 - s for s in filtered_scores],
                                search_type=SearchType.HYBRID,
                                vector_scores=None,
                                keyword_scores=None
                            )
                            logger.debug("Merged additional chunks", final_count=len(filtered_docs))
            else:
                logger.warning(
                    "No content found for document after filtering (entities)",
                    document_id=document_id,
                    collection=collection_name,
                    retrieved_count=len(retrieval_result.documents)
                )
                retrieval_result = None
        
        if not retrieval_result or not retrieval_result.documents:
            logger.warning(
                "No content found for document (entities)",
                document_id=document_id,
                collection=collection_name,
                retrieved_count=len(retrieval_result.documents) if retrieval_result else 0
            )
            raise GenerationError(
                f"No content found for document {document_id}. "
                f"The document may not be indexed yet, or indexing may still be in progress. "
                f"Please ensure the document processing is complete (status: 'ready')."
            )
        
        # Step 2: Convert to context chunks
        context_chunks = self._convert_to_context_chunks(retrieval_result)
        
        # Step 3: Extract entities using insights generator
        try:
            entities = await self.insights_generator.extract_entities(context_chunks)
            
            # Step 4: Format entities according to API schema
            formatted_entities = self._format_entities_for_api(entities, context_chunks)
            
            return formatted_entities
            
        except Exception as e:
            logger.error("Entity extraction failed", error=str(e), document_id=document_id)
            raise GenerationError(f"Failed to generate entities: {str(e)}")
    
    def _format_entities_for_api(
        self,
        entities: List[Entity],
        context_chunks: List[ContextChunk]
    ) -> Dict[str, Any]:
        """
        Format extracted entities according to API schema
        
        Args:
            entities: List of extracted entities
            context_chunks: Context chunks with metadata
            
        Returns:
            Dictionary with formatted entities grouped by type
        """
        # Group entities by type and track occurrences
        entity_groups = {
            "organizations": {},
            "people": {},
            "dates": {},
            "monetaryValues": {},
            "locations": {}
        }
        
        # Map entity types to groups
        type_mapping = {
            "organization": "organizations",
            "person": "people",
            "date": "dates",
            "monetary": "monetaryValues",
            "location": "locations"
        }
        
        # Process each entity
        for entity in entities:
            entity_type = type_mapping.get(entity.type, None)
            if not entity_type:
                continue
            
            # Normalize entity text for grouping (case-insensitive)
            entity_key = entity.text.lower().strip()
            
            # Get page number from citations if available
            page = None
            context_text = None
            
            if entity.citations and len(entity.citations) > 0:
                # Get page from first citation's chunk metadata
                citation_idx = entity.citations[0] - 1  # Citations are 1-indexed
                if 0 <= citation_idx < len(context_chunks):
                    chunk_metadata = context_chunks[citation_idx].metadata
                    page = chunk_metadata.get("page_number") or chunk_metadata.get("page")
                    # Get context from chunk content
                    chunk_content = context_chunks[citation_idx].content
                    # Extract more comprehensive context around entity (100 chars before and after for better context)
                    entity_pos = chunk_content.lower().find(entity.text.lower())
                    if entity_pos >= 0:
                        start = max(0, entity_pos - 100)
                        end = min(len(chunk_content), entity_pos + len(entity.text) + 200)
                        context_text = chunk_content[start:end].strip()
                        # Clean up context but preserve structure
                        if context_text:
                            # Preserve line breaks and structure
                            context_text = re.sub(r'[ \t]+', ' ', context_text)  # Only collapse spaces/tabs, not newlines
                            # Limit length but preserve important structure
                            if len(context_text) > 400:
                                # Try to cut at sentence boundary
                                sentences = re.split(r'([.!?]\s+)', context_text[:400])
                                if len(sentences) > 2:
                                    context_text = ''.join(sentences[:-2]) + "..."
                                else:
                                    context_text = context_text[:400] + "..."
            
            # Group entities by normalized key
            if entity_key not in entity_groups[entity_type]:
                entity_groups[entity_type][entity_key] = {
                    "text": entity.text,
                    "context": context_text,
                    "page": page,
                    "count": 1,
                    "value": entity.value,
                    "citations": entity.citations
                }
            else:
                # Increment count
                entity_groups[entity_type][entity_key]["count"] += 1
                # Update page if we found a different page
                if page and entity_groups[entity_type][entity_key]["page"] != page:
                    # Keep the first page found, or could use a list
                    pass
                # Merge citations
                if entity.citations:
                    existing_citations = entity_groups[entity_type][entity_key]["citations"]
                    entity_groups[entity_type][entity_key]["citations"] = list(set(existing_citations + entity.citations))
        
        # Format entities for API response
        formatted = {
            "organizations": [],
            "people": [],
            "dates": [],
            "monetaryValues": [],
            "locations": []
        }
        
        # Format regular entities
        for entity_type in ["organizations", "people", "dates", "locations"]:
            for entity_data in entity_groups[entity_type].values():
                formatted[entity_type].append({
                    "text": entity_data["text"],
                    "context": entity_data["context"],
                    "page": entity_data["page"],
                    "count": entity_data["count"] if entity_data["count"] > 1 else None
                })
        
        # Format monetary entities (special handling)
        for entity_data in entity_groups["monetaryValues"].values():
            # Parse monetary value
            value_str = str(entity_data["value"]) if entity_data["value"] else entity_data["text"]
            
            # Extract numeric value
            numeric_value = 0.0
            currency = "USD"  # Default currency
            
            # Try to extract number and currency
            money_match = re.search(r'[\d,]+\.?\d*', value_str.replace(',', ''))
            if money_match:
                try:
                    numeric_value = float(money_match.group(0).replace(',', ''))
                except ValueError:
                    pass
            
            # Try to extract currency
            currency_match = re.search(r'\b(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|BRL)\b', value_str.upper())
            if currency_match:
                currency = currency_match.group(1)
            
            # Format monetary value
            formatted_value = f"${numeric_value:,.2f}" if currency == "USD" else f"{currency} {numeric_value:,.2f}"
            
            formatted["monetaryValues"].append({
                "text": entity_data["text"],
                "value": numeric_value,
                "currency": currency,
                "formatted": formatted_value,
                "context": entity_data["context"],
                "page": entity_data["page"],
                "count": entity_data["count"] if entity_data["count"] > 1 else None
            })
        
        return formatted
    
    async def generate_patterns_and_contradictions(
        self,
        query: str,
        collection_name: str,
        document_ids: List[str],
        context_chunks: Optional[List[ContextChunk]] = None,
        document_name_map: Optional[Dict[str, str]] = None,
        retrieval_config: Optional[RetrievalConfig] = None,
        tenant_id: Optional[str] = None
    ) -> Tuple[Optional[List[Dict[str, Any]]], Optional[List[Dict[str, Any]]]]:
        """
        Generate patterns and contradictions for cross-document queries
        
        Args:
            query: Original query
            collection_name: Collection name
            document_ids: List of document IDs being queried
            context_chunks: Optional pre-retrieved context chunks
            document_name_map: Map of document_id to document_name
            retrieval_config: Retrieval configuration
            tenant_id: Optional tenant ID
            
        Returns:
            Tuple of (patterns_list, contradictions_list)
        """
        if not document_ids or len(document_ids) < 2:
            return None, None
        
        try:
            # If context chunks not provided, retrieve them
            if not context_chunks:
                if not retrieval_config:
                    retrieval_config = RetrievalConfig()
                    retrieval_config.top_k = 20  # Get more chunks for pattern detection
                    retrieval_config.search_type = SearchType.HYBRID
                
                # Retrieve chunks from all documents
                retrieval_result = await self.retrieval_service.retrieve(
                    query=query,
                    collection_name=collection_name,
                    config=retrieval_config,
                    tenant_id=tenant_id
                )
                
                # Filter by document_ids
                if retrieval_result and retrieval_result.documents:
                    filtered_docs = []
                    filtered_metadata = []
                    filtered_scores = []
                    filtered_ids = []
                    
                    for i, metadata in enumerate(retrieval_result.metadata):
                        doc_id = metadata.get("document_id")
                        if doc_id in document_ids:
                            filtered_docs.append(retrieval_result.documents[i])
                            filtered_metadata.append(metadata)
                            filtered_scores.append(retrieval_result.scores[i])
                            filtered_ids.append(retrieval_result.ids[i])
                    
                    if filtered_docs:
                        filtered_result = RetrievalResult(
                            ids=filtered_ids,
                            documents=filtered_docs,
                            metadata=filtered_metadata,
                            scores=filtered_scores,
                            distances=[1.0 - s for s in filtered_scores],
                            search_type=retrieval_result.search_type,
                            vector_scores=None,
                            keyword_scores=None
                        )
                        context_chunks = self._convert_to_context_chunks(filtered_result)
                    else:
                        context_chunks = []
            
            if not context_chunks:
                return None, None
            
            # Group chunks by document_id
            chunks_by_doc: Dict[str, List[ContextChunk]] = {}
            for chunk in context_chunks:
                doc_id = chunk.metadata.get("document_id", "unknown")
                if doc_id not in chunks_by_doc:
                    chunks_by_doc[doc_id] = []
                chunks_by_doc[doc_id].append(chunk)
            
            # Generate patterns
            patterns = await self._generate_patterns(
                context_chunks=context_chunks,
                chunks_by_doc=chunks_by_doc,
                document_ids=document_ids,
                document_name_map=document_name_map or {}
            )
            
            # Generate contradictions
            contradictions = await self._generate_contradictions(
                context_chunks=context_chunks,
                chunks_by_doc=chunks_by_doc,
                document_ids=document_ids,
                document_name_map=document_name_map or {}
            )
            
            return patterns, contradictions
            
        except Exception as e:
            logger.error("Failed to generate patterns/contradictions", error=str(e))
            return None, None
    
    async def _generate_patterns(
        self,
        context_chunks: List[ContextChunk],
        chunks_by_doc: Dict[str, List[ContextChunk]],
        document_ids: List[str],
        document_name_map: Dict[str, str]
    ) -> Optional[List[Dict[str, Any]]]:
        """Generate patterns across documents"""
        try:
            # Combine content from all documents
            content_parts = []
            for doc_id in document_ids:
                doc_chunks = chunks_by_doc.get(doc_id, [])
                if doc_chunks:
                    doc_content = "\n\n".join([chunk.content for chunk in doc_chunks[:10]])  # Limit per doc
                    content_parts.append(f"[Document: {document_name_map.get(doc_id, doc_id)}]\n{doc_content}")
            
            combined_content = "\n\n---\n\n".join(content_parts)
            
            system_prompt = """You are an expert at identifying patterns across multiple documents. Analyze the content and identify:
1. Common themes and topics
2. Shared entities (organizations, people, locations)
3. Trends and patterns over time
4. Relationships and connections

For each pattern, provide:
- Type (theme, entity, trend, or relationship)
- Description
- Which documents it appears in
- Number of occurrences
- Example passages with page numbers
- Confidence score (0-1)"""
            
            user_prompt = f"""Analyze the following content from {len(document_ids)} documents and identify patterns:

{combined_content[:15000]}

Identify and list patterns in this format:
[PATTERN]
Type: [theme/entity/trend/relationship]
Description: [clear description]
Documents: [comma-separated document IDs]
Occurrences: [number]
Examples:
- Document: [name], Text: "[example]", Page: [number]
Confidence: [0.0-1.0]

List all significant patterns you find."""
            
            config = LLMConfig(temperature=0.3, max_tokens=3000)
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse patterns from response
            patterns = self._parse_patterns_from_response(
                response.content,
                document_ids,
                document_name_map,
                chunks_by_doc
            )
            
            return patterns[:10]  # Limit to top 10 patterns
            
        except Exception as e:
            logger.error("Pattern generation failed", error=str(e))
            return None
    
    async def _generate_contradictions(
        self,
        context_chunks: List[ContextChunk],
        chunks_by_doc: Dict[str, List[ContextChunk]],
        document_ids: List[str],
        document_name_map: Dict[str, str]
    ) -> Optional[List[Dict[str, Any]]]:
        """Generate contradictions across documents"""
        try:
            # Combine content from all documents
            content_parts = []
            for doc_id in document_ids:
                doc_chunks = chunks_by_doc.get(doc_id, [])
                if doc_chunks:
                    doc_content = "\n\n".join([chunk.content for chunk in doc_chunks[:10]])
                    content_parts.append(f"[Document: {document_name_map.get(doc_id, doc_id)}]\n{doc_content}")
            
            combined_content = "\n\n---\n\n".join(content_parts)
            
            system_prompt = """You are an expert at identifying contradictions between documents. Analyze the content and identify:
1. Factual contradictions (different facts about the same topic)
2. Temporal contradictions (conflicting dates/timelines)
3. Quantitative contradictions (different numbers/metrics)
4. Categorical contradictions (different classifications)

For each contradiction, provide:
- Type (factual, temporal, quantitative, or categorical)
- Description
- Claims from each document with page numbers
- Severity (low, medium, or high)
- Confidence score (0-1)"""
            
            user_prompt = f"""Analyze the following content from {len(document_ids)} documents and identify contradictions:

{combined_content[:15000]}

Identify and list contradictions in this format:
[CONTRADICTION]
Type: [factual/temporal/quantitative/categorical]
Description: [clear description]
Documents:
- Document: [name], Claim: "[claim text]", Page: [number]
- Document: [name], Claim: "[contradictory claim]", Page: [number]
Severity: [low/medium/high]
Confidence: [0.0-1.0]

List all significant contradictions you find."""
            
            config = LLMConfig(temperature=0.2, max_tokens=3000)
            response = await self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                config=config
            )
            
            # Parse contradictions from response
            contradictions = self._parse_contradictions_from_response(
                response.content,
                document_ids,
                document_name_map,
                chunks_by_doc
            )
            
            return contradictions[:10]  # Limit to top 10 contradictions
            
        except Exception as e:
            logger.error("Contradiction generation failed", error=str(e))
            return None
    
    def _parse_patterns_from_response(
        self,
        response_text: str,
        document_ids: List[str],
        document_name_map: Dict[str, str],
        chunks_by_doc: Dict[str, List[ContextChunk]]
    ) -> List[Dict[str, Any]]:
        """Parse patterns from LLM response"""
        patterns = []
        lines = response_text.split("\n")
        
        current_pattern = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Start of new pattern
            if "[PATTERN]" in line.upper() or line.upper().startswith("PATTERN"):
                if current_pattern:
                    patterns.append(current_pattern)
                current_pattern = {
                    "type": "theme",
                    "description": "",
                    "documents": [],
                    "occurrences": 0,
                    "examples": [],
                    "confidence": 0.7
                }
                continue
            
            if not current_pattern:
                continue
            
            # Parse pattern fields
            if line.lower().startswith("type:"):
                pattern_type = line.split(":", 1)[1].strip().lower()
                if pattern_type in ["theme", "entity", "trend", "relationship"]:
                    current_pattern["type"] = pattern_type
            
            elif line.lower().startswith("description:"):
                current_pattern["description"] = line.split(":", 1)[1].strip()
            
            elif line.lower().startswith("documents:"):
                doc_ids_str = line.split(":", 1)[1].strip()
                # Try to extract document IDs
                for doc_id in document_ids:
                    if doc_id in doc_ids_str or document_name_map.get(doc_id, "") in doc_ids_str:
                        if doc_id not in current_pattern["documents"]:
                            current_pattern["documents"].append(doc_id)
            
            elif line.lower().startswith("occurrences:"):
                try:
                    current_pattern["occurrences"] = int(line.split(":", 1)[1].strip())
                except ValueError:
                    pass
            
            elif line.lower().startswith("confidence:"):
                try:
                    current_pattern["confidence"] = float(line.split(":", 1)[1].strip())
                except ValueError:
                    pass
            
            elif "document:" in line.lower() and "text:" in line.lower():
                # Parse example
                try:
                    parts = line.split("Text:")
                    doc_part = parts[0].split("Document:")[1].strip() if "Document:" in parts[0] else ""
                    text_part = parts[1].split("Page:")[0].strip().strip('"') if len(parts) > 1 else ""
                    page_part = parts[1].split("Page:")[1].strip() if len(parts) > 1 and "Page:" in parts[1] else None
                    
                    # Find matching document ID
                    doc_id = None
                    for did in document_ids:
                        if document_name_map.get(did, did) in doc_part or did in doc_part:
                            doc_id = did
                            break
                    
                    if doc_id and text_part:
                        page_num = None
                        if page_part:
                            try:
                                page_num = int(page_part.strip())
                            except ValueError:
                                pass
                        
                        current_pattern["examples"].append({
                            "document_id": doc_id,
                            "document_name": document_name_map.get(doc_id, doc_id),
                            "text": text_part[:200],  # Limit text length
                            "page": page_num
                        })
                except Exception:
                    pass
        
        if current_pattern:
            patterns.append(current_pattern)
        
        # Ensure we have at least document IDs
        for pattern in patterns:
            if not pattern["documents"]:
                pattern["documents"] = document_ids[:2]  # Default to first 2 docs
            if pattern["occurrences"] == 0:
                pattern["occurrences"] = len(pattern["documents"])
        
        return patterns
    
    def _parse_contradictions_from_response(
        self,
        response_text: str,
        document_ids: List[str],
        document_name_map: Dict[str, str],
        chunks_by_doc: Dict[str, List[ContextChunk]]
    ) -> List[Dict[str, Any]]:
        """Parse contradictions from LLM response"""
        contradictions = []
        lines = response_text.split("\n")
        
        current_contradiction = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Start of new contradiction
            if "[CONTRADICTION]" in line.upper() or line.upper().startswith("CONTRADICTION"):
                if current_contradiction:
                    contradictions.append(current_contradiction)
                current_contradiction = {
                    "type": "factual",
                    "description": "",
                    "documents": [],
                    "severity": "medium",
                    "confidence": 0.7
                }
                continue
            
            if not current_contradiction:
                continue
            
            # Parse contradiction fields
            if line.lower().startswith("type:"):
                contra_type = line.split(":", 1)[1].strip().lower()
                if contra_type in ["factual", "temporal", "quantitative", "categorical"]:
                    current_contradiction["type"] = contra_type
            
            elif line.lower().startswith("description:"):
                current_contradiction["description"] = line.split(":", 1)[1].strip()
            
            elif line.lower().startswith("severity:"):
                severity = line.split(":", 1)[1].strip().lower()
                if severity in ["low", "medium", "high"]:
                    current_contradiction["severity"] = severity
            
            elif line.lower().startswith("confidence:"):
                try:
                    current_contradiction["confidence"] = float(line.split(":", 1)[1].strip())
                except ValueError:
                    pass
            
            elif "document:" in line.lower() and "claim:" in line.lower():
                # Parse document claim
                try:
                    parts = line.split("Claim:")
                    doc_part = parts[0].split("Document:")[1].strip() if "Document:" in parts[0] else ""
                    claim_part = parts[1].split("Page:")[0].strip().strip('"') if len(parts) > 1 else ""
                    page_part = parts[1].split("Page:")[1].strip() if len(parts) > 1 and "Page:" in parts[1] else None
                    
                    # Find matching document ID
                    doc_id = None
                    for did in document_ids:
                        if document_name_map.get(did, did) in doc_part or did in doc_part:
                            doc_id = did
                            break
                    
                    if doc_id and claim_part:
                        page_num = None
                        if page_part:
                            try:
                                page_num = int(page_part.strip())
                            except ValueError:
                                pass
                        
                        current_contradiction["documents"].append({
                            "id": doc_id,
                            "name": document_name_map.get(doc_id, doc_id),
                            "claim": claim_part[:300],  # Limit claim length
                            "page": page_num
                        })
                except Exception:
                    pass
        
        if current_contradiction:
            contradictions.append(current_contradiction)
        
        # Ensure we have at least 2 documents for contradictions
        contradictions = [c for c in contradictions if len(c["documents"]) >= 2]
        
        return contradictions
    
    def _calculate_confidence(
        self,
        scores: List[float],
        citation_count: int
    ) -> float:
        """
        Calculate confidence score based on retrieval scores and citations
        
        Args:
            scores: Retrieval relevance scores
            citation_count: Number of citations in answer
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not scores:
            return 0.0
        
        # Average of top scores
        top_scores = sorted(scores, reverse=True)[:5]
        avg_score = sum(top_scores) / len(top_scores) if top_scores else 0.0
        
        # Normalize score (assuming scores are 0-1, adjust if different)
        normalized_score = min(avg_score, 1.0)
        
        # Boost confidence if multiple citations
        citation_boost = min(citation_count * 0.1, 0.3)
        
        confidence = min(normalized_score + citation_boost, 1.0)
        
        return round(confidence, 2)
    
    async def generate_comparison(
        self,
        document_ids: List[str],
        collection_name: str,
        document_name_map: Optional[Dict[str, str]] = None,
        retrieval_config: Optional[RetrievalConfig] = None,
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate comparison analysis (similarities and differences) for multiple documents
        
        Args:
            document_ids: List of document IDs to compare
            collection_name: Collection name to search
            document_name_map: Map of document_id to document_name
            retrieval_config: Retrieval configuration
            tenant_id: Optional tenant ID
            
        Returns:
            Dictionary with 'similarities' and 'differences' lists
        """
        if not document_ids or len(document_ids) < 2:
            raise GenerationValidationError("At least 2 documents are required for comparison")
        
        logger.info("Generating comparison", document_ids=document_ids, collection=collection_name)
        
        try:
            # Configure retrieval
            if not retrieval_config:
                retrieval_config = RetrievalConfig()
                retrieval_config.top_k = 50  # Get more chunks per document for comprehensive comparison
                retrieval_config.search_type = SearchType.HYBRID
                retrieval_config.query_expansion_enabled = True
            
            # Use a broad query similar to summary generation (this works well for retrieving document content)
            comparison_query = "document content information details topics themes sections key points findings conclusions data facts"
            
            # Retrieve chunks for each document (same pattern as generate_summary)
            chunks_by_document: Dict[str, List[ContextChunk]] = {}
            
            for doc_id in document_ids:
                logger.debug("Retrieving chunks for comparison", document_id=doc_id)
                
                # Try with metadata filter first (same as generate_summary)
                retrieval_config.metadata_filter = {"document_id": doc_id}
                
                # Retrieve chunks
                retrieval_result = await self.retrieval_service.retrieve(
                    query=comparison_query,
                    collection_name=collection_name,
                    config=retrieval_config,
                    tenant_id=tenant_id
                )
                
                # Always filter by document_id in memory (fallback if metadata filter didn't work)
                # This is the same pattern used in generate_summary which works
                if retrieval_result and retrieval_result.documents:
                    filtered_docs = []
                    filtered_metadata = []
                    filtered_scores = []
                    filtered_ids = []
                    filtered_distances = []
                    
                    for i, metadata in enumerate(retrieval_result.metadata):
                        doc_id_from_metadata = metadata.get("document_id")
                        if doc_id_from_metadata == doc_id:
                            filtered_docs.append(retrieval_result.documents[i])
                            filtered_metadata.append(metadata)
                            filtered_scores.append(retrieval_result.scores[i])
                            filtered_ids.append(retrieval_result.ids[i])
                            if retrieval_result.distances:
                                filtered_distances.append(retrieval_result.distances[i])
                    
                    # If we found filtered results, use them
                    if filtered_docs:
                        filtered_result = RetrievalResult(
                            ids=filtered_ids,
                            documents=filtered_docs,
                            metadata=filtered_metadata,
                            scores=filtered_scores,
                            distances=filtered_distances if filtered_distances else [1.0 - s for s in filtered_scores],
                            search_type=retrieval_result.search_type,
                            vector_scores=retrieval_result.vector_scores[:len(filtered_docs)] if retrieval_result.vector_scores else None,
                            keyword_scores=retrieval_result.keyword_scores[:len(filtered_docs)] if retrieval_result.keyword_scores else None
                        )
                        chunks_by_document[doc_id] = self._convert_to_context_chunks(filtered_result)
                        logger.debug(
                            "Retrieved chunks for document",
                            document_id=doc_id,
                            chunk_count=len(chunks_by_document[doc_id]),
                            original_count=len(retrieval_result.documents),
                            filtered_count=len(filtered_docs)
                        )
                    else:
                        logger.warning(
                            "No chunks found for document after filtering",
                            document_id=doc_id,
                            retrieved_count=len(retrieval_result.documents),
                            sample_metadata=retrieval_result.metadata[0] if retrieval_result.metadata else None
                        )
                        chunks_by_document[doc_id] = []
                else:
                    logger.warning(
                        "No retrieval result for document",
                        document_id=doc_id
                    )
                    chunks_by_document[doc_id] = []
            
            # Ensure we have chunks for all documents
            if not any(chunks_by_document.values()):
                raise GenerationError("No content found for comparison")
            
            # Generate comparison using insights generator
            comparison_data = await self.insights_generator.generate_comparison(
                chunks_by_document=chunks_by_document,
                document_name_map=document_name_map or {doc_id: doc_id for doc_id in document_ids},
                max_similarities=5,
                max_differences=5
            )
            
            return comparison_data
            
        except Exception as e:
            logger.error("Failed to generate comparison", error=str(e), document_ids=document_ids)
            raise GenerationError(f"Failed to generate comparison: {str(e)}")

