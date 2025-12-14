"""
Exceptions for chunking service
"""


class ChunkingError(Exception):
    """Custom exception for chunking errors"""
    
    def __init__(self, message: str, document_id: str = None, original_error: Exception = None):
        self.message = message
        self.document_id = document_id
        self.original_error = original_error
        super().__init__(self.message)

