"""
Text preprocessing utilities for document loaders
Includes page number removal, header/footer removal, and language detection
"""

import re
from typing import Optional, Dict, Any, List, Tuple
import structlog

logger = structlog.get_logger(__name__)

# Try to import language detection library
try:
    from langdetect import detect, detect_langs, LangDetectException
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    logger.warning("langdetect_not_available", message="langdetect not installed. Install with: pip install langdetect")


def remove_page_numbers(text: str, page_separator: str = "\n\n") -> Tuple[str, int]:
    """
    Remove page numbers from text
    
    Page numbers are typically:
    - At the start or end of lines
    - Standalone numbers (1, 2, 3, etc.)
    - In formats like "Page 1", "1 of 10", "- 1 -", etc.
    
    Args:
        text: Input text
        page_separator: Separator between pages (used to identify page boundaries)
        
    Returns:
        Tuple[str, int]: (cleaned_text, removed_count)
    """
    if not text:
        return text, 0
    
    original_length = len(text)
    
    # Split by page separator if present
    pages = text.split(page_separator) if page_separator else [text]
    cleaned_pages = []
    removed_count = 0
    
    for page in pages:
        lines = page.split('\n')
        cleaned_lines = []
        
        for line in lines:
            original_line = line
            line = line.strip()
            
            # Skip empty lines
            if not line:
                cleaned_lines.append(original_line)
                continue
            
            # Pattern 1: Standalone page numbers (1, 2, 3, etc.) at start or end of line
            if re.match(r'^\d+$', line):
                removed_count += 1
                continue
            
            # Pattern 2: "Page X" or "Page X of Y"
            if re.match(r'^Page\s+\d+(\s+of\s+\d+)?$', line, re.IGNORECASE):
                removed_count += 1
                continue
            
            # Pattern 3: "- X -" or "- X -" format
            if re.match(r'^-\s*\d+\s*-$', line):
                removed_count += 1
                continue
            
            # Pattern 4: "X / Y" or "X/Y" format
            if re.match(r'^\d+\s*/\s*\d+$', line):
                removed_count += 1
                continue
            
            # Pattern 5: Remove page numbers at end of lines (e.g., "text 1")
            # Only if the number is at the very end and line has substantial content
            line_without_end_number = re.sub(r'\s+\d+\s*$', '', line)
            if len(line_without_end_number) > 10 and line_without_end_number != line:
                line = line_without_end_number
                removed_count += 1
            
            # Pattern 6: Remove page numbers at start of lines (e.g., "1 text")
            # Only if the number is at the very start and line has substantial content
            line_without_start_number = re.sub(r'^\d+\s+', '', line)
            if len(line_without_start_number) > 10 and line_without_start_number != line:
                line = line_without_start_number
                removed_count += 1
            
            cleaned_lines.append(line)
        
        # Rejoin lines
        cleaned_page = '\n'.join(cleaned_lines)
        if cleaned_page.strip():
            cleaned_pages.append(cleaned_page)
    
    # Rejoin pages
    cleaned_text = page_separator.join(cleaned_pages) if page_separator else '\n'.join(cleaned_pages)
    
    return cleaned_text, removed_count


def remove_headers_footers(text: str, min_repetition: int = 2) -> Tuple[str, int]:
    """
    Remove headers and footers from text
    
    Headers/footers are identified by:
    - Repetitive lines at the start/end of pages
    - Common patterns like document titles, dates, etc.
    
    Args:
        text: Input text
        min_repetition: Minimum number of times a line must appear to be considered header/footer
        
    Returns:
        Tuple[str, int]: (cleaned_text, removed_count)
    """
    if not text:
        return text, 0
    
    # Split into pages (using double newline as separator)
    pages = text.split('\n\n')
    if len(pages) < 2:
        # Not enough pages to identify headers/footers
        return text, 0
    
    # Count line occurrences across pages
    line_counts = {}
    page_lines = []
    
    for page in pages:
        lines = [line.strip() for line in page.split('\n') if line.strip()]
        page_lines.append(lines)
        
        # Count first and last lines (common header/footer positions)
        if lines:
            first_line = lines[0]
            last_line = lines[-1]
            
            line_counts[first_line] = line_counts.get(first_line, 0) + 1
            if len(lines) > 1:
                line_counts[last_line] = line_counts.get(last_line, 0) + 1
    
    # Identify headers and footers (lines that appear in multiple pages)
    headers_footers = {
        line for line, count in line_counts.items()
        if count >= min_repetition and len(line) > 0
    }
    
    # Remove headers and footers from each page
    cleaned_pages = []
    removed_count = 0
    
    for lines in page_lines:
        cleaned_lines = []
        
        for i, line in enumerate(lines):
            # Check if it's a header (first line) or footer (last line)
            is_first = i == 0
            is_last = i == len(lines) - 1
            
            if (is_first or is_last) and line in headers_footers:
                removed_count += 1
                continue
            
            cleaned_lines.append(line)
        
        if cleaned_lines:
            cleaned_pages.append('\n'.join(cleaned_lines))
    
    cleaned_text = '\n\n'.join(cleaned_pages)
    
    return cleaned_text, removed_count


