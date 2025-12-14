"""
Test embedding and vector store with actual documents
Run this to test the full pipeline: ingestion -> chunking -> embedding -> vector storage
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_ingestion import DocumentIngestionService
from app.services.chunking import ChunkingService, ChunkingConfig
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, VectorDocument


async def test_full_pipeline(file_path: str, document_id: str = "test_doc_1"):
    """
    Test the full document processing pipeline:
    1. Ingest document
    2. Chunk document
    3. Generate embeddings
    4. Store in vector database
    5. Search for similar content
    """
    print("=" * 80)
    print("Testing Full Pipeline: Document -> Chunks -> Embeddings -> Vector Store")
    print("=" * 80)
    print()
    
    # Step 1: Ingest document
    print("📄 Step 1: Ingesting document...")
    ingestion_service = DocumentIngestionService()
    
    # Determine file type
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
        return
    
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
        print(f"   - Average chunk size: {sum(len(c.text) for c in chunks) / len(chunks):.0f} chars")
        print()
    except Exception as e:
        print(f"❌ Chunking failed: {e}")
        return
    
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
        print(f"   - Dimension: {embedding_result.metadata.get('dimension', 'N/A')}")
        if 'cache_hits' in embedding_result.metadata:
            print(f"   - Cache hits: {embedding_result.metadata.get('cache_hits', 0)}")
            print(f"   - Cache misses: {embedding_result.metadata.get('cache_misses', 0)}")
        print()
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        print(f"   Make sure you have:")
        print(f"   1. Installed the embedding provider package")
        print(f"   2. Set the correct EMBEDDING_PROVIDER in .env")
        print(f"   3. Set API keys if using OpenAI/Cohere/Gemini")
        print()
        print(f"   💡 TIP: If you're hitting rate limits, try using Sentence Transformers (FREE, no limits):")
        print(f"      - Install: pip install sentence-transformers")
        print(f"      - In .env: EMBEDDING_PROVIDER=sentence-transformers")
        print(f"      - Also set: PINECONE_DIMENSION=384 and QDRANT_DIMENSION=384")
        return
    
    # Step 4: Store in vector database
    print("💾 Step 4: Storing in vector database...")
    vector_store = VectorStoreService(dimension=embedding_service.get_embedding_dimension())
    collection_name = "test_documents"
    
    try:
        # Create collection if it doesn't exist
        if not await vector_store.collection_exists(collection_name):
            await vector_store.create_collection(collection_name)
            print(f"   - Created collection: {collection_name}")
        
        # Prepare vector documents
        vector_documents = []
        for chunk, embedding in zip(chunks, embedding_result.embeddings):
            # Build metadata, filtering out None values (ChromaDB doesn't accept None)
            metadata = {
                "document_id": document_id,
                "chunk_index": chunk.chunk_index,
                "char_count": chunk.char_count,
                "word_count": chunk.word_count,
            }
            
            # Add optional fields only if they're not None
            if chunk.page_number is not None:
                metadata["page_number"] = chunk.page_number
            if chunk.section is not None:
                metadata["section"] = chunk.section
            if chunk.heading is not None:
                metadata["heading"] = chunk.heading
            if chunk.document_type is not None:
                metadata["document_type"] = chunk.document_type
            
            vector_doc = VectorDocument(
                id=f"{document_id}_{chunk.chunk_index}",
                embedding=embedding,
                document=chunk.text,
                metadata=metadata
            )
            vector_documents.append(vector_doc)
        
        # Store documents
        stored_ids = await vector_store.add_documents(
            documents=vector_documents,
            collection_name=collection_name
        )
        print(f"✅ Documents stored successfully!")
        print(f"   - Provider: {vector_store.provider_name}")
        print(f"   - Collection: {collection_name}")
        print(f"   - Stored documents: {len(stored_ids)}")
        print()
    except Exception as e:
        print(f"❌ Vector storage failed: {e}")
        print(f"   Make sure you have:")
        print(f"   1. Installed the vector store package (chromadb, etc.)")
        print(f"   2. Set the correct VECTOR_STORE_PROVIDER in .env")
        print(f"   3. Vector store is running (if using remote)")
        return
    
    # Step 5: Test search
    print("🔍 Step 5: Testing vector search...")
    try:
        # Generate a test query
        test_query = "What is this document about?"
        print(f"   - Query: '{test_query}'")
        
        # Generate query embedding
        query_embedding = await embedding_service.embed_query(test_query)
        
        # Search
        search_results = await vector_store.search(
            query_embedding=query_embedding,
            collection_name=collection_name,
            top_k=3
        )
        
        print(f"✅ Search completed successfully!")
        print(f"   - Results found: {len(search_results.ids)}")
        print()
        print("📋 Top Results:")
        for i, (doc_id, doc_text, score) in enumerate(zip(
            search_results.ids[:3],
            search_results.documents[:3],
            search_results.scores[:3]
        ), 1):
            print(f"\n   Result {i} (Score: {score:.4f}):")
            print(f"   ID: {doc_id}")
            preview = doc_text[:150].replace('\n', ' ')
            print(f"   Text: {preview}...")
        
        print()
        print("=" * 80)
        print("✅ Full pipeline test completed successfully!")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return


async def main():
    """Main function to run the test"""
    if len(sys.argv) < 2:
        print("Usage: python tests/test_embedding_with_docs.py <path_to_document>")
        print()
        print("Examples:")
        print("  python tests/test_embedding_with_docs.py uploads/test-files/sample.pdf")
        print("  python tests/test_embedding_with_docs.py uploads/test-files/sample.docx")
        print("  python tests/test_embedding_with_docs.py uploads/test-files/sample.txt")
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_id = sys.argv[2] if len(sys.argv) > 2 else "test_doc_1"
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    
    await test_full_pipeline(file_path, document_id)


if __name__ == "__main__":
    asyncio.run(main())

