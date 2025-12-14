"""
Test chunking service with actual document files
This script ingests a document and then chunks it, showing detailed results

Usage:
    python tests/test_chunking_with_docs.py <file_path> [document_type]
    
Examples:
    python tests/test_chunking_with_docs.py uploads/test-files/sample.pdf
    python tests/test_chunking_with_docs.py uploads/test-files/sample.pdf contract
    python tests/test_chunking_with_docs.py uploads/test-files/sample.docx report
"""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_ingestion import DocumentIngestionService
from app.services.chunking import ChunkingService, ChunkingConfig
from app.services.document_loaders import DocumentLoaderFactory


async def test_chunking_with_doc(file_path: str, document_type: str = None):
    """Test chunking with an actual document file"""
    print("\n" + "="*70)
    print(f"TESTING CHUNKING WITH: {file_path}")
    if document_type:
        print(f"Document Type: {document_type}")
    print("="*70)
    
    path = Path(file_path)
    
    if not path.exists():
        print(f"[ERROR] File not found: {file_path}")
        return False
    
    # Check if supported
    if not DocumentLoaderFactory.is_supported(file_path):
        print(f"[ERROR] Unsupported file type: {path.suffix}")
        print(f"Supported types: {', '.join(DocumentLoaderFactory.get_supported_extensions())}")
        return False
    
    try:
        # Step 1: Ingest document
        print("\n[STEP 1] Ingesting document...")
        ingestion_service = DocumentIngestionService()
        
        file_ext = path.suffix if path.suffix else None
        document_content = await ingestion_service.ingest_document(
            file_path=str(path),
            file_type=file_ext
        )
        
        print(f"[OK] Document ingested successfully")
        print(f"   Text length: {len(document_content.text):,} characters")
        print(f"   Pages: {len(document_content.pages) if document_content.pages else 0}")
        print(f"   Tables: {len(document_content.tables) if document_content.tables else 0}")
        
        # Step 2: Chunk document
        print("\n[STEP 2] Chunking document...")
        
        # Create chunking config
        if document_type:
            config = ChunkingConfig(document_type=document_type)
            print(f"   Using {document_type} chunking strategy")
            print(f"   Chunk size: {config.chunk_size} chars")
            print(f"   Chunk overlap: {config.chunk_overlap} chars")
        else:
            config = ChunkingConfig()
            print(f"   Using default chunking strategy")
            print(f"   Chunk size: {config.chunk_size} chars")
            print(f"   Chunk overlap: {config.chunk_overlap} chars")
        
        chunking_service = ChunkingService(config=config)
        
        # Generate document ID from file name
        doc_id = f"doc_{path.stem}"
        
        chunks = chunking_service.chunk_document(
            document_content=document_content,
            document_id=doc_id,
            document_type=document_type
        )
        
        print(f"[OK] Document chunked successfully")
        print(f"   Total chunks: {len(chunks)}")
        
        if len(chunks) > 0:
            avg_size = sum(len(c.text) for c in chunks) / len(chunks)
            print(f"   Average chunk size: {avg_size:.0f} characters")
            print(f"   Average words per chunk: {sum(c.word_count for c in chunks) / len(chunks):.0f} words")
        
        # Step 3: Show chunk details
        print("\n[STEP 3] Chunk Details:")
        print("-"*70)
        
        # Show first 5 chunks
        for i, chunk in enumerate(chunks[:5]):
            print(f"\nChunk {chunk.chunk_index}:")
            print(f"   Size: {chunk.char_count} chars, {chunk.word_count} words")
            print(f"   Document ID: {chunk.document_id}")
            print(f"   Document Type: {chunk.document_type or 'general'}")
            
            if chunk.page_number:
                print(f"   Page: {chunk.page_number}")
            if chunk.section:
                print(f"   Section: {chunk.section}")
            if chunk.heading:
                print(f"   Heading: {chunk.heading}")
            
            # Show preview of text
            preview = chunk.text[:100].replace('\n', ' ')
            if len(chunk.text) > 100:
                preview += "..."
            print(f"   Preview: {preview}")
        
        if len(chunks) > 5:
            print(f"\n... and {len(chunks) - 5} more chunks")
        
        # Step 4: Statistics
        print("\n[STEP 4] Statistics:")
        print("-"*70)
        
        chunks_with_pages = [c for c in chunks if c.page_number is not None]
        chunks_with_sections = [c for c in chunks if c.section is not None]
        chunks_with_headings = [c for c in chunks if c.heading is not None]
        
        print(f"   Chunks with page numbers: {len(chunks_with_pages)} ({len(chunks_with_pages)/len(chunks)*100:.1f}%)")
        print(f"   Chunks with sections: {len(chunks_with_sections)} ({len(chunks_with_sections)/len(chunks)*100:.1f}%)")
        print(f"   Chunks with headings: {len(chunks_with_headings)} ({len(chunks_with_headings)/len(chunks)*100:.1f}%)")
        
        # Size distribution
        if len(chunks) > 0:
            sizes = [len(c.text) for c in chunks]
            print(f"   Min chunk size: {min(sizes)} chars")
            print(f"   Max chunk size: {max(sizes)} chars")
            print(f"   Median chunk size: {sorted(sizes)[len(sizes)//2]} chars")
        
        print("\n" + "="*70)
        print("[SUCCESS] Chunking test completed!")
        print("="*70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_type = sys.argv[2] if len(sys.argv) > 2 else None
    
    if document_type and document_type not in ["contract", "report", "article", "general"]:
        print(f"[ERROR] Invalid document type: {document_type}")
        print("Valid types: contract, report, article, general")
        sys.exit(1)
    
    success = asyncio.run(test_chunking_with_doc(file_path, document_type))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

