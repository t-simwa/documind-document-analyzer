"""
Pinecone vector store implementation
"""

from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from .base import BaseVectorStore, VectorDocument, VectorSearchResult
from .exceptions import VectorStoreError, VectorStoreConnectionError, VectorStoreNotFoundError

logger = structlog.get_logger(__name__)

try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    logger.warning("pinecone-client not installed, PineconeVectorStore will not be available")


class PineconeVectorStore(BaseVectorStore):
    """Pinecone vector store implementation"""
    
    def __init__(
        self,
        dimension: int = None,
        api_key: str = None,
        environment: str = None,
        index_name: str = None
    ):
        """
        Initialize Pinecone vector store
        
        Args:
            dimension: Embedding dimension (defaults to settings)
            api_key: Pinecone API key (defaults to settings)
            environment: Pinecone environment (defaults to settings)
            index_name: Default index name (defaults to settings)
        """
        if not PINECONE_AVAILABLE:
            raise ImportError(
                "pinecone-client is not installed. Install it with: pip install pinecone-client"
            )
        
        dimension = dimension or settings.PINECONE_DIMENSION
        super().__init__(dimension)
        
        self.api_key = api_key or settings.PINECONE_API_KEY
        self.environment = environment or settings.PINECONE_ENVIRONMENT
        self.default_index_name = index_name or settings.PINECONE_INDEX_NAME
        
        if not self.api_key:
            raise VectorStoreConnectionError(
                "Pinecone API key is required",
                provider="pinecone"
            )
        
        try:
            self.client = Pinecone(api_key=self.api_key)
            logger.info("pinecone_store_initialized", environment=self.environment)
        except Exception as e:
            raise VectorStoreConnectionError(
                f"Failed to connect to Pinecone: {str(e)}",
                provider="pinecone"
            ) from e
    
    def _get_index(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        create_if_not_exists: bool = False
    ):
        """Get or create a Pinecone index"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            # List existing indexes
            existing_indexes = [idx.name for idx in self.client.list_indexes()]
            
            if full_name in existing_indexes:
                return self.client.Index(full_name)
            
            if create_if_not_exists:
                # Create new index
                self.client.create_index(
                    name=full_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=self.environment
                    )
                )
                # Wait for index to be ready
                import time
                while full_name not in [idx.name for idx in self.client.list_indexes()]:
                    time.sleep(1)
                return self.client.Index(full_name)
            else:
                raise VectorStoreNotFoundError(
                    f"Index {full_name} does not exist",
                    provider="pinecone"
                )
        except VectorStoreNotFoundError:
            raise
        except Exception as e:
            raise VectorStoreError(
                f"Failed to get index {full_name}: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def create_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Create a new index"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            existing_indexes = [idx.name for idx in self.client.list_indexes()]
            
            if full_name in existing_indexes:
                logger.warning("pinecone_index_exists", index_name=full_name)
                return True
            
            self.client.create_index(
                name=full_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=self.environment
                )
            )
            
            logger.info("pinecone_index_created", index_name=full_name)
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to create index {full_name}: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def delete_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete an index"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            existing_indexes = [idx.name for idx in self.client.list_indexes()]
            
            if full_name not in existing_indexes:
                logger.warning("pinecone_index_not_found", index_name=full_name)
                return False
            
            self.client.delete_index(full_name)
            logger.info("pinecone_index_deleted", index_name=full_name)
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to delete index {full_name}: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def collection_exists(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Check if index exists"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            existing_indexes = [idx.name for idx in self.client.list_indexes()]
            return full_name in existing_indexes
        except Exception as e:
            logger.error("pinecone_list_indexes_error", error=str(e))
            return False
    
    async def list_collections(
        self,
        tenant_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all indexes"""
        try:
            indexes = self.client.list_indexes()
            result = []
            
            for index_info in indexes:
                # Pinecone returns IndexList objects, extract name
                index_name = index_info.name if hasattr(index_info, "name") else str(index_info)
                
                # Filter by tenant_id if provided
                if tenant_id:
                    if not index_name.startswith(f"{tenant_id}_"):
                        continue
                    # Remove tenant prefix for display
                    display_name = index_name[len(f"{tenant_id}_"):]
                else:
                    # Only show indexes without tenant prefix (or with documind prefix)
                    if "_" in index_name:
                        prefix = index_name.split("_")[0]
                        if prefix not in ["documind"] and prefix.isdigit():
                            # Skip tenant-prefixed collections when no tenant_id provided
                            continue
                    display_name = index_name
                
                # Get index metadata
                metadata = {
                    "dimension": self.dimension,
                    "metric": "cosine"
                }
                
                # Try to get document count and additional info
                try:
                    index = self.client.Index(index_name)
                    stats = index.describe_index_stats()
                    document_count = stats.get("total_vector_count", 0)
                    metadata["status"] = "ready"
                except Exception as e:
                    logger.debug("pinecone_index_stats_error", index=index_name, error=str(e))
                    document_count = 0
                    metadata["status"] = "unknown"
                
                result.append({
                    "name": display_name,
                    "full_name": index_name,
                    "metadata": metadata,
                    "document_count": document_count
                })
            
            logger.info("pinecone_indexes_listed", count=len(result))
            return result
        except Exception as e:
            logger.error("pinecone_list_indexes_error", error=str(e))
            raise VectorStoreError(
                f"Failed to list indexes: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def add_documents(
        self,
        documents: List[VectorDocument],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> List[str]:
        """Add documents to the index"""
        if not documents:
            return []
        
        index = self._get_index(collection_name, tenant_id, create_if_not_exists=True)
        
        # Validate embeddings
        for doc in documents:
            self._validate_embedding(doc.embedding)
        
        try:
            # Prepare vectors for Pinecone
            vectors = []
            for doc in documents:
                vectors.append({
                    "id": doc.id,
                    "values": doc.embedding,
                    "metadata": {**doc.metadata, "text": doc.document}
                })
            
            # Upsert in batches (Pinecone supports up to 100 vectors per batch)
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                index.upsert(vectors=batch)
            
            logger.info(
                "pinecone_documents_added",
                collection_name=collection_name,
                count=len(documents)
            )
            
            return [doc.id for doc in documents]
        except Exception as e:
            raise VectorStoreError(
                f"Failed to add documents: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def search(
        self,
        query_embedding: List[float],
        collection_name: str,
        top_k: int = 10,
        tenant_id: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None
    ) -> VectorSearchResult:
        """Search for similar vectors"""
        self._validate_embedding(query_embedding)
        
        try:
            index = self._get_index(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
        except VectorStoreNotFoundError:
            raise
        
        try:
            # Pinecone filter format
            pinecone_filter = filter if filter else None
            
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=pinecone_filter
            )
            
            # Extract results
            matches = results.get("matches", [])
            
            ids = [match["id"] for match in matches]
            embeddings = []  # Pinecone doesn't return embeddings in query results
            documents = [match["metadata"].get("text", "") for match in matches]
            metadatas = [{k: v for k, v in match["metadata"].items() if k != "text"} for match in matches]
            scores = [match["score"] for match in matches]
            distances = [1.0 - score for score in scores]  # Convert similarity to distance
            
            logger.debug(
                "pinecone_search_completed",
                collection_name=collection_name,
                results_count=len(ids)
            )
            
            return VectorSearchResult(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadata=metadatas,
                distances=distances,
                scores=scores
            )
        except Exception as e:
            raise VectorStoreError(
                f"Search failed: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def delete_documents(
        self,
        document_ids: List[str],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete documents from the index"""
        if not document_ids:
            return True
        
        try:
            index = self._get_index(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            index.delete(ids=document_ids)
            
            logger.info(
                "pinecone_documents_deleted",
                collection_name=collection_name,
                count=len(document_ids)
            )
            
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to delete documents: {str(e)}",
                provider="pinecone"
            ) from e
    
    async def get_document(
        self,
        document_id: str,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[VectorDocument]:
        """Get a document by ID"""
        try:
            index = self._get_index(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            results = index.fetch(ids=[document_id])
            
            if not results.get("vectors") or document_id not in results["vectors"]:
                return None
            
            vector_data = results["vectors"][document_id]
            metadata = vector_data.get("metadata", {})
            
            return VectorDocument(
                id=document_id,
                embedding=vector_data.get("values", []),
                document=metadata.get("text", ""),
                metadata={k: v for k, v in metadata.items() if k != "text"}
            )
        except Exception as e:
            logger.error("pinecone_get_document_error", error=str(e))
            return None

