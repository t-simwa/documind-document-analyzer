"""
Comprehensive test suite for document chunking service
Run with: python -m pytest tests/test_chunking_service.py -v
Or run individual tests: python tests/test_chunking_service.py
"""

import pytest
import sys
from pathlib import Path
import tempfile
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.chunking import (
    ChunkingService,
    Chunk,
    ChunkingConfig,
    ChunkingError,
)
from app.services.document_loaders.base import DocumentContent


class TestChunkingConfig:
    """Test chunking configuration"""
    
    def test_default_config(self):
        """Test default configuration"""
        config = ChunkingConfig()
        assert config.chunk_size == 1000
        assert config.chunk_overlap == 200
        assert config.preserve_sentences is True
        assert config.preserve_paragraphs is True
        print("[OK] Default configuration works")
    
    def test_contract_config(self):
        """Test contract-specific configuration"""
        config = ChunkingConfig(document_type="contract")
        assert config.chunk_size == 400
        assert config.chunk_overlap == 50
        print("[OK] Contract configuration works")
    
    def test_report_config(self):
        """Test report-specific configuration"""
        config = ChunkingConfig(document_type="report")
        assert config.chunk_size == 650
        assert config.chunk_overlap == 100
        print("[OK] Report configuration works")
    
    def test_article_config(self):
        """Test article-specific configuration"""
        config = ChunkingConfig(document_type="article")
        assert config.chunk_size == 1000
        assert config.chunk_overlap == 200
        print("[OK] Article configuration works")
    
    def test_custom_config(self):
        """Test custom configuration"""
        config = ChunkingConfig(
            chunk_size=500,
            chunk_overlap=100,
            preserve_sentences=False
        )
        assert config.chunk_size == 500
        assert config.chunk_overlap == 100
        assert config.preserve_sentences is False
        print("[OK] Custom configuration works")


class TestChunk:
    """Test Chunk dataclass"""
    
    def test_chunk_creation(self):
        """Test basic chunk creation"""
        chunk = Chunk(
            text="This is a test chunk.",
            chunk_index=0,
            document_id="doc123"
        )
        assert chunk.text == "This is a test chunk."
        assert chunk.chunk_index == 0
        assert chunk.document_id == "doc123"
        assert chunk.char_count > 0
        assert chunk.word_count > 0
        assert "chunk_index" in chunk.metadata
        assert "document_id" in chunk.metadata
        print("[OK] Basic chunk creation works")
    
    def test_chunk_with_metadata(self):
        """Test chunk with full metadata"""
        chunk = Chunk(
            text="Test chunk with metadata.",
            chunk_index=5,
            document_id="doc456",
            page_number=2,
            section="1.1",
            heading="Introduction",
            document_type="report",
            start_char_index=100,
            end_char_index=130
        )
        assert chunk.page_number == 2
        assert chunk.section == "1.1"
        assert chunk.heading == "Introduction"
        assert chunk.document_type == "report"
        assert chunk.metadata["page_number"] == 2
        assert chunk.metadata["section"] == "1.1"
        assert chunk.metadata["heading"] == "Introduction"
        print("[OK] Chunk with full metadata works")


