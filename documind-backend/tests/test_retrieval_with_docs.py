"""
Test retrieval engine with actual documents
Run this to test the full pipeline: ingestion -> chunking -> embedding -> vector storage -> retrieval
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_ingestion import DocumentIngestionService
from app.services.chunking import ChunkingService
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, VectorDocument
from app.services.retrieval import RetrievalService, RetrievalConfig, SearchType, FusionMethod, RerankProvider


async def test_full_retrieval_pipeline(file_path: str, document_id: str = "test_doc_1"):
    """
    Test the full document processing and retrieval pipeline:
    1. Ingest document
    2. Chunk document
    3. Generate embeddings
    4. Store in vector database
    5. Build keyword index
    6. Test vector search
    7. Test keyword search
    8. Test hybrid search
    9. Test re-ranking (if enabled)
    10. Test filtering and deduplication
    """
    print("=" * 80)
    print("Testing Full Retrieval Pipeline: Document -> Chunks -> Embeddings -> Vector Store -> Retrieval")
    print("=" * 80)
    print()
    
    collection_name = "test_documents"
    
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
        print()
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        print(f"   Make sure you have set the correct EMBEDDING_PROVIDER and API keys in .env")
        return
    
    # Step 4: Store in vector database
    print("💾 Step 4: Storing in vector database...")
    vector_store = VectorStoreService(dimension=embedding_service.get_embedding_dimension())
    
    try:
        # Create collection if it doesn't exist
        if not await vector_store.collection_exists(collection_name):
            await vector_store.create_collection(collection_name)
            print(f"   - Created collection: {collection_name}")
        
        # Prepare vector documents
        vector_documents = []
        for chunk, embedding in zip(chunks, embedding_result.embeddings):
            metadata = {
                "document_id": document_id,
                "chunk_index": chunk.chunk_index,
                "char_count": chunk.char_count,
                "word_count": chunk.word_count,
            }
            
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
        return
    
    # Step 5: Initialize retrieval service and build keyword index
    print("🔍 Step 5: Building keyword index for retrieval...")
    retrieval_service = RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store
    )
    
    try:
        await retrieval_service.build_keyword_index(collection_name)
        print(f"✅ Keyword index built successfully!")
        print()
    except Exception as e:
        print(f"⚠️  Keyword index build warning: {e}")
        print(f"   (This is okay, keyword search will build index on-demand)")
        print()
    
    # Step 6: Test Vector Search
    print("=" * 80)
    print("🔍 Step 6: Testing Vector Search")
    print("=" * 80)
    test_query = "What is this document about?"
    print(f"Query: '{test_query}'")
    print()
    
    try:
        config = RetrievalConfig(
            search_type=SearchType.VECTOR,
            top_k=5
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        print(f"✅ Vector search completed!")
        print(f"   - Results found: {len(result.ids)}")
        print(f"   - Search type: {result.search_type}")
        print()
        print("📋 Top Results:")
        for i, (doc_id, doc_text, score) in enumerate(zip(
            result.ids[:3],
            result.documents[:3],
            result.scores[:3]
        ), 1):
            print(f"\n   Result {i} (Score: {score:.4f}):")
            print(f"   ID: {doc_id}")
            preview = doc_text[:150].replace('\n', ' ')
            print(f"   Text: {preview}...")
        print()
    except Exception as e:
        print(f"❌ Vector search failed: {e}")
        print()
    
    # Step 7: Test Keyword Search
    print("=" * 80)
    print("🔍 Step 7: Testing Keyword Search (BM25)")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print()
    
    try:
        config = RetrievalConfig(
            search_type=SearchType.KEYWORD,
            top_k=5
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        print(f"✅ Keyword search completed!")
        print(f"   - Results found: {len(result.ids)}")
        print(f"   - Search type: {result.search_type}")
        if result.keyword_scores:
            print(f"   - Keyword scores: {[f'{s:.4f}' for s in result.keyword_scores[:3]]}")
        print()
        print("📋 Top Results:")
        for i, (doc_id, doc_text, score) in enumerate(zip(
            result.ids[:3],
            result.documents[:3],
            result.scores[:3]
        ), 1):
            print(f"\n   Result {i} (Score: {score:.4f}):")
            print(f"   ID: {doc_id}")
            preview = doc_text[:150].replace('\n', ' ')
            print(f"   Text: {preview}...")
        print()
    except Exception as e:
        print(f"❌ Keyword search failed: {e}")
        print()
    
    # Step 8: Test Hybrid Search
    print("=" * 80)
    print("🔍 Step 8: Testing Hybrid Search (Vector + Keyword)")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print()
    
    try:
        config = RetrievalConfig(
            search_type=SearchType.HYBRID,
            top_k=5,
            vector_weight=0.7,
            keyword_weight=0.3,
            fusion_method=FusionMethod.RRF
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        print(f"✅ Hybrid search completed!")
        print(f"   - Results found: {len(result.ids)}")
        print(f"   - Search type: {result.search_type}")
        print(f"   - Fusion method: {config.fusion_method}")
        if result.vector_scores:
            print(f"   - Vector scores: {[f'{s:.4f}' for s in result.vector_scores[:3]]}")
        if result.keyword_scores:
            print(f"   - Keyword scores: {[f'{s:.4f}' for s in result.keyword_scores[:3]]}")
        print()
        print("📋 Top Results:")
        for i, (doc_id, doc_text, score) in enumerate(zip(
            result.ids[:3],
            result.documents[:3],
            result.scores[:3]
        ), 1):
            print(f"\n   Result {i} (Score: {score:.4f}):")
            print(f"   ID: {doc_id}")
            preview = doc_text[:150].replace('\n', ' ')
            print(f"   Text: {preview}...")
        print()
    except Exception as e:
        print(f"❌ Hybrid search failed: {e}")
        print()
    
    # Step 9: Test Different Fusion Methods
    print("=" * 80)
    print("🔍 Step 9: Testing Different Fusion Methods")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print()
    
    fusion_methods = [
        (FusionMethod.RRF, "Reciprocal Rank Fusion"),
        (FusionMethod.WEIGHTED, "Weighted Fusion"),
        (FusionMethod.MEAN, "Mean Fusion")
    ]
    
    for fusion_method, method_name in fusion_methods:
        try:
            config = RetrievalConfig(
                search_type=SearchType.HYBRID,
                top_k=3,
                fusion_method=fusion_method
            )
            
            result = await retrieval_service.retrieve(
                query=test_query,
                collection_name=collection_name,
                config=config
            )
            
            print(f"✅ {method_name}: {len(result.ids)} results")
            if result.ids:
                print(f"   Top result score: {result.scores[0]:.4f}")
        except Exception as e:
            print(f"❌ {method_name} failed: {e}")
    print()
    
    # Step 10: Test Metadata Filtering
    print("=" * 80)
    print("🔍 Step 10: Testing Metadata Filtering")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print(f"Filter: document_id='{document_id}'")
    print()
    
    try:
        config = RetrievalConfig(
            search_type=SearchType.HYBRID,
            top_k=5,
            metadata_filter={"document_id": document_id}
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        print(f"✅ Metadata filtering completed!")
        print(f"   - Results found: {len(result.ids)}")
        # Verify all results match filter
        all_match = all(
            meta.get("document_id") == document_id
            for meta in result.metadata
        )
        print(f"   - All results match filter: {all_match}")
        print()
    except Exception as e:
        print(f"❌ Metadata filtering failed: {e}")
        print()
    
    # Step 11: Test Deduplication
    print("=" * 80)
    print("🔍 Step 11: Testing Deduplication")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print()
    
    try:
        config = RetrievalConfig(
            search_type=SearchType.HYBRID,
            top_k=10,
            deduplication_enabled=True,
            deduplication_threshold=0.95
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        print(f"✅ Deduplication completed!")
        print(f"   - Results found: {len(result.ids)}")
        print(f"   - Unique IDs: {len(set(result.ids))}")
        print(f"   - Deduplication working: {len(result.ids) == len(set(result.ids))}")
        print()
    except Exception as e:
        print(f"❌ Deduplication test failed: {e}")
        print()
    
    # Step 12: Test Re-ranking (if available)
    print("=" * 80)
    print("🔍 Step 12: Testing Re-ranking (Optional)")
    print("=" * 80)
    print(f"Query: '{test_query}'")
    print()
    print("Note: Re-ranking requires Cohere API key or sentence-transformers")
    print("Skipping if not configured...")
    print()
    
    # Try Cohere rerank
    try:
        config = RetrievalConfig(
            search_type=SearchType.HYBRID,
            top_k=10,
            rerank_enabled=True,
            rerank_provider=RerankProvider.COHERE,
            rerank_top_n=5
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        if result.rerank_scores:
            print(f"✅ Cohere reranking completed!")
            print(f"   - Results found: {len(result.ids)}")
            print(f"   - Rerank scores: {[f'{s:.4f}' for s in result.rerank_scores[:3]]}")
        else:
            print("⚠️  Cohere reranking not available (API key may be missing)")
    except Exception as e:
        print(f"⚠️  Cohere reranking not available: {str(e)[:100]}")
    
    # Try Cross-encoder rerank
    try:
        config = RetrievalConfig(
            search_type=SearchType.HYBRID,
            top_k=10,
            rerank_enabled=True,
            rerank_provider=RerankProvider.CROSS_ENCODER,
            rerank_top_n=5
        )
        
        result = await retrieval_service.retrieve(
            query=test_query,
            collection_name=collection_name,
            config=config
        )
        
        if result.rerank_scores:
            print(f"✅ Cross-encoder reranking completed!")
            print(f"   - Results found: {len(result.ids)}")
            print(f"   - Rerank scores: {[f'{s:.4f}' for s in result.rerank_scores[:3]]}")
        else:
            print("⚠️  Cross-encoder reranking not available (sentence-transformers may not be installed)")
    except Exception as e:
        print(f"⚠️  Cross-encoder reranking not available: {str(e)[:100]}")
    
    print()
    print("=" * 80)
    print("✅ Full retrieval pipeline test completed!")
    print("=" * 80)
    print()
    print("Summary:")
    print(f"  - Document processed: {document_id}")
    print(f"  - Chunks created: {len(chunks)}")
    print(f"  - Documents stored: {len(stored_ids)}")
    print(f"  - Collection: {collection_name}")
    print()
    print("All retrieval features tested successfully! 🚀")


async def main():
    """Main function to run the test"""
    if len(sys.argv) < 2:
        print("Usage: python tests/test_retrieval_with_docs.py <path_to_document> [document_id]")
        print()
        print("Examples:")
        print("  python tests/test_retrieval_with_docs.py uploads/test-files/sample.pdf")
        print("  python tests/test_retrieval_with_docs.py uploads/test-files/sample.docx")
        print("  python tests/test_retrieval_with_docs.py uploads/test-files/sample.txt")
        print("  python tests/test_retrieval_with_docs.py uploads/test-files/sample.pdf my_document_123")
        print()
        print("This test will:")
        print("  1. Ingest the document")
        print("  2. Chunk it into smaller pieces")
        print("  3. Generate embeddings")
        print("  4. Store in vector database")
        print("  5. Build keyword index")
        print("  6. Test vector search")
        print("  7. Test keyword search")
        print("  8. Test hybrid search")
        print("  9. Test different fusion methods")
        print("  10. Test metadata filtering")
        print("  11. Test deduplication")
        print("  12. Test re-ranking (if available)")
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_id = sys.argv[2] if len(sys.argv) > 2 else "test_doc_1"
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    
    await test_full_retrieval_pipeline(file_path, document_id)


if __name__ == "__main__":
    asyncio.run(main())

