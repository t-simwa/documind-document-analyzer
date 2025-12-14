"""
Test full generation pipeline: Document Processing -> Indexing -> Querying
Run this to test the complete RAG pipeline including generation
"""

import asyncio
import sys
import os
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_ingestion import DocumentIngestionService
from app.services.chunking import ChunkingService
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, VectorDocument
from app.services.retrieval import RetrievalService, RetrievalConfig, SearchType
from app.services.llm import LLMService, LLMConfig
from app.services.generation import GenerationService


async def test_full_generation_pipeline(
    file_path: str,
    document_id: str = "test_doc_1",
    collection_name: str = "documind_documents",
    force_recreate: bool = False
):
    """
    Test the complete generation pipeline:
    1. Ingest document
    2. Chunk document
    3. Generate embeddings
    4. Store in vector database
    5. Build keyword index
    6. Query using generation service
    7. Verify response with citations
    """
    print("=" * 80)
    print("Testing Full Generation Pipeline: Document -> Indexing -> Query -> Answer")
    print("=" * 80)
    print()
    
    # Step 1: Ingest document
    print("📄 Step 1: Ingesting document...")
    ingestion_service = DocumentIngestionService()
    
    file_ext = Path(file_path).suffix.lower()
    
    try:
        document_content = await ingestion_service.ingest_document(
            file_path=file_path,
            file_type=file_ext
        )
        print(f"✅ Document ingested successfully!")
        print(f"   - Text length: {len(document_content.text)} characters")
        print(f"   - Pages: {len(document_content.pages) if document_content.pages else 0}")
        print()
    except Exception as e:
        print(f"❌ Document ingestion failed: {e}")
        return False
    
    # Step 2: Chunk document
    print("✂️  Step 2: Chunking document...")
    chunking_service = ChunkingService()
    
    try:
        chunks = chunking_service.chunk_document(
            document_content=document_content,
            document_id=document_id
        )
        print(f"✅ Document chunked successfully!")
        print(f"   - Total chunks: {len(chunks)}")
        print()
    except Exception as e:
        print(f"❌ Chunking failed: {e}")
        return False
    
    # Step 3: Generate embeddings
    print("🔢 Step 3: Generating embeddings...")
    embedding_service = EmbeddingService()
    
    try:
        chunk_texts = [chunk.text for chunk in chunks]
        embedding_result = await embedding_service.embed_texts(
            texts=chunk_texts,
            batch_size=32
        )
        print(f"✅ Embeddings generated successfully!")
        print(f"   - Provider: {embedding_result.provider}")
        print(f"   - Model: {embedding_result.model}")
        print(f"   - Embedding count: {len(embedding_result.embeddings)}")
        
        # Get actual embedding dimension
        actual_dimension = len(embedding_result.embeddings[0]) if embedding_result.embeddings else None
        if actual_dimension:
            print(f"   - Dimension: {actual_dimension}")
        print()
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        print(f"   Make sure you have set the correct EMBEDDING_PROVIDER and API keys in .env")
        return False
    
    # Step 4: Store in vector database
    print("💾 Step 4: Storing in vector database...")
    
    # Get actual embedding dimension from the embeddings
    if not embedding_result.embeddings:
        print(f"❌ No embeddings generated!")
        return False
    
    actual_dimension = len(embedding_result.embeddings[0])
    print(f"   - Embedding dimension: {actual_dimension}")
    
    # Initialize vector store with correct dimension
    vector_store = VectorStoreService(dimension=actual_dimension)
    
    try:
        # Check if collection exists
        collection_exists = await vector_store.collection_exists(collection_name)
        
        # Force delete if requested
        if force_recreate and collection_exists:
            print(f"   - Force recreating collection (--force flag)...")
            await vector_store.delete_collection(collection_name)
            collection_exists = False
        
        if collection_exists:
            # Try to add a test document to check if dimension matches
            # If it fails with dimension error, we need to recreate the collection
            try:
                test_doc = VectorDocument(
                    id="__dimension_test__",
                    embedding=embedding_result.embeddings[0],
                    document="test",
                    metadata={"test": "dimension_check"}  # ChromaDB requires non-empty metadata
                )
                # This will fail if dimension doesn't match
                await vector_store.add_documents([test_doc], collection_name)
                # If successful, delete the test document
                await vector_store.delete_documents(["__dimension_test__"], collection_name)
                print(f"   - Collection exists with matching dimension")
            except Exception as e:
                error_msg = str(e).lower()
                if "dimension" in error_msg or "does not match" in error_msg:
                    print(f"   ⚠️  Collection exists with different dimension. Deleting and recreating...")
                    await vector_store.delete_collection(collection_name)
                    collection_exists = False
                else:
                    # Some other error, re-raise it
                    raise
        
        # Create collection if it doesn't exist
        if not collection_exists:
            await vector_store.create_collection(collection_name)
            print(f"   - Collection created with dimension {actual_dimension}")
        
        # Prepare documents for storage
        vector_docs = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embedding_result.embeddings)):
            chunk_id = f"{document_id}_chunk_{i}"
            vector_docs.append(VectorDocument(
                id=chunk_id,
                embedding=embedding,
                document=chunk.text,
                metadata={
                    "document_id": document_id,
                    "chunk_id": chunk_id,
                    "chunk_index": i,
                    "page": chunk.page_number,
                    "section": chunk.section,
                    "heading": chunk.heading,
                    "document_type": chunk.document_type,
                    "document_name": Path(file_path).name
                }
            ))
        
        # Store documents
        await vector_store.add_documents(
            documents=vector_docs,
            collection_name=collection_name
        )
        print(f"✅ Documents stored successfully!")
        print(f"   - Collection: {collection_name}")
        print(f"   - Documents stored: {len(vector_docs)}")
        print()
    except Exception as e:
        print(f"❌ Vector storage failed: {e}")
        return False
    
    # Step 5: Build keyword index
    print("🔍 Step 5: Building keyword index...")
    retrieval_service = RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store
    )
    
    try:
        # Build keyword index (this happens automatically on first search)
        # But we can trigger it explicitly
        print(f"   - Keyword index will be built on first search")
        print()
    except Exception as e:
        print(f"⚠️  Keyword index warning: {e}")
        print()
    
    # Step 6: Test generation with query
    print("🤖 Step 6: Testing generation with query...")
    
    try:
        llm_service = LLMService()
        generation_service = GenerationService(
            retrieval_service=retrieval_service,
            llm_service=llm_service
        )
        
        # Test query
        test_query = "What is the main topic of this document?"
        print(f"   - Query: '{test_query}'")
        print(f"   - Generating answer...")
        print()
        
        response = await generation_service.generate_answer(
            query=test_query,
            collection_name=collection_name,
            document_ids=[document_id]
        )
        
        print(f"✅ Generation successful!")
        print(f"   - Provider: {response.provider}")
        print(f"   - Model: {response.model}")
        print(f"   - Answer length: {len(response.answer)} characters")
        print(f"   - Citations: {len(response.citations)}")
        print(f"   - Confidence: {response.confidence:.2f}")
        print()
        print("📝 Answer:")
        print("-" * 80)
        print(response.answer)
        print("-" * 80)
        print()
        
        if response.citations:
            print("📚 Citations:")
            for citation in response.citations:
                print(f"   [{citation.index}] Document: {citation.document_id}, Page: {citation.page}, Score: {citation.score:.3f}")
            print()
        
        if response.key_points:
            print("🔑 Key Points:")
            for i, kp in enumerate(response.key_points[:3], 1):
                print(f"   {i}. {kp.text} (importance: {kp.importance:.2f})")
            print()
        
        print("=" * 80)
        print("✅ Full pipeline test completed successfully!")
        print("=" * 80)
        print()
        print(f"Collection name: {collection_name}")
        print(f"Document ID: {document_id}")
        print()
        print("You can now query this document using the API:")
        print(f'curl -X POST http://localhost:8000/api/v1/query \\')
        print(f'  -H "Content-Type: application/json" \\')
        print(f'  -d \'{{"query": "Your question here", "collection_name": "{collection_name}"}}\'')
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        print()
        print("Make sure you have:")
        print("  1. Set LLM_PROVIDER in .env (e.g., LLM_PROVIDER=ollama)")
        print("  2. Set appropriate API keys (or use Ollama local)")
        print("  3. Backend server is running on port 8000")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Test full generation pipeline: Document -> Indexing -> Query -> Answer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test with sample PDF
  python tests/test_full_generation_pipeline.py uploads/test-files/sample.pdf
  
  # Test with custom document ID and collection
  python tests/test_full_generation_pipeline.py path/to/doc.pdf --doc-id my_doc --collection my_collection
  
  # Test with DOCX file
  python tests/test_full_generation_pipeline.py document.docx
  
  # Force recreate collection (useful if dimension mismatch)
  python tests/test_full_generation_pipeline.py uploads/test-files/sample.pdf --force
        """
    )
    parser.add_argument("file_path", help="Path to document file")
    parser.add_argument("--doc-id", default="test_doc_1", help="Document ID (default: test_doc_1)")
    parser.add_argument("--collection", default="documind_documents", help="Collection name (default: documind_documents)")
    parser.add_argument("--force", action="store_true", help="Force recreate collection if it exists (useful for dimension mismatch)")
    
    args = parser.parse_args()
    
    if not Path(args.file_path).exists():
        print(f"❌ File not found: {args.file_path}")
        print(f"   Please provide a valid file path.")
        return 1
    
    print(f"📁 File: {args.file_path}")
    print(f"🆔 Document ID: {args.doc_id}")
    print(f"📚 Collection: {args.collection}")
    if args.force:
        print(f"🔄 Force recreate: Yes")
    print()
    
    result = asyncio.run(test_full_generation_pipeline(
        file_path=args.file_path,
        document_id=args.doc_id,
        collection_name=args.collection,
        force_recreate=args.force
    ))
    
    return 0 if result else 1


if __name__ == "__main__":
    sys.exit(main())

