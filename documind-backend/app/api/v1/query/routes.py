"""
Query API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
import structlog
import json

from app.core.config import settings
from app.core.dependencies import require_auth
from app.services.retrieval import RetrievalService, RetrievalConfig, SearchType
from app.services.llm import LLMService, LLMConfig, LLMProvider
from app.services.generation import GenerationService
from app.utils.activity_logger import log_activity
from .schemas import (
    QueryRequest,
    QueryResponse,
    CitationResponse,
    KeyPointResponse,
    EntityResponse,
    QueryHistoryItem,
    QueryHistoryResponse,
    DocumentPatternResponse,
    DocumentContradictionResponse,
    PatternExampleResponse,
    ContradictionDocumentResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# In-memory query history per user (in production, use a database)
# Structure: {user_id: [history_items]}
query_history: dict[str, List[dict]] = {}


def get_generation_service() -> GenerationService:
    """Dependency to get generation service instance"""
    retrieval_service = RetrievalService()
    llm_service = LLMService()
    generation_service = GenerationService(
        retrieval_service=retrieval_service,
        llm_service=llm_service
    )
    return generation_service


@router.post(
    "/",
    response_model=QueryResponse,
    summary="Query documents",
    description="Query documents using RAG (Retrieval-Augmented Generation)"
)
async def query_documents(
    request: QueryRequest,
    generation_service: GenerationService = Depends(get_generation_service),
    current_user: dict = Depends(require_auth)
):
    """
    Query documents and get AI-generated answer (only user's documents)
    
    Args:
        request: Query request with question and configuration
        generation_service: Generation service instance
        
    Returns:
        QueryResponse with answer, citations, and metadata
    """
    try:
        user_id = current_user["id"]
        
        # Validate that all document_ids belong to the user
        if request.document_ids:
            from app.database.models import Document as DocumentModel
            from bson import ObjectId
            from beanie.exceptions import DocumentNotFound
            
            for doc_id in request.document_ids:
                doc = None
                try:
                    # Try ObjectId first
                    try:
                        object_id = ObjectId(doc_id)
                        doc = await DocumentModel.find_one(
                            DocumentModel.id == object_id,
                            DocumentModel.uploaded_by == user_id
                        )
                    except (ValueError, TypeError, DocumentNotFound):
                        # Fallback to string ID search
                        doc = await DocumentModel.find_one(
                            DocumentModel.id == doc_id,
                            DocumentModel.uploaded_by == user_id
                        )
                except Exception as e:
                    logger.error("error_finding_document_in_query", doc_id=doc_id, error=str(e))
                
                if not doc:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Document {doc_id} not found or access denied"
                    )
        # Build retrieval config
        retrieval_config = RetrievalConfig()
        if request.top_k:
            retrieval_config.top_k = request.top_k
        if request.search_type:
            try:
                retrieval_config.search_type = SearchType(request.search_type.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid search_type: {request.search_type}. Must be one of: vector, keyword, hybrid"
                )
        if request.rerank_enabled is not None:
            retrieval_config.rerank_enabled = request.rerank_enabled
        
        # Build LLM config
        llm_config = LLMConfig()
        if request.temperature is not None:
            llm_config.temperature = request.temperature
        if request.max_tokens is not None:
            llm_config.max_tokens = request.max_tokens
        
        # Generate answer
        response = await generation_service.generate_answer(
            query=request.query,
            collection_name=request.collection_name,
            document_ids=request.document_ids,
            retrieval_config=retrieval_config,
            llm_config=llm_config,
            conversation_history=request.conversation_history,
            generate_insights=request.generate_insights
        )
        
        # Generate patterns and contradictions for cross-document queries
        patterns = None
        contradictions = None
        
        # Only generate patterns/contradictions if multiple documents are queried
        if request.document_ids and len(request.document_ids) > 1:
            try:
                # Get document names for mapping (already validated above)
                from app.database.models import Document as DocumentModel
                from bson import ObjectId
                from beanie.exceptions import DocumentNotFound
                
                doc_name_map = {}
                for doc_id in request.document_ids:
                    doc = None
                    try:
                        # Try ObjectId first
                        try:
                            object_id = ObjectId(doc_id)
                            doc = await DocumentModel.find_one(
                                DocumentModel.id == object_id,
                                DocumentModel.uploaded_by == user_id
                            )
                        except (ValueError, TypeError, DocumentNotFound):
                            # Fallback to string ID search
                            doc = await DocumentModel.find_one(
                                DocumentModel.id == doc_id,
                                DocumentModel.uploaded_by == user_id
                            )
                    except Exception:
                        pass
                    
                    if doc:
                        doc_name_map[doc_id] = doc.name
                    else:
                        doc_name_map[doc_id] = doc_id
                
                # Generate patterns and contradictions (will retrieve chunks internally)
                patterns_data, contradictions_data = await generation_service.generate_patterns_and_contradictions(
                    query=request.query,
                    collection_name=request.collection_name,
                    document_ids=request.document_ids,
                    context_chunks=None,  # Will retrieve internally
                    document_name_map=doc_name_map,
                    retrieval_config=retrieval_config
                )
                
                if patterns_data:
                    patterns = [
                        DocumentPatternResponse(
                            type=p["type"],
                            description=p["description"],
                            documents=p["documents"],
                            occurrences=p["occurrences"],
                            examples=[
                                PatternExampleResponse(
                                    document_id=ex["document_id"],
                                    document_name=ex["document_name"],
                                    text=ex["text"],
                                    page=ex.get("page")
                                )
                                for ex in p.get("examples", [])
                            ],
                            confidence=p["confidence"]
                        )
                        for p in patterns_data
                    ]
                
                if contradictions_data:
                    contradictions = [
                        DocumentContradictionResponse(
                            type=c["type"],
                            description=c["description"],
                            documents=[
                                ContradictionDocumentResponse(
                                    id=d["id"],
                                    name=d["name"],
                                    claim=d["claim"],
                                    page=d.get("page"),
                                    section=d.get("section")
                                )
                                for d in c["documents"]
                            ],
                            severity=c["severity"],
                            confidence=c["confidence"]
                        )
                        for c in contradictions_data
                    ]
            except Exception as e:
                logger.warning("Failed to generate patterns/contradictions", error=str(e))
                # Continue without patterns/contradictions if generation fails
        
        # Convert to response schema
        query_response = QueryResponse(
            answer=response.answer,
            citations=[
                CitationResponse(
                    index=c.index,
                    document_id=c.document_id,
                    chunk_id=c.chunk_id,
                    page=c.page,
                    score=c.score,
                    metadata=c.metadata
                )
                for c in response.citations
            ],
            confidence=response.confidence,
            key_points=[
                KeyPointResponse(
                    text=kp.text,
                    importance=kp.importance,
                    citations=kp.citations
                )
                for kp in response.key_points
            ],
            entities=[
                EntityResponse(
                    text=e.text,
                    type=e.type,
                    value=e.value,
                    citations=e.citations
                )
                for e in response.entities
            ],
            patterns=patterns,
            contradictions=contradictions,
            model=response.model,
            provider=response.provider,
            usage=response.usage,
            metadata=response.metadata,
            generated_at=response.generated_at
        )
        
        # Store in history (scoped to user)
        if user_id not in query_history:
            query_history[user_id] = []
        
        history_item = {
            "id": f"query_{len(query_history[user_id])}",
            "query": request.query,
            "answer": response.answer,
            "collection_name": request.collection_name,
            "document_ids": request.document_ids or [],
            "created_at": response.generated_at,
            "metadata": response.metadata
        }
        query_history[user_id].append(history_item)
        
        logger.info(
            "Query processed",
            query=request.query[:100],
            collection=request.collection_name,
            answer_length=len(response.answer)
        )
        
        # Log activity
        doc_names = []
        if request.document_ids:
            from app.database.models import Document as DocumentModel
            from bson import ObjectId
            for doc_id in request.document_ids[:3]:  # Get first 3 document names
                try:
                    doc = await DocumentModel.get(ObjectId(doc_id) if len(doc_id) == 24 else doc_id)
                    if doc:
                        doc_names.append(doc.name)
                except:
                    pass
        
        doc_description = f" on {', '.join(doc_names)}" if doc_names else ""
        if len(request.document_ids or []) > 3:
            doc_description += f" and {len(request.document_ids) - 3} more"
        
        await log_activity(
            activity_type="query",
            title="AI query executed",
            description=f"Query executed{doc_description}",
            user_id=user_id,
            organization_id=current_user.get("organization_id"),
            document_id=request.document_ids[0] if request.document_ids else None,
            status="success",
            metadata={
                "query": request.query[:100],  # Truncate for storage
                "document_count": len(request.document_ids or []),
                "answer_length": len(response.answer)
            }
        )
        
        return query_response
    
    except Exception as e:
        logger.error("Query failed", error=str(e), query=request.query)
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.post(
    "/stream",
    summary="Stream query response",
    description="Query documents and stream AI-generated answer in real-time"
)
async def query_documents_stream(
    request: QueryRequest,
    generation_service: GenerationService = Depends(get_generation_service),
    current_user: dict = Depends(require_auth)
):
    """
    Query documents and stream answer (only user's documents)
    
    Args:
        request: Query request with question and configuration
        generation_service: Generation service instance
        
    Returns:
        StreamingResponse with text chunks
    """
    try:
        user_id = current_user["id"]
        
        # Validate that all document_ids belong to the user
        if request.document_ids:
            from app.database.models import Document as DocumentModel
            from bson import ObjectId
            from beanie.exceptions import DocumentNotFound
            
            for doc_id in request.document_ids:
                doc = None
                try:
                    # Try ObjectId first
                    try:
                        object_id = ObjectId(doc_id)
                        doc = await DocumentModel.find_one(
                            DocumentModel.id == object_id,
                            DocumentModel.uploaded_by == user_id
                        )
                    except (ValueError, TypeError, DocumentNotFound):
                        # Fallback to string ID search
                        doc = await DocumentModel.find_one(
                            DocumentModel.id == doc_id,
                            DocumentModel.uploaded_by == user_id
                        )
                except Exception as e:
                    logger.error("error_finding_document_in_query_stream", doc_id=doc_id, error=str(e))
                
                if not doc:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Document {doc_id} not found or access denied"
                    )
        # Build retrieval config
        retrieval_config = RetrievalConfig()
        if request.top_k:
            retrieval_config.top_k = request.top_k
        if request.search_type:
            try:
                retrieval_config.search_type = SearchType(request.search_type.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid search_type: {request.search_type}"
                )
        if request.rerank_enabled is not None:
            retrieval_config.rerank_enabled = request.rerank_enabled
        
        # Build LLM config with streaming enabled
        llm_config = LLMConfig(stream=True)
        if request.temperature is not None:
            llm_config.temperature = request.temperature
        if request.max_tokens is not None:
            llm_config.max_tokens = request.max_tokens
        
        async def generate():
            """Generator function for streaming"""
            full_answer = ""
            async for chunk in generation_service.generate_answer_stream(
                query=request.query,
                collection_name=request.collection_name,
                document_ids=request.document_ids,
                retrieval_config=retrieval_config,
                llm_config=llm_config,
                conversation_history=request.conversation_history
            ):
                full_answer += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Send final message with metadata
            yield f"data: {json.dumps({'done': True, 'answer_length': len(full_answer)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        logger.error("Streaming query failed", error=str(e), query=request.query)
        raise HTTPException(status_code=500, detail=f"Streaming query failed: {str(e)}")


@router.get(
    "/history",
    response_model=QueryHistoryResponse,
    summary="Get query history",
    description="Get query history for the authenticated user"
)
async def get_query_history(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(require_auth)
):
    """
    Get query history for the authenticated user
    
    Args:
        limit: Maximum number of items to return
        offset: Offset for pagination
        
    Returns:
        QueryHistoryResponse with history items
    """
    user_id = current_user["id"]
    user_history = query_history.get(user_id, [])
    
    # Get items in reverse chronological order
    sorted_history = sorted(
        user_history,
        key=lambda x: x.get("created_at", datetime.min),
        reverse=True
    )
    
    # Apply pagination
    paginated_items = sorted_history[offset:offset + limit]
    
    items = [
        QueryHistoryItem(
            id=item["id"],
            query=item["query"],
            answer=item["answer"],
            collection_name=item["collection_name"],
            document_ids=item.get("document_ids", []),
            created_at=item["created_at"],
            metadata=item.get("metadata", {})
        )
        for item in paginated_items
    ]
    
    return QueryHistoryResponse(
        items=items,
        total=len(user_history)
    )


@router.delete(
    "/history/{query_id}",
    summary="Delete query from history",
    description="Delete a specific query from authenticated user's history"
)
async def delete_query_history(query_id: str, current_user: dict = Depends(require_auth)):
    """
    Delete query from authenticated user's history
    
    Args:
        query_id: Query ID to delete
        
    Returns:
        Success message
    """
    user_id = current_user["id"]
    if user_id not in query_history:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found")
    
    original_length = len(query_history[user_id])
    query_history[user_id] = [
        item for item in query_history[user_id] 
        if item["id"] != query_id
    ]
    
    if len(query_history[user_id]) == original_length:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found")
    
    return {"message": f"Query {query_id} deleted successfully"}

