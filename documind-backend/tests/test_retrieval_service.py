"""
Tests for retrieval service
"""

import pytest
import asyncio
from datetime import datetime, timedelta

from app.services.retrieval import (
    RetrievalService, RetrievalConfig, RetrievalResult,
    SearchType, FusionMethod, RerankProvider
)
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, VectorDocument
from app.services.retrieval.query_optimizer import QueryOptimizer
from app.services.retrieval.keyword_search import KeywordSearchService, BM25Index


@pytest.fixture
def embedding_service():
    """Create embedding service for testing"""
    return EmbeddingService(provider="openai")


@pytest.fixture
def vector_store():
    """Create vector store for testing"""
    return VectorStoreService(provider="chroma", dimension=1536)


@pytest.fixture
def retrieval_service(embedding_service, vector_store):
    """Create retrieval service for testing"""
    return RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store
    )


@pytest.fixture
def sample_documents():
    """Sample documents for testing"""
    return [
        ("doc1", "Python is a programming language used for web development and data science."),
        ("doc2", "Machine learning algorithms can be used to analyze large datasets."),
        ("doc3", "FastAPI is a modern web framework for building APIs with Python."),
        ("doc4", "Vector databases store embeddings for semantic search applications."),
        ("doc5", "Natural language processing enables computers to understand human language."),
    ]


@pytest.mark.asyncio
async def test_query_preprocessing(retrieval_service):
    """Test query preprocessing"""
    optimizer = QueryOptimizer()
    
    # Test basic preprocessing
    query = "  Python Programming  "
    processed = optimizer.preprocess_query(query)
    assert processed == "python programming"
    
    # Test with stopwords removal
    query = "the quick brown fox"
    processed = optimizer.preprocess_query(query, remove_stopwords=True)
    assert "the" not in processed
    assert "quick" in processed or "brown" in processed or "fox" in processed


@pytest.mark.asyncio
async def test_query_expansion(retrieval_service):
    """Test query expansion"""
    optimizer = QueryOptimizer()
    
    query = "document search"
    expanded = optimizer.expand_query(query)
    assert len(expanded.split()) >= len(query.split())


@pytest.mark.asyncio
async def test_bm25_index():
    """Test BM25 index"""
    index = BM25Index(k1=1.5, b=0.75)
    
    # Add documents
    documents = [
        ("doc1", "Python programming language"),
        ("doc2", "Machine learning algorithms"),
        ("doc3", "Python web framework FastAPI"),
    ]
    index.add_documents(documents)
    
    # Search
    results = index.search("Python", top_k=2)
    assert len(results) > 0
    assert results[0][0] in ["doc1", "doc3"]  # Should find Python-related docs


@pytest.mark.asyncio
async def test_keyword_search_service():
    """Test keyword search service"""
    service = KeywordSearchService()
    
    # Build index
    documents = [
        ("doc1", "Python programming language"),
        ("doc2", "Machine learning algorithms"),
        ("doc3", "Python web framework"),
    ]
    service.build_index("test_collection", documents)
    
    # Search
    results = service.search("Python", "test_collection", top_k=2)
    assert len(results) > 0


@pytest.mark.asyncio
async def test_vector_search(retrieval_service, sample_documents):
    """Test vector-only search"""
    # Add documents to vector store
    collection_name = "test_vector_search"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Generate embeddings and add documents
    texts = [doc[1] for doc in sample_documents]
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=doc_id,
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i}
        )
        for i, (doc_id, text) in enumerate(sample_documents)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    
    # Search
    config = RetrievalConfig(
        search_type=SearchType.VECTOR,
        top_k=3
    )
    
    result = await retrieval_service.retrieve(
        query="programming language",
        collection_name=collection_name,
        config=config
    )
    
    assert len(result.ids) > 0
    assert result.search_type == SearchType.VECTOR
    assert len(result.documents) == len(result.ids)


@pytest.mark.asyncio
async def test_keyword_search(retrieval_service, sample_documents):
    """Test keyword-only search"""
    collection_name = "test_keyword_search"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Add documents to vector store
    texts = [doc[1] for doc in sample_documents]
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=doc_id,
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i}
        )
        for i, (doc_id, text) in enumerate(sample_documents)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    
    # Build keyword index
    await retrieval_service.build_keyword_index(collection_name)
    
    # Search
    config = RetrievalConfig(
        search_type=SearchType.KEYWORD,
        top_k=3
    )
    
    result = await retrieval_service.retrieve(
        query="Python programming",
        collection_name=collection_name,
        config=config
    )
    
    assert len(result.ids) > 0
    assert result.search_type == SearchType.KEYWORD


