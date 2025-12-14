"""
PDF document loader using PyPDF2
"""

from typing import Dict, Any, List
import PyPDF2
from pathlib import Path
import structlog

from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)


class PDFLoader(DocumentLoader):
    """Loader for PDF documents"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from PDF file
        
        Returns:
            DocumentContent: Extracted content with text, pages, and metadata
            
        Raises:
            LoaderError: If PDF loading fails
        """
        try:
            logger.info("loading_pdf", file_path=str(self.file_path))
            
            pages = []
            full_text = []
            metadata = self._extract_metadata()
            
            # Open PDF file
            with open(self.file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract PDF metadata
                pdf_metadata = pdf_reader.metadata or {}
                metadata.update({
                    "page_count": len(pdf_reader.pages),
                    "pdf_title": pdf_metadata.get("/Title", ""),
                    "pdf_author": pdf_metadata.get("/Author", ""),
                    "pdf_subject": pdf_metadata.get("/Subject", ""),
                    "pdf_creator": pdf_metadata.get("/Creator", ""),
                    "pdf_producer": pdf_metadata.get("/Producer", ""),
                    "is_encrypted": pdf_reader.is_encrypted,
                })
                
                # Extract text from each page
                for page_num, page in enumerate(pdf_reader.pages, start=1):
                    try:
                        page_text = page.extract_text()
                        # Don't apply preprocessing on individual pages - do it on combined text
                        normalized_text = self._normalize_text(page_text, apply_preprocessing=False)
                        
                        pages.append({
                            "page_number": page_num,
                            "text": normalized_text,
                            "char_count": len(normalized_text),
                        })
                        
                        full_text.append(normalized_text)
                        
                    except Exception as e:
                        logger.warning(
                            "pdf_page_extraction_failed",
                            page_num=page_num,
                            error=str(e)
                        )
                        # Continue with other pages even if one fails
                        pages.append({
                            "page_number": page_num,
                            "text": "",
                            "char_count": 0,
                            "error": str(e),
                        })
                
                # Combine all pages
                combined_text = "\n\n".join(full_text)
                
                # Apply preprocessing (page numbers, headers/footers)
                from .preprocessing import preprocess_text
                preprocess_result = preprocess_text(
                    combined_text,
                    remove_page_nums=True,
                    remove_headers_footers=True,
                    detect_lang=True
                )
                combined_text = preprocess_result["text"]
                
                # Normalize text
                combined_text = self._normalize_text(combined_text, apply_preprocessing=False)
                
                # Add preprocessing metadata
                if "page_numbers_removed" in preprocess_result:
                    metadata["page_numbers_removed"] = preprocess_result["page_numbers_removed"]
                if "headers_footers_removed" in preprocess_result:
                    metadata["headers_footers_removed"] = preprocess_result["headers_footers_removed"]
                if "language_detection" in preprocess_result:
                    lang_info = preprocess_result["language_detection"]
                    metadata["detected_language"] = lang_info.get("language", "unknown")
                    metadata["language_confidence"] = lang_info.get("confidence", 0.0)
                    metadata["language_detection_method"] = lang_info.get("detection_method", "none")
                
                metadata["total_char_count"] = len(combined_text)
                metadata["extraction_method"] = "PyPDF2"
                
                logger.info(
                    "pdf_loaded_successfully",
                    file_path=str(self.file_path),
                    page_count=len(pages),
                    char_count=len(combined_text)
                )
                
                return DocumentContent(
                    text=combined_text,
                    metadata=metadata,
                    pages=pages
                )
                
        except PyPDF2.errors.PdfReadError as e:
            error_msg = f"Invalid PDF file: {str(e)}"
            logger.error("pdf_read_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
        
        except Exception as e:
            error_msg = f"Failed to load PDF: {str(e)}"
            logger.error("pdf_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def supports_streaming(self) -> bool:
        """PDF loading supports streaming for large files"""
        return True
    
    def load_streaming(self, max_pages: int = None) -> DocumentContent:
        """
        Load PDF with streaming support for large files
        
        Args:
            max_pages: Maximum number of pages to load (None for all)
            
        Returns:
            DocumentContent: Extracted content
        """
        try:
            logger.info("loading_pdf_streaming", file_path=str(self.file_path), max_pages=max_pages)
            
            pages = []
            full_text = []
            metadata = self._extract_metadata()
            
            with open(self.file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                pages_to_load = min(max_pages or total_pages, total_pages)
                
                metadata.update({
                    "page_count": total_pages,
                    "pages_loaded": pages_to_load,
                    "is_partial": pages_to_load < total_pages,
                })
                
                # Load pages in chunks
                for page_num in range(1, pages_to_load + 1):
                    try:
                        page = pdf_reader.pages[page_num - 1]
                        page_text = page.extract_text()
                        # Don't apply preprocessing on individual pages
                        normalized_text = self._normalize_text(page_text, apply_preprocessing=False)
                        
                        pages.append({
                            "page_number": page_num,
                            "text": normalized_text,
                            "char_count": len(normalized_text),
                        })
                        
                        full_text.append(normalized_text)
                        
                    except Exception as e:
                        logger.warning(
                            "pdf_page_streaming_failed",
                            page_num=page_num,
                            error=str(e)
                        )
                
                combined_text = "\n\n".join(full_text)
                
                # Apply preprocessing
                from .preprocessing import preprocess_text
                preprocess_result = preprocess_text(
                    combined_text,
                    remove_page_nums=True,
                    remove_headers_footers=True,
                    detect_lang=True
                )
                combined_text = preprocess_result["text"]
                combined_text = self._normalize_text(combined_text, apply_preprocessing=False)
                
                # Add preprocessing metadata
                if "page_numbers_removed" in preprocess_result:
                    metadata["page_numbers_removed"] = preprocess_result["page_numbers_removed"]
                if "headers_footers_removed" in preprocess_result:
                    metadata["headers_footers_removed"] = preprocess_result["headers_footers_removed"]
                if "language_detection" in preprocess_result:
                    lang_info = preprocess_result["language_detection"]
                    metadata["detected_language"] = lang_info.get("language", "unknown")
                    metadata["language_confidence"] = lang_info.get("confidence", 0.0)
                
                metadata["total_char_count"] = len(combined_text)
                metadata["extraction_method"] = "PyPDF2_streaming"
                
                return DocumentContent(
                    text=combined_text,
                    metadata=metadata,
                    pages=pages
                )
                
        except Exception as e:
            error_msg = f"Failed to stream PDF: {str(e)}"
            logger.error("pdf_streaming_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)

