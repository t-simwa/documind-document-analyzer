"""
Google Gemini-based document loader using native document understanding
Supports PDFs, images, DOCX, Excel, PowerPoint, and other document types
"""

import asyncio
from typing import Dict, Any, Optional
from pathlib import Path
import structlog
import mimetypes

from app.core.config import settings
from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed. Gemini document loader will not be available.")


class GeminiLoader(DocumentLoader):
    """
    Document loader using Google Gemini's native document understanding
    Supports PDFs (up to 1000 pages), images, DOCX, Excel, PowerPoint, and more
    """
    
    # MIME type mapping for different file types
    MIME_TYPE_MAP = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.bmp': 'image/bmp',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
    }
    
    def __init__(
        self,
        file_path: str,
        api_key: Optional[str] = None,
        model: str = "gemini-2.5-flash",
        chunk_size: int = 1024 * 1024
    ):
        """
        Initialize Gemini document loader
        
        Args:
            file_path: Path to the document file
            api_key: Gemini API key (defaults to settings)
            model: Gemini model to use (default: gemini-2.5-flash)
            chunk_size: Size of chunks for streaming (not used for Gemini, kept for compatibility)
        """
        super().__init__(file_path, chunk_size)
        
        if not GEMINI_AVAILABLE:
            raise LoaderError(
                "google-genai package is not installed. Install it with: pip install google-genai",
                file_path=str(self.file_path)
            )
        
        # Get API key - prioritize parameter over settings
        # Use explicit None check to distinguish between None and empty string
        if api_key is not None:
            self.api_key = api_key
        else:
            self.api_key = settings.GEMINI_API_KEY
        
        # Validate API key is not empty
        if not self.api_key or not str(self.api_key).strip():
            raise LoaderError(
                "Gemini API key is required. Set GEMINI_API_KEY in environment or pass api_key parameter.",
                file_path=str(self.file_path)
            )
        
        self.model = model
        self.client = genai.Client(api_key=self.api_key)
        
        # Determine content type
        self.content_type = self._get_content_type()
        
        logger.info(
            "gemini_loader_initialized",
            file_path=str(self.file_path),
            content_type=self.content_type,
            model=self.model
        )
    
    def _get_content_type(self) -> str:
        """Get MIME type for the file"""
        extension = self.file_path.suffix.lower()
        
        # Check our mapping first
        if extension in self.MIME_TYPE_MAP:
            return self.MIME_TYPE_MAP[extension]
        
        # Fallback to mimetypes module
        mime_type, _ = mimetypes.guess_type(str(self.file_path))
        if mime_type:
            return mime_type
        
        # Default fallback
        return 'application/octet-stream'
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from document using Gemini
        
        Returns:
            DocumentContent: Extracted content with text, pages, and metadata
            
        Raises:
            LoaderError: If document loading fails
        """
        try:
            logger.info("loading_document_with_gemini", file_path=str(self.file_path))
            
            # Handle async execution - check if we're in an event loop
            def _run_async(coro):
                """Run async coroutine, handling both sync and async contexts"""
                try:
                    # Check if we're in a running event loop
                    loop = asyncio.get_running_loop()
                    # We're in an event loop, need to run in a separate thread
                    import concurrent.futures
                    import threading
                    result = None
                    exception = None
                    
                    def run_in_thread():
                        nonlocal result, exception
                        try:
                            # Create new event loop in this thread
                            new_loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(new_loop)
                            result = new_loop.run_until_complete(coro)
                            new_loop.close()
                        except Exception as e:
                            exception = e
                    
                    thread = threading.Thread(target=run_in_thread)
                    thread.start()
                    thread.join()
                    
                    if exception:
                        raise exception
                    return result
                except RuntimeError:
                    # No event loop running, use asyncio.run()
                    return asyncio.run(coro)
            
            # For text files, read as text first
            if self.content_type.startswith('text/'):
                try:
                    with open(self.file_path, 'r', encoding='utf-8') as f:
                        file_content_text = f.read()
                    response = _run_async(self._generate_content_text(file_content_text))
                except UnicodeDecodeError:
                    # Fallback to binary if UTF-8 fails
                    response = _run_async(self._generate_content_binary(None))
            else:
                # For binary files (PDF, images, etc.), use Files API
                # Pass None since we'll use file path directly
                response = _run_async(self._generate_content_binary(None))
            
            # Extract text from response
            extracted_text = response.text if hasattr(response, 'text') and response.text else ""
            
            # Build metadata
            metadata = self._extract_metadata()
            metadata.update({
                "extraction_method": "Gemini",
                "gemini_model": self.model,
                "content_type": self.content_type,
                "total_char_count": len(extracted_text),
            })
            
            # Try to extract structured information if available
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    # Extract any additional metadata from response
                    for part in candidate.content.parts:
                        if hasattr(part, 'text'):
                            # Text already extracted
                            pass
                        elif hasattr(part, 'function_call'):
                            # Function calls can contain structured data
                            metadata['has_function_calls'] = True
            
            # Normalize text
            normalized_text = self._normalize_text(extracted_text, apply_preprocessing=False)
            
            # For PDFs and documents with pages, try to extract page information
            pages = []
            if self.content_type == 'application/pdf' or '.pdf' in self.file_path.suffix.lower():
                # Gemini processes PDFs as a whole, but we can split by pages if needed
                # For now, treat as single document
                pages = [{
                    "page_number": 1,
                    "text": normalized_text,
                    "char_count": len(normalized_text),
                }]
                metadata["page_count"] = 1  # Gemini doesn't provide exact page count
                metadata["is_pdf"] = True
            
            # Detect language
            lang_info = self._detect_language(normalized_text)
            if lang_info:
                metadata.update(lang_info)
            
            logger.info(
                "document_loaded_with_gemini",
                file_path=str(self.file_path),
                char_count=len(normalized_text),
                content_type=self.content_type
            )
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata,
                pages=pages if pages else None
            )
            
        except Exception as e:
            error_msg = f"Failed to load document with Gemini: {str(e)}"
            logger.error(
                "gemini_load_error",
                file_path=str(self.file_path),
                error=str(e),
                error_type=type(e).__name__
            )
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    async def _generate_content_text(self, text_content: str) -> Any:
        """Generate content from text input"""
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=f"Extract and return all text content from this document:\n\n{text_content}",
            )
            return response
        except Exception as e:
            logger.error("gemini_text_generation_error", error=str(e))
            raise
    
    async def _generate_content_binary(self, binary_content: Optional[bytes] = None) -> Any:
        """
        Generate content from binary file input using Files API
        
        Args:
            binary_content: Not used - we use file path directly (kept for compatibility)
        """
        try:
            # Build prompt based on file type
            if self.content_type.startswith('image/'):
                prompt = "Extract and return all text content from this image. Include any text visible in the image."
            elif self.content_type == 'application/pdf':
                prompt = "Extract and return all text content from this PDF document. Preserve the structure and formatting as much as possible."
            else:
                prompt = f"Extract and return all text content from this {self.content_type} document. Preserve structure and formatting."
            
            # Step 1: Upload file using Files API
            # Use the file path directly (Files API accepts file paths)
            uploaded_file = await asyncio.to_thread(
                self.client.files.upload,
                file=str(self.file_path)
            )
            
            try:
                # Step 2: Use uploaded file in generate_content
                # According to docs: contents=["text prompt", uploaded_file]
                contents = [prompt, uploaded_file]
                
                # Generate content using Gemini
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model,
                    contents=contents
                )
                
                return response
                
            finally:
                # Clean up uploaded file (optional - files auto-delete after 48h, but we'll clean up immediately)
                try:
                    await asyncio.to_thread(
                        self.client.files.delete,
                        name=uploaded_file.name
                    )
                except Exception as e:
                    # Ignore cleanup errors (file might already be deleted)
                    logger.debug("file_cleanup_failed", error=str(e))
                
        except Exception as e:
            logger.error("gemini_binary_generation_error", error=str(e), content_type=self.content_type)
            raise LoaderError(
                f"Failed to process binary file with Gemini: {str(e)}",
                file_path=str(self.file_path),
                original_error=e
            )
    
    def supports_streaming(self) -> bool:
        """Gemini supports streaming, but we'll use standard loading for now"""
        return False  # Can be enhanced later
    
    def load_streaming(self, max_pages: int = None) -> DocumentContent:
        """
        Load document with streaming support
        For now, delegates to standard load (can be enhanced)
        """
        return self.load()


class GeminiPDFLoader(GeminiLoader):
    """Specialized Gemini loader for PDF documents"""
    
    def __init__(self, file_path: str, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        super().__init__(file_path, api_key, model)
        if not self.file_path.suffix.lower() == '.pdf':
            raise LoaderError(
                f"GeminiPDFLoader only supports PDF files, got: {self.file_path.suffix}",
                file_path=str(self.file_path)
            )


class GeminiImageLoader(GeminiLoader):
    """Specialized Gemini loader for image documents (OCR)"""
    
    def __init__(self, file_path: str, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        super().__init__(file_path, api_key, model)
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.tif', '.bmp']
        if self.file_path.suffix.lower() not in image_extensions:
            raise LoaderError(
                f"GeminiImageLoader only supports image files, got: {self.file_path.suffix}",
                file_path=str(self.file_path)
            )