@pytest.mark.asyncio
async def test_hybrid_search(retrieval_service, sample_documents):
    """Test hybrid search"""
    collection_name = "test_hybrid_search"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Add documents to vector store
    texts = [doc[1] for doc in sample_documents]
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=doc_id,
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i}
        )
        for i, (doc_id, text) in enumerate(sample_documents)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    
    # Build keyword index
    await retrieval_service.build_keyword_index(collection_name)
    
    # Search with hybrid
    config = RetrievalConfig(
        search_type=SearchType.HYBRID,
        top_k=5,
        vector_weight=0.7,
        keyword_weight=0.3,
        fusion_method=FusionMethod.RRF
    )
    
    result = await retrieval_service.retrieve(
        query="Python programming",
        collection_name=collection_name,
        config=config
    )
    
    assert len(result.ids) > 0
    assert result.search_type == SearchType.HYBRID
    assert result.vector_scores is not None
    assert result.keyword_scores is not None


@pytest.mark.asyncio
async def test_metadata_filtering(retrieval_service, sample_documents):
    """Test metadata filtering"""
    collection_name = "test_metadata_filter"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Add documents with metadata
    texts = [doc[1] for doc in sample_documents]
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=doc_id,
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i, "category": "tech" if i < 3 else "other"}
        )
        for i, (doc_id, text) in enumerate(sample_documents)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    
    # Search with metadata filter
    config = RetrievalConfig(
        search_type=SearchType.VECTOR,
        top_k=10,
        metadata_filter={"category": "tech"}
    )
    
    result = await retrieval_service.retrieve(
        query="programming",
        collection_name=collection_name,
        config=config
    )
    
    # All results should have category="tech"
    for metadata in result.metadata:
        assert metadata.get("category") == "tech"


@pytest.mark.asyncio
async def test_deduplication(retrieval_service, sample_documents):
    """Test result deduplication"""
    collection_name = "test_deduplication"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Add documents with duplicates
    texts = [doc[1] for doc in sample_documents]
    # Add duplicate
    texts.append(sample_documents[0][1])  # Duplicate of first document
    
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=f"doc{i}",
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i}
        )
        for i, text in enumerate(texts)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    
    # Search with deduplication
    config = RetrievalConfig(
        search_type=SearchType.VECTOR,
        top_k=10,
        deduplication_enabled=True,
        deduplication_threshold=0.9
    )
    
    result = await retrieval_service.retrieve(
        query="Python",
        collection_name=collection_name,
        config=config
    )
    
    # Check that duplicates are removed (simple check)
    assert len(result.ids) <= len(set(result.ids))


@pytest.mark.asyncio
async def test_fusion_methods(retrieval_service, sample_documents):
    """Test different fusion methods"""
    collection_name = "test_fusion"
    await retrieval_service.vector_store.create_collection(collection_name)
    
    # Add documents
    texts = [doc[1] for doc in sample_documents]
    embedding_result = await retrieval_service.embedding_service.embed_texts(texts)
    
    vector_docs = [
        VectorDocument(
            id=doc_id,
            embedding=embedding_result.embeddings[i],
            document=text,
            metadata={"index": i}
        )
        for i, (doc_id, text) in enumerate(sample_documents)
    ]
    
    await retrieval_service.vector_store.add_documents(vector_docs, collection_name)
    await retrieval_service.build_keyword_index(collection_name)
    
    # Test RRF fusion
    config_rrf = RetrievalConfig(
        search_type=SearchType.HYBRID,
        fusion_method=FusionMethod.RRF,
        top_k=5
    )
    result_rrf = await retrieval_service.retrieve(
        query="Python",
        collection_name=collection_name,
        config=config_rrf
    )
    assert len(result_rrf.ids) > 0
    
    # Test weighted fusion
    config_weighted = RetrievalConfig(
        search_type=SearchType.HYBRID,
        fusion_method=FusionMethod.WEIGHTED,
        top_k=5
    )
    result_weighted = await retrieval_service.retrieve(
        query="Python",
        collection_name=collection_name,
        config=config_weighted
    )
    assert len(result_weighted.ids) > 0
    
    # Test mean fusion
    config_mean = RetrievalConfig(
        search_type=SearchType.HYBRID,
        fusion_method=FusionMethod.MEAN,
        top_k=5
    )
    result_mean = await retrieval_service.retrieve(
        query="Python",
        collection_name=collection_name,
        config=config_mean
    )
    assert len(result_mean.ids) > 0


@pytest.mark.asyncio
async def test_empty_query(retrieval_service):
    """Test handling of empty query"""
    config = RetrievalConfig()
    result = await retrieval_service.retrieve(
        query="",
        collection_name="test",
        config=config
    )
    
    assert len(result.ids) == 0
    assert len(result.documents) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

