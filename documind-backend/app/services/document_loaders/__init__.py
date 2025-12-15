"""Document loaders for various file formats"""

from .base import DocumentLoader, DocumentContent, LoaderError
from .pdf_loader import PDFLoader
from .docx_loader import DOCXLoader
from .text_loader import TextLoader, MarkdownLoader
from .excel_loader import ExcelLoader, CSVLoader
from .pptx_loader import PPTXLoader
from .image_loader import ImageLoader

# Gemini loaders (optional, requires google-genai package)
try:
    from .gemini_loader import GeminiLoader, GeminiPDFLoader, GeminiImageLoader
    GEMINI_LOADERS_AVAILABLE = True
except ImportError:
    GEMINI_LOADERS_AVAILABLE = False
    GeminiLoader = None
    GeminiPDFLoader = None
    GeminiImageLoader = None

from .factory import DocumentLoaderFactory
from .preprocessing import (
    remove_page_numbers,
    remove_headers_footers,
    detect_language,
    preprocess_text,
)

__all__ = [
    "DocumentLoader",
    "DocumentContent",
    "LoaderError",
    "PDFLoader",
    "DOCXLoader",
    "TextLoader",
    "MarkdownLoader",
    "ExcelLoader",
    "CSVLoader",
    "PPTXLoader",
    "ImageLoader",
    "DocumentLoaderFactory",
    "remove_page_numbers",
    "remove_headers_footers",
    "detect_language",
    "preprocess_text",
    "GEMINI_LOADERS_AVAILABLE",
]

# Add Gemini loaders to exports if available
if GEMINI_LOADERS_AVAILABLE:
    __all__.extend(["GeminiLoader", "GeminiPDFLoader", "GeminiImageLoader"])