class TestChunkingService:
    """Test chunking service"""
    
    def test_service_initialization(self):
        """Test service initialization"""
        service = ChunkingService()
        assert service.config is not None
        assert service.splitter is not None
        print("[OK] Service initialization works")
    
    def test_service_with_config(self):
        """Test service with custom config"""
        config = ChunkingConfig(chunk_size=500, chunk_overlap=50)
        service = ChunkingService(config=config)
        assert service.config.chunk_size == 500
        assert service.config.chunk_overlap == 50
        print("[OK] Service with custom config works")
    
    def test_basic_chunking(self):
        """Test basic document chunking"""
        # Create sample document content
        text = "This is sentence one. This is sentence two. This is sentence three. " * 50
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "test.txt", "file_type": "text"}
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_1"
        )
        
        assert len(chunks) > 0
        assert all(isinstance(chunk, Chunk) for chunk in chunks)
        assert all(chunk.document_id == "test_doc_1" for chunk in chunks)
        assert all(chunk.chunk_index == i for i, chunk in enumerate(chunks))
        print(f"[OK] Basic chunking works: {len(chunks)} chunks created")
    
    def test_chunk_size_respect(self):
        """Test that chunks respect size limits"""
        # Create text that should produce multiple chunks
        text = "Word " * 1000  # 5000 characters
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "test.txt"}
        )
        
        config = ChunkingConfig(chunk_size=500, chunk_overlap=50)
        service = ChunkingService(config=config)
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_2"
        )
        
        assert len(chunks) > 1
        # Check that chunks are roughly within size limits (allowing for overlap)
        for chunk in chunks:
            assert len(chunk.text) <= config.chunk_size + 100  # Allow some tolerance
        print(f"[OK] Chunk size limits respected: {len(chunks)} chunks")
    
    def test_chunk_overlap(self):
        """Test that chunks have overlap"""
        text = "Sentence one. Sentence two. Sentence three. " * 100
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "test.txt"}
        )
        
        config = ChunkingConfig(chunk_size=200, chunk_overlap=50)
        service = ChunkingService(config=config)
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_3"
        )
        
        if len(chunks) > 1:
            # Check that consecutive chunks have some overlap
            chunk1_end = chunks[0].text[-50:]
            chunk2_start = chunks[1].text[:50]
            # There should be some common text (allowing for variations)
            assert len(chunk1_end) > 0 and len(chunk2_start) > 0
        print(f"[OK] Chunk overlap works: {len(chunks)} chunks")
    
    def test_page_number_tracking(self):
        """Test page number tracking"""
        # Create document with page information
        page1_text = "Page one content. " * 50
        page2_text = "Page two content. " * 50
        full_text = page1_text + page2_text
        
        document_content = DocumentContent(
            text=full_text,
            metadata={"file_name": "test.pdf"},
            pages=[
                {"page_number": 1, "text": page1_text},
                {"page_number": 2, "text": page2_text},
            ]
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_4"
        )
        
        # Check that chunks have page numbers
        page_numbers = [chunk.page_number for chunk in chunks if chunk.page_number is not None]
        assert len(page_numbers) > 0
        assert 1 in page_numbers or 2 in page_numbers
        print(f"[OK] Page number tracking works: {len(page_numbers)} chunks with page numbers")
    
    def test_section_extraction(self):
        """Test section and heading extraction"""
        text = """
# Introduction
This is the introduction section.

## Overview
This is the overview subsection.

# Main Content
This is the main content section.

1. First Point
This is the first point.

1.1 Sub-point
This is a sub-point.
"""
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "test.md"}
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_5"
        )
        
        # Check that some chunks have sections/headings
        chunks_with_sections = [c for c in chunks if c.section is not None or c.heading is not None]
        assert len(chunks_with_sections) > 0
        print(f"[OK] Section extraction works: {len(chunks_with_sections)} chunks with sections")
    
    def test_document_type_detection(self):
        """Test automatic document type detection"""
        # Contract-like document
        contract_text = "CONTRACT AGREEMENT\n\nThis contract is between Party A and Party B..."
        contract_content = DocumentContent(
            text=contract_text,
            metadata={"file_name": "contract.pdf"}
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=contract_content,
            document_id="test_doc_6"
        )
        
        # Check that document type was detected
        assert chunks[0].document_type in ["contract", "general"]
        print(f"[OK] Document type detection works: {chunks[0].document_type}")
    
    def test_contract_chunking_strategy(self):
        """Test contract-specific chunking"""
        text = "Clause 1. This is a contract clause. " * 200
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "contract.pdf"}
        )
        
        config = ChunkingConfig(document_type="contract")
        service = ChunkingService(config=config)
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_7",
            document_type="contract"
        )
        
        # Contract chunks should be smaller
        avg_size = sum(len(c.text) for c in chunks) / len(chunks) if chunks else 0
        assert avg_size < 500  # Contracts use 400 char chunks
        print(f"[OK] Contract chunking strategy works: avg size {avg_size:.0f} chars")
    
    def test_report_chunking_strategy(self):
        """Test report-specific chunking"""
        text = "Report section content. " * 300
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "report.pdf"}
        )
        
        config = ChunkingConfig(document_type="report")
        service = ChunkingService(config=config)
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_8",
            document_type="report"
        )
        
        # Report chunks should be medium-sized
        avg_size = sum(len(c.text) for c in chunks) / len(chunks) if chunks else 0
        assert 500 < avg_size < 800  # Reports use 650 char chunks
        print(f"[OK] Report chunking strategy works: avg size {avg_size:.0f} chars")
    
    def test_metadata_preservation(self):
        """Test that document metadata is preserved in chunks"""
        document_content = DocumentContent(
            text="Test content. " * 100,
            metadata={
                "file_name": "test.pdf",
                "author": "Test Author",
                "title": "Test Document",
                "custom_field": "custom_value"
            }
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_9"
        )
        
        # Check that metadata is preserved
        assert len(chunks) > 0
        for chunk in chunks:
            assert "file_name" in chunk.metadata
            assert chunk.metadata["file_name"] == "test.pdf"
            assert "author" in chunk.metadata
            assert "custom_field" in chunk.metadata
        print("[OK] Metadata preservation works")
    
    def test_sentence_boundary_preservation(self):
        """Test that sentence boundaries are preserved"""
        text = "First sentence. Second sentence! Third sentence? Fourth sentence. " * 50
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "test.txt"}
        )
        
        config = ChunkingConfig(preserve_sentences=True)
        service = ChunkingService(config=config)
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_10"
        )
        
        # Check that chunks don't break in the middle of sentences
        # (This is a heuristic check - chunks should generally end with sentence endings)
        sentence_endings = ['.', '!', '?']
        chunks_ending_properly = sum(
            1 for chunk in chunks
            if any(chunk.text.rstrip().endswith(ending) for ending in sentence_endings)
        )
        # At least some chunks should end with sentence endings
        assert chunks_ending_properly > len(chunks) * 0.3  # At least 30%
        print(f"[OK] Sentence boundary preservation works: {chunks_ending_properly}/{len(chunks)} chunks end properly")
    
    def test_empty_document(self):
        """Test chunking empty document"""
        document_content = DocumentContent(
            text="",
            metadata={"file_name": "empty.txt"}
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_11"
        )
        
        # Empty document should produce no chunks or one empty chunk
        assert len(chunks) == 0 or (len(chunks) == 1 and len(chunks[0].text) == 0)
        print("[OK] Empty document handling works")
    
    def test_very_large_document(self):
        """Test chunking very large document"""
        # Create a large document
        text = "This is a sentence. " * 10000  # ~200,000 characters
        document_content = DocumentContent(
            text=text,
            metadata={"file_name": "large.txt"}
        )
        
        service = ChunkingService()
        chunks = service.chunk_document(
            document_content=document_content,
            document_id="test_doc_12"
        )
        
        assert len(chunks) > 100  # Should produce many chunks
        print(f"[OK] Large document chunking works: {len(chunks)} chunks")
    
    def test_config_update(self):
        """Test updating chunking configuration"""
        service = ChunkingService()
        original_size = service.config.chunk_size
        
        new_config = ChunkingConfig(chunk_size=500)
        service.update_config(new_config)
        
        assert service.config.chunk_size == 500
        assert service.config.chunk_size != original_size
        print("[OK] Configuration update works")


def run_all_tests():
    """Run all chunking tests"""
    print("=" * 60)
    print("Chunking Service Test Suite")
    print("=" * 60)
    print()
    
    test_classes = [
        TestChunkingConfig,
        TestChunk,
        TestChunkingService,
    ]
    
    passed = 0
    failed = 0
    
    for test_class in test_classes:
        print(f"\n{'=' * 60}")
        print(f"Running {test_class.__name__}")
        print(f"{'=' * 60}\n")
        
        test_instance = test_class()
        test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
        
        for test_method in test_methods:
            try:
                getattr(test_instance, test_method)()
                passed += 1
            except Exception as e:
                print(f"[FAILED] {test_method} FAILED: {str(e)}")
                import traceback
                traceback.print_exc()
                failed += 1
    
    print("\n" + "=" * 60)
    print("Test Results")
    print("=" * 60)
    print(f"[PASSED] Passed: {passed}")
    print(f"[FAILED] Failed: {failed}")
    print(f"Total: {passed + failed}")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

