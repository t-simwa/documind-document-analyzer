"""
Tests for embedding service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.embeddings import (
    EmbeddingService,
    OpenAIEmbeddingService,
    CohereEmbeddingService,
    GeminiEmbeddingService,
    EmbeddingError
)
from app.core.config import settings


class TestEmbeddingService:
    """Test embedding service factory"""
    
    def test_embedding_service_initialization(self):
        """Test embedding service initialization"""
        with patch.dict('os.environ', {'EMBEDDING_PROVIDER': 'openai', 'OPENAI_API_KEY': 'test-key'}):
            service = EmbeddingService(provider="openai")
            assert service.provider_name == "openai"
            assert service.provider is not None
    
    def test_embedding_service_invalid_provider(self):
        """Test embedding service with invalid provider"""
        with pytest.raises(EmbeddingError):
            EmbeddingService(provider="invalid_provider")
    
    @pytest.mark.asyncio
    async def test_embed_texts_with_cache(self):
        """Test embedding texts with cache enabled"""
        with patch.dict('os.environ', {'EMBEDDING_PROVIDER': 'openai', 'OPENAI_API_KEY': 'test-key'}):
            service = EmbeddingService(provider="openai", cache_enabled=True)
            
            # Mock the provider's embed_texts method
            mock_result = Mock()
            mock_result.embeddings = [[0.1] * 1536, [0.2] * 1536]
            mock_result.model = "text-embedding-3-small"
            mock_result.provider = "openai"
            mock_result.metadata = {"dimension": 1536}
            
            service.provider.embed_texts = AsyncMock(return_value=mock_result)
            
            texts = ["Test text 1", "Test text 2"]
            result = await service.embed_texts(texts)
            
            assert len(result.embeddings) == 2
            assert result.provider == "openai"
    
    @pytest.mark.asyncio
    async def test_embed_query(self):
        """Test embedding a single query"""
        with patch.dict('os.environ', {'EMBEDDING_PROVIDER': 'openai', 'OPENAI_API_KEY': 'test-key'}):
            service = EmbeddingService(provider="openai")
            
            # Mock the provider's embed_query method
            service.provider.embed_query = AsyncMock(return_value=[0.1] * 1536)
            
            query = "Test query"
            embedding = await service.embed_query(query)
            
            assert len(embedding) == 1536
            assert all(isinstance(x, (int, float)) for x in embedding)


class TestOpenAIEmbeddingService:
    """Test OpenAI embedding service"""
    
    def test_openai_service_initialization(self):
        """Test OpenAI service initialization"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            service = OpenAIEmbeddingService(api_key="test-key")
            assert service.provider_name == "openai"
            assert service.api_key == "test-key"
    
    def test_openai_service_missing_api_key(self):
        """Test OpenAI service without API key"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(EmbeddingError):
                OpenAIEmbeddingService()
    
    def test_openai_get_embedding_dimension(self):
        """Test getting embedding dimension"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            service = OpenAIEmbeddingService(model="text-embedding-3-small")
            assert service.get_embedding_dimension() == 1536
            
            service = OpenAIEmbeddingService(model="text-embedding-3-large")
            assert service.get_embedding_dimension() == 3072
    
    @pytest.mark.asyncio
    async def test_openai_embed_texts_success(self):
        """Test successful embedding generation"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            service = OpenAIEmbeddingService()
            
            # Mock httpx response
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "data": [
                    {"embedding": [0.1] * 1536},
                    {"embedding": [0.2] * 1536}
                ]
            }
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                
                texts = ["Text 1", "Text 2"]
                result = await service.embed_texts(texts)
                
                assert len(result.embeddings) == 2
                assert result.provider == "openai"
    
    @pytest.mark.asyncio
    async def test_openai_embed_texts_rate_limit(self):
        """Test handling rate limit errors"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            service = OpenAIEmbeddingService(max_retries=1)
            
            # Mock rate limit response
            mock_response = Mock()
            mock_response.status_code = 429
            mock_response.headers = {"Retry-After": "60"}
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                
                with pytest.raises(EmbeddingError):
                    await service.embed_texts(["Test text"])


class TestCohereEmbeddingService:
    """Test Cohere embedding service"""
    
    def test_cohere_service_initialization(self):
        """Test Cohere service initialization"""
        with patch.dict('os.environ', {'COHERE_API_KEY': 'test-key'}):
            service = CohereEmbeddingService(api_key="test-key")
            assert service.provider_name == "cohere"
    
    def test_cohere_get_embedding_dimension(self):
        """Test getting embedding dimension"""
        with patch.dict('os.environ', {'COHERE_API_KEY': 'test-key'}):
            service = CohereEmbeddingService(model="embed-english-v3.0")
            assert service.get_embedding_dimension() == 1024


class TestGeminiEmbeddingService:
    """Test Gemini embedding service"""
    
    def test_gemini_service_initialization(self):
        """Test Gemini service initialization"""
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'}):
            service = GeminiEmbeddingService(api_key="test-key")
            assert service.provider_name == "gemini"
    
    def test_gemini_get_embedding_dimension(self):
        """Test getting embedding dimension"""
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'}):
            service = GeminiEmbeddingService(model="models/embedding-001")
            assert service.get_embedding_dimension() == 768


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

