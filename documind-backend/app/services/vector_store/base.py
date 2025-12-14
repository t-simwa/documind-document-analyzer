"""
Base vector store interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class VectorSearchResult:
    """Result of vector similarity search"""
    ids: List[str]
    embeddings: List[List[float]]
    documents: List[str]
    metadata: List[Dict[str, Any]]
    distances: List[float]
    scores: List[float]  # Normalized similarity scores (0-1, higher is better)
    
    def __post_init__(self):
        """Validate and normalize results"""
        # Ensure all lists have the same length
        lengths = [
            len(self.ids),
            len(self.embeddings),
            len(self.documents),
            len(self.metadata),
            len(self.distances),
            len(self.scores)
        ]
        if len(set(lengths)) > 1:
            raise ValueError("All result lists must have the same length")
        
        # Normalize scores if not already normalized
        if self.distances and self.scores:
            max_dist = max(self.distances) if self.distances else 1.0
            if max_dist > 0:
                self.scores = [1.0 - (d / max_dist) for d in self.distances]


@dataclass
class VectorDocument:
    """Document with vector embedding"""
    id: str
    embedding: List[float]
    document: str
    metadata: Dict[str, Any]


class BaseVectorStore(ABC):
    """Base class for vector store implementations"""
    
    def __init__(self, dimension: int):
        """
        Initialize vector store
        
        Args:
            dimension: Dimension of embedding vectors
        """
        self.dimension = dimension
        self.provider_name = self.__class__.__name__.replace("VectorStore", "").lower()
    
    @abstractmethod
    async def create_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Create a new collection/index
        
        Args:
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            metadata: Optional metadata for the collection
            
        Returns:
            True if created successfully
            
        Raises:
            VectorStoreError: If collection creation fails
        """
        pass
    
    @abstractmethod
    async def delete_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """
        Delete a collection/index
        
        Args:
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            
        Returns:
            True if deleted successfully
        """
        pass
    
    @abstractmethod
    async def collection_exists(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """
        Check if collection exists
        
        Args:
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            
        Returns:
            True if collection exists
        """
        pass
    
    @abstractmethod
    async def add_documents(
        self,
        documents: List[VectorDocument],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> List[str]:
        """
        Add documents to the vector store
        
        Args:
            documents: List of VectorDocument objects
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            
        Returns:
            List of document IDs that were added
            
        Raises:
            VectorStoreError: If adding documents fails
        """
        pass
    
    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        collection_name: str,
        top_k: int = 10,
        tenant_id: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None
    ) -> VectorSearchResult:
        """
        Search for similar vectors
        
        Args:
            query_embedding: Query embedding vector
            collection_name: Name of the collection to search
            top_k: Number of results to return
            tenant_id: Optional tenant ID for multi-tenancy
            filter: Optional metadata filter
            
        Returns:
            VectorSearchResult with similar documents
            
        Raises:
            VectorStoreError: If search fails
        """
        pass
    
    @abstractmethod
    async def delete_documents(
        self,
        document_ids: List[str],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """
        Delete documents from the vector store
        
        Args:
            document_ids: List of document IDs to delete
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            
        Returns:
            True if deleted successfully
        """
        pass
    
    @abstractmethod
    async def get_document(
        self,
        document_id: str,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[VectorDocument]:
        """
        Get a document by ID
        
        Args:
            document_id: Document ID
            collection_name: Name of the collection
            tenant_id: Optional tenant ID for multi-tenancy
            
        Returns:
            VectorDocument if found, None otherwise
        """
        pass
    
    def _get_collection_name(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> str:
        """
        Generate collection name with tenant prefix for multi-tenancy
        
        Args:
            collection_name: Base collection name
            tenant_id: Optional tenant ID
            
        Returns:
            Full collection name with tenant prefix
        """
        if tenant_id:
            return f"{tenant_id}_{collection_name}"
        return collection_name
    
    def _validate_embedding(self, embedding: List[float]) -> None:
        """Validate embedding vector"""
        if not embedding:
            raise ValueError("Embedding cannot be empty")
        
        if len(embedding) != self.dimension:
            raise ValueError(
                f"Embedding dimension {len(embedding)} does not match "
                f"expected dimension {self.dimension}"
            )
        
        if not all(isinstance(x, (int, float)) for x in embedding):
            raise ValueError("Embedding must contain only numbers")

