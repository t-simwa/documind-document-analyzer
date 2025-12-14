"""
Custom exceptions for vector store service
"""


class VectorStoreError(Exception):
    """Base exception for vector store-related errors"""
    
    def __init__(self, message: str, provider: str = None, error_code: str = None):
        self.message = message
        self.provider = provider
        self.error_code = error_code
        super().__init__(self.message)
    
    def __str__(self):
        if self.provider:
            return f"[{self.provider}] {self.message}"
        return self.message


class VectorStoreConnectionError(VectorStoreError):
    """Exception raised when vector store connection fails"""
    pass


class VectorStoreConfigurationError(VectorStoreError):
    """Exception raised when vector store configuration is invalid"""
    pass


class VectorStoreNotFoundError(VectorStoreError):
    """Exception raised when collection/index is not found"""
    pass


class VectorStoreOperationError(VectorStoreError):
    """Exception raised when vector store operation fails"""
    pass

