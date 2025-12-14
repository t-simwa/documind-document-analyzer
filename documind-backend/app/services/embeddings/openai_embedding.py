"""
OpenAI embedding service implementation
"""

import asyncio
from typing import List, Dict, Any
import httpx
import structlog

from app.core.config import settings
from .base import BaseEmbeddingService, EmbeddingResult
from .exceptions import EmbeddingError, EmbeddingProviderError, EmbeddingRateLimitError, EmbeddingTimeoutError

logger = structlog.get_logger(__name__)


class OpenAIEmbeddingService(BaseEmbeddingService):
    """OpenAI embedding service"""
    
    # Model dimensions mapping
    MODEL_DIMENSIONS = {
        "text-embedding-ada-002": 1536,
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
    }
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        max_retries: int = None,
        timeout: int = None
    ):
        """
        Initialize OpenAI embedding service
        
        Args:
            api_key: OpenAI API key (defaults to settings)
            model: Model name (defaults to settings)
            max_retries: Max retries (defaults to settings)
            timeout: Timeout in seconds (defaults to settings)
        """
        api_key = api_key or settings.OPENAI_API_KEY
        model = model or settings.OPENAI_EMBEDDING_MODEL
        max_retries = max_retries or settings.OPENAI_MAX_RETRIES
        timeout = timeout or settings.OPENAI_TIMEOUT
        
        if not api_key:
            raise EmbeddingError("OpenAI API key is required", provider="openai")
        
        super().__init__(api_key, model, max_retries, timeout)
        self.base_url = "https://api.openai.com/v1"
        self.provider_name = "openai"
    
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = 100,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings for texts using OpenAI API
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts per batch (OpenAI supports up to 2048)
            **kwargs: Additional arguments (dimensions for text-embedding-3 models)
            
        Returns:
            EmbeddingResult with embeddings
        """
        self._validate_texts(texts)
        
        # OpenAI batch limit is 2048, but we use configurable batch_size
        batch_size = min(batch_size, 2048)
        batches = self._batch_texts(texts, batch_size)
        
        all_embeddings = []
        total_tokens = 0
        
        logger.info(
            "openai_embedding_started",
            provider="openai",
            model=self.model,
            text_count=len(texts),
            batch_count=len(batches)
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for batch_idx, batch in enumerate(batches):
                try:
                    embeddings = await self._embed_batch(client, batch, **kwargs)
                    all_embeddings.extend(embeddings)
                    
                    logger.debug(
                        "openai_batch_completed",
                        batch_index=batch_idx + 1,
                        total_batches=len(batches),
                        batch_size=len(batch)
                    )
                    
                    # Rate limiting: OpenAI allows 3000 requests/minute
                    if batch_idx < len(batches) - 1:
                        await asyncio.sleep(0.1)  # Small delay between batches
                
                except Exception as e:
                    logger.error(
                        "openai_batch_failed",
                        batch_index=batch_idx,
                        error=str(e)
                    )
                    raise EmbeddingProviderError(
                        f"Failed to embed batch {batch_idx + 1}: {str(e)}",
                        provider="openai"
                    ) from e
        
        logger.info(
            "openai_embedding_completed",
            provider="openai",
            model=self.model,
            embedding_count=len(all_embeddings)
        )
        
        return EmbeddingResult(
            embeddings=all_embeddings,
            model=self.model,
            provider="openai",
            metadata={
                "total_texts": len(texts),
                "batch_count": len(batches),
                "dimension": self.get_embedding_dimension()
            }
        )
    
    async def _embed_batch(
        self,
        client: httpx.AsyncClient,
        texts: List[str],
        **kwargs
    ) -> List[List[float]]:
        """Embed a single batch of texts with retry logic"""
        url = f"{self.base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare request payload
        payload = {
            "model": self.model,
            "input": texts
        }
        
        # Add dimensions for text-embedding-3 models if specified
        if "dimensions" in kwargs and self.model.startswith("text-embedding-3"):
            payload["dimensions"] = kwargs["dimensions"]
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return [item["embedding"] for item in data["data"]]
                
                elif response.status_code == 429:
                    # Rate limit error
                    retry_after = int(response.headers.get("Retry-After", 60))
                    if attempt < self.max_retries - 1:
                        logger.warning(
                            "openai_rate_limit",
                            retry_after=retry_after,
                            attempt=attempt + 1
                        )
                        await asyncio.sleep(retry_after)
                        continue
                    raise EmbeddingRateLimitError(
                        "OpenAI API rate limit exceeded",
                        provider="openai",
                        error_code="rate_limit"
                    )
                
                elif response.status_code == 401:
                    raise EmbeddingError(
                        "Invalid OpenAI API key",
                        provider="openai",
                        error_code="unauthorized"
                    )
                
                else:
                    error_data = response.json() if response.content else {}
                    error_msg = error_data.get("error", {}).get("message", "Unknown error")
                    raise EmbeddingProviderError(
                        f"OpenAI API error: {error_msg}",
                        provider="openai",
                        error_code=str(response.status_code)
                    )
            
            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise EmbeddingTimeoutError(
                    f"OpenAI API request timed out after {self.timeout}s",
                    provider="openai"
                ) from e
            
            except httpx.RequestError as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise EmbeddingProviderError(
                    f"OpenAI API request failed: {str(e)}",
                    provider="openai"
                ) from e
        
        raise EmbeddingProviderError(
            f"Failed after {self.max_retries} attempts: {str(last_error)}",
            provider="openai"
        )
    
    async def embed_query(self, query: str, **kwargs) -> List[float]:
        """Generate embedding for a single query"""
        result = await self.embed_texts([query], batch_size=1, **kwargs)
        return result.embeddings[0]
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension for the current model"""
        # Check if dimensions specified in kwargs
        if hasattr(self, '_dimensions'):
            return self._dimensions
        
        # Return default dimension for model
        return self.MODEL_DIMENSIONS.get(self.model, 1536)

