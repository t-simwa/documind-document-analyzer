"""
Main retrieval service with hybrid search, re-ranking, and optimization
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

from app.core.config import settings
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, VectorSearchResult
from .base import (
    RetrievalResult, RetrievalConfig, SearchType, FusionMethod, RerankProvider
)
from .query_optimizer import QueryOptimizer
from .keyword_search import KeywordSearchService
from .reranking import RerankingService
from .exceptions import RetrievalError, RetrievalConfigurationError

logger = structlog.get_logger(__name__)


class RetrievalService:
    """Main retrieval service with hybrid search and re-ranking"""
    
    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStoreService] = None,
        keyword_search: Optional[KeywordSearchService] = None
    ):
        """
        Initialize retrieval service
        
        Args:
            embedding_service: Embedding service instance
            vector_store: Vector store service instance
            keyword_search: Keyword search service instance
        """
        self.embedding_service = embedding_service or EmbeddingService()
        
        # Get dimension from embedding service if vector_store not provided
        if vector_store is None:
            try:
                # Get dimension from embedding provider
                dimension = self.embedding_service.provider.get_embedding_dimension()
                self.vector_store = VectorStoreService(dimension=dimension)
                logger.debug(
                    "vector_store_initialized_with_embedding_dimension",
                    dimension=dimension,
                    provider=self.embedding_service.provider_name
                )
            except Exception as e:
                # Fallback to default if dimension detection fails
                logger.warning(
                    "failed_to_get_embedding_dimension",
                    error=str(e),
                    using_default=True
                )
                self.vector_store = VectorStoreService()
        else:
            self.vector_store = vector_store
        
        self.keyword_search = keyword_search or KeywordSearchService(
            k1=settings.RETRIEVAL_BM25_K1,
            b=settings.RETRIEVAL_BM25_B
        )
        self.query_optimizer = QueryOptimizer()
    
    async def retrieve(
        self,
        query: str,
        collection_name: str,
        config: Optional[RetrievalConfig] = None,
        tenant_id: Optional[str] = None
    ) -> RetrievalResult:
        """
        Retrieve documents using hybrid search with optional re-ranking
        
        Args:
            query: Search query
            collection_name: Collection name to search
            config: Retrieval configuration
            tenant_id: Optional tenant ID
            
        Returns:
            RetrievalResult with retrieved documents
        """
        if not query:
            return RetrievalResult(
                ids=[],
                documents=[],
                metadata=[],
                scores=[],
                distances=[]
            )
        
        # Use default config if not provided
        if config is None:
            config = RetrievalConfig()
        
        # Preprocess query
        if config.query_preprocessing_enabled:
            query = self.query_optimizer.preprocess_query(query)
        
        # Expand query if enabled
        if config.query_expansion_enabled:
            query = self.query_optimizer.expand_query(query)
        
        # Build metadata filter
        metadata_filter = self._build_metadata_filter(config, tenant_id)
        
        # Perform search based on type
        if config.search_type == SearchType.VECTOR:
            result = await self._vector_search(
                query, collection_name, config, tenant_id, metadata_filter
            )
        elif config.search_type == SearchType.KEYWORD:
            result = await self._keyword_search(
                query, collection_name, config, tenant_id, metadata_filter
            )
        else:  # HYBRID
            result = await self._hybrid_search(
                query, collection_name, config, tenant_id, metadata_filter
            )
        
        # Apply deduplication if enabled
        if config.deduplication_enabled:
            result = self._deduplicate_results(result, config.deduplication_threshold)
        
        # Apply re-ranking if enabled
        if config.rerank_enabled and result.documents:
            reranking_service = RerankingService(provider=config.rerank_provider)
            result = await reranking_service.rerank_results(
                query=query,
                result=result,
                top_n=config.rerank_top_n
            )
            
            # Apply rerank threshold
            if config.rerank_threshold > 0:
                result = self._filter_by_threshold(result, config.rerank_threshold)
        
        # Limit to top_k
        if len(result.ids) > config.top_k:
            result = RetrievalResult(
                ids=result.ids[:config.top_k],
                documents=result.documents[:config.top_k],
                metadata=result.metadata[:config.top_k],
                scores=result.scores[:config.top_k],
                distances=result.distances[:config.top_k],
                rerank_scores=result.rerank_scores[:config.top_k] if result.rerank_scores else None,
                search_type=result.search_type,
                vector_scores=result.vector_scores[:config.top_k] if result.vector_scores else None,
                keyword_scores=result.keyword_scores[:config.top_k] if result.keyword_scores else None
            )
        
        return result
    
    async def _vector_search(
        self,
        query: str,
        collection_name: str,
        config: RetrievalConfig,
        tenant_id: Optional[str],
        metadata_filter: Optional[Dict[str, Any]]
    ) -> RetrievalResult:
        """Perform vector similarity search"""
        # Generate query embedding
        query_embedding = await self.embedding_service.embed_query(query)
        
        # Search vector store
        vector_result = await self.vector_store.search(
            query_embedding=query_embedding,
            collection_name=collection_name,
            top_k=config.top_k,
            tenant_id=tenant_id,
            filter=metadata_filter
        )
        
        # Convert to RetrievalResult
        return RetrievalResult(
            ids=vector_result.ids,
            documents=vector_result.documents,
            metadata=vector_result.metadata,
            scores=vector_result.scores,
            distances=vector_result.distances,
            search_type=SearchType.VECTOR,
            vector_scores=vector_result.scores
        )
    
    async def _keyword_search(
        self,
        query: str,
        collection_name: str,
        config: RetrievalConfig,
        tenant_id: Optional[str],
        metadata_filter: Optional[Dict[str, Any]]
    ) -> RetrievalResult:
        """Perform keyword search using BM25"""
        # Check if index exists, build if not
        index_key = self.keyword_search._get_index_key(collection_name, tenant_id)
        if index_key not in self.keyword_search.indexes:
            # Build index on-demand
            await self.build_keyword_index(collection_name, tenant_id)
        
        # Search using BM25
        keyword_results = self.keyword_search.search(
            query=query,
            collection_name=collection_name,
            top_k=config.top_k * 2,  # Get more results for filtering
            tenant_id=tenant_id
        )
        
        if not keyword_results:
            return RetrievalResult(
                ids=[],
                documents=[],
                metadata=[],
                scores=[],
                distances=[],
                search_type=SearchType.KEYWORD
            )
        
        # Get full documents from vector store
        doc_ids = [doc_id for doc_id, _ in keyword_results]
        documents_data = await self._get_documents_by_ids(
            doc_ids, collection_name, tenant_id
        )
        
        # Apply metadata filter
        if metadata_filter:
            documents_data = self._filter_documents_by_metadata(
                documents_data, metadata_filter
            )
        
        # Build result
        ids = []
        documents = []
        metadata = []
        scores = []
        distances = []
        keyword_scores = []
        
        score_map = {doc_id: score for doc_id, score in keyword_results}
        
        for doc_id, doc_text, doc_metadata in documents_data:
            ids.append(doc_id)
            documents.append(doc_text)
            metadata.append(doc_metadata)
            score = score_map.get(doc_id, 0.0)
            keyword_scores.append(score)
            # Normalize BM25 score to 0-1 range (simple normalization)
            max_score = max(score_map.values()) if score_map.values() else 1.0
            normalized_score = score / max_score if max_score > 0 else 0.0
            scores.append(normalized_score)
            distances.append(1.0 - normalized_score)
        
        return RetrievalResult(
            ids=ids,
            documents=documents,
            metadata=metadata,
            scores=scores,
            distances=distances,
            search_type=SearchType.KEYWORD,
            keyword_scores=keyword_scores
        )
    
    async def _hybrid_search(
        self,
        query: str,
        collection_name: str,
        config: RetrievalConfig,
        tenant_id: Optional[str],
        metadata_filter: Optional[Dict[str, Any]]
    ) -> RetrievalResult:
        """Perform hybrid search combining vector and keyword search"""
        # Perform both searches in parallel
        vector_task = self._vector_search(
            query, collection_name, config, tenant_id, metadata_filter
        )
        keyword_task = self._keyword_search(
            query, collection_name, config, tenant_id, metadata_filter
        )
        
        vector_result, keyword_result = await asyncio.gather(
            vector_task, keyword_task
        )
        
        # Fuse results
        fused_result = self._fuse_results(
            vector_result, keyword_result, config
        )
        
        return fused_result
    
    def _fuse_results(
        self,
        vector_result: RetrievalResult,
        keyword_result: RetrievalResult,
        config: RetrievalConfig
    ) -> RetrievalResult:
        """Fuse vector and keyword search results"""
        if config.fusion_method == FusionMethod.RRF:
            return self._rrf_fusion(vector_result, keyword_result, config)
        elif config.fusion_method == FusionMethod.WEIGHTED:
            return self._weighted_fusion(vector_result, keyword_result, config)
        else:  # MEAN
            return self._mean_fusion(vector_result, keyword_result, config)
    
    def _rrf_fusion(
        self,
        vector_result: RetrievalResult,
        keyword_result: RetrievalResult,
        config: RetrievalConfig
    ) -> RetrievalResult:
        """Reciprocal Rank Fusion (RRF)"""
        # Create rank maps
        vector_ranks = {doc_id: rank + 1 for rank, doc_id in enumerate(vector_result.ids)}
        keyword_ranks = {doc_id: rank + 1 for rank, doc_id in enumerate(keyword_result.ids)}
        
        # Get all unique document IDs
        all_doc_ids = set(vector_result.ids) | set(keyword_result.ids)
        
        # Calculate RRF scores
        rrf_scores = {}
        for doc_id in all_doc_ids:
            vector_rank = vector_ranks.get(doc_id, float('inf'))
            keyword_rank = keyword_ranks.get(doc_id, float('inf'))
            
            rrf_score = (
                config.vector_weight / (config.rrf_k + vector_rank) +
                config.keyword_weight / (config.rrf_k + keyword_rank)
            )
            rrf_scores[doc_id] = rrf_score
        
        # Sort by RRF score
        sorted_doc_ids = sorted(all_doc_ids, key=lambda x: rrf_scores[x], reverse=True)
        
        # Build result
        return self._build_fused_result(
            sorted_doc_ids,
            vector_result,
            keyword_result,
            rrf_scores
        )
    
    def _weighted_fusion(
        self,
        vector_result: RetrievalResult,
        keyword_result: RetrievalResult,
        config: RetrievalConfig
    ) -> RetrievalResult:
        """Weighted score fusion"""
        # Create score maps
        vector_scores = {doc_id: score for doc_id, score in zip(vector_result.ids, vector_result.scores)}
        keyword_scores = {doc_id: score for doc_id, score in zip(keyword_result.ids, keyword_result.scores)}
        
        # Get all unique document IDs
        all_doc_ids = set(vector_result.ids) | set(keyword_result.ids)
        
        # Calculate weighted scores
        weighted_scores = {}
        for doc_id in all_doc_ids:
            vector_score = vector_scores.get(doc_id, 0.0)
            keyword_score = keyword_scores.get(doc_id, 0.0)
            
            weighted_score = (
                config.vector_weight * vector_score +
                config.keyword_weight * keyword_score
            )
            weighted_scores[doc_id] = weighted_score
        
        # Sort by weighted score
        sorted_doc_ids = sorted(all_doc_ids, key=lambda x: weighted_scores[x], reverse=True)
        
        # Build result
        return self._build_fused_result(
            sorted_doc_ids,
            vector_result,
            keyword_result,
            weighted_scores
        )
    
    def _mean_fusion(
        self,
        vector_result: RetrievalResult,
        keyword_result: RetrievalResult,
        config: RetrievalConfig
    ) -> RetrievalResult:
        """Mean score fusion"""
        # Create score maps
        vector_scores = {doc_id: score for doc_id, score in zip(vector_result.ids, vector_result.scores)}
        keyword_scores = {doc_id: score for doc_id, score in zip(keyword_result.ids, keyword_result.scores)}
        
        # Get all unique document IDs
        all_doc_ids = set(vector_result.ids) | set(keyword_result.ids)
        
        # Calculate mean scores
        mean_scores = {}
        for doc_id in all_doc_ids:
            vector_score = vector_scores.get(doc_id, 0.0)
            keyword_score = keyword_scores.get(doc_id, 0.0)
            
            mean_score = (vector_score + keyword_score) / 2.0
            mean_scores[doc_id] = mean_score
        
        # Sort by mean score
        sorted_doc_ids = sorted(all_doc_ids, key=lambda x: mean_scores[x], reverse=True)
        
        # Build result
        return self._build_fused_result(
            sorted_doc_ids,
            vector_result,
            keyword_result,
            mean_scores
        )
    
    def _build_fused_result(
        self,
        sorted_doc_ids: List[str],
        vector_result: RetrievalResult,
        keyword_result: RetrievalResult,
        scores: Dict[str, float]
    ) -> RetrievalResult:
        """Build fused result from sorted document IDs"""
        # Create document maps
        vector_docs = {doc_id: (doc, meta, score) for doc_id, doc, meta, score in
                      zip(vector_result.ids, vector_result.documents, vector_result.metadata, vector_result.scores)}
        keyword_docs = {doc_id: (doc, meta, score) for doc_id, doc, meta, score in
                       zip(keyword_result.ids, keyword_result.documents, keyword_result.metadata, keyword_result.scores)}
        
        # Build result lists
        ids = []
        documents = []
        metadata = []
        fused_scores = []
        distances = []
        vector_scores_list = []
        keyword_scores_list = []
        
        for doc_id in sorted_doc_ids:
            ids.append(doc_id)
            
            # Prefer vector result, fallback to keyword
            if doc_id in vector_docs:
                doc, meta, vec_score = vector_docs[doc_id]
                documents.append(doc)
                metadata.append(meta)
                vector_scores_list.append(vec_score)
            else:
                doc, meta, _ = keyword_docs[doc_id]
                documents.append(doc)
                metadata.append(meta)
                vector_scores_list.append(0.0)
            
            if doc_id in keyword_docs:
                _, _, kw_score = keyword_docs[doc_id]
                keyword_scores_list.append(kw_score)
            else:
                keyword_scores_list.append(0.0)
            
            fused_scores.append(scores[doc_id])
            distances.append(1.0 - scores[doc_id])
        
        return RetrievalResult(
            ids=ids,
            documents=documents,
            metadata=metadata,
            scores=fused_scores,
            distances=distances,
            search_type=SearchType.HYBRID,
            vector_scores=vector_scores_list,
            keyword_scores=keyword_scores_list
        )
    
    async def _get_documents_by_ids(
        self,
        doc_ids: List[str],
        collection_name: str,
        tenant_id: Optional[str]
    ) -> List[Tuple[str, str, Dict[str, Any]]]:
        """Get documents by IDs from vector store"""
        results = []
        for doc_id in doc_ids:
            doc = await self.vector_store.get_document(
                document_id=doc_id,
                collection_name=collection_name,
                tenant_id=tenant_id
            )
            if doc:
                results.append((doc.id, doc.document, doc.metadata))
        return results
    
    def _filter_documents_by_metadata(
        self,
        documents: List[Tuple[str, str, Dict[str, Any]]],
        metadata_filter: Dict[str, Any]
    ) -> List[Tuple[str, str, Dict[str, Any]]]:
        """Filter documents by metadata"""
        filtered = []
        for doc_id, doc_text, doc_metadata in documents:
            if self._matches_metadata_filter(doc_metadata, metadata_filter):
                filtered.append((doc_id, doc_text, doc_metadata))
        return filtered
    
    def _matches_metadata_filter(
        self,
        metadata: Dict[str, Any],
        filter_dict: Dict[str, Any]
    ) -> bool:
        """Check if metadata matches filter"""
        for key, value in filter_dict.items():
            if key not in metadata:
                return False
            if metadata[key] != value:
                return False
        return True
    
    def _build_metadata_filter(
        self,
        config: RetrievalConfig,
        tenant_id: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Build metadata filter from config"""
        filter_dict = {}
        
        # Add tenant filter if provided
        if tenant_id:
            filter_dict["tenant_id"] = tenant_id
        
        # Add metadata filter from config
        if config.metadata_filter:
            filter_dict.update(config.metadata_filter)
        
        # Add time filter
        if config.time_filter:
            time_field = config.time_filter.get("field", "timestamp")
            start_time = config.time_filter.get("start")
            end_time = config.time_filter.get("end")
            
            # Note: Time filtering may need provider-specific implementation
            # For now, we'll add it to metadata filter
            if start_time or end_time:
                filter_dict[time_field] = {
                    "$gte": start_time.isoformat() if start_time else None,
                    "$lte": end_time.isoformat() if end_time else None
                }
        
        return filter_dict if filter_dict else None
    
    def _deduplicate_results(
        self,
        result: RetrievalResult,
        threshold: float
    ) -> RetrievalResult:
        """Remove duplicate results based on similarity threshold"""
        if not result.documents:
            return result
        
        # Simple deduplication based on document text similarity
        # For production, consider using embeddings for better deduplication
        seen_texts = set()
        unique_indices = []
        
        for i, doc_text in enumerate(result.documents):
            # Normalize text for comparison
            normalized = doc_text.lower().strip()
            
            # Check if similar text already seen
            is_duplicate = False
            for seen_text in seen_texts:
                # Simple similarity check (can be enhanced with proper similarity metrics)
                similarity = self._text_similarity(normalized, seen_text)
                if similarity >= threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_texts.add(normalized)
                unique_indices.append(i)
        
        # Build deduplicated result
        return RetrievalResult(
            ids=[result.ids[i] for i in unique_indices],
            documents=[result.documents[i] for i in unique_indices],
            metadata=[result.metadata[i] for i in unique_indices],
            scores=[result.scores[i] for i in unique_indices],
            distances=[result.distances[i] for i in unique_indices],
            rerank_scores=[result.rerank_scores[i] for i in unique_indices] if result.rerank_scores else None,
            search_type=result.search_type,
            vector_scores=[result.vector_scores[i] for i in unique_indices] if result.vector_scores else None,
            keyword_scores=[result.keyword_scores[i] for i in unique_indices] if result.keyword_scores else None
        )
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity (0-1)"""
        if not text1 or not text2:
            return 0.0
        
        # Simple word overlap similarity
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union) if union else 0.0
    
    def _filter_by_threshold(
        self,
        result: RetrievalResult,
        threshold: float
    ) -> RetrievalResult:
        """Filter results by score threshold"""
        if not result.scores:
            return result
        
        filtered_indices = [
            i for i, score in enumerate(result.scores)
            if score >= threshold
        ]
        
        return RetrievalResult(
            ids=[result.ids[i] for i in filtered_indices],
            documents=[result.documents[i] for i in filtered_indices],
            metadata=[result.metadata[i] for i in filtered_indices],
            scores=[result.scores[i] for i in filtered_indices],
            distances=[result.distances[i] for i in filtered_indices],
            rerank_scores=[result.rerank_scores[i] for i in filtered_indices] if result.rerank_scores else None,
            search_type=result.search_type,
            vector_scores=[result.vector_scores[i] for i in filtered_indices] if result.vector_scores else None,
            keyword_scores=[result.keyword_scores[i] for i in filtered_indices] if result.keyword_scores else None
        )
    
    async def build_keyword_index(
        self,
        collection_name: str,
        tenant_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None
    ):
        """
        Build keyword search index for a collection
        
        Args:
            collection_name: Collection name
            tenant_id: Optional tenant ID
            document_ids: Optional list of document IDs to index (if None, indexes all)
        """
        logger.info(
            "building_keyword_index",
            collection=collection_name,
            tenant_id=tenant_id
        )
        
        # Get documents from vector store
        # For now, we'll build from a sample of documents
        # In production, you might want to maintain the index incrementally
        documents_to_index = []
        
        if document_ids:
            # Index specific documents
            for doc_id in document_ids:
                doc = await self.vector_store.get_document(
                    document_id=doc_id,
                    collection_name=collection_name,
                    tenant_id=tenant_id
                )
                if doc:
                    documents_to_index.append((doc.id, doc.document))
        else:
            # Build index from vector search with large top_k
            # This is a workaround - ideally we'd have a method to get all documents
            dummy_embedding = [0.0] * self.vector_store.get_embedding_dimension()
            vector_result = await self.vector_store.search(
                query_embedding=dummy_embedding,
                collection_name=collection_name,
                top_k=1000,  # Get up to 1000 documents
                tenant_id=tenant_id
            )
            
            for doc_id, doc_text in zip(vector_result.ids, vector_result.documents):
                documents_to_index.append((doc_id, doc_text))
        
        # Build keyword index
        if documents_to_index:
            self.keyword_search.build_index(
                collection_name=collection_name,
                documents=documents_to_index,
                tenant_id=tenant_id
            )
            
            logger.info(
                "keyword_index_built",
                collection=collection_name,
                num_documents=len(documents_to_index)
            )

