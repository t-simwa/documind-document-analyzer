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
    
    @field_validator("CORS_ORIGINS", "CORS_METHODS", "CORS_HEADERS", "ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_comma_separated(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated string into list"""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v


# Global settings instance
settings = Settings()

