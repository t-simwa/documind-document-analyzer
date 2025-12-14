"""
Re-ranking services for retrieval results
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
import structlog

from .base import RerankProvider, RetrievalResult
from .exceptions import RetrievalError, RetrievalProviderError
from app.core.config import settings

logger = structlog.get_logger(__name__)


class CohereReranker:
    """Cohere Rerank integration"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "rerank-english-v3.0"):
        """
        Initialize Cohere reranker
        
        Args:
            api_key: Cohere API key (if None, uses settings)
            model: Rerank model name
        """
        self.api_key = api_key or settings.COHERE_API_KEY
        self.model = model
        
        if not self.api_key:
            raise RetrievalConfigurationError(
                "Cohere API key is required for reranking",
                provider="cohere"
            )
        
        try:
            import cohere
            self.client = cohere.Client(api_key=self.api_key)
        except ImportError:
            raise RetrievalConfigurationError(
                "cohere package is required. Install with: pip install cohere",
                provider="cohere"
            )
    
    async def rerank(
        self,
        query: str,
        documents: List[str],
        top_n: Optional[int] = None
    ) -> List[Tuple[int, float]]:
        """
        Rerank documents using Cohere
        
        Args:
            query: Search query
            documents: List of document texts to rerank
            top_n: Number of top results to return (None = all)
            
        Returns:
            List of (index, score) tuples sorted by score (descending)
        """
        if not documents:
            return []
        
        try:
            # Cohere rerank API call
            response = self.client.rerank(
                model=self.model,
                query=query,
                documents=documents,
                top_n=top_n or len(documents)
            )
            
            # Extract results
            results = []
            for result in response.results:
                results.append((result.index, result.relevance_score))
            
            logger.debug(
                "cohere_rerank_completed",
                query=query,
                num_documents=len(documents),
                num_results=len(results)
            )
            
            return results
            
        except Exception as e:
            raise RetrievalProviderError(
                f"Cohere rerank failed: {str(e)}",
                provider="cohere"
            ) from e


class CrossEncoderReranker:
    """Cross-encoder reranking using sentence-transformers"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialize cross-encoder reranker
        
        Args:
            model_name: Cross-encoder model name
        """
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load cross-encoder model"""
        try:
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(self.model_name)
            logger.info(
                "cross_encoder_loaded",
                model=self.model_name
            )
        except ImportError:
            raise RetrievalConfigurationError(
                "sentence-transformers package is required. Install with: pip install sentence-transformers",
                provider="cross_encoder"
            )
        except Exception as e:
            raise RetrievalProviderError(
                f"Failed to load cross-encoder model: {str(e)}",
                provider="cross_encoder"
            ) from e
    
    async def rerank(
        self,
        query: str,
        documents: List[str],
        top_n: Optional[int] = None
    ) -> List[Tuple[int, float]]:
        """
        Rerank documents using cross-encoder
        
        Args:
            query: Search query
            documents: List of document texts to rerank
            top_n: Number of top results to return (None = all)
            
        Returns:
            List of (index, score) tuples sorted by score (descending)
        """
        if not documents or not self.model:
            return []
        
        try:
            # Prepare pairs for cross-encoder
            pairs = [[query, doc] for doc in documents]
            
            # Get scores (run in thread pool to avoid blocking)
            loop = asyncio.get_event_loop()
            scores = await loop.run_in_executor(
                None,
                self.model.predict,
                pairs
            )
            
            # Convert to list if numpy array
            if hasattr(scores, 'tolist'):
                scores = scores.tolist()
            
            # Create (index, score) pairs
            results = [(i, float(score)) for i, score in enumerate(scores)]
            
            # Sort by score (descending)
            results.sort(key=lambda x: x[1], reverse=True)
            
            # Return top_n if specified
            if top_n:
                results = results[:top_n]
            
            logger.debug(
                "cross_encoder_rerank_completed",
                query=query,
                num_documents=len(documents),
                num_results=len(results)
            )
            
            return results
            
        except Exception as e:
            raise RetrievalProviderError(
                f"Cross-encoder rerank failed: {str(e)}",
                provider="cross_encoder"
            ) from e


class RerankingService:
    """Re-ranking service with provider abstraction"""
    
    def __init__(self, provider: RerankProvider = RerankProvider.COHERE):
        """
        Initialize reranking service
        
        Args:
            provider: Reranking provider
        """
        self.provider = provider
        self.reranker = None
        
        if provider == RerankProvider.COHERE:
            try:
                self.reranker = CohereReranker()
            except RetrievalConfigurationError:
                logger.warning("Cohere reranker not available, falling back to none")
                self.provider = RerankProvider.NONE
        elif provider == RerankProvider.CROSS_ENCODER:
            try:
                self.reranker = CrossEncoderReranker()
            except RetrievalConfigurationError:
                logger.warning("Cross-encoder reranker not available, falling back to none")
                self.provider = RerankProvider.NONE
    
    async def rerank_results(
        self,
        query: str,
        result: RetrievalResult,
        top_n: Optional[int] = None
    ) -> RetrievalResult:
        """
        Rerank retrieval results
        
        Args:
            query: Search query
            result: Original retrieval result
            top_n: Number of top results to rerank (None = rerank all)
            
        Returns:
            Reranked retrieval result
        """
        if not self.reranker or self.provider == RerankProvider.NONE:
            return result
        
        if not result.documents:
            return result
        
        # Determine how many to rerank
        rerank_count = top_n or len(result.documents)
        rerank_count = min(rerank_count, len(result.documents))
        
        # Get documents to rerank
        documents_to_rerank = result.documents[:rerank_count]
        
        # Rerank
        reranked_indices = await self.reranker.rerank(
            query=query,
            documents=documents_to_rerank,
            top_n=rerank_count
        )
        
        # Reorder results based on reranking
        rerank_scores = [0.0] * len(result.documents)
        reranked_ids = []
        reranked_documents = []
        reranked_metadata = []
        reranked_scores = []
        reranked_distances = []
        
        # Add reranked results
        rerank_score_map = {idx: score for idx, score in reranked_indices}
        for original_idx, (idx, score) in enumerate(reranked_indices):
            reranked_ids.append(result.ids[idx])
            reranked_documents.append(result.documents[idx])
            reranked_metadata.append(result.metadata[idx])
            reranked_scores.append(score)
            rerank_scores[idx] = score
            # Convert rerank score to distance (inverse)
            reranked_distances.append(1.0 - score)
        
        # Add remaining results (not reranked)
        reranked_set = {idx for idx, _ in reranked_indices}
        for i in range(rerank_count, len(result.documents)):
            if i not in reranked_set:
                reranked_ids.append(result.ids[i])
                reranked_documents.append(result.documents[i])
                reranked_metadata.append(result.metadata[i])
                reranked_scores.append(result.scores[i])
                reranked_distances.append(result.distances[i])
                rerank_scores[i] = result.scores[i]
        
        # Create reranked result
        reranked_result = RetrievalResult(
            ids=reranked_ids,
            documents=reranked_documents,
            metadata=reranked_metadata,
            scores=reranked_scores,
            distances=reranked_distances,
            rerank_scores=rerank_scores,
            search_type=result.search_type,
            vector_scores=result.vector_scores,
            keyword_scores=result.keyword_scores
        )
        
        return reranked_result

