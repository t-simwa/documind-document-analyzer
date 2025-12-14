"""
Main embedding service with provider abstraction and caching
"""

import hashlib
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import structlog

from app.core.config import settings
from .base import BaseEmbeddingService, EmbeddingResult
from .openai_embedding import OpenAIEmbeddingService
from .cohere_embedding import CohereEmbeddingService
from .gemini_embedding import GeminiEmbeddingService
from .exceptions import EmbeddingError, EmbeddingConfigurationError

# Optional import for Sentence Transformers
try:
    from .sentence_transformer_embedding import SentenceTransformerEmbeddingService
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformerEmbeddingService = None

logger = structlog.get_logger(__name__)


class EmbeddingCache:
    """Simple in-memory cache for embeddings"""
    
    def __init__(self, ttl: int = 86400):
        """
        Initialize embedding cache
        
        Args:
            ttl: Time to live in seconds (default: 24 hours)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl
    
    def _get_cache_key(self, text: str, model: str, provider: str, **kwargs) -> str:
        """Generate cache key from text and parameters"""
        cache_data = {
            "text": text,
            "model": model,
            "provider": provider,
            **kwargs
        }
        cache_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(cache_str.encode()).hexdigest()
    
    def get(self, text: str, model: str, provider: str, **kwargs) -> Optional[List[float]]:
        """Get embedding from cache if available and not expired"""
        if not settings.EMBEDDING_CACHE_ENABLED:
            return None
        
        cache_key = self._get_cache_key(text, model, provider, **kwargs)
        
        if cache_key in self.cache:
            cached_item = self.cache[cache_key]
            if datetime.now() < cached_item["expires_at"]:
                logger.debug("embedding_cache_hit", cache_key=cache_key[:8])
                return cached_item["embedding"]
            else:
                # Expired, remove from cache
                del self.cache[cache_key]
        
        return None
    
    def set(self, text: str, model: str, provider: str, embedding: List[float], **kwargs) -> None:
        """Store embedding in cache"""
        if not settings.EMBEDDING_CACHE_ENABLED:
            return
        
        cache_key = self._get_cache_key(text, model, provider, **kwargs)
        self.cache[cache_key] = {
            "embedding": embedding,
            "expires_at": datetime.now() + timedelta(seconds=self.ttl)
        }
        logger.debug("embedding_cache_set", cache_key=cache_key[:8])
    
    def clear(self) -> None:
        """Clear all cached embeddings"""
        self.cache.clear()
        logger.info("embedding_cache_cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self.cache),
            "ttl": self.ttl,
            "enabled": settings.EMBEDDING_CACHE_ENABLED
        }


class EmbeddingService:
    """
    Main embedding service with provider abstraction and caching
    """
    
    def __init__(
        self,
        provider: str = None,
        cache_enabled: bool = None,
        cache_ttl: int = None
    ):
        """
        Initialize embedding service
        
        Args:
            provider: Embedding provider (openai, cohere, gemini)
            cache_enabled: Enable embedding cache
            cache_ttl: Cache TTL in seconds
        """
        self.provider_name = provider or settings.EMBEDDING_PROVIDER
        self.cache_enabled = cache_enabled if cache_enabled is not None else settings.EMBEDDING_CACHE_ENABLED
        self.cache_ttl = cache_ttl or settings.EMBEDDING_CACHE_TTL
        
        # Initialize cache
        self.cache = EmbeddingCache(ttl=self.cache_ttl) if self.cache_enabled else None
        
        # Initialize provider
        self.provider = self._create_provider()
        
        # Get model name safely (handle SentenceTransformer objects)
        model_name = getattr(self.provider, 'model_name', None)
        if not model_name:
            # For Sentence Transformers, use model_name attribute
            if hasattr(self.provider, 'model_name'):
                model_name = self.provider.model_name
            else:
                # For other providers, use model attribute (should be a string)
                model_attr = getattr(self.provider, 'model', 'unknown')
                model_name = str(model_attr) if not isinstance(model_attr, str) else model_attr
        
        logger.info(
            "embedding_service_initialized",
            provider=self.provider_name,
            model=model_name,
            cache_enabled=self.cache_enabled
        )
    
    def _create_provider(self) -> BaseEmbeddingService:
        """Create embedding provider instance"""
        provider_name = self.provider_name.lower()
        
        if provider_name == "openai":
            return OpenAIEmbeddingService()
        elif provider_name == "cohere":
            return CohereEmbeddingService()
        elif provider_name == "gemini":
            return GeminiEmbeddingService()
        elif provider_name == "sentence-transformers":
            if not SENTENCE_TRANSFORMERS_AVAILABLE:
                raise EmbeddingConfigurationError(
                    "sentence-transformers is not installed. "
                    "Install it with: pip install sentence-transformers",
                    provider="sentence-transformers"
                )
            from app.core.config import settings
            model_name = getattr(settings, 'SENTENCE_TRANSFORMER_MODEL', 'all-MiniLM-L6-v2')
            return SentenceTransformerEmbeddingService(model_name=model_name)
        else:
            supported = "openai, cohere, gemini"
            if SENTENCE_TRANSFORMERS_AVAILABLE:
                supported += ", sentence-transformers"
            raise EmbeddingConfigurationError(
                f"Unknown embedding provider: {provider_name}. "
                f"Supported providers: {supported}",
                provider=provider_name
            )
    
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = None,
        use_cache: bool = True,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings for texts with caching support
        
        Args:
            texts: List of texts to embed
            batch_size: Batch size for processing
            use_cache: Whether to use cache
            **kwargs: Provider-specific arguments
            
        Returns:
            EmbeddingResult with embeddings
        """
        batch_size = batch_size or settings.EMBEDDING_BATCH_SIZE
        
        # Get model name safely (handle SentenceTransformer objects)
        model_name = getattr(self.provider, 'model_name', None)
        if not model_name:
            # For Sentence Transformers, use model_name attribute
            if hasattr(self.provider, 'model_name'):
                model_name = self.provider.model_name
            else:
                # For other providers, use model attribute (should be a string)
                model_attr = getattr(self.provider, 'model', 'unknown')
                model_name = str(model_attr) if not isinstance(model_attr, str) else model_attr
        
        # Check cache for each text
        cached_embeddings = {}
        texts_to_embed = []
        text_indices = []
        
        if use_cache and self.cache:
            for idx, text in enumerate(texts):
                cached = self.cache.get(
                    text,
                    model_name,  # Use model name string, not the object
                    self.provider_name,
                    **kwargs
                )
                if cached:
                    cached_embeddings[idx] = cached
                else:
                    texts_to_embed.append(text)
                    text_indices.append(idx)
        else:
            texts_to_embed = texts
            text_indices = list(range(len(texts)))
        
        # Generate embeddings for uncached texts
        new_embeddings = []
        if texts_to_embed:
            result = await self.provider.embed_texts(
                texts_to_embed,
                batch_size=batch_size,
                **kwargs
            )
            new_embeddings = result.embeddings
            
            # Store in cache
            if use_cache and self.cache:
                for text, embedding in zip(texts_to_embed, new_embeddings):
                    self.cache.set(
                        text,
                        model_name,  # Use model name string, not the object
                        self.provider_name,
                        embedding,
                        **kwargs
                    )
        
        # Combine cached and new embeddings in correct order
        all_embeddings = []
        new_idx = 0
        for idx in range(len(texts)):
            if idx in cached_embeddings:
                all_embeddings.append(cached_embeddings[idx])
            else:
                all_embeddings.append(new_embeddings[new_idx])
                new_idx += 1
        
        cache_hits = len(cached_embeddings)
        cache_misses = len(texts_to_embed)
        
        # Get model name safely (handle SentenceTransformer objects)
        model_name = getattr(self.provider, 'model_name', None) or str(getattr(self.provider, 'model', 'unknown'))
        if hasattr(self.provider, 'model') and not isinstance(self.provider.model, str):
            model_name = getattr(self.provider, 'model_name', str(self.provider.model))
        
        logger.info(
            "embedding_generation_completed",
            provider=self.provider_name,
            model=model_name,
            total_texts=len(texts),
            cache_hits=cache_hits,
            cache_misses=cache_misses
        )
        
        # Get model name safely (handle SentenceTransformer objects)
        model_name = getattr(self.provider, 'model_name', None)
        if not model_name:
            # For Sentence Transformers, use model_name attribute
            if hasattr(self.provider, 'model_name'):
                model_name = self.provider.model_name
            else:
                # For other providers, use model attribute (should be a string)
                model_attr = getattr(self.provider, 'model', 'unknown')
                model_name = str(model_attr) if not isinstance(model_attr, str) else model_attr
        
        return EmbeddingResult(
            embeddings=all_embeddings,
            model=model_name,  # Use string model name, not the object
            provider=self.provider_name,
            metadata={
                "total_texts": len(texts),
                "cache_hits": cache_hits,
                "cache_misses": cache_misses,
                "dimension": self.provider.get_embedding_dimension()
            }
        )
    
    async def embed_query(self, query: str, use_cache: bool = True, **kwargs) -> List[float]:
        """
        Generate embedding for a single query
        
        Args:
            query: Query text
            use_cache: Whether to use cache
            **kwargs: Provider-specific arguments
            
        Returns:
            Embedding vector
        """
        # Get model name safely (handle SentenceTransformer objects)
        model_name = getattr(self.provider, 'model_name', None)
        if not model_name:
            if hasattr(self.provider, 'model_name'):
                model_name = self.provider.model_name
            else:
                model_attr = getattr(self.provider, 'model', 'unknown')
                model_name = str(model_attr) if not isinstance(model_attr, str) else model_attr
        
        # Check cache
        if use_cache and self.cache:
            cached = self.cache.get(
                query,
                model_name,  # Use model name string, not the object
                self.provider_name,
                **kwargs
            )
            if cached:
                logger.debug("embedding_query_cache_hit")
                return cached
        
        # Generate embedding
        embedding = await self.provider.embed_query(query, **kwargs)
        
        # Store in cache
        if use_cache and self.cache:
            self.cache.set(
                query,
                model_name,  # Use model name string, not the object
                self.provider_name,
                embedding,
                **kwargs
            )
        
        return embedding
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        return self.provider.get_embedding_dimension()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if self.cache:
            return self.cache.get_stats()
        return {"enabled": False}
    
    def clear_cache(self) -> None:
        """Clear embedding cache"""
        if self.cache:
            self.cache.clear()

