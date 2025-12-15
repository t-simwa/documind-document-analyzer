"""
Main generation service that orchestrates retrieval, prompt engineering, LLM calls, and response formatting
"""

from typing import List, Dict, Any, Optional, AsyncIterator
import structlog

from app.services.retrieval import RetrievalService, RetrievalConfig, RetrievalResult
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

