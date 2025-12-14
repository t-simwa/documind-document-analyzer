"""
Google Gemini embedding service implementation
"""

import asyncio
from typing import List, Dict, Any
import httpx
import structlog

from app.core.config import settings
from .base import BaseEmbeddingService, EmbeddingResult
from .exceptions import EmbeddingError, EmbeddingProviderError, EmbeddingRateLimitError, EmbeddingTimeoutError

logger = structlog.get_logger(__name__)


class GeminiEmbeddingService(BaseEmbeddingService):
    """Google Gemini embedding service"""
    
    # Model dimensions mapping
    MODEL_DIMENSIONS = {
        "models/embedding-001": 768,
    }
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        max_retries: int = None,
        timeout: int = None
    ):
        """
        Initialize Gemini embedding service
        
        Args:
            api_key: Gemini API key (defaults to settings)
            model: Model name (defaults to settings)
            max_retries: Max retries (defaults to settings)
            timeout: Timeout in seconds (defaults to settings)
        """
        api_key = api_key or settings.GEMINI_API_KEY
        model = model or settings.GEMINI_EMBEDDING_MODEL
        max_retries = max_retries or settings.GEMINI_MAX_RETRIES
        timeout = timeout or settings.GEMINI_TIMEOUT
        
        if not api_key:
            raise EmbeddingError("Gemini API key is required", provider="gemini")
        
        super().__init__(api_key, model, max_retries, timeout)
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.provider_name = "gemini"
    
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = 100,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings for texts using Gemini API
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts per batch
            **kwargs: Additional arguments (task_type)
            
        Returns:
            EmbeddingResult with embeddings
        """
        self._validate_texts(texts)
        
        batches = self._batch_texts(texts, batch_size)
        all_embeddings = []
        task_type = kwargs.get("task_type", "RETRIEVAL_DOCUMENT")
        
        logger.info(
            "gemini_embedding_started",
            provider="gemini",
            model=self.model,
            text_count=len(texts),
            batch_count=len(batches),
            task_type=task_type
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for batch_idx, batch in enumerate(batches):
                try:
                    # Gemini processes one text at a time
                    batch_embeddings = []
                    for text in batch:
                        embedding = await self._embed_single(
                            client, text, task_type=task_type, **kwargs
                        )
                        batch_embeddings.append(embedding)
                    
                    all_embeddings.extend(batch_embeddings)
                    
                    logger.debug(
                        "gemini_batch_completed",
                        batch_index=batch_idx + 1,
                        total_batches=len(batches),
                        batch_size=len(batch)
                    )
                    
                    # Rate limiting: Gemini allows 60 requests/minute
                    if batch_idx < len(batches) - 1:
                        await asyncio.sleep(1)  # Delay to respect rate limits
                
                except Exception as e:
                    logger.error(
                        "gemini_batch_failed",
                        batch_index=batch_idx,
                        error=str(e)
                    )
                    raise EmbeddingProviderError(
                        f"Failed to embed batch {batch_idx + 1}: {str(e)}",
                        provider="gemini"
                    ) from e
        
        logger.info(
            "gemini_embedding_completed",
            provider="gemini",
            model=self.model,
            embedding_count=len(all_embeddings)
        )
        
        return EmbeddingResult(
            embeddings=all_embeddings,
            model=self.model,
            provider="gemini",
            metadata={
                "total_texts": len(texts),
                "batch_count": len(batches),
                "dimension": self.get_embedding_dimension(),
                "task_type": task_type
            }
        )
    
    async def _embed_single(
        self,
        client: httpx.AsyncClient,
        text: str,
        task_type: str = "RETRIEVAL_DOCUMENT",
        **kwargs
    ) -> List[float]:
        """Embed a single text with retry logic"""
        url = f"{self.base_url}/{self.model}:embedContent"
        params = {"key": self.api_key}
        
        payload = {
            "model": self.model,
            "content": {
                "parts": [{"text": text}]
            },
            "taskType": task_type
        }
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                response = await client.post(url, json=payload, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    embedding = data.get("embedding", {}).get("values", [])
                    if not embedding:
                        raise EmbeddingProviderError(
                            "No embedding returned from Gemini API",
                            provider="gemini"
                        )
                    return embedding
                
                elif response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    if attempt < self.max_retries - 1:
                        logger.warning(
                            "gemini_rate_limit",
                            retry_after=retry_after,
                            attempt=attempt + 1
                        )
                        await asyncio.sleep(retry_after)
                        continue
                    raise EmbeddingRateLimitError(
                        "Gemini API rate limit exceeded",
                        provider="gemini",
                        error_code="rate_limit"
                    )
                
                elif response.status_code == 401:
                    raise EmbeddingError(
                        "Invalid Gemini API key",
                        provider="gemini",
                        error_code="unauthorized"
                    )
                
                else:
                    error_data = response.json() if response.content else {}
                    error_msg = error_data.get("error", {}).get("message", "Unknown error")
                    raise EmbeddingProviderError(
                        f"Gemini API error: {error_msg}",
                        provider="gemini",
                        error_code=str(response.status_code)
                    )
            
            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise EmbeddingTimeoutError(
                    f"Gemini API request timed out after {self.timeout}s",
                    provider="gemini"
                ) from e
            
            except httpx.RequestError as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise EmbeddingProviderError(
                    f"Gemini API request failed: {str(e)}",
                    provider="gemini"
                ) from e
        
        raise EmbeddingProviderError(
            f"Failed after {self.max_retries} attempts: {str(last_error)}",
            provider="gemini"
        )
    
    async def embed_query(self, query: str, **kwargs) -> List[float]:
        """Generate embedding for a single query"""
        # Use RETRIEVAL_QUERY task type for queries
        result = await self.embed_texts(
            [query],
            batch_size=1,
            task_type="RETRIEVAL_QUERY",
            **kwargs
        )
        return result.embeddings[0]
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension for the current model"""
        return self.MODEL_DIMENSIONS.get(self.model, 768)

