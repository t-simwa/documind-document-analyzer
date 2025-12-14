"""
Tests for vector store service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.vector_store import (
    VectorStoreService,
    ChromaVectorStore,
    VectorDocument,
    VectorStoreError
)
from app.core.config import settings


class TestVectorStoreService:
    """Test vector store service factory"""
    
    def test_vector_store_service_initialization(self):
        """Test vector store service initialization"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            with patch('chromadb.PersistentClient'):
                service = VectorStoreService(provider="chroma", dimension=1536)
                assert service.provider_name == "chroma"
                assert service.dimension == 1536
                assert service.store is not None
    
    def test_vector_store_service_invalid_provider(self):
        """Test vector store service with invalid provider"""
        with pytest.raises(VectorStoreError):
            VectorStoreService(provider="invalid_provider")
    
    @pytest.mark.asyncio
    async def test_create_collection(self):
        """Test creating a collection"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            mock_client = Mock()
            mock_client.create_collection = Mock()
            mock_client.list_collections = Mock(return_value=[])
            
            with patch('chromadb.PersistentClient', return_value=mock_client):
                service = VectorStoreService(provider="chroma", dimension=1536)
                result = await service.create_collection("test_collection")
                assert result is True
    
    @pytest.mark.asyncio
    async def test_add_documents(self):
        """Test adding documents to vector store"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            mock_collection = Mock()
            mock_collection.add = Mock()
            mock_client = Mock()
            mock_client.get_or_create_collection = Mock(return_value=mock_collection)
            
            with patch('chromadb.PersistentClient', return_value=mock_client):
                service = VectorStoreService(provider="chroma", dimension=1536)
                
                documents = [
                    VectorDocument(
                        id="doc1",
                        embedding=[0.1] * 1536,
                        document="Test document 1",
                        metadata={"test": "value1"}
                    ),
                    VectorDocument(
                        id="doc2",
                        embedding=[0.2] * 1536,
                        document="Test document 2",
                        metadata={"test": "value2"}
                    )
                ]
                
                result = await service.add_documents(documents, "test_collection")
                assert len(result) == 2
                assert "doc1" in result
                assert "doc2" in result
    
    @pytest.mark.asyncio
    async def test_search(self):
        """Test vector similarity search"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            mock_collection = Mock()
            mock_collection.query = Mock(return_value={
                "ids": [["doc1", "doc2"]],
                "embeddings": [[[0.1] * 1536, [0.2] * 1536]],
                "documents": [["Test doc 1", "Test doc 2"]],
                "metadatas": [[{"test": "value1"}, {"test": "value2"}]],
                "distances": [[0.1, 0.2]]
            })
            mock_client = Mock()
            mock_client.get_collection = Mock(return_value=mock_collection)
            
            with patch('chromadb.PersistentClient', return_value=mock_client):
                service = VectorStoreService(provider="chroma", dimension=1536)
                
                query_embedding = [0.15] * 1536
                result = await service.search(query_embedding, "test_collection", top_k=2)
                
                assert len(result.ids) == 2
                assert len(result.documents) == 2
                assert len(result.scores) == 2


class TestChromaVectorStore:
    """Test ChromaDB vector store"""
    
    def test_chroma_store_initialization(self):
        """Test ChromaDB store initialization"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            with patch('chromadb.PersistentClient') as mock_client:
                store = ChromaVectorStore(dimension=1536)
                assert store.dimension == 1536
                assert store.provider_name == "chroma"
    
    def test_chroma_store_missing_dependency(self):
        """Test ChromaDB store without dependency"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', False):
            with pytest.raises(ImportError):
                ChromaVectorStore(dimension=1536)
    
    def test_get_collection_name_with_tenant(self):
        """Test collection name generation with tenant"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            with patch('chromadb.PersistentClient'):
                store = ChromaVectorStore(dimension=1536)
                name = store._get_collection_name("test_collection", tenant_id="tenant1")
                assert name == "tenant1_test_collection"
    
    def test_validate_embedding(self):
        """Test embedding validation"""
        with patch('app.services.vector_store.chroma_store.CHROMADB_AVAILABLE', True):
            with patch('chromadb.PersistentClient'):
                store = ChromaVectorStore(dimension=1536)
                
                # Valid embedding
                store._validate_embedding([0.1] * 1536)
                
                # Invalid dimension
                with pytest.raises(ValueError):
                    store._validate_embedding([0.1] * 100)
                
                # Empty embedding
                with pytest.raises(ValueError):
                    store._validate_embedding([])


class TestVectorDocument:
    """Test VectorDocument dataclass"""
    
    def test_vector_document_creation(self):
        """Test creating a VectorDocument"""
        doc = VectorDocument(
            id="doc1",
            embedding=[0.1] * 1536,
            document="Test document",
            metadata={"key": "value"}
        )
        
        assert doc.id == "doc1"
        assert len(doc.embedding) == 1536
        assert doc.document == "Test document"
        assert doc.metadata["key"] == "value"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

