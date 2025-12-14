"""
Image-based document loader with OCR support
Uses EasyOCR as primary engine (pip-installable, cloud-ready)
Falls back to Tesseract if EasyOCR is unavailable
"""

from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import structlog
import io

# Compatibility patch for Pillow 10.1.0+ (ANTIALIAS was removed)
# EasyOCR still uses the old API, so we add it back for compatibility
# This MUST be done before importing easyocr
if not hasattr(Image, 'ANTIALIAS'):
    Image.ANTIALIAS = Image.LANCZOS  # LANCZOS is the modern equivalent

from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)

# Try to import OCR engines
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logger.warning("easyocr_not_available", message="EasyOCR not installed. Install with: pip install easyocr")

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract_not_available", message="pytesseract not installed. Install with: pip install pytesseract")


class ImageLoader(DocumentLoader):
    """Loader for image files with OCR support"""
    
    def __init__(self, file_path: str, chunk_size: int = 1024 * 1024, ocr_lang: str = 'eng'):
        """
        Initialize the image loader
        
        Args:
            file_path: Path to the image file
            chunk_size: Size of chunks for streaming (not used for images)
            ocr_lang: OCR language code (default: 'eng')
        """
        super().__init__(file_path, chunk_size)
        self.ocr_lang = ocr_lang
        self.supported_formats = {'.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.gif'}
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from image file using OCR
        
        Returns:
            DocumentContent: Extracted content with text and metadata
            
        Raises:
            LoaderError: If image loading or OCR fails
        """
        try:
            logger.info("loading_image", file_path=str(self.file_path), ocr_lang=self.ocr_lang)
            
            metadata = self._extract_metadata()
            
            # Check if file extension is supported
            if self.file_path.suffix.lower() not in self.supported_formats:
                raise LoaderError(
                    f"Unsupported image format: {self.file_path.suffix}",
                    file_path=str(self.file_path)
                )
            
            # Open and process image
            try:
                image = Image.open(self.file_path)
            except Exception as e:
                raise LoaderError(
                    f"Failed to open image file: {str(e)}",
                    file_path=str(self.file_path),
                    original_error=e
                )
            
            # Extract image metadata
            image_metadata = self._extract_image_metadata(image)
            metadata.update(image_metadata)
            
            # Perform OCR - try EasyOCR first, fallback to Tesseract
            ocr_text = ""
            ocr_metadata = {}
            extraction_method = "none"
            
            if EASYOCR_AVAILABLE:
                try:
                    logger.info("using_easyocr", file_path=str(self.file_path))
                    ocr_text, ocr_metadata = self._ocr_with_easyocr(image)
                    extraction_method = "easyocr"
                except Exception as e:
                    logger.warning(
                        "easyocr_failed_fallback",
                        file_path=str(self.file_path),
                        error=str(e)
                    )
                    # Fallback to Tesseract if available
                    if TESSERACT_AVAILABLE:
                        try:
                            logger.info("falling_back_to_tesseract", file_path=str(self.file_path))
                            ocr_text, ocr_metadata = self._ocr_with_tesseract(image)
                            extraction_method = "pytesseract_ocr"
                        except Exception as tesseract_error:
                            error_msg = f"OCR processing failed with both engines. EasyOCR error: {str(e)}, Tesseract error: {str(tesseract_error)}"
                            logger.error("all_ocr_failed", file_path=str(self.file_path), error=error_msg)
                            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
                    else:
                        error_msg = f"EasyOCR failed and Tesseract is not available: {str(e)}"
                        logger.error("ocr_unavailable", file_path=str(self.file_path), error=error_msg)
                        raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
            
            elif TESSERACT_AVAILABLE:
                try:
                    logger.info("using_tesseract", file_path=str(self.file_path))
                    ocr_text, ocr_metadata = self._ocr_with_tesseract(image)
                    extraction_method = "pytesseract_ocr"
                except pytesseract.TesseractNotFoundError:
                    error_msg = "Tesseract OCR is not installed on the system. Please install EasyOCR with: pip install easyocr"
                    logger.error("tesseract_not_found", file_path=str(self.file_path))
                    raise LoaderError(error_msg, file_path=str(self.file_path))
                except Exception as e:
                    error_msg = f"OCR processing failed: {str(e)}"
                    logger.error("ocr_error", file_path=str(self.file_path), error=str(e))
                    raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
            
            else:
                error_msg = "No OCR engine available. Please install EasyOCR with: pip install easyocr"
                logger.error("no_ocr_engine", file_path=str(self.file_path))
                raise LoaderError(error_msg, file_path=str(self.file_path))
            
            # Normalize text
            normalized_text = self._normalize_text(ocr_text)
            
            metadata.update(ocr_metadata)
            metadata.update({
                "ocr_language": self.ocr_lang,
                "total_char_count": len(normalized_text),
                "extraction_method": extraction_method,
            })
            
            # Store image data
            image_data = {
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode,
            }
            
            logger.info(
                "image_loaded_successfully",
                file_path=str(self.file_path),
                char_count=len(normalized_text),
                word_count=ocr_metadata.get("word_count", 0)
            )
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata,
                images=[image_data]
            )
            
        except LoaderError:
            raise
        except Exception as e:
            error_msg = f"Failed to load image file: {str(e)}"
            logger.error("image_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def _extract_image_metadata(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract metadata from image
        
        Args:
            image: PIL Image object
            
        Returns:
            Dict[str, Any]: Image metadata
        """
        metadata = {
            "image_width": image.width,
            "image_height": image.height,
            "image_format": image.format,
            "image_mode": image.mode,
        }
        
        # Extract EXIF data if available
        if hasattr(image, '_getexif') and image._getexif():
            try:
                exif = image._getexif()
                if exif:
                    metadata["has_exif"] = True
                    # Extract common EXIF tags
                    exif_tags = {}
                    for tag_id, value in exif.items():
                        try:
                            from PIL.ExifTags import TAGS
                            tag = TAGS.get(tag_id, tag_id)
                            exif_tags[str(tag)] = str(value)
                        except Exception:
                            pass
                    if exif_tags:
                        metadata["exif_data"] = exif_tags
            except Exception:
                pass
        
        return metadata
    
    def _ocr_with_easyocr(self, image: Image.Image) -> Tuple[str, Dict[str, Any]]:
        """
        Perform OCR using EasyOCR
        
        Args:
            image: PIL Image object
            
        Returns:
            tuple: (extracted_text, metadata_dict)
        """
        # Initialize EasyOCR reader (lazy initialization)
        if not hasattr(self, '_easyocr_reader'):
            # Map language codes (EasyOCR uses different codes)
            lang_map = {
                'eng': 'en',
                'spa': 'es',
                'fra': 'fr',
                'deu': 'de',
                'chi_sim': 'ch_sim',
                'chi_trad': 'ch_trad',
            }
            easyocr_lang = lang_map.get(self.ocr_lang, 'en')
            
            logger.info("initializing_easyocr", lang=easyocr_lang)
            self._easyocr_reader = easyocr.Reader([easyocr_lang], gpu=False)
        
        # Convert PIL Image to numpy array
        import numpy as np
        img_array = np.array(image)
        
        # Perform OCR
        results = self._easyocr_reader.readtext(img_array)
        
        # Extract text and confidence scores
        text_parts = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            text_parts.append(text)
            confidences.append(confidence)
        
        # Combine all text
        ocr_text = "\n".join(text_parts)
        
        # Calculate metadata
        words = ocr_text.split()
        lines = [line for line in ocr_text.split('\n') if line.strip()]
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        metadata = {
            "word_count": len(words),
            "line_count": len(lines),
            "ocr_confidence_avg": round(avg_confidence * 100, 2),  # Convert to percentage
            "ocr_confidence_min": round(min(confidences) * 100, 2) if confidences else 0,
            "ocr_confidence_max": round(max(confidences) * 100, 2) if confidences else 0,
            "detection_count": len(results),
        }
        
        return ocr_text, metadata
    
    def _ocr_with_tesseract(self, image: Image.Image) -> Tuple[str, Dict[str, Any]]:
        """
        Perform OCR using Tesseract (fallback)
        
        Args:
            image: PIL Image object
            
        Returns:
            tuple: (extracted_text, metadata_dict)
        """
        # Perform OCR
        ocr_text = pytesseract.image_to_string(image, lang=self.ocr_lang)
        ocr_data = pytesseract.image_to_data(image, lang=self.ocr_lang, output_type=pytesseract.Output.DICT)
        
        # Extract metadata
        words = [word for word in ocr_data.get('text', []) if word.strip()]
        lines = [line for line in ocr_data.get('text', []) if '\n' in line or line.strip()]
        
        # Count confidence levels
        confidences = [int(conf) for conf in ocr_data.get('conf', []) if conf != '-1']
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        metadata = {
            "word_count": len(words),
            "line_count": len(lines),
            "ocr_confidence_avg": round(avg_confidence, 2),
            "ocr_confidence_min": min(confidences) if confidences else 0,
            "ocr_confidence_max": max(confidences) if confidences else 0,
        }
        
        return ocr_text, metadata
    
    def supports_streaming(self) -> bool:
        """Images don't support streaming in the traditional sense"""
        return False
    
    def load_multipage_tiff(self) -> DocumentContent:
        """
        Load multi-page TIFF files
        
        Returns:
            DocumentContent: Extracted content from all pages
        """
        try:
            logger.info("loading_multipage_tiff", file_path=str(self.file_path))
            
            metadata = self._extract_metadata()
            pages_data = []
            full_text = []
            
            # Open multi-page TIFF
            image = Image.open(self.file_path)
            
            page_num = 0
            while True:
                try:
                    page_num += 1
                    
                    # Perform OCR on current page (use same method as single image)
                    if EASYOCR_AVAILABLE:
                        try:
                            ocr_text, _ = self._ocr_with_easyocr(image)
                        except Exception:
                            if TESSERACT_AVAILABLE:
                                ocr_text, _ = self._ocr_with_tesseract(image)
                            else:
                                raise
                    elif TESSERACT_AVAILABLE:
                        ocr_text, _ = self._ocr_with_tesseract(image)
                    else:
                        raise LoaderError("No OCR engine available", file_path=str(self.file_path))
                    
                    normalized_text = self._normalize_text(ocr_text)
                    
                    pages_data.append({
                        "page_number": page_num,
                        "text": normalized_text,
                        "char_count": len(normalized_text),
                    })
                    
                    full_text.append(normalized_text)
                    
                    # Move to next page
                    image.seek(image.tell() + 1)
                    
                except EOFError:
                    # End of file
                    break
                except Exception as e:
                    logger.warning(
                        "tiff_page_ocr_failed",
                        page_num=page_num,
                        error=str(e)
                    )
                    break
            
            combined_text = "\n\n".join(full_text)
            combined_text = self._normalize_text(combined_text)
            
            extraction_method = "easyocr" if EASYOCR_AVAILABLE else ("pytesseract_ocr" if TESSERACT_AVAILABLE else "none")
            metadata.update({
                "page_count": page_num,
                "total_char_count": len(combined_text),
                "extraction_method": f"{extraction_method}_multipage",
            })
            
            return DocumentContent(
                text=combined_text,
                metadata=metadata,
                pages=pages_data
            )
            
        except Exception as e:
            error_msg = f"Failed to load multi-page TIFF: {str(e)}"
            logger.error("multipage_tiff_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)

