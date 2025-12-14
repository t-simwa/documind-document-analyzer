"""
Document ingestion service that orchestrates document loading
"""

from typing import Optional, Dict, Any
from pathlib import Path
import structlog

from .document_loaders import DocumentLoaderFactory, DocumentContent, LoaderError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class DocumentIngestionService:
    """Service for ingesting documents of various formats"""
    
    def __init__(self, large_file_threshold: int = 10 * 1024 * 1024):
        """
        Initialize the document ingestion service
        
        Args:
            large_file_threshold: Size threshold in bytes for large files (default: 10MB)
        """
        self.large_file_threshold = large_file_threshold
    
    async def ingest_document(
        self,
        file_path: str,
        file_type: Optional[str] = None,
        mime_type: Optional[str] = None,
        use_streaming: Optional[bool] = None,
        **loader_kwargs
    ) -> DocumentContent:
        """
        Ingest a document and extract its content
        
        Args:
            file_path: Path to the document file
            file_type: File extension (e.g., '.pdf', '.docx')
            mime_type: MIME type of the file
            use_streaming: Whether to use streaming (None for auto-detect)
            **loader_kwargs: Additional arguments for the loader
            
        Returns:
            DocumentContent: Extracted document content
            
        Raises:
            LoaderError: If ingestion fails
        """
        try:
            logger.info(
                "document_ingestion_started",
                file_path=file_path,
                file_type=file_type,
                mime_type=mime_type
            )
            
            # Validate file exists
            path = Path(file_path)
            if not path.exists():
                raise LoaderError(f"File not found: {file_path}", file_path=file_path)
            
            # Check if file type is supported
            if not DocumentLoaderFactory.is_supported(file_path, file_type):
                supported = DocumentLoaderFactory.get_supported_extensions()
                raise LoaderError(
                    f"Unsupported file type. Supported types: {', '.join(supported)}",
                    file_path=file_path
                )
            
            # Create appropriate loader
            loader = DocumentLoaderFactory.create_loader(
                file_path=file_path,
                file_type=file_type,
                mime_type=mime_type,
                **loader_kwargs
            )
            
            # Determine if streaming should be used
            if use_streaming is None:
                use_streaming = loader.is_large_file(self.large_file_threshold) and loader.supports_streaming()
            
            # Load document
            if use_streaming and loader.supports_streaming():
                logger.info("using_streaming_loader", file_path=file_path)
                content = await self._load_with_streaming(loader)
            else:
                logger.info("using_standard_loader", file_path=file_path)
                content = loader.load()
            
            # Add ingestion metadata
            content.metadata.update({
                "ingestion_method": "streaming" if use_streaming else "standard",
                "large_file": loader.is_large_file(self.large_file_threshold),
            })
            
            logger.info(
                "document_ingestion_completed",
                file_path=file_path,
                char_count=len(content.text),
                page_count=len(content.pages) if content.pages else 0,
                table_count=len(content.tables) if content.tables else 0
            )
            
            return content
            
        except LoaderError:
            raise
        except Exception as e:
            error_msg = f"Document ingestion failed: {str(e)}"
            logger.error(
                "document_ingestion_failed",
                file_path=file_path,
                error=str(e)
            )
            raise LoaderError(error_msg, file_path=file_path, original_error=e)
    
    async def _load_with_streaming(self, loader: Any) -> DocumentContent:
        """
        Load document with streaming support
        
        Args:
            loader: Document loader instance
            
        Returns:
            DocumentContent: Extracted content
        """
        try:
            # Check loader type and use appropriate streaming method
            loader_type = type(loader).__name__
            
            if loader_type == 'PDFLoader':
                # For PDFs, load first 100 pages if it's a large file
                return loader.load_streaming(max_pages=100)
            
            elif loader_type == 'TextLoader':
                # For text files, load first 10MB
                return loader.load_streaming(max_bytes=10 * 1024 * 1024)
            
            elif loader_type == 'ExcelLoader':
                # For Excel files, load first 5 sheets, 1000 rows each
                return loader.load_streaming(max_sheets=5, max_rows_per_sheet=1000)
            
            elif loader_type == 'CSVLoader':
                # For CSV files, load first 10000 rows
                return loader.load_streaming(max_rows=10000)
            
            elif loader_type == 'PPTXLoader':
                # For PPTX files, load first 50 slides
                return loader.load_streaming(max_slides=50)
            
            else:
                # Fallback to standard loading
                return loader.load()
                
        except Exception as e:
            logger.warning(
                "streaming_load_failed_fallback",
                loader_type=loader_type,
                error=str(e)
            )
            # Fallback to standard loading
            return loader.load()
    
    def validate_file(self, file_path: str, file_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Validate a file before ingestion
        
        Args:
            file_path: Path to the file
            file_type: File extension (optional)
            
        Returns:
            Dict[str, Any]: Validation result with status and details
        """
        result = {
            "valid": False,
            "file_path": file_path,
            "errors": [],
            "warnings": [],
            "file_size": 0,
            "is_supported": False,
            "is_large": False,
        }
        
        try:
            path = Path(file_path)
            
            # Check if file exists
            if not path.exists():
                result["errors"].append("File does not exist")
                return result
            
            # Check if it's a file
            if not path.is_file():
                result["errors"].append("Path is not a file")
                return result
            
            # Get file size
            result["file_size"] = path.stat().st_size
            
            # Check if file is large
            result["is_large"] = result["file_size"] > self.large_file_threshold
            if result["is_large"]:
                result["warnings"].append(
                    f"File is large ({result['file_size'] / (1024*1024):.2f} MB). "
                    "Streaming will be used."
                )
            
            # Check if file type is supported
            result["is_supported"] = DocumentLoaderFactory.is_supported(file_path, file_type)
            if not result["is_supported"]:
                supported = DocumentLoaderFactory.get_supported_extensions()
                result["errors"].append(
                    f"Unsupported file type. Supported types: {', '.join(supported)}"
                )
                return result
            
            # File is valid
            result["valid"] = True
            
        except Exception as e:
            result["errors"].append(f"Validation error: {str(e)}")
        
        return result
    
    def get_supported_formats(self) -> Dict[str, Any]:
        """
        Get information about supported file formats
        
        Returns:
            Dict[str, Any]: Supported formats information
        """
        return {
            "extensions": DocumentLoaderFactory.get_supported_extensions(),
            "mime_types": DocumentLoaderFactory.get_supported_mime_types(),
            "large_file_threshold": self.large_file_threshold,
            "streaming_supported": True,
        }