def detect_language(text: str) -> Dict[str, Any]:
    """
    Detect the language of the text
    
    Args:
        text: Input text to analyze
        
    Returns:
        Dict[str, Any]: Language detection results with:
            - language: Primary detected language code (e.g., 'en', 'es', 'fr')
            - confidence: Confidence score (0.0 to 1.0)
            - all_languages: List of all detected languages with probabilities
    """
    if not text or len(text.strip()) < 10:
        return {
            "language": "unknown",
            "confidence": 0.0,
            "all_languages": [],
            "detection_method": "none"
        }
    
    if not LANGDETECT_AVAILABLE:
        logger.warning("langdetect_not_available_for_detection")
        return {
            "language": "unknown",
            "confidence": 0.0,
            "all_languages": [],
            "detection_method": "none",
            "error": "langdetect library not installed"
        }
    
    try:
        # Get primary language
        primary_lang = detect(text)
        
        # Get all languages with probabilities
        all_langs = detect_langs(text)
        
        # Extract confidence from primary language
        confidence = 0.0
        for lang_info in all_langs:
            if lang_info.lang == primary_lang:
                confidence = lang_info.prob
                break
        
        return {
            "language": primary_lang,
            "confidence": round(confidence, 3),
            "all_languages": [
                {"language": lang_info.lang, "probability": round(lang_info.prob, 3)}
                for lang_info in all_langs[:5]  # Top 5 languages
            ],
            "detection_method": "langdetect"
        }
        
    except LangDetectException as e:
        logger.warning("language_detection_failed", error=str(e))
        return {
            "language": "unknown",
            "confidence": 0.0,
            "all_languages": [],
            "detection_method": "langdetect",
            "error": str(e)
        }
    except Exception as e:
        logger.error("language_detection_error", error=str(e))
        return {
            "language": "unknown",
            "confidence": 0.0,
            "all_languages": [],
            "detection_method": "langdetect",
            "error": str(e)
        }


def preprocess_text(
    text: str,
    remove_page_nums: bool = True,
    remove_headers_footers: bool = True,
    detect_lang: bool = True
) -> Dict[str, Any]:
    """
    Apply all preprocessing steps to text
    
    Args:
        text: Input text
        remove_page_nums: Whether to remove page numbers
        remove_headers_footers: Whether to remove headers and footers
        detect_lang: Whether to detect language
        
    Returns:
        Dict[str, Any]: Preprocessed text and metadata
    """
    # Store function reference before parameter shadows it
    _remove_headers_footers_func = remove_headers_footers
    
    result = {
        "text": text,
        "original_length": len(text),
        "preprocessing_applied": []
    }
    
    # Remove page numbers
    if remove_page_nums:
        cleaned_text, page_num_count = remove_page_numbers(result["text"])
        result["text"] = cleaned_text
        result["page_numbers_removed"] = page_num_count
        result["preprocessing_applied"].append("page_number_removal")
    
    # Remove headers and footers
    # Note: Parameter name shadows function name, so use globals() to get the function
    if remove_headers_footers:
        _remove_hf_func = globals()['remove_headers_footers']
        cleaned_text, header_footer_count = _remove_hf_func(result["text"])
        result["text"] = cleaned_text
        result["headers_footers_removed"] = header_footer_count
        result["preprocessing_applied"].append("header_footer_removal")
    
    # Detect language
    if detect_lang:
        lang_info = detect_language(result["text"])
        result["language_detection"] = lang_info
        result["preprocessing_applied"].append("language_detection")
    
    result["final_length"] = len(result["text"])
    result["characters_removed"] = result["original_length"] - result["final_length"]
    
    return result

