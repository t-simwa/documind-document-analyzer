"""
Custom exceptions for retrieval service
"""


class RetrievalError(Exception):
    """Base exception for retrieval errors"""
    
    def __init__(self, message: str, provider: str = None):
        self.message = message
        self.provider = provider
        super().__init__(self.message)


class RetrievalConfigurationError(RetrievalError):
    """Configuration error in retrieval service"""
    pass


class RetrievalProviderError(RetrievalError):
    """Provider-specific error in retrieval service"""
    pass


class RetrievalRateLimitError(RetrievalError):
    """Rate limit exceeded in retrieval service"""
    pass


class RetrievalTimeoutError(RetrievalError):
    """Timeout error in retrieval service"""
    pass

