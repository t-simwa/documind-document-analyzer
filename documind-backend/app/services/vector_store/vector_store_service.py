"""
Main vector store service with provider abstraction
"""

from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from .base import BaseVectorStore, VectorDocument, VectorSearchResult
from .chroma_store import ChromaVectorStore
from .pinecone_store import PineconeVectorStore
from .qdrant_store import QdrantVectorStore
from .exceptions import VectorStoreError, VectorStoreConfigurationError

logger = structlog.get_logger(__name__)


class VectorStoreService:
    """
    Main vector store service with provider abstraction
    """
    
    def __init__(
        self,
        provider: str = None,
        dimension: int = None
    ):
        """
        Initialize vector store service
        
        Args:
            provider: Vector store provider (chroma, pinecone, qdrant)
            dimension: Embedding dimension (required if not using default)
        """
        self.provider_name = provider or settings.VECTOR_STORE_PROVIDER
        
        # Determine dimension based on provider defaults
        if dimension is None:
            if self.provider_name == "chroma":
                dimension = settings.PINECONE_DIMENSION  # Default
            elif self.provider_name == "pinecone":
                dimension = settings.PINECONE_DIMENSION
            elif self.provider_name == "qdrant":
                dimension = settings.QDRANT_DIMENSION
            else:
                dimension = 1536  # OpenAI default
        
        self.dimension = dimension
        
        # Initialize provider
        self.store = self._create_provider()
        
        logger.info(
            "vector_store_service_initialized",
            provider=self.provider_name,
            dimension=self.dimension
        )
    
    def _create_provider(self) -> BaseVectorStore:
        """Create vector store provider instance"""
        provider_name = self.provider_name.lower()
        
        if provider_name == "chroma":
            return ChromaVectorStore(dimension=self.dimension)
        elif provider_name == "pinecone":
            return PineconeVectorStore(dimension=self.dimension)
        elif provider_name == "qdrant":
            return QdrantVectorStore(dimension=self.dimension)
        else:
            raise VectorStoreConfigurationError(
                f"Unknown vector store provider: {provider_name}. "
                f"Supported providers: chroma, pinecone, qdrant",
                provider=provider_name
            )
    
    async def create_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Create a new collection/index"""
        return await self.store.create_collection(
            collection_name=collection_name,
            tenant_id=tenant_id,
            metadata=metadata
        )
    
    async def delete_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete a collection/index"""
        return await self.store.delete_collection(
            collection_name=collection_name,
            tenant_id=tenant_id
        )
    
    async def collection_exists(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Check if collection exists"""
        return await self.store.collection_exists(
            collection_name=collection_name,
            tenant_id=tenant_id
        )
    
    async def list_collections(
        self,
        tenant_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all collections/indexes"""
        return await self.store.list_collections(tenant_id=tenant_id)
    
    async def add_documents(
        self,
        documents: List[VectorDocument],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> List[str]:
        """Add documents to the vector store"""
        return await self.store.add_documents(
            documents=documents,
            collection_name=collection_name,
            tenant_id=tenant_id
        )
    
    async def search(
        self,
        query_embedding: List[float],
        collection_name: str,
        top_k: int = 10,
        tenant_id: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None
    ) -> VectorSearchResult:
        """Search for similar vectors"""
        return await self.store.search(
            query_embedding=query_embedding,
            collection_name=collection_name,
            top_k=top_k,
            tenant_id=tenant_id,
            filter=filter
        )
    
    async def delete_documents(
        self,
        document_ids: List[str],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete documents from the vector store"""
        return await self.store.delete_documents(
            document_ids=document_ids,
            collection_name=collection_name,
            tenant_id=tenant_id
        )
    
    async def get_document(
        self,
        document_id: str,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[VectorDocument]:
        """Get a document by ID"""
        return await self.store.get_document(
            document_id=document_id,
            collection_name=collection_name,
            tenant_id=tenant_id
        )
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        return self.dimension

