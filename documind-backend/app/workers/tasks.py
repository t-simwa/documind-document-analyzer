"""
Background task definitions using FastAPI BackgroundTasks
These tasks run asynchronously after a response is returned
"""

from fastapi import BackgroundTasks
from typing import Any, Callable, Dict, Optional
import asyncio
import structlog

from app.core.logging_config import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class TaskQueue:
    """
    Simple in-memory task queue for background tasks
    In production, this would be replaced with Celery or similar
    """
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self._task_counter = 0
    
    def add_task(
        self,
        task_id: str,
        task_type: str,
        status: str = "pending",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Add a task to the queue"""
        self.tasks[task_id] = {
            "id": task_id,
            "type": task_type,
            "status": status,
            "metadata": metadata or {},
            "created_at": asyncio.get_event_loop().time(),
        }
        logger.info("task_added", task_id=task_id, task_type=task_type)
        return task_id
    
    def update_task_status(
        self,
        task_id: str,
        status: str,
        result: Optional[Any] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update task status"""
        if task_id not in self.tasks:
            return False
        
        self.tasks[task_id]["status"] = status
        if result is not None:
            self.tasks[task_id]["result"] = result
        if error:
            self.tasks[task_id]["error"] = error
        
        logger.info(
            "task_status_updated",
            task_id=task_id,
            status=status,
            has_error=error is not None
        )
        return True
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task information"""
        return self.tasks.get(task_id)
    
    def list_tasks(
        self,
        task_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> list:
        """List tasks with optional filtering"""
        tasks = list(self.tasks.values())
        
        if task_type:
            tasks = [t for t in tasks if t["type"] == task_type]
        if status:
            tasks = [t for t in tasks if t["status"] == status]
        
        return tasks


# Global task queue instance
task_queue = TaskQueue()


async def process_document_async(
    document_id: str,
    file_path: str,
    file_type: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Background task to process a document
    Integrates with document ingestion service and RAG pipeline
    """
    from app.services.document_ingestion import DocumentIngestionService
    
    task_id = f"doc_process_{document_id}"
    task_queue.add_task(
        task_id=task_id,
        task_type="document_processing",
        status="processing",
        metadata={"document_id": document_id, "file_path": file_path, "file_type": file_type}
    )
    
    try:
        logger.info(
            "document_processing_started",
            document_id=document_id,
            file_type=file_type
        )
        
        # Step 1: Ingest document using document ingestion service
        ingestion_service = DocumentIngestionService()
        
        # Determine file extension
        file_ext = f".{file_type}" if file_type and not file_type.startswith('.') else file_type
        
        # Ingest document
        document_content = await ingestion_service.ingest_document(
            file_path=file_path,
            file_type=file_ext
        )
        
        # Update task with ingestion results
        task_queue.update_task_status(
            task_id=task_id,
            status="processing",
            result={
                "document_id": document_id,
                "status": "ingested",
                "step": "extract",
                "content_length": len(document_content.text),
                "page_count": len(document_content.pages) if document_content.pages else 0,
                "table_count": len(document_content.tables) if document_content.tables else 0,
                "metadata": document_content.metadata
            }
        )
        
        logger.info(
            "document_ingestion_completed",
            document_id=document_id,
            content_length=len(document_content.text),
            page_count=len(document_content.pages) if document_content.pages else 0
        )
        
        # Step 2: Chunk document using chunking service
        from app.services.chunking import ChunkingService, ChunkingConfig
        
        # Detect document type from metadata if available
        doc_type = None
        if metadata:
            doc_type = metadata.get("document_type")
        
        # Create chunking service with appropriate config
        chunking_config = ChunkingConfig(document_type=doc_type)
        chunking_service = ChunkingService(config=chunking_config)
        
        # Chunk the document
        chunks = chunking_service.chunk_document(
            document_content=document_content,
            document_id=document_id,
            document_type=doc_type
        )
        
        # Update task with chunking results
        task_queue.update_task_status(
            task_id=task_id,
            status="processing",
            result={
                "document_id": document_id,
                "status": "chunked",
                "step": "chunk",
                "content_length": len(document_content.text),
                "page_count": len(document_content.pages) if document_content.pages else 0,
                "chunk_count": len(chunks),
                "chunks": [
                    {
                        "chunk_index": chunk.chunk_index,
                        "char_count": chunk.char_count,
                        "word_count": chunk.word_count,
                        "page_number": chunk.page_number,
                        "section": chunk.section,
                        "heading": chunk.heading,
                    }
                    for chunk in chunks[:10]  # Include first 10 chunks in result
                ],
                "metadata": document_content.metadata
            }
        )
        
        logger.info(
            "document_chunking_completed",
            document_id=document_id,
            chunk_count=len(chunks),
            avg_chunk_size=sum(len(c.text) for c in chunks) / len(chunks) if chunks else 0
        )
        
        # Step 3: Generate embeddings
        from app.services.embeddings import EmbeddingService
        from app.services.vector_store import VectorStoreService, VectorDocument
        
        embedding_service = EmbeddingService()
        vector_store = VectorStoreService(dimension=embedding_service.get_embedding_dimension())
        
        # Prepare texts for embedding
        chunk_texts = [chunk.text for chunk in chunks]
        
        # Generate embeddings
        embedding_result = await embedding_service.embed_texts(
            texts=chunk_texts,
            batch_size=settings.EMBEDDING_BATCH_SIZE
        )
        
        logger.info(
            "document_embedding_completed",
            document_id=document_id,
            embedding_count=len(embedding_result.embeddings),
            dimension=embedding_result.metadata.get("dimension"),
            cache_hits=embedding_result.metadata.get("cache_hits", 0),
            cache_misses=embedding_result.metadata.get("cache_misses", 0)
        )
        
        # Step 4: Store in vector database
        collection_name = settings.VECTOR_STORE_COLLECTION_PREFIX
        tenant_id = metadata.get("tenant_id") if metadata else None
        
        # Ensure collection exists
        if not await vector_store.collection_exists(collection_name, tenant_id=tenant_id):
            await vector_store.create_collection(collection_name, tenant_id=tenant_id)
        
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
            if chunk.start_char_index is not None:
                metadata["start_char_index"] = chunk.start_char_index
            if chunk.end_char_index is not None:
                metadata["end_char_index"] = chunk.end_char_index
            if chunk.timestamp is not None:
                metadata["timestamp"] = chunk.timestamp.isoformat()
            
            # Add any additional metadata from chunk, filtering None values and complex types
            # ChromaDB only accepts: str, int, float, bool, None
            for key, value in chunk.metadata.items():
                if value is not None:
                    # Convert complex types to ChromaDB-compatible formats
                    if isinstance(value, (list, dict)):
                        # Skip nested structures (ChromaDB doesn't support them)
                        # Convert to JSON string if needed, or skip
                        if key == "all_languages" and isinstance(value, list):
                            # Convert list of dicts to comma-separated string
                            lang_strs = [f"{item.get('language', '')}:{item.get('probability', 0)}" 
                                       for item in value if isinstance(item, dict)]
                            metadata[key] = ",".join(lang_strs) if lang_strs else None
                        else:
                            # Skip other complex types
                            continue
                    elif isinstance(value, (str, int, float, bool)):
                        metadata[key] = value
                    else:
                        # Convert other types to string
                        metadata[key] = str(value)
            
            vector_doc = VectorDocument(
                id=f"{document_id}_{chunk.chunk_index}",
                embedding=embedding,
                document=chunk.text,
                metadata=metadata
            )
            vector_documents.append(vector_doc)
        
        # Store documents in vector store
        stored_ids = await vector_store.add_documents(
            documents=vector_documents,
            collection_name=collection_name,
            tenant_id=tenant_id
        )
        
        logger.info(
            "document_indexing_completed",
            document_id=document_id,
            stored_count=len(stored_ids),
            collection_name=collection_name
        )
        
        # Step 5: Update document status
        task_queue.update_task_status(
            task_id=task_id,
            status="completed",
            result={
                "document_id": document_id,
                "status": "processed",
                "step": "index",
                "content_length": len(document_content.text),
                "chunk_count": len(chunks),
                "embedding_count": len(embedding_result.embeddings),
                "stored_count": len(stored_ids),
                "embedding_provider": embedding_result.provider,
                "embedding_model": embedding_result.model,
                "vector_store_provider": vector_store.provider_name,
                "collection_name": collection_name,
                "metadata": document_content.metadata
            }
        )
        
        # Update document status in documents_store
        try:
            from app.api.v1.documents.routes import documents_store
            if document_id in documents_store:
                documents_store[document_id]["status"] = "ready"
        except Exception as e:
            logger.warning("Failed to update document status in store", document_id=document_id, error=str(e))
        
        # Update document status in database
        try:
            from app.database.models import Document as DocumentModel
            doc = await DocumentModel.get(document_id)
            if doc:
                doc.status = "ready"
                await doc.save()
                
                # Log activity for document processing completion
                from app.utils.activity_logger import log_activity
                await log_activity(
                    activity_type="complete",
                    title="Document processed successfully",
                    description=f"{doc.name} has been processed and is ready for analysis",
                    user_id=doc.uploaded_by,
                    organization_id=doc.organization_id,
                    document_id=document_id,
                    project_id=doc.project_id,
                    status="success",
                    metadata={"chunk_count": len(chunks), "embedding_count": len(embedding_result.embeddings)}
                )
        except Exception as e:
            logger.warning("Failed to update document status in database", document_id=document_id, error=str(e))
        
        logger.info("document_processing_completed", document_id=document_id)
        
    except Exception as e:
        logger.exception(
            "document_processing_failed",
            document_id=document_id,
            error=str(e)
        )
        task_queue.update_task_status(
            task_id=task_id,
            status="failed",
            error=str(e)
        )
        
        # Update document status in documents_store to error
        try:
            from app.api.v1.documents.routes import documents_store
            if document_id in documents_store:
                documents_store[document_id]["status"] = "error"
        except Exception as store_error:
            logger.warning("Failed to update document status in store", document_id=document_id, error=str(store_error))
        
        # Update document status in database and log error activity
        try:
            from app.database.models import Document as DocumentModel
            doc = await DocumentModel.get(document_id)
            if doc:
                doc.status = "error"
                await doc.save()
                
                # Log activity for processing error
                from app.utils.activity_logger import log_activity
                await log_activity(
                    activity_type="error",
                    title="Processing failed",
                    description=f"Failed to process {doc.name} - {str(e)}",
                    user_id=doc.uploaded_by,
                    organization_id=doc.organization_id,
                    document_id=document_id,
                    project_id=doc.project_id,
                    status="error",
                    metadata={"error": str(e)}
                )
        except Exception as db_error:
            logger.warning("Failed to update document status in database", document_id=document_id, error=str(db_error))


async def security_scan_async(
    document_id: str,
    file_path: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Background task to perform security scanning
    This would integrate with security scanning service when implemented
    """
    task_id = f"security_scan_{document_id}"
    task_queue.add_task(
        task_id=task_id,
        task_type="security_scan",
        status="scanning",
        metadata={"document_id": document_id, "file_path": file_path}
    )
    
    try:
        logger.info("security_scan_started", document_id=document_id)
        
        # Simulate security scanning
        # In production, this would:
        # 1. Scan for malware
        # 2. Scan for viruses
        # 3. Check file signatures
        # 4. Update security scan status
        
        await asyncio.sleep(0.5)  # Simulate scan time
        
        task_queue.update_task_status(
            task_id=task_id,
            status="completed",
            result={"document_id": document_id, "scan_status": "clean"}
        )
        
        logger.info("security_scan_completed", document_id=document_id)
        
    except Exception as e:
        logger.exception(
            "security_scan_failed",
            document_id=document_id,
            error=str(e)
        )
        task_queue.update_task_status(
            task_id=task_id,
            status="failed",
            error=str(e)
        )


def add_background_task(
    background_tasks: BackgroundTasks,
    task_func: Callable,
    *args,
    **kwargs
) -> None:
    """
    Helper function to add a background task
    """
    background_tasks.add_task(task_func, *args, **kwargs)

