"""
Cohere embedding service implementation
"""

import asyncio
from typing import List, Dict, Any
import httpx
import structlog

from app.core.config import settings
from .base import BaseEmbeddingService, EmbeddingResult
from .exceptions import EmbeddingError, EmbeddingProviderError, EmbeddingRateLimitError, EmbeddingTimeoutError

logger = structlog.get_logger(__name__)


class CohereEmbeddingService(BaseEmbeddingService):
    """Cohere embedding service"""
    
    # Model dimensions mapping
    MODEL_DIMENSIONS = {
        "embed-english-v3.0": 1024,
        "embed-multilingual-v3.0": 1024,
        "embed-english-light-v3.0": 384,
        "embed-multilingual-light-v3.0": 384,
    }
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        max_retries: int = None,
        timeout: int = None
    ):
        """
        Initialize Cohere embedding service
        
        Args:
            api_key: Cohere API key (defaults to settings)
            model: Model name (defaults to settings)
            max_retries: Max retries (defaults to settings)
            timeout: Timeout in seconds (defaults to settings)
        """
        api_key = api_key or settings.COHERE_API_KEY
        model = model or settings.COHERE_EMBEDDING_MODEL
        max_retries = max_retries or settings.COHERE_MAX_RETRIES
        timeout = timeout or settings.COHERE_TIMEOUT
        
        if not api_key:
            raise EmbeddingError("Cohere API key is required", provider="cohere")
        
        super().__init__(api_key, model, max_retries, timeout)
        self.base_url = "https://api.cohere.ai/v1"
        self.provider_name = "cohere"
    
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = 96,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings for texts using Cohere API
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts per batch (Cohere supports up to 96)
            **kwargs: Additional arguments (input_type, truncate)
            
        Returns:
            EmbeddingResult with embeddings
        """
        self._validate_texts(texts)
        
        # Cohere batch limit is 96
        batch_size = min(batch_size, 96)
        batches = self._batch_texts(texts, batch_size)
        
        all_embeddings = []
        input_type = kwargs.get("input_type", "search_document")
        
        logger.info(
            "cohere_embedding_started",
            provider="cohere",
            model=self.model,
            text_count=len(texts),
            batch_count=len(batches),
            input_type=input_type
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for batch_idx, batch in enumerate(batches):
                try:
                    embeddings = await self._embed_batch(
                        client, batch, input_type=input_type, **kwargs
                    )
                    all_embeddings.extend(embeddings)
                    
                    logger.debug(
                        "cohere_batch_completed",
                        batch_index=batch_idx + 1,
                        total_batches=len(batches),
                        batch_size=len(batch)
                    )
                    
                    # Rate limiting: Cohere allows 100 requests/minute
                    if batch_idx < len(batches) - 1:
                        await asyncio.sleep(0.6)  # Delay to respect rate limits
                
                except Exception as e:
                    logger.error(
                        "cohere_batch_failed",
                        batch_index=batch_idx,
                        error=str(e)
                    )
                    raise EmbeddingProviderError(
                        f"Failed to embed batch {batch_idx + 1}: {str(e)}",
                        provider="cohere"
                    ) from e
        
        logger.info(
            "cohere_embedding_completed",
            provider="cohere",
            model=self.model,
            embedding_count=len(all_embeddings)
        )
        
        return EmbeddingResult(
            embeddings=all_embeddings,
            model=self.model,
            provider="cohere",
            metadata={
                "total_texts": len(texts),
                "batch_count": len(batches),
                "dimension": self.get_embedding_dimension(),
                "input_type": input_type
            }
        )
    
    async def _embed_batch(
        self,
        client: httpx.AsyncClient,
        texts: List[str],
        input_type: str = "search_document",
        **kwargs
    ) -> List[List[float]]:
        """Embed a single batch of texts with retry logic"""
        url = f"{self.base_url}/embed"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "texts": texts,
            "input_type": input_type,
            "truncate": kwargs.get("truncate", "END")
        }
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("embeddings", [])
                
                elif response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    if attempt < self.max_retries - 1:
                        logger.warning(
                            "cohere_rate_limit",
                            retry_after=retry_after,
                            attempt=attempt + 1
                        )
                        await asyncio.sleep(retry_after)
                        continue
                    raise EmbeddingRateLimitError(
                        "Cohere API rate limit exceeded",
                        provider="cohere",
                        error_code="rate_limit"
                    )
                
                elif response.status_code == 401:
                    raise EmbeddingError(
                        "Invalid Cohere API key",
                        provider="cohere",
                        error_code="unauthorized"
                    )
                
                else:
                    error_data = response.json() if response.content else {}
                    error_msg = error_data.get("message", "Unknown error")
                    raise EmbeddingProviderError(
                        f"Cohere API error: {error_msg}",
                        provider="cohere",
                        error_code=str(response.status_code)
                    )
            
            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise EmbeddingTimeoutError(
                    f"Cohere API request timed out after {self.timeout}s",
                    provider="cohere"
                ) from e
            
            except httpx.RequestError as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise EmbeddingProviderError(
                    f"Cohere API request failed: {str(e)}",
                    provider="cohere"
                ) from e
        
        raise EmbeddingProviderError(
            f"Failed after {self.max_retries} attempts: {str(last_error)}",
            provider="cohere"
        )
    
    async def embed_query(self, query: str, **kwargs) -> List[float]:
        """Generate embedding for a single query"""
        # Use search_query input type for queries
        result = await self.embed_texts(
            [query],
            batch_size=1,
            input_type="search_query",
            **kwargs
        )
        return result.embeddings[0]
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension for the current model"""
        return self.MODEL_DIMENSIONS.get(self.model, 1024)

