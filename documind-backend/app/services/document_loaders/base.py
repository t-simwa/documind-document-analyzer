"""
Base classes and interfaces for document loaders
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from pathlib import Path
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class DocumentContent:
    """Represents extracted content from a document"""
    
    text: str
    metadata: Dict[str, Any]
    pages: Optional[List[Dict[str, Any]]] = None  # For page-based documents
    tables: Optional[List[Dict[str, Any]]] = None  # For documents with tables
    images: Optional[List[Dict[str, Any]]] = None  # For documents with images
    
    def __post_init__(self):
        """Ensure metadata is always a dict"""
        if self.metadata is None:
            self.metadata = {}
        if self.pages is None:
            self.pages = []
        if self.tables is None:
            self.tables = []
        if self.images is None:
            self.images = []


class LoaderError(Exception):
    """Custom exception for document loader errors"""
    
    def __init__(self, message: str, file_path: Optional[str] = None, original_error: Optional[Exception] = None):
        self.message = message
        self.file_path = file_path
        self.original_error = original_error
        super().__init__(self.message)


class DocumentLoader(ABC):
    """Base class for all document loaders"""
    
    def __init__(self, file_path: str, chunk_size: int = 1024 * 1024):
        """
        Initialize the document loader
        
        Args:
            file_path: Path to the document file
            chunk_size: Size of chunks for streaming large files (default: 1MB)
        """
        self.file_path = Path(file_path)
        self.chunk_size = chunk_size
        
        if not self.file_path.exists():
            raise LoaderError(f"File not found: {file_path}", file_path=file_path)
        
        if not self.file_path.is_file():
            raise LoaderError(f"Path is not a file: {file_path}", file_path=file_path)
    
    @abstractmethod
    def load(self) -> DocumentContent:
        """
        Load and extract content from the document
        
        Returns:
            DocumentContent: Extracted content with text and metadata
            
        Raises:
            LoaderError: If loading fails
        """
        pass
    
    @abstractmethod
    def supports_streaming(self) -> bool:
        """
        Check if this loader supports streaming for large files
        
        Returns:
            bool: True if streaming is supported
        """
        pass
    
    def get_file_size(self) -> int:
        """Get the size of the file in bytes"""
        return self.file_path.stat().st_size
    
    def is_large_file(self, threshold: int = 10 * 1024 * 1024) -> bool:
        """
        Check if the file is considered large
        
        Args:
            threshold: Size threshold in bytes (default: 10MB)
            
        Returns:
            bool: True if file size exceeds threshold
        """
        return self.get_file_size() > threshold
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            str: Normalized text
        """
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        return text
    
    def _extract_metadata(self) -> Dict[str, Any]:
        """
        Extract basic file metadata
        
        Returns:
            Dict[str, Any]: File metadata
        """
        stat = self.file_path.stat()
        return {
            "file_name": self.file_path.name,
            "file_path": str(self.file_path),
            "file_size": stat.st_size,
            "file_extension": self.file_path.suffix.lower(),
            "modified_time": stat.st_mtime,
        }

