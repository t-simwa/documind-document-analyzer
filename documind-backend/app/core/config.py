"""
Application configuration management
Loads settings from environment variables with sensible defaults
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Application
    APP_NAME: str = "DocuMind AI Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS - can be set as comma-separated string or list
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: Union[str, List[str]] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    CORS_HEADERS: Union[str, List[str]] = "*"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Database (optional for now)
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/documind_db"
    
    # Redis (optional for now)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 20971520  # 20MB in bytes
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: Union[str, List[str]] = "pdf,docx,txt,md,png,jpg,jpeg,tiff,bmp"
    
    # Embedding Configuration
    EMBEDDING_PROVIDER: str = "openai"  # openai, cohere, gemini, sentence-transformers
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # OpenAI default
    EMBEDDING_BATCH_SIZE: int = 100  # Batch size for embedding generation
    EMBEDDING_CACHE_ENABLED: bool = True
    EMBEDDING_CACHE_TTL: int = 86400  # 24 hours in seconds
    
    # Sentence Transformers Configuration (for free local embeddings)
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"  # all-MiniLM-L6-v2, all-mpnet-base-v2, etc.
    
    # OpenAI Embedding
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_MAX_RETRIES: int = 3
    OPENAI_TIMEOUT: int = 30
    
    # Cohere Embedding
    COHERE_API_KEY: str = ""
    COHERE_EMBEDDING_MODEL: str = "embed-english-v3.0"
    COHERE_MAX_RETRIES: int = 3
    COHERE_TIMEOUT: int = 30
    
    # Google Gemini Embedding
    GEMINI_API_KEY: str = ""
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"
    GEMINI_MAX_RETRIES: int = 3
    GEMINI_TIMEOUT: int = 30
    
    # Vector Store Configuration
    VECTOR_STORE_PROVIDER: str = "chroma"  # chroma, pinecone, qdrant
    VECTOR_STORE_PERSIST_DIR: str = "./vector_store"
    VECTOR_STORE_COLLECTION_PREFIX: str = "documind"
    
    # ChromaDB Configuration
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    
    # Pinecone Configuration
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = "us-east-1"
    PINECONE_INDEX_NAME: str = "documind"
    PINECONE_DIMENSION: int = 1536  # Default for OpenAI embeddings
    
    # Qdrant Configuration
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "documind"
    QDRANT_DIMENSION: int = 1536
    
    # Retrieval Configuration
    RETRIEVAL_SEARCH_TYPE: str = "hybrid"  # vector, keyword, hybrid
    RETRIEVAL_TOP_K: int = 10
    RETRIEVAL_VECTOR_WEIGHT: float = 0.7  # Weight for vector search in hybrid (0-1)
    RETRIEVAL_KEYWORD_WEIGHT: float = 0.3  # Weight for keyword search in hybrid (0-1)
    RETRIEVAL_FUSION_METHOD: str = "rrf"  # rrf, weighted, mean
    RETRIEVAL_RRF_K: int = 60  # RRF constant
    
    # Re-ranking Configuration
    RETRIEVAL_RERANK_ENABLED: bool = False
    RETRIEVAL_RERANK_PROVIDER: str = "cohere"  # cohere, cross_encoder, none
    RETRIEVAL_RERANK_TOP_N: int = 20  # Re-rank top N results
    RETRIEVAL_RERANK_THRESHOLD: float = 0.0  # Minimum score threshold for re-ranking
    RETRIEVAL_RERANK_MODEL: str = "rerank-english-v3.0"  # Cohere rerank model
    
    # Query Optimization
    RETRIEVAL_QUERY_EXPANSION_ENABLED: bool = False
    RETRIEVAL_QUERY_PREPROCESSING_ENABLED: bool = True
    
    # Deduplication
    RETRIEVAL_DEDUPLICATION_ENABLED: bool = True
    RETRIEVAL_DEDUPLICATION_THRESHOLD: float = 0.95  # Similarity threshold for deduplication
    
    # BM25 Configuration
    RETRIEVAL_BM25_K1: float = 1.5  # BM25 k1 parameter
    RETRIEVAL_BM25_B: float = 0.75  # BM25 b parameter
    
    # LLM Configuration
    LLM_PROVIDER: str = "ollama"  # openai, gemini, claude, ollama (FREE), huggingface (FREE tier)
    LLM_MODEL: str = "llama3"  # Model name (e.g., "gpt-4", "gemini-pro", "llama3", "mistralai/Mistral-7B-Instruct-v0.2")
    LLM_TEMPERATURE: float = 0.7  # Temperature for generation (0-2)
    LLM_MAX_TOKENS: int = 2000  # Maximum tokens in response
    LLM_TOP_P: float = 1.0  # Top-p sampling parameter
    LLM_FREQUENCY_PENALTY: float = 0.0  # Frequency penalty
    LLM_PRESENCE_PENALTY: float = 0.0  # Presence penalty
    LLM_TIMEOUT: int = 60  # Request timeout in seconds
    LLM_MAX_RETRIES: int = 3  # Maximum retries for failed requests
    LLM_STREAM_ENABLED: bool = True  # Enable streaming responses
    
    # Anthropic Claude Configuration
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"
    
    # Ollama Configuration (Supports Local and Cloud)
    OLLAMA_BASE_URL: str = "https://ollama.com"  # Ollama API URL (https://ollama.com for cloud, http://localhost:11434 for local)
    OLLAMA_API_KEY: str = ""  # Required for Ollama Cloud (get from https://ollama.com), not needed for local
    
    # Hugging Face Configuration (FREE tier available)
    HUGGINGFACE_API_KEY: str = ""  # Get free token from https://huggingface.co/settings/tokens
    HUGGINGFACE_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.2"  # Default model
    
    @field_validator("CORS_ORIGINS", "CORS_METHODS", "CORS_HEADERS", "ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_comma_separated(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated string into list"""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v


# Global settings instance
settings = Settings()

