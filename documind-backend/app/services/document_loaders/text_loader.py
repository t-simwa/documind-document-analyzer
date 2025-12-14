"""
Text and Markdown document loaders
"""

from typing import Dict, Any
import chardet
import structlog

from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)


class TextLoader(DocumentLoader):
    """Loader for plain text files"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from text file
        
        Returns:
            DocumentContent: Extracted content with text and metadata
            
        Raises:
            LoaderError: If text loading fails
        """
        try:
            logger.info("loading_text", file_path=str(self.file_path))
            
            metadata = self._extract_metadata()
            
            # Detect encoding
            encoding = self._detect_encoding()
            
            # Read file with detected encoding
            with open(self.file_path, 'r', encoding=encoding, errors='replace') as file:
                text = file.read()
            
            # Normalize text
            normalized_text = self._normalize_text(text)
            
            # Extract line and word counts
            lines = normalized_text.split('\n')
            words = normalized_text.split()
            
            metadata.update({
                "encoding": encoding,
                "line_count": len(lines),
                "word_count": len(words),
                "total_char_count": len(normalized_text),
                "extraction_method": "text_file",
            })
            
            logger.info(
                "text_loaded_successfully",
                file_path=str(self.file_path),
                encoding=encoding,
                char_count=len(normalized_text),
                line_count=len(lines)
            )
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata
            )
            
        except UnicodeDecodeError as e:
            error_msg = f"Failed to decode text file: {str(e)}"
            logger.error("text_decode_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
        
        except Exception as e:
            error_msg = f"Failed to load text file: {str(e)}"
            logger.error("text_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def _detect_encoding(self) -> str:
        """
        Detect file encoding using chardet
        
        Returns:
            str: Detected encoding (defaults to 'utf-8')
        """
        try:
            with open(self.file_path, 'rb') as file:
                # Read first chunk for encoding detection
                raw_data = file.read(min(10000, self.get_file_size()))
                result = chardet.detect(raw_data)
                encoding = result.get('encoding', 'utf-8')
                confidence = result.get('confidence', 0)
                
                logger.debug(
                    "encoding_detected",
                    file_path=str(self.file_path),
                    encoding=encoding,
                    confidence=confidence
                )
                
                # Fallback to utf-8 if confidence is too low
                if confidence < 0.7:
                    encoding = 'utf-8'
                
                return encoding
                
        except Exception as e:
            logger.warning(
                "encoding_detection_failed",
                file_path=str(self.file_path),
                error=str(e)
            )
            return 'utf-8'  # Default to UTF-8
    
    def supports_streaming(self) -> bool:
        """Text files support streaming"""
        return True
    
    def load_streaming(self, max_bytes: int = None) -> DocumentContent:
        """
        Load text file with streaming support
        
        Args:
            max_bytes: Maximum bytes to read (None for all)
            
        Returns:
            DocumentContent: Extracted content
        """
        try:
            logger.info("loading_text_streaming", file_path=str(self.file_path), max_bytes=max_bytes)
            
            metadata = self._extract_metadata()
            encoding = self._detect_encoding()
            
            text_parts = []
            bytes_read = 0
            
            with open(self.file_path, 'r', encoding=encoding, errors='replace') as file:
                if max_bytes:
                    # Read in chunks
                    while bytes_read < max_bytes:
                        chunk = file.read(self.chunk_size)
                        if not chunk:
                            break
                        text_parts.append(chunk)
                        bytes_read += len(chunk.encode(encoding))
                else:
                    text_parts.append(file.read())
            
            text = ''.join(text_parts)
            normalized_text = self._normalize_text(text)
            
            metadata.update({
                "encoding": encoding,
                "total_char_count": len(normalized_text),
                "bytes_read": bytes_read,
                "is_partial": max_bytes is not None and bytes_read >= max_bytes,
                "extraction_method": "text_file_streaming",
            })
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata
            )
            
        except Exception as e:
            error_msg = f"Failed to stream text file: {str(e)}"
            logger.error("text_streaming_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)


class MarkdownLoader(TextLoader):
    """Loader for Markdown files (extends TextLoader)"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from Markdown file
        
        Returns:
            DocumentContent: Extracted content with text and metadata
        """
        try:
            # Use parent class to load text
            content = super().load()
            
            # Add Markdown-specific metadata
            content.metadata.update({
                "file_type": "markdown",
                "extraction_method": "markdown_file",
            })
            
            # Extract Markdown structure (headings, links, etc.)
            markdown_metadata = self._extract_markdown_structure(content.text)
            content.metadata.update(markdown_metadata)
            
            logger.info(
                "markdown_loaded_successfully",
                file_path=str(self.file_path),
                heading_count=markdown_metadata.get("heading_count", 0)
            )
            
            return content
            
        except Exception as e:
            error_msg = f"Failed to load Markdown file: {str(e)}"
            logger.error("markdown_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def _extract_markdown_structure(self, text: str) -> Dict[str, Any]:
        """
        Extract Markdown structure (headings, links, etc.)
        
        Args:
            text: Markdown text content
            
        Returns:
            Dict[str, Any]: Markdown structure metadata
        """
        import re
        
        # Count headings
        heading_pattern = r'^#{1,6}\s+.+$'
        headings = re.findall(heading_pattern, text, re.MULTILINE)
        
        # Count links
        link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
        links = re.findall(link_pattern, text)
        
        # Count code blocks
        code_block_pattern = r'```[\s\S]*?```'
        code_blocks = re.findall(code_block_pattern, text)
        
        return {
            "heading_count": len(headings),
            "link_count": len(links),
            "code_block_count": len(code_blocks),
        }

