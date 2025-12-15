"""
Sentence Transformers embedding service (Free, Local)
"""

from typing import List, Dict, Optional
import structlog
import threading

from .base import BaseEmbeddingService, EmbeddingResult
from .exceptions import EmbeddingError, EmbeddingProviderError

logger = structlog.get_logger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not installed, SentenceTransformerEmbeddingService will not be available")

# Global model cache to prevent multiple loads of the same model
_model_cache: Dict[str, SentenceTransformer] = {}
_model_lock = threading.Lock()


class SentenceTransformerEmbeddingService(BaseEmbeddingService):
    """Sentence Transformers embedding service (free, local)"""
    
    # Model dimensions mapping
    MODEL_DIMENSIONS = {
        "all-MiniLM-L6-v2": 384,
        "all-mpnet-base-v2": 768,
        "paraphrase-multilingual-MiniLM-L12-v2": 384,
        "all-MiniLM-L12-v2": 384,
    }
    
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        max_retries: int = 0,
        timeout: int = 0
    ):
        """
        Initialize Sentence Transformers service
        
        Args:
            model_name: Model name from Hugging Face
                Popular models:
                - all-MiniLM-L6-v2 (384 dim, fast, good quality) - Recommended
                - all-mpnet-base-v2 (768 dim, better quality, slower)
                - paraphrase-multilingual-MiniLM-L12-v2 (384 dim, multilingual)
                - all-MiniLM-L12-v2 (384 dim, slightly better than L6)
            max_retries: Not used (local model, no retries needed)
            timeout: Not used (local model, no timeout needed)
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is not installed. Install it with: pip install sentence-transformers"
            )
        
        super().__init__(api_key="", model=model_name, max_retries=max_retries, timeout=timeout)
        self.provider_name = "sentence-transformers"
        self.model_name = model_name
        
        # Check if model is already cached
        with _model_lock:
            if model_name in _model_cache:
                logger.debug(
                    "using_cached_sentence_transformer_model",
                    model=model_name,
                    provider="sentence-transformers"
                )
                self.model = _model_cache[model_name]
            else:
                try:
                    logger.info(
                        "loading_sentence_transformer_model",
                        model=model_name,
                        provider="sentence-transformers"
                    )
                    
                    # Try to load the model with workaround for PyTorch meta tensor issue
                    try:
                        self.model = SentenceTransformer(model_name)
                    except NotImplementedError as e:
                        if "meta tensor" in str(e).lower() or "to_empty" in str(e).lower():
                            # PyTorch compatibility issue - try loading with device explicitly set
                            import torch
                            logger.warning(
                                "meta_tensor_error_detected",
                                error=str(e),
                                attempting_workaround=True
                            )
                            # Try loading with explicit device handling
                            try:
                                # Force CPU device to avoid meta tensor issues
                                self.model = SentenceTransformer(model_name, device='cpu')
                            except Exception as e2:
                                logger.error(
                                    "workaround_failed",
                                    error=str(e2),
                                    original_error=str(e)
                                )
                                raise EmbeddingError(
                                    f"Failed to load Sentence Transformer model '{model_name}' due to PyTorch compatibility issue. "
                                    f"Original error: {str(e)}. Workaround error: {str(e2)}. "
                                    f"Try updating PyTorch: pip install --upgrade torch",
                                    provider="sentence-transformers"
                                ) from e2
                        else:
                            raise
                    
                    # Cache the model for reuse
                    _model_cache[model_name] = self.model
                    
                    logger.info(
                        "sentence_transformer_model_loaded",
                        model=model_name,
                        dimension=self.get_embedding_dimension()
                    )
                except EmbeddingError:
                    # Re-raise EmbeddingError as-is
                    raise
                except Exception as e:
                    raise EmbeddingError(
                        f"Failed to load Sentence Transformer model '{model_name}': {str(e)}",
                        provider="sentence-transformers"
                    ) from e
    
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = 32,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings using Sentence Transformers
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process in each batch (default: 32)
            **kwargs: Additional arguments (not used, but kept for compatibility)
            
        Returns:
            EmbeddingResult with embeddings and metadata
        """
        self._validate_texts(texts)
        
        try:
            logger.info(
                "sentence_transformer_embedding_started",
                provider="sentence-transformers",
                model=self.model_name,
                text_count=len(texts),
                batch_size=batch_size
            )
            
            # Sentence Transformers handles batching internally
            # encode() returns numpy array, convert to list of lists
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=kwargs.get("normalize_embeddings", False)
            )
            
            # Convert numpy array to list of lists
            if hasattr(embeddings, 'tolist'):
                embeddings_list = embeddings.tolist()
            else:
                embeddings_list = [list(emb) for emb in embeddings]
            
            logger.info(
                "sentence_transformer_embedding_completed",
                provider="sentence-transformers",
                model=self.model_name,
                embedding_count=len(embeddings_list),
                dimension=len(embeddings_list[0]) if embeddings_list else 0
            )
            
            return EmbeddingResult(
                embeddings=embeddings_list,
                model=str(self.model_name),  # Ensure it's a string, not the model object
                provider="sentence-transformers",
                metadata={
                    "total_texts": len(texts),
                    "dimension": len(embeddings_list[0]) if embeddings_list else 0,
                    "batch_size": batch_size
                }
            )
        except Exception as e:
            logger.error(
                "sentence_transformer_embedding_failed",
                error=str(e),
                model=self.model_name
            )
            raise EmbeddingProviderError(
                f"Failed to generate embeddings: {str(e)}",
                provider="sentence-transformers"
            ) from e
    
    async def embed_query(self, query: str, **kwargs) -> List[float]:
        """Generate embedding for a single query"""
        result = await self.embed_texts([query], batch_size=1, **kwargs)
        return result.embeddings[0]
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension for the current model"""
        # Try to get from model directly
        try:
            return self.model.get_sentence_embedding_dimension()
        except:
            # Fallback to known dimensions
            return self.MODEL_DIMENSIONS.get(self.model_name, 384)

