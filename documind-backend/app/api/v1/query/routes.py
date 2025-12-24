"""
Query API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timedelta
import structlog
import json
import time

from app.core.config import settings
from app.core.dependencies import require_auth
from app.services.retrieval import RetrievalService, RetrievalConfig, SearchType
from app.services.llm import LLMService, LLMConfig, LLMProvider
from app.services.generation import GenerationService
from app.utils.activity_logger import log_activity
from app.database.models import QueryHistory as QueryHistoryModel
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
    ContradictionDocumentResponse,
    QueryPerformanceResponse,
    TopQueryResponse,
    RecentErrorResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter()


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
        
        # Track response time
        start_time = time.time()
        response = None
        query_success = True
        error_message = None
        
        try:
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
        except Exception as e:
            query_success = False
            error_message = str(e)
            # Re-raise the exception to return error to client
            raise
        finally:
            response_time = time.time() - start_time
        
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
        
        # Store in MongoDB query history (store even if query failed)
        try:
            query_history_item = QueryHistoryModel(
                user_id=user_id,
                query=request.query,
                answer=response.answer if response else "",
                collection_name=request.collection_name,
                document_ids=request.document_ids or [],
                response_time=round(response_time, 3),  # Store in seconds with 3 decimal precision
                success=query_success,
                error_message=error_message,
                metadata={
                    **(response.metadata if response else {}),
                    "model": response.model if response else None,
                    "provider": response.provider if response else None,
                    "usage": response.usage if response else {},
                    "confidence": response.confidence if response else 0.0,
                    "answer_length": len(response.answer) if response else 0,
                    "citation_count": len(response.citations) if response else 0
                }
            )
            await query_history_item.insert()
        except Exception as e:
            # Log error but don't fail the query if history storage fails
            logger.warning("failed_to_store_query_history", error=str(e), user_id=user_id)
        
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
    user_id = current_user["id"]
    start_time = time.time()
    full_answer = ""
    query_success = True
    error_message = None
    
    try:
        
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
            nonlocal full_answer, query_success, error_message
            try:
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
            except Exception as e:
                query_success = False
                error_message = str(e)
                raise
        
        # Create response and store history after streaming completes
        response = StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
        # Store query history after response (background task)
        # Note: This runs after the response is sent, so we calculate time here
        async def store_history():
            response_time = time.time() - start_time
            try:
                query_history_item = QueryHistoryModel(
                    user_id=user_id,
                    query=request.query,
                    answer=full_answer,
                    collection_name=request.collection_name,
                    document_ids=request.document_ids or [],
                    response_time=round(response_time, 3),
                    success=query_success,
                    error_message=error_message,
                    metadata={
                        "streaming": True,
                        "answer_length": len(full_answer)
                    }
                )
                await query_history_item.insert()
            except Exception as e:
                logger.warning("failed_to_store_streaming_query_history", error=str(e), user_id=user_id)
        
        # Schedule history storage (runs after response)
        import asyncio
        asyncio.create_task(store_history())
        
        return response
    
    except Exception as e:
        logger.error("Streaming query failed", error=str(e), query=request.query)
        query_success = False
        error_message = str(e)
        # Store failed query in history
        response_time = time.time() - start_time
        try:
            query_history_item = QueryHistoryModel(
                user_id=user_id,
                query=request.query,
                answer=full_answer,
                collection_name=request.collection_name,
                document_ids=request.document_ids or [],
                response_time=round(response_time, 3),
                success=False,
                error_message=str(e),
                metadata={"streaming": True}
            )
            await query_history_item.insert()
        except Exception:
            pass  # Don't fail if history storage fails
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
    try:
        user_id = current_user["id"]
        
        # Query MongoDB for user's query history
        total = await QueryHistoryModel.find(
            QueryHistoryModel.user_id == user_id
        ).count()
        
        # Get paginated items in reverse chronological order
        history_items = await QueryHistoryModel.find(
            QueryHistoryModel.user_id == user_id
        ).sort(-QueryHistoryModel.created_at).skip(offset).limit(limit).to_list()
        
        items = [
            QueryHistoryItem(
                id=str(item.id),
                query=item.query,
                answer=item.answer,
                collection_name=item.collection_name,
                document_ids=item.document_ids,
                created_at=item.created_at,
                metadata={
                    **item.metadata,
                    "response_time": item.response_time,
                    "success": item.success,
                    "error_message": item.error_message
                }
            )
            for item in history_items
        ]
        
        return QueryHistoryResponse(
            items=items,
            total=total
        )
    except Exception as e:
        logger.exception("query_history_fetch_failed", error=str(e), user_id=current_user.get("id"))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch query history: {str(e)}"
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
    try:
        user_id = current_user["id"]
        
        # Try ObjectId conversion first
        from bson import ObjectId
        from beanie.exceptions import DocumentNotFound
        
        try:
            object_id = ObjectId(query_id)
            query_item = await QueryHistoryModel.find_one(
                QueryHistoryModel.id == object_id,
                QueryHistoryModel.user_id == user_id
            )
        except (ValueError, TypeError):
            # Fallback to string ID search
            query_item = await QueryHistoryModel.find_one(
                QueryHistoryModel.id == query_id,
                QueryHistoryModel.user_id == user_id
            )
        
        if not query_item:
            raise HTTPException(status_code=404, detail=f"Query {query_id} not found")
        
        await query_item.delete()
        
        return {"message": f"Query {query_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("query_history_delete_failed", error=str(e), query_id=query_id, user_id=current_user.get("id"))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete query history: {str(e)}"
        )


@router.get(
    "/performance",
    response_model=QueryPerformanceResponse,
    summary="Get query performance metrics",
    description="Get aggregated query performance metrics for the authenticated user with optional time-based filtering"
)
async def get_query_performance(
    start_date: Optional[datetime] = Query(None, description="Start date for filtering (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering (ISO format)"),
    current_user: dict = Depends(require_auth)
):
    """
    Get query performance metrics for the authenticated user
    
    Args:
        start_date: Optional start date for filtering (ISO format)
        end_date: Optional end date for filtering (ISO format)
        
    Returns:
        QueryPerformanceResponse with success rate, average response time, top queries, and recent errors
    """
    try:
        user_id = current_user["id"]
        
        # Query MongoDB for user's query history with optional date filtering
        query_builder = QueryHistoryModel.find(QueryHistoryModel.user_id == user_id)
        
        if start_date:
            query_builder = query_builder.find(QueryHistoryModel.created_at >= start_date)
        if end_date:
            # Add 1 day to end_date to include the entire end day
            end_date_inclusive = end_date + timedelta(days=1)
            query_builder = query_builder.find(QueryHistoryModel.created_at <= end_date_inclusive)
        
        user_history = await query_builder.to_list()
        
        if not user_history:
            return QueryPerformanceResponse(
                success_rate=0.0,
                average_response_time=0.0,
                total_queries=0,
                successful_queries=0,
                failed_queries=0,
                top_queries=[],
                recent_errors=[]
            )
        
        # Calculate success/failure
        total_queries = len(user_history)
        successful_queries = sum(1 for item in user_history if item.success)
        failed_queries = total_queries - successful_queries
        
        # Collect response times
        response_times = [item.response_time for item in user_history if item.response_time is not None]
        
        # Query frequency tracking
        query_counts: dict[str, dict] = {}  # {query: {count: int, times: [float]}}
        
        # Collect recent errors
        recent_errors = []
        
        for item in user_history:
            query_text = item.query
            response_time = item.response_time
            
            # Track response time
            if response_time is not None:
                response_times.append(response_time)
            
            # Track query frequency
            if query_text:
                if query_text not in query_counts:
                    query_counts[query_text] = {"count": 0, "times": []}
                query_counts[query_text]["count"] += 1
                if response_time is not None:
                    query_counts[query_text]["times"].append(response_time)
            
            # Track errors
            if not item.success and item.error_message:
                recent_errors.append({
                    "query": query_text[:100],  # Truncate long queries
                    "error": item.error_message[:200],  # Truncate long errors
                    "timestamp": item.created_at
                })
        
        # Calculate success rate
        success_rate = (successful_queries / total_queries * 100) if total_queries > 0 else 0.0
        
        # Calculate average response time
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0.0
        
        # Get top queries (most frequent, limit to 5)
        top_queries_list = []
        sorted_queries = sorted(
            query_counts.items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )[:5]
        
        for query_text, data in sorted_queries:
            avg_time = sum(data["times"]) / len(data["times"]) if data["times"] else 0.0
            top_queries_list.append(TopQueryResponse(
                query=query_text[:100],  # Truncate long queries
                count=data["count"],
                avg_time=round(avg_time, 2)
            ))
        
        # Sort recent errors by timestamp (most recent first), limit to 10
        recent_errors_sorted = sorted(
            recent_errors,
            key=lambda x: x["timestamp"],
            reverse=True
        )[:10]
        
        recent_errors_response = [
            RecentErrorResponse(
                query=err["query"],
                error=err["error"],
                timestamp=err["timestamp"]
            )
            for err in recent_errors_sorted
        ]
        
        return QueryPerformanceResponse(
            success_rate=round(success_rate, 1),
            average_response_time=round(avg_response_time, 2),
            total_queries=total_queries,
            successful_queries=successful_queries,
            failed_queries=failed_queries,
            top_queries=top_queries_list,
            recent_errors=recent_errors_response
        )
    
    except Exception as e:
        logger.exception("query_performance_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate query performance: {str(e)}"
        )

