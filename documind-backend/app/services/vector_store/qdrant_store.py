"""
Qdrant vector store implementation
"""

from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from .base import BaseVectorStore, VectorDocument, VectorSearchResult
from .exceptions import VectorStoreError, VectorStoreConnectionError, VectorStoreNotFoundError

logger = structlog.get_logger(__name__)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    logger.warning("qdrant-client not installed, QdrantVectorStore will not be available")


class QdrantVectorStore(BaseVectorStore):
    """Qdrant vector store implementation"""
    
    def __init__(
        self,
        dimension: int = None,
        host: str = None,
        port: int = None,
        api_key: str = None,
        collection_name: str = None
    ):
        """
        Initialize Qdrant vector store
        
        Args:
            dimension: Embedding dimension (defaults to settings)
            host: Qdrant server host (defaults to settings)
            port: Qdrant server port (defaults to settings)
            api_key: Qdrant API key (optional, for cloud)
            collection_name: Default collection name (defaults to settings)
        """
        if not QDRANT_AVAILABLE:
            raise ImportError(
                "qdrant-client is not installed. Install it with: pip install qdrant-client"
            )
        
        dimension = dimension or settings.QDRANT_DIMENSION
        super().__init__(dimension)
        
        self.host = host or settings.QDRANT_HOST
        self.port = port or settings.QDRANT_PORT
        self.api_key = api_key or settings.QDRANT_API_KEY
        self.default_collection_name = collection_name or settings.QDRANT_COLLECTION_NAME
        
        try:
            if self.api_key:
                # Cloud Qdrant
                self.client = QdrantClient(
                    url=f"https://{self.host}",
                    api_key=self.api_key
                )
            else:
                # Local Qdrant
                self.client = QdrantClient(
                    host=self.host,
                    port=self.port
                )
            
            logger.info("qdrant_store_initialized", host=self.host, port=self.port)
        except Exception as e:
            raise VectorStoreConnectionError(
                f"Failed to connect to Qdrant: {str(e)}",
                provider="qdrant"
            ) from e
    
    def _get_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        create_if_not_exists: bool = False
    ):
        """Get or create a Qdrant collection"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if full_name in collection_names:
                return full_name
            
            if create_if_not_exists:
                # Create new collection
                self.client.create_collection(
                    collection_name=full_name,
                    vectors_config=VectorParams(
                        size=self.dimension,
                        distance=Distance.COSINE
                    )
                )
                return full_name
            else:
                raise VectorStoreNotFoundError(
                    f"Collection {full_name} does not exist",
                    provider="qdrant"
                )
        except VectorStoreNotFoundError:
            raise
        except Exception as e:
            raise VectorStoreError(
                f"Failed to get collection {full_name}: {str(e)}",
                provider="qdrant"
            ) from e
    
    async def create_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Create a new collection"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if full_name in collection_names:
                logger.warning("qdrant_collection_exists", collection_name=full_name)
                return True
            
            self.client.create_collection(
                collection_name=full_name,
                vectors_config=VectorParams(
                    size=self.dimension,
                    distance=Distance.COSINE
                )
            )
            
            logger.info("qdrant_collection_created", collection_name=full_name)
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to create collection {full_name}: {str(e)}",
                provider="qdrant"
            ) from e
    
    async def delete_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete a collection"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if full_name not in collection_names:
                logger.warning("qdrant_collection_not_found", collection_name=full_name)
                return False
            
            self.client.delete_collection(full_name)
            logger.info("qdrant_collection_deleted", collection_name=full_name)
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to delete collection {full_name}: {str(e)}",
                provider="qdrant"
            ) from e
    
    async def collection_exists(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Check if collection exists"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            return full_name in collection_names
        except Exception as e:
            logger.error("qdrant_list_collections_error", error=str(e))
            return False
    
    async def list_collections(
        self,
        tenant_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all collections"""
        try:
            collections_response = self.client.get_collections()
            collections = collections_response.collections
            result = []
            
            for collection_info in collections:
                collection_name = collection_info.name
                
                # Filter by tenant_id if provided
                if tenant_id:
                    if not collection_name.startswith(f"{tenant_id}_"):
                        continue
                    # Remove tenant prefix for display
                    display_name = collection_name[len(f"{tenant_id}_"):]
                else:
                    # Only show collections without tenant prefix
                    if "_" in collection_name and collection_name.split("_")[0] not in ["documind"]:
                        continue
                    display_name = collection_name
                
                # Get collection info
                try:
                    collection_info_full = self.client.get_collection(collection_name)
                    document_count = getattr(collection_info_full, "points_count", 0)
                    metadata = {
                        "vectors_count": getattr(collection_info_full, "vectors_count", 0),
                        "indexed_vectors_count": getattr(collection_info_full, "indexed_vectors_count", 0),
                        "points_count": document_count
                    }
                    # Try to get config info safely
                    if hasattr(collection_info_full, "config") and hasattr(collection_info_full.config, "params"):
                        if hasattr(collection_info_full.config.params, "vectors"):
                            if hasattr(collection_info_full.config.params.vectors, "size"):
                                metadata["dimension"] = collection_info_full.config.params.vectors.size
                            else:
                                metadata["dimension"] = self.dimension
                        else:
                            metadata["dimension"] = self.dimension
                    else:
                        metadata["dimension"] = self.dimension
                except Exception as e:
                    logger.debug("qdrant_collection_info_error", collection=collection_name, error=str(e))
                    metadata = {"dimension": self.dimension}
                    document_count = 0
                
                result.append({
                    "name": display_name,
                    "full_name": collection_name,
                    "metadata": metadata,
                    "document_count": document_count
                })
            
            logger.info("qdrant_collections_listed", count=len(result))
            return result
        except Exception as e:
            logger.error("qdrant_list_collections_error", error=str(e))
            raise VectorStoreError(
                f"Failed to list collections: {str(e)}",
                provider="qdrant"
            ) from e
    
    async def add_documents(
        self,
        documents: List[VectorDocument],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> List[str]:
        """Add documents to the collection"""
        if not documents:
            return []
        
        full_name = self._get_collection(collection_name, tenant_id, create_if_not_exists=True)
        
        # Validate embeddings
        for doc in documents:
            self._validate_embedding(doc.embedding)
        
        try:
            # Prepare points for Qdrant
            points = []
            for doc in documents:
                points.append(
                    PointStruct(
                        id=doc.id,
                        vector=doc.embedding,
                        payload={
                            "text": doc.document,
                            **doc.metadata
                        }
                    )
                )
            
            # Upsert points
            self.client.upsert(
                collection_name=full_name,
                points=points
            )
            
            logger.info(
                "qdrant_documents_added",
                collection_name=collection_name,
                count=len(documents)
            )
            
            return [doc.id for doc in documents]
        except Exception as e:
            raise VectorStoreError(
                f"Failed to add documents: {str(e)}",
                provider="qdrant"
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
            full_name = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
        except VectorStoreNotFoundError:
            raise
        
        try:
            # Build Qdrant filter from metadata filter
            qdrant_filter = None
            if filter:
                conditions = []
                for key, value in filter.items():
                    conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                if conditions:
                    qdrant_filter = Filter(must=conditions)
            
            results = self.client.search(
                collection_name=full_name,
                query_vector=query_embedding,
                limit=top_k,
                query_filter=qdrant_filter
            )
            
            # Extract results
            ids = [str(result.id) for result in results]
            embeddings = []  # Qdrant doesn't return embeddings in search results
            documents = [result.payload.get("text", "") for result in results]
            metadatas = [{k: v for k, v in result.payload.items() if k != "text"} for result in results]
            scores = [result.score for result in results]
            distances = [1.0 - score for score in scores]  # Convert similarity to distance
            
            logger.debug(
                "qdrant_search_completed",
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
                provider="qdrant"
            ) from e
    
    async def delete_documents(
        self,
        document_ids: List[str],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete documents from the collection"""
        if not document_ids:
            return True
        
        try:
            full_name = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            self.client.delete(
                collection_name=full_name,
                points_selector=document_ids
            )
            
            logger.info(
                "qdrant_documents_deleted",
                collection_name=collection_name,
                count=len(document_ids)
            )
            
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to delete documents: {str(e)}",
                provider="qdrant"
            ) from e
    
    async def get_document(
        self,
        document_id: str,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[VectorDocument]:
        """Get a document by ID"""
        try:
            full_name = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            results = self.client.retrieve(
                collection_name=full_name,
                ids=[document_id]
            )
            
            if not results:
                return None
            
            result = results[0]
            payload = result.payload or {}
            
            return VectorDocument(
                id=str(result.id),
                embedding=result.vector if hasattr(result, 'vector') else [],
                document=payload.get("text", ""),
                metadata={k: v for k, v in payload.items() if k != "text"}
            )
        except Exception as e:
            logger.error("qdrant_get_document_error", error=str(e))
            return None

