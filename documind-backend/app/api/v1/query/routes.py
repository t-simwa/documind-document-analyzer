"""
Query API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
import structlog
import json

from app.core.config import settings
from app.services.retrieval import RetrievalService, RetrievalConfig, SearchType
from app.services.llm import LLMService, LLMConfig, LLMProvider
from app.services.generation import GenerationService
from .schemas import (
    QueryRequest,
    QueryResponse,
    CitationResponse,
    KeyPointResponse,
    EntityResponse,
    QueryHistoryItem,
    QueryHistoryResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()

# In-memory query history (in production, use a database)
query_history: List[dict] = []


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
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Query documents and get AI-generated answer
    
    Args:
        request: Query request with question and configuration
        generation_service: Generation service instance
        
    Returns:
        QueryResponse with answer, citations, and metadata
    """
    try:
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
            model=response.model,
            provider=response.provider,
            usage=response.usage,
            metadata=response.metadata,
            generated_at=response.generated_at
        )
        
        # Store in history
        history_item = {
            "id": f"query_{len(query_history)}",
            "query": request.query,
            "answer": response.answer,
            "collection_name": request.collection_name,
            "document_ids": request.document_ids or [],
            "created_at": response.generated_at,
            "metadata": response.metadata
        }
        query_history.append(history_item)
        
        logger.info(
            "Query processed",
            query=request.query[:100],
            collection=request.collection_name,
            answer_length=len(response.answer)
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
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Query documents and stream answer
    
    Args:
        request: Query request with question and configuration
        generation_service: Generation service instance
        
    Returns:
        StreamingResponse with text chunks
    """
    try:
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
    description="Get query history for the current session"
)
async def get_query_history(
    limit: int = 50,
    offset: int = 0
):
    """
    Get query history
    
    Args:
        limit: Maximum number of items to return
        offset: Offset for pagination
        
    Returns:
        QueryHistoryResponse with history items
    """
    # Get items in reverse chronological order
    sorted_history = sorted(
        query_history,
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
        total=len(query_history)
    )


@router.delete(
    "/history/{query_id}",
    summary="Delete query from history",
    description="Delete a specific query from history"
)
async def delete_query_history(query_id: str):
    """
    Delete query from history
    
    Args:
        query_id: Query ID to delete
        
    Returns:
        Success message
    """
    global query_history
    original_length = len(query_history)
    query_history = [item for item in query_history if item["id"] != query_id]
    
    if len(query_history) == original_length:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found")
    
    return {"message": f"Query {query_id} deleted successfully"}

