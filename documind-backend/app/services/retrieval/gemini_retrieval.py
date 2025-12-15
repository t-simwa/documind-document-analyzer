"""
Google Gemini-based retrieval service using File Search, Google Search, and Function Calling
Implements document retrieval using Gemini's native tools
"""

import asyncio
from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from .base import RetrievalResult, RetrievalConfig, SearchType
from .exceptions import RetrievalError

logger = structlog.get_logger(__name__)

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed. Gemini retrieval service will not be available.")


class GeminiRetrievalService:
    """
    Retrieval service using Gemini's File Search, Google Search, and Function Calling tools
    
    According to Google's API documentation:
    - File Search: Built-in tool for searching uploaded files
    - Google Search: Real-time web search integration
    - Function Calling: Custom retrieval logic via function definitions
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gemini-2.5-flash",
        enable_file_search: bool = True,
        enable_google_search: bool = False,
        file_search_store_id: Optional[str] = None
    ):
        """
        Initialize Gemini retrieval service
        
        Args:
            api_key: Gemini API key (defaults to settings)
            model: Gemini model to use
            enable_file_search: Enable File Search tool for document retrieval
            enable_google_search: Enable Google Search tool for external knowledge
            file_search_store_id: File Search store ID (if using File Search)
        """
        if not GEMINI_AVAILABLE:
            raise RetrievalError("google-genai package is not installed")
        
        self.api_key = api_key or settings.GEMINI_API_KEY
        if not self.api_key:
            raise RetrievalError("Gemini API key is required")
        
        self.model = model
        self.enable_file_search = enable_file_search
        self.enable_google_search = enable_google_search
        self.file_search_store_id = file_search_store_id
        
        self.client = genai.Client(api_key=self.api_key)
        
        logger.info(
            "gemini_retrieval_service_initialized",
            model=model,
            file_search=enable_file_search,
            google_search=enable_google_search
        )
    
    async def retrieve(
        self,
        query: str,
        collection_name: Optional[str] = None,
        config: Optional[RetrievalConfig] = None,
        tenant_id: Optional[str] = None,
        uploaded_file_uris: Optional[List[str]] = None
    ) -> RetrievalResult:
        """
        Retrieve documents using Gemini's File Search tool
        
        Args:
            query: Search query
            collection_name: Collection name (for compatibility, not used with File Search)
            config: Retrieval configuration
            tenant_id: Tenant ID (for compatibility)
            uploaded_file_uris: List of uploaded file URIs to search (from Files API)
            
        Returns:
            RetrievalResult with retrieved documents
        """
        if not query:
            return RetrievalResult(
                ids=[],
                documents=[],
                metadata=[],
                scores=[],
                distances=[],
                search_type=SearchType.VECTOR  # Gemini uses semantic search
            )
        
        config = config or RetrievalConfig()
        
        try:
            # Build tools configuration based on enabled features
            # According to Google's API docs, tools should be a list of tool definitions
            tools = []
            
            # Add File Search tool if enabled
            if self.enable_file_search:
                file_search_config = {}
                if self.file_search_store_id:
                    file_search_config["store_id"] = self.file_search_store_id
                tools.append({
                    "file_search": file_search_config if file_search_config else {}
                })
            
            # Add Google Search tool if enabled
            if self.enable_google_search:
                tools.append({
                    "google_search": {}
                })
            
            # Build the prompt for retrieval
            # File Search automatically searches uploaded files when the tool is enabled
            prompt = f"Search for information related to: {query}\n\n"
            prompt += "Extract relevant passages and provide citations."
            
            # If specific file URIs are provided, reference them
            if uploaded_file_uris:
                prompt += f"\n\nSearch in these files: {', '.join(uploaded_file_uris)}"
            
            # Generate content with tools enabled
            # Pass tools as config parameter according to Google's API
            generation_config = {}
            if tools:
                generation_config["tools"] = tools
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt,
                config=generation_config if generation_config else None
            )
            
            # Extract results from response
            # Gemini's File Search returns results in the response text
            # We need to parse the response to extract document chunks
            
            result_text = response.text if hasattr(response, 'text') and response.text else ""
            
            # Parse function calls if any (for custom retrieval)
            function_calls = []
            if hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'function_call'):
                                function_calls.append(part.function_call)
            
            # For now, return the text as a single document
            # In a production system, you'd parse the response more intelligently
            # to extract individual document chunks and citations
            
            # Split result into chunks (simple approach)
            # In production, parse citations and structure better
            chunks = self._extract_chunks_from_response(result_text)
            
            # Build RetrievalResult
            ids = [f"gemini_result_{i}" for i in range(len(chunks))]
            documents = chunks
            metadata = [
                {
                    "source": "gemini_file_search",
                    "query": query,
                    "chunk_index": i,
                    "function_calls": len(function_calls)
                }
                for i in range(len(chunks))
            ]
            scores = [1.0] * len(chunks)  # Gemini doesn't provide scores, use default
            distances = [0.0] * len(chunks)
            
            logger.info(
                "gemini_retrieval_completed",
                query=query,
                chunks_found=len(chunks),
                function_calls=len(function_calls)
            )
            
            return RetrievalResult(
                ids=ids,
                documents=documents,
                metadata=metadata,
                scores=scores,
                distances=distances,
                search_type=SearchType.VECTOR
            )
            
        except Exception as e:
            logger.error("gemini_retrieval_error", error=str(e), query=query)
            raise RetrievalError(f"Gemini retrieval failed: {str(e)}")
    
    def _extract_chunks_from_response(self, response_text: str) -> List[str]:
        """
        Extract document chunks from Gemini's response
        
        In production, this would parse citations and structure better
        """
        # Simple chunking by paragraphs
        paragraphs = [p.strip() for p in response_text.split('\n\n') if p.strip()]
        
        # Filter out very short paragraphs (likely formatting artifacts)
        chunks = [p for p in paragraphs if len(p) > 50]
        
        # If no good chunks, return the whole text as one chunk
        if not chunks:
            chunks = [response_text]
        
        return chunks
    
    async def retrieve_with_function_calling(
        self,
        query: str,
        custom_functions: List[Dict[str, Any]],
        config: Optional[RetrievalConfig] = None
    ) -> RetrievalResult:
        """
        Retrieve documents using Function Calling for custom retrieval logic
        
        Args:
            query: Search query
            custom_functions: List of function definitions for custom retrieval
            config: Retrieval configuration
            
        Returns:
            RetrievalResult with retrieved documents
            
        Example custom_functions:
        [
            {
                "name": "search_documents",
                "description": "Search documents by keyword",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "document_ids": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["query"]
                }
            }
        ]
        """
        if not query:
            return RetrievalResult(
                ids=[],
                documents=[],
                metadata=[],
                scores=[],
                distances=[],
                search_type=SearchType.VECTOR
            )
        
        config = config or RetrievalConfig()
        
        try:
            # Build tools with function definitions
            # According to Google's API, function declarations go in tools
            tools = [
                {
                    "function_declarations": custom_functions
                }
            ]
            
            prompt = f"Search for information related to: {query}\n\n"
            prompt += "Use the provided functions to retrieve relevant documents."
            
            generation_config = {"tools": tools}
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt,
                config=generation_config
            )
            
            # Extract function calls from response
            function_calls = []
            result_text = ""
            
            if hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'function_call'):
                                function_calls.append(part.function_call)
                            elif hasattr(part, 'text'):
                                result_text += part.text
            
            # Process function calls (in production, execute them and get results)
            # For now, return the text response
            chunks = self._extract_chunks_from_response(result_text)
            
            ids = [f"gemini_function_{i}" for i in range(len(chunks))]
            documents = chunks
            metadata = [
                {
                    "source": "gemini_function_calling",
                    "query": query,
                    "chunk_index": i,
                    "function_calls": len(function_calls),
                    "functions_used": [fc.name for fc in function_calls if hasattr(fc, 'name')]
                }
                for i in range(len(chunks))
            ]
            scores = [1.0] * len(chunks)
            distances = [0.0] * len(chunks)
            
            logger.info(
                "gemini_function_calling_retrieval_completed",
                query=query,
                chunks_found=len(chunks),
                function_calls=len(function_calls)
            )
            
            return RetrievalResult(
                ids=ids,
                documents=documents,
                metadata=metadata,
                scores=scores,
                distances=distances,
                search_type=SearchType.VECTOR
            )
            
        except Exception as e:
            logger.error("gemini_function_calling_error", error=str(e), query=query)
            raise RetrievalError(f"Gemini function calling retrieval failed: {str(e)}")
    
    async def retrieve_with_google_search(
        self,
        query: str,
        config: Optional[RetrievalConfig] = None
    ) -> RetrievalResult:
        """
        Retrieve external knowledge using Google Search tool
        
        Args:
            query: Search query
            config: Retrieval configuration
            
        Returns:
            RetrievalResult with web search results
        """
        if not query:
            return RetrievalResult(
                ids=[],
                documents=[],
                metadata=[],
                scores=[],
                distances=[],
                search_type=SearchType.VECTOR
            )
        
        config = config or RetrievalConfig()
        
        try:
            # Enable Google Search tool
            tools = [{"google_search": {}}]
            
            prompt = f"Search the web for: {query}\n\n"
            prompt += "Provide relevant information with sources."
            
            generation_config = {"tools": tools}
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt,
                config=generation_config
            )
            
            result_text = response.text if hasattr(response, 'text') and response.text else ""
            
            # Extract chunks from web search results
            chunks = self._extract_chunks_from_response(result_text)
            
            ids = [f"google_search_{i}" for i in range(len(chunks))]
            documents = chunks
            metadata = [
                {
                    "source": "google_search",
                    "query": query,
                    "chunk_index": i,
                    "external": True
                }
                for i in range(len(chunks))
            ]
            scores = [1.0] * len(chunks)
            distances = [0.0] * len(chunks)
            
            logger.info(
                "google_search_retrieval_completed",
                query=query,
                chunks_found=len(chunks)
            )
            
            return RetrievalResult(
                ids=ids,
                documents=documents,
                metadata=metadata,
                scores=scores,
                distances=distances,
                search_type=SearchType.VECTOR
            )
            
        except Exception as e:
            logger.error("google_search_error", error=str(e), query=query)
            raise RetrievalError(f"Google Search retrieval failed: {str(e)}")

