"""
Embedding service for generating vector embeddings
"""

from .base import BaseEmbeddingService, EmbeddingResult
from .openai_embedding import OpenAIEmbeddingService
from .cohere_embedding import CohereEmbeddingService
from .gemini_embedding import GeminiEmbeddingService
from .embedding_service import EmbeddingService
from .exceptions import EmbeddingError, EmbeddingProviderError

# Optional import for Sentence Transformers
try:
    from .sentence_transformer_embedding import SentenceTransformerEmbeddingService
    __all__ = [
        "BaseEmbeddingService",
        "EmbeddingService",
        "EmbeddingResult",
        "OpenAIEmbeddingService",
        "CohereEmbeddingService",
        "GeminiEmbeddingService",
        "SentenceTransformerEmbeddingService",
        "EmbeddingError",
        "EmbeddingProviderError",
    ]
except ImportError:
    __all__ = [
        "BaseEmbeddingService",
        "EmbeddingService",
        "EmbeddingResult",
        "OpenAIEmbeddingService",
        "CohereEmbeddingService",
        "GeminiEmbeddingService",
        "EmbeddingError",
        "EmbeddingProviderError",
    ]

