"""
ChromaDB vector store implementation
"""

import os
from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from .base import BaseVectorStore, VectorDocument, VectorSearchResult
from .exceptions import VectorStoreError, VectorStoreConnectionError, VectorStoreNotFoundError

logger = structlog.get_logger(__name__)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("chromadb not installed, ChromaVectorStore will not be available")


class ChromaVectorStore(BaseVectorStore):
    """ChromaDB vector store implementation"""
    
    def __init__(
        self,
        dimension: int = None,
        persist_dir: str = None,
        host: str = None,
        port: int = None
    ):
        """
        Initialize ChromaDB vector store
        
        Args:
            dimension: Embedding dimension (defaults to settings)
            persist_dir: Directory to persist data (defaults to settings)
            host: ChromaDB server host (for client mode)
            port: ChromaDB server port (for client mode)
        """
        if not CHROMADB_AVAILABLE:
            raise ImportError(
                "chromadb is not installed. Install it with: pip install chromadb"
            )
        
        dimension = dimension or settings.PINECONE_DIMENSION  # Default dimension
        super().__init__(dimension)
        
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self.host = host or settings.CHROMA_HOST
        self.port = port or settings.CHROMA_PORT
        
        # Create persist directory if it doesn't exist
        if self.persist_dir:
            os.makedirs(self.persist_dir, exist_ok=True)
        
        # Initialize ChromaDB client
        try:
            if self.host and self.host != "localhost":
                # Client mode (remote server)
                self.client = chromadb.HttpClient(
                    host=self.host,
                    port=self.port
                )
            else:
                # Persistent client (local)
                self.client = chromadb.PersistentClient(
                    path=self.persist_dir,
                    settings=ChromaSettings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
            
            logger.info(
                "chroma_store_initialized",
                persist_dir=self.persist_dir,
                host=self.host,
                port=self.port
            )
        except Exception as e:
            raise VectorStoreConnectionError(
                f"Failed to connect to ChromaDB: {str(e)}",
                provider="chroma"
            ) from e
    
    def _get_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        create_if_not_exists: bool = True
    ):
        """Get or create a ChromaDB collection"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            if create_if_not_exists:
                return self.client.get_or_create_collection(
                    name=full_name,
                    metadata={"dimension": self.dimension}
                )
            else:
                return self.client.get_collection(name=full_name)
        except Exception as e:
            raise VectorStoreError(
                f"Failed to get collection {full_name}: {str(e)}",
                provider="chroma"
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
            collection_metadata = {"dimension": self.dimension}
            if metadata:
                collection_metadata.update(metadata)
            
            self.client.create_collection(
                name=full_name,
                metadata=collection_metadata
            )
            
            logger.info("chroma_collection_created", collection_name=full_name)
            return True
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.warning("chroma_collection_exists", collection_name=full_name)
                return True
            raise VectorStoreError(
                f"Failed to create collection {full_name}: {str(e)}",
                provider="chroma"
            ) from e
    
    async def delete_collection(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Delete a collection"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            self.client.delete_collection(name=full_name)
            logger.info("chroma_collection_deleted", collection_name=full_name)
            return True
        except Exception as e:
            if "does not exist" in str(e).lower():
                logger.warning("chroma_collection_not_found", collection_name=full_name)
                return False
            raise VectorStoreError(
                f"Failed to delete collection {full_name}: {str(e)}",
                provider="chroma"
            ) from e
    
    async def collection_exists(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> bool:
        """Check if collection exists"""
        full_name = self._get_collection_name(collection_name, tenant_id)
        
        try:
            collections = self.client.list_collections()
            return any(c.name == full_name for c in collections)
        except Exception as e:
            logger.error("chroma_list_collections_error", error=str(e))
            return False
    
    async def add_documents(
        self,
        documents: List[VectorDocument],
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> List[str]:
        """Add documents to the collection"""
        if not documents:
            return []
        
        collection = self._get_collection(collection_name, tenant_id)
        
        # Validate embeddings
        for doc in documents:
            self._validate_embedding(doc.embedding)
        
        try:
            # Prepare data for ChromaDB
            ids = [doc.id for doc in documents]
            embeddings = [doc.embedding for doc in documents]
            texts = [doc.document for doc in documents]
            
            # Filter out None values from metadata (ChromaDB doesn't accept None)
            # ChromaDB requires at least one metadata attribute
            metadatas = []
            for doc in documents:
                clean_metadata = {
                    k: v for k, v in doc.metadata.items()
                    if v is not None
                }
                # ChromaDB requires at least one metadata field
                # Add a dummy field if metadata is empty
                if not clean_metadata:
                    clean_metadata = {"_placeholder": "true"}
                metadatas.append(clean_metadata)
            
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas
            )
            
            logger.info(
                "chroma_documents_added",
                collection_name=collection_name,
                count=len(documents)
            )
            
            return ids
        except Exception as e:
            raise VectorStoreError(
                f"Failed to add documents: {str(e)}",
                provider="chroma"
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
            collection = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
        except Exception as e:
            raise VectorStoreNotFoundError(
                f"Collection {collection_name} not found",
                provider="chroma"
            ) from e
        
        try:
            # ChromaDB uses where filter for metadata
            where = filter if filter else None
            
            # Log filter for debugging
            if where:
                logger.debug("ChromaDB search with filter", filter=where, collection=collection_name)
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where
            )
            
            # Log results for debugging
            if results and results.get("ids"):
                result_count = len(results.get("ids", [[]])[0]) if results.get("ids") else 0
                logger.debug("ChromaDB search results", count=result_count, collection=collection_name)
            
            # Extract results - handle case where results might be empty or None
            if not results:
                return VectorSearchResult(
                    ids=[],
                    embeddings=[],
                    documents=[],
                    metadata=[],
                    distances=[],
                    scores=[]
                )
            
            # Safely extract results with defaults
            ids_list = results.get("ids", [[]])
            ids = ids_list[0] if ids_list and len(ids_list) > 0 and ids_list[0] else []
            
            # ChromaDB doesn't return embeddings in query results by default
            # We'll use empty list for embeddings
            embeddings = []
            
            documents_list = results.get("documents", [[]])
            documents = documents_list[0] if documents_list and len(documents_list) > 0 and documents_list[0] else []
            
            metadatas_list = results.get("metadatas", [[]])
            metadatas = metadatas_list[0] if metadatas_list and len(metadatas_list) > 0 and metadatas_list[0] else []
            
            distances_list = results.get("distances", [[]])
            distances = distances_list[0] if distances_list and len(distances_list) > 0 and distances_list[0] else []
            
            # Ensure all lists have the same length
            result_count = len(ids)
            if result_count == 0:
                return VectorSearchResult(
                    ids=[],
                    embeddings=[],
                    documents=[],
                    metadata=[],
                    distances=[],
                    scores=[]
                )
            
            # Pad embeddings list to match result count (ChromaDB doesn't return embeddings)
            embeddings = [[] for _ in range(result_count)]
            
            # Ensure all other lists match the result count
            documents = documents[:result_count] if len(documents) > result_count else documents
            metadatas = metadatas[:result_count] if len(metadatas) > result_count else metadatas
            distances = distances[:result_count] if len(distances) > result_count else distances
            
            # Pad if needed
            while len(documents) < result_count:
                documents.append("")
            while len(metadatas) < result_count:
                metadatas.append({})
            while len(distances) < result_count:
                distances.append(1.0)
            
            # Convert distances to scores (ChromaDB returns distances, lower is better)
            scores = [1.0 / (1.0 + d) if d > 0 else 1.0 for d in distances] if distances else [0.0] * result_count
            
            logger.debug(
                "chroma_search_completed",
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
                provider="chroma"
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
            collection = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            collection.delete(ids=document_ids)
            
            logger.info(
                "chroma_documents_deleted",
                collection_name=collection_name,
                count=len(document_ids)
            )
            
            return True
        except Exception as e:
            raise VectorStoreError(
                f"Failed to delete documents: {str(e)}",
                provider="chroma"
            ) from e
    
    async def get_document(
        self,
        document_id: str,
        collection_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[VectorDocument]:
        """Get a document by ID"""
        try:
            collection = self._get_collection(
                collection_name,
                tenant_id,
                create_if_not_exists=False
            )
            
            results = collection.get(ids=[document_id])
            
            if not results.get("ids") or not results["ids"][0]:
                return None
            
            return VectorDocument(
                id=results["ids"][0],
                embedding=results.get("embeddings", [[]])[0] if results.get("embeddings") else [],
                document=results.get("documents", [[]])[0] if results.get("documents") else "",
                metadata=results.get("metadatas", [{}])[0] if results.get("metadatas") else {}
            )
        except Exception as e:
            logger.error("chroma_get_document_error", error=str(e))
            return None

