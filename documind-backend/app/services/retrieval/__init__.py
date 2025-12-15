"""
Retrieval Engine Service
Provides hybrid search, re-ranking, and retrieval optimization
"""

from .retrieval_service import RetrievalService
from .base import (
    RetrievalResult,
    RetrievalConfig,
    SearchType,
    FusionMethod,
    RerankProvider
)
from .exceptions import RetrievalError, RetrievalConfigurationError

# Try to import Gemini retrieval service
try:
    from .gemini_retrieval import GeminiRetrievalService
    GEMINI_RETRIEVAL_AVAILABLE = True
except ImportError:
    GEMINI_RETRIEVAL_AVAILABLE = False
    GeminiRetrievalService = None

__all__ = [
    "RetrievalService",
    "RetrievalResult",
    "RetrievalConfig",
    "SearchType",
    "FusionMethod",
    "RerankProvider",
    "RetrievalError",
    "RetrievalConfigurationError",
    "GeminiRetrievalService",
    "GEMINI_RETRIEVAL_AVAILABLE",
]

