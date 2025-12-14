"""
Document chunking service with adaptive chunking strategies
"""

from typing import List, Dict, Any, Optional, Literal, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import re
import structlog

from app.services.document_loaders.base import DocumentContent
from .exceptions import ChunkingError

logger = structlog.get_logger(__name__)


class RecursiveCharacterTextSplitter:
    """
    Custom implementation of RecursiveCharacterTextSplitter
    Splits text recursively by trying different separators in order of priority
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
        length_function: callable = len,
        is_separator_regex: bool = False
    ):
        """
        Initialize the text splitter
        
        Args:
            chunk_size: Maximum size of chunks
            chunk_overlap: Overlap between chunks
            separators: List of separators to try (in order of priority)
            length_function: Function to calculate text length
            is_separator_regex: Whether separators are regex patterns (not used in this implementation)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or [
            "\n\n",  # Paragraphs
            "\n",    # Lines
            ". ",    # Sentences
            "! ",    # Exclamations
            "? ",    # Questions
            "; ",    # Semicolons
            ", ",    # Commas
            " ",     # Words
            "",      # Characters (fallback)
        ]
        self.length_function = length_function
        self.is_separator_regex = is_separator_regex
    
    def split_text(self, text: str) -> List[str]:
        """
        Split text into chunks recursively
        
        Args:
            text: Text to split
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        # If text is smaller than chunk size, return as single chunk
        if self.length_function(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        current_text = text
        
        while current_text:
            # Try to split at the best separator
            chunk, remaining = self._split_at_separator(current_text)
            
            if chunk:
                chunks.append(chunk)
            
            if not remaining or remaining == current_text:
                # No progress made, force split
                if remaining:
                    # Split at character level if we can't find a good separator
                    if self.length_function(remaining) > self.chunk_size:
                        chunks.append(remaining[:self.chunk_size])
                        current_text = remaining[self.chunk_size - self.chunk_overlap:]
                    else:
                        chunks.append(remaining)
                        break
                else:
                    break
            else:
                current_text = remaining
        
        # Merge small chunks and apply overlap
        return self._merge_chunks_with_overlap(chunks)
    
    def _split_at_separator(self, text: str) -> Tuple[str, str]:
        """
        Try to split text at the best available separator
        
        Args:
            text: Text to split
            
        Returns:
            Tuple of (chunk, remaining_text)
        """
        # Try each separator in order of priority
        for separator in self.separators:
            if separator == "":
                # Character-level splitting (fallback)
                if self.length_function(text) > self.chunk_size:
                    split_pos = self.chunk_size
                    return text[:split_pos], text[split_pos:]
                continue
            
            # Find the last occurrence of separator before chunk_size
            search_text = text[:self.chunk_size + len(separator)]
            last_index = search_text.rfind(separator)
            
            if last_index > 0:
                # Found a good split point
                split_pos = last_index + len(separator)
                chunk = text[:split_pos].rstrip()
                remaining = text[split_pos:]
                return chunk, remaining
        
        # No good separator found, split at chunk_size
        if self.length_function(text) > self.chunk_size:
            return text[:self.chunk_size], text[self.chunk_size:]
        
        return text, ""
    
    def _merge_chunks_with_overlap(self, chunks: List[str]) -> List[str]:
        """
        Merge small chunks and apply overlap between chunks
        
        Args:
            chunks: List of chunks to merge
            
        Returns:
            List of merged chunks with overlap
        """
        if not chunks:
            return []
        
        merged = []
        i = 0
        
        while i < len(chunks):
            current_chunk = chunks[i]
            
            # Try to merge with next chunk if current is too small
            if (self.length_function(current_chunk) < self.chunk_size * 0.5 and 
                i + 1 < len(chunks)):
                next_chunk = chunks[i + 1]
                combined = current_chunk + next_chunk
                
                if self.length_function(combined) <= self.chunk_size:
                    merged.append(combined)
                    i += 2
                    continue
            
            merged.append(current_chunk)
            i += 1
        
        # Apply overlap between chunks
        if self.chunk_overlap > 0 and len(merged) > 1:
            overlapped = [merged[0]]
            
            for i in range(1, len(merged)):
                prev_chunk = merged[i - 1]
                current_chunk = merged[i]
                
                # Take overlap from end of previous chunk
                if self.length_function(prev_chunk) > self.chunk_overlap:
                    overlap_text = prev_chunk[-self.chunk_overlap:]
                    # Combine overlap with current chunk
                    overlapped.append(overlap_text + current_chunk)
                else:
                    overlapped.append(current_chunk)
            
            return overlapped
        
        return merged


@dataclass
class Chunk:
    """Represents a text chunk with comprehensive metadata"""
    
    text: str
    chunk_index: int
    document_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Core metadata fields
    page_number: Optional[int] = None
    section: Optional[str] = None
    heading: Optional[str] = None
    document_type: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Position tracking
    start_char_index: Optional[int] = None
    end_char_index: Optional[int] = None
    
    # Chunk statistics
    char_count: int = 0
    word_count: int = 0
    
    def __post_init__(self):
        """Calculate statistics and ensure metadata consistency"""
        if self.char_count == 0:
            self.char_count = len(self.text)
        if self.word_count == 0:
            self.word_count = len(self.text.split())
        
        # Ensure timestamp is datetime
        if isinstance(self.timestamp, str):
            try:
                self.timestamp = datetime.fromisoformat(self.timestamp)
            except (ValueError, AttributeError):
                self.timestamp = datetime.utcnow()
        
        # Add computed fields to metadata
        self.metadata.update({
            "chunk_index": self.chunk_index,
            "document_id": self.document_id,
            "char_count": self.char_count,
            "word_count": self.word_count,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else str(self.timestamp),
        })
        
        if self.page_number is not None:
            self.metadata["page_number"] = self.page_number
        if self.section is not None:
            self.metadata["section"] = self.section
        if self.heading is not None:
            self.metadata["heading"] = self.heading
        if self.document_type is not None:
            self.metadata["document_type"] = self.document_type
        if self.start_char_index is not None:
            self.metadata["start_char_index"] = self.start_char_index
        if self.end_char_index is not None:
            self.metadata["end_char_index"] = self.end_char_index


@dataclass
class ChunkingConfig:
    """Configuration for document chunking"""
    
    chunk_size: int = 1000
    chunk_overlap: int = 200
    document_type: Optional[Literal["contract", "report", "article", "general"]] = None
    
    # Boundary preservation
    preserve_sentences: bool = True
    preserve_paragraphs: bool = True
    
    # Document-type-specific defaults
    def __post_init__(self):
        """Apply document-type-specific defaults"""
        if self.document_type == "contract":
            if self.chunk_size == 1000:  # Only override if using default
                self.chunk_size = 400
                self.chunk_overlap = 50
        elif self.document_type == "report":
            if self.chunk_size == 1000:
                self.chunk_size = 650
                self.chunk_overlap = 100
        elif self.document_type == "article":
            if self.chunk_size == 1000:
                self.chunk_size = 1000
                self.chunk_overlap = 200


class ChunkingService:
    """Service for chunking documents with adaptive strategies"""
    
    def __init__(self, config: Optional[ChunkingConfig] = None):
        """
        Initialize the chunking service
        
        Args:
            config: Chunking configuration (uses defaults if not provided)
        """
        self.config = config or ChunkingConfig()
        self._initialize_splitter()
    
    def _initialize_splitter(self):
        """Initialize the RecursiveCharacterTextSplitter with configuration"""
        # Define separators for recursive splitting
        # Order matters: more specific separators first
        separators = [
            "\n\n",  # Paragraphs
            "\n",    # Lines
            ". ",    # Sentences
            "! ",    # Exclamations
            "? ",    # Questions
            "; ",    # Semicolons
            ", ",    # Commas
            " ",     # Words
            "",      # Characters (fallback)
        ]
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
            separators=separators,
            length_function=len,
            is_separator_regex=False,
        )
    
    def chunk_document(
        self,
        document_content: DocumentContent,
        document_id: str,
        document_type: Optional[str] = None
    ) -> List[Chunk]:
        """
        Chunk a document with comprehensive metadata preservation
        
        Args:
            document_content: DocumentContent from ingestion service
            document_id: Unique identifier for the document
            document_type: Type of document (contract, report, article, etc.)
            
        Returns:
            List[Chunk]: List of chunks with metadata
            
        Raises:
            ChunkingError: If chunking fails
        """
        try:
            logger.info(
                "chunking_started",
                document_id=document_id,
                document_type=document_type or self.config.document_type,
                text_length=len(document_content.text)
            )
            
            # Determine document type
            doc_type = document_type or self.config.document_type or self._detect_document_type(document_content)
            
            # Update config if document type is provided
            if doc_type and doc_type != self.config.document_type:
                self.config.document_type = doc_type
                self.config.__post_init__()  # Apply type-specific defaults
                self._initialize_splitter()  # Reinitialize with new config
            
            # Extract page information if available
            page_map = self._build_page_map(document_content)
            
            # Extract section/heading information
            sections = self._extract_sections(document_content.text)
            
            # Split text into chunks
            text_chunks = self.splitter.split_text(document_content.text)
            
            # Create Chunk objects with metadata
            chunks = []
            current_char_index = 0
            
            for idx, chunk_text in enumerate(text_chunks):
                # Find where this chunk appears in the original text
                # Try to find exact match first
                start_idx = document_content.text.find(chunk_text, current_char_index)
                if start_idx == -1:
                    # If exact match not found, try from beginning (for overlapping chunks)
                    start_idx = document_content.text.find(chunk_text)
                if start_idx == -1:
                    # Fallback: estimate position based on previous chunks
                    start_idx = current_char_index
                end_idx = start_idx + len(chunk_text)
                # Update current_char_index to avoid finding same chunk again
                current_char_index = max(start_idx + 1, current_char_index + 1)
                
                # Determine page number
                page_num = self._get_page_for_position(start_idx, page_map)
                
                # Determine section/heading
                section_info = self._get_section_for_position(start_idx, sections)
                
                # Create chunk
                chunk = Chunk(
                    text=chunk_text,
                    chunk_index=idx,
                    document_id=document_id,
                    page_number=page_num,
                    section=section_info.get("section"),
                    heading=section_info.get("heading"),
                    document_type=doc_type,
                    start_char_index=start_idx,
                    end_char_index=end_idx,
                    metadata={
                        **document_content.metadata,  # Preserve original document metadata
                    }
                )
                
                chunks.append(chunk)
            
            logger.info(
                "chunking_completed",
                document_id=document_id,
                chunk_count=len(chunks),
                avg_chunk_size=sum(len(c.text) for c in chunks) / len(chunks) if chunks else 0
            )
            
            return chunks
            
        except Exception as e:
            error_msg = f"Document chunking failed: {str(e)}"
            logger.error(
                "chunking_failed",
                document_id=document_id,
                error=str(e)
            )
            raise ChunkingError(error_msg, document_id=document_id, original_error=e)
    
    def _detect_document_type(self, document_content: DocumentContent) -> str:
        """
        Detect document type from content and metadata
        
        Args:
            document_content: Document content to analyze
            
        Returns:
            str: Detected document type (contract, report, article, general)
        """
        text_lower = document_content.text.lower()
        metadata_lower = {k.lower(): str(v).lower() for k, v in document_content.metadata.items()}
        
        # Check metadata first
        file_name = metadata_lower.get("file_name", "")
        file_path = metadata_lower.get("file_path", "")
        
        # Contract indicators
        contract_keywords = ["contract", "agreement", "terms", "clause", "party", "signature"]
        if any(kw in file_name or kw in file_path for kw in contract_keywords):
            return "contract"
        if any(kw in text_lower[:5000] for kw in contract_keywords):  # Check first 5000 chars
            return "contract"
        
        # Report indicators
        report_keywords = ["report", "summary", "analysis", "findings", "conclusion", "executive"]
        if any(kw in file_name or kw in file_path for kw in report_keywords):
            return "report"
        if any(kw in text_lower[:5000] for kw in report_keywords):
            return "report"
        
        # Article indicators
        article_keywords = ["article", "blog", "post", "essay", "opinion"]
        if any(kw in file_name or kw in file_path for kw in article_keywords):
            return "article"
        
        return "general"
    
    def _build_page_map(self, document_content: DocumentContent) -> List[Dict[str, Any]]:
        """
        Build a map of character positions to page numbers
        
        Args:
            document_content: Document content with pages
            
        Returns:
            List[Dict]: List of page mappings with start/end positions
        """
        page_map = []
        
        if not document_content.pages:
            return page_map
        
        current_pos = 0
        for page_idx, page in enumerate(document_content.pages):
            page_text = page.get("text", "")
            page_num = page.get("page_number", page_idx + 1)
            
            if page_text:
                start_pos = document_content.text.find(page_text, current_pos)
                if start_pos != -1:
                    end_pos = start_pos + len(page_text)
                    page_map.append({
                        "page_number": page_num,
                        "start_pos": start_pos,
                        "end_pos": end_pos,
                    })
                    current_pos = start_pos
        
        return page_map
    
    def _get_page_for_position(self, char_position: int, page_map: List[Dict[str, Any]]) -> Optional[int]:
        """
        Get page number for a character position
        
        Args:
            char_position: Character position in document
            page_map: Page mapping from _build_page_map
            
        Returns:
            Optional[int]: Page number or None
        """
        for page_info in page_map:
            if page_info["start_pos"] <= char_position < page_info["end_pos"]:
                return page_info["page_number"]
        
        # Fallback: find closest page
        if page_map:
            for page_info in page_map:
                if char_position < page_info["end_pos"]:
                    return page_info["page_number"]
            return page_map[-1]["page_number"]
        
        return None
    
    def _extract_sections(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract sections and headings from text
        
        Args:
            text: Document text
            
        Returns:
            List[Dict]: List of sections with positions and headings
        """
        sections = []
        
        # Pattern for markdown-style headings
        markdown_heading_pattern = r'^(#{1,6})\s+(.+)$'
        
        # Pattern for numbered sections (e.g., "1. Introduction", "1.1 Overview")
        numbered_section_pattern = r'^(\d+(?:\.\d+)*)\s+(.+)$'
        
        # Pattern for ALL CAPS headings (common in documents)
        all_caps_heading_pattern = r'^([A-Z][A-Z\s]{10,})$'
        
        lines = text.split('\n')
        current_section = None
        current_heading = None
        
        char_pos = 0
        
        for line in lines:
            line_stripped = line.strip()
            
            # Check for markdown heading
            md_match = re.match(markdown_heading_pattern, line_stripped)
            if md_match:
                level = len(md_match.group(1))
                heading = md_match.group(2).strip()
                sections.append({
                    "start_pos": char_pos,
                    "section": f"section_{len(sections) + 1}",
                    "heading": heading,
                    "level": level,
                })
                current_section = f"section_{len(sections)}"
                current_heading = heading
                char_pos += len(line) + 1
                continue
            
            # Check for numbered section
            num_match = re.match(numbered_section_pattern, line_stripped)
            if num_match:
                section_num = num_match.group(1)
                heading = num_match.group(2).strip()
                sections.append({
                    "start_pos": char_pos,
                    "section": section_num,
                    "heading": heading,
                    "level": section_num.count('.') + 1,
                })
                current_section = section_num
                current_heading = heading
                char_pos += len(line) + 1
                continue
            
            # Check for ALL CAPS heading (must be short and all caps)
            if len(line_stripped) > 10 and len(line_stripped) < 100 and line_stripped.isupper():
                caps_match = re.match(all_caps_heading_pattern, line_stripped)
                if caps_match:
                    heading = line_stripped.title()  # Convert to Title Case
                    sections.append({
                        "start_pos": char_pos,
                        "section": f"section_{len(sections) + 1}",
                        "heading": heading,
                        "level": 1,
                    })
                    current_section = f"section_{len(sections)}"
                    current_heading = heading
                    char_pos += len(line) + 1
                    continue
            
            char_pos += len(line) + 1
        
        return sections
    
    def _get_section_for_position(
        self,
        char_position: int,
        sections: List[Dict[str, Any]]
    ) -> Dict[str, Optional[str]]:
        """
        Get section and heading for a character position
        
        Args:
            char_position: Character position in document
            sections: Sections from _extract_sections
            
        Returns:
            Dict: Section and heading information
        """
        # Find the most recent section before or at this position
        current_section = None
        current_heading = None
        
        # If no sections, return None
        if not sections:
            return {
                "section": None,
                "heading": None,
            }
        
        # Find the most recent section that starts before or at this position
        for section in sections:
            if section["start_pos"] <= char_position:
                current_section = section["section"]
                current_heading = section["heading"]
            else:
                # We've passed all relevant sections, break
                break
        
        # If position is before first section, check if we should assign first section anyway
        # (for chunks that start at position 0 but contain section content)
        if current_section is None and sections and char_position < sections[0]["start_pos"] + 100:
            # If we're close to the first section, assign it
            current_section = sections[0]["section"]
            current_heading = sections[0]["heading"]
        
        return {
            "section": current_section,
            "heading": current_heading,
        }
    
    def update_config(self, config: ChunkingConfig):
        """
        Update chunking configuration
        
        Args:
            config: New chunking configuration
        """
        self.config = config
        self._initialize_splitter()
        logger.info("chunking_config_updated", config=config)

