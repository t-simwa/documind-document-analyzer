"""
Document loader factory for creating appropriate loaders based on file type
"""

from pathlib import Path
from typing import Optional, Dict
import mimetypes
import structlog

from .base import DocumentLoader, LoaderError
from .pdf_loader import PDFLoader
from .docx_loader import DOCXLoader
from .text_loader import TextLoader, MarkdownLoader
from .excel_loader import ExcelLoader, CSVLoader
from .pptx_loader import PPTXLoader
from .image_loader import ImageLoader

logger = structlog.get_logger(__name__)


class DocumentLoaderFactory:
    """Factory for creating document loaders based on file type"""
    
    # Supported file extensions and their corresponding loaders
    LOADER_MAP: Dict[str, type] = {
        # PDF
        '.pdf': PDFLoader,
        
        # Microsoft Word
        '.docx': DOCXLoader,
        '.doc': DOCXLoader,  # Note: .doc requires additional handling
        
        # Text files
        '.txt': TextLoader,
        '.text': TextLoader,
        
        # Markdown
        '.md': MarkdownLoader,
        '.markdown': MarkdownLoader,
        
        # Excel
        '.xlsx': ExcelLoader,
        '.xls': ExcelLoader,
        
        # CSV
        '.csv': CSVLoader,
        
        # PowerPoint
        '.pptx': PPTXLoader,
        '.ppt': PPTXLoader,  # Note: .ppt requires additional handling
        
        # Images
        '.png': ImageLoader,
        '.jpg': ImageLoader,
        '.jpeg': ImageLoader,
        '.tiff': ImageLoader,
        '.tif': ImageLoader,
        '.bmp': ImageLoader,
        '.gif': ImageLoader,
    }
    
    # MIME type to extension mapping
    MIME_TYPE_MAP: Dict[str, str] = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/msword': '.doc',
        'text/plain': '.txt',
        'text/markdown': '.md',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-excel': '.xls',
        'text/csv': '.csv',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'application/vnd.ms-powerpoint': '.ppt',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/tiff': '.tiff',
        'image/bmp': '.bmp',
        'image/gif': '.gif',
    }
    
    @classmethod
    def create_loader(
        cls,
        file_path: str,
        file_type: Optional[str] = None,
        mime_type: Optional[str] = None,
        **kwargs
    ) -> DocumentLoader:
        """
        Create an appropriate document loader for the given file
        
        Args:
            file_path: Path to the document file
            file_type: File extension (e.g., '.pdf', '.docx')
            mime_type: MIME type of the file
            **kwargs: Additional arguments to pass to the loader
            
        Returns:
            DocumentLoader: Appropriate loader instance
            
        Raises:
            LoaderError: If file type is not supported
        """
        path = Path(file_path)
        
        # Determine file extension
        extension = None
        
        # Try to get extension from file_type parameter
        if file_type:
            if not file_type.startswith('.'):
                file_type = f'.{file_type}'
            extension = file_type.lower()
        
        # Try to get extension from file path
        if not extension and path.suffix:
            extension = path.suffix.lower()
        
        # Try to get extension from MIME type
        if not extension and mime_type:
            extension = cls.MIME_TYPE_MAP.get(mime_type.lower())
        
        # Try to guess from MIME type using mimetypes
        if not extension and mime_type:
            guessed_ext = mimetypes.guess_extension(mime_type)
            if guessed_ext:
                extension = guessed_ext.lower()
        
        # Fallback: try to guess from filename
        if not extension:
            guessed_type, _ = mimetypes.guess_type(str(path))
            if guessed_type:
                extension = cls.MIME_TYPE_MAP.get(guessed_type.lower())
                if not extension:
                    guessed_ext = mimetypes.guess_extension(guessed_type)
                    if guessed_ext:
                        extension = guessed_ext.lower()
        
        # Check if extension is supported
        if not extension:
            error_msg = f"Could not determine file type for: {file_path}"
            logger.error("unknown_file_type", file_path=file_path)
            raise LoaderError(error_msg, file_path=file_path)
        
        if extension not in cls.LOADER_MAP:
            supported = ', '.join(cls.LOADER_MAP.keys())
            error_msg = (
                f"Unsupported file type: {extension}. "
                f"Supported types: {supported}"
            )
            logger.error(
                "unsupported_file_type",
                file_path=file_path,
                extension=extension,
                supported_types=list(cls.LOADER_MAP.keys())
            )
            raise LoaderError(error_msg, file_path=file_path)
        
        # Get loader class
        loader_class = cls.LOADER_MAP[extension]
        
        # Create loader instance
        try:
            logger.info(
                "creating_loader",
                file_path=file_path,
                extension=extension,
                loader_class=loader_class.__name__
            )
            
            loader = loader_class(file_path, **kwargs)
            return loader
            
        except Exception as e:
            error_msg = f"Failed to create loader: {str(e)}"
            logger.error(
                "loader_creation_failed",
                file_path=file_path,
                extension=extension,
                error=str(e)
            )
            raise LoaderError(error_msg, file_path=file_path, original_error=e)
    
    @classmethod
    def is_supported(cls, file_path: str, file_type: Optional[str] = None) -> bool:
        """
        Check if a file type is supported
        
        Args:
            file_path: Path to the file
            file_type: File extension (optional)
            
        Returns:
            bool: True if file type is supported
        """
        try:
            path = Path(file_path)
            extension = file_type.lower() if file_type else path.suffix.lower()
            
            if not extension.startswith('.'):
                extension = f'.{extension}'
            
            return extension in cls.LOADER_MAP
            
        except Exception:
            return False
    
    @classmethod
    def get_supported_extensions(cls) -> list:
        """
        Get list of supported file extensions
        
        Returns:
            list: List of supported extensions
        """
        return list(cls.LOADER_MAP.keys())
    
    @classmethod
    def get_supported_mime_types(cls) -> list:
        """
        Get list of supported MIME types
        
        Returns:
            list: List of supported MIME types
        """
        return list(cls.MIME_TYPE_MAP.keys())

