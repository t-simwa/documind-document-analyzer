"""
Custom exceptions for embedding service
"""


class EmbeddingError(Exception):
    """Base exception for embedding-related errors"""
    
    def __init__(self, message: str, provider: str = None, error_code: str = None):
        self.message = message
        self.provider = provider
        self.error_code = error_code
        super().__init__(self.message)
    
    def __str__(self):
        if self.provider:
            return f"[{self.provider}] {self.message}"
        return self.message


class EmbeddingProviderError(EmbeddingError):
    """Exception raised when embedding provider fails"""
    pass


class EmbeddingConfigurationError(EmbeddingError):
    """Exception raised when embedding configuration is invalid"""
    pass


class EmbeddingRateLimitError(EmbeddingError):
    """Exception raised when embedding API rate limit is exceeded"""
    pass


class EmbeddingTimeoutError(EmbeddingError):
    """Exception raised when embedding request times out"""
    pass

