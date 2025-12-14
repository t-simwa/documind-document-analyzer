"""
Base embedding service interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class EmbeddingResult:
    """Result of embedding generation"""
    embeddings: List[List[float]]
    model: str
    provider: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class BaseEmbeddingService(ABC):
    """Base class for embedding service implementations"""
    
    def __init__(self, api_key: str, model: str, max_retries: int = 3, timeout: int = 30):
        """
        Initialize embedding service
        
        Args:
            api_key: API key for the embedding provider
            model: Model name to use
            max_retries: Maximum number of retries for failed requests
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.model = model
        self.max_retries = max_retries
        self.timeout = timeout
        self.provider_name = self.__class__.__name__.replace("EmbeddingService", "").lower()
    
    @abstractmethod
    async def embed_texts(
        self,
        texts: List[str],
        batch_size: int = 100,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embeddings for a list of texts
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process in each batch
            **kwargs: Additional provider-specific arguments
            
        Returns:
            EmbeddingResult with embeddings and metadata
            
        Raises:
            EmbeddingError: If embedding generation fails
        """
        pass
    
    @abstractmethod
    async def embed_query(self, query: str, **kwargs) -> List[float]:
        """
        Generate embedding for a single query text
        
        Args:
            query: Query text to embed
            **kwargs: Additional provider-specific arguments
            
        Returns:
            List of floats representing the embedding vector
            
        Raises:
            EmbeddingError: If embedding generation fails
        """
        pass
    
    @abstractmethod
    def get_embedding_dimension(self) -> int:
        """
        Get the dimension of embeddings produced by this service
        
        Returns:
            Integer representing the embedding dimension
        """
        pass
    
    def _validate_texts(self, texts: List[str]) -> None:
        """Validate input texts"""
        if not texts:
            raise ValueError("Texts list cannot be empty")
        
        if not all(isinstance(text, str) for text in texts):
            raise ValueError("All texts must be strings")
        
        if not all(text.strip() for text in texts):
            logger.warning("Some texts are empty or whitespace-only")
    
    def _batch_texts(self, texts: List[str], batch_size: int) -> List[List[str]]:
        """Split texts into batches"""
        batches = []
        for i in range(0, len(texts), batch_size):
            batches.append(texts[i:i + batch_size])
        return batches

