"""
Base classes and data structures for retrieval service
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class SearchType(str, Enum):
    """Type of search to perform"""
    VECTOR = "vector"
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class FusionMethod(str, Enum):
    """Result fusion method for hybrid search"""
    RRF = "rrf"  # Reciprocal Rank Fusion
    WEIGHTED = "weighted"  # Weighted combination
    MEAN = "mean"  # Mean of scores


class RerankProvider(str, Enum):
    """Re-ranking provider"""
    COHERE = "cohere"
    CROSS_ENCODER = "cross_encoder"
    NONE = "none"


@dataclass
class RetrievalResult:
    """Result of retrieval operation"""
    ids: List[str]
    documents: List[str]
    metadata: List[Dict[str, Any]]
    scores: List[float]  # Normalized scores (0-1, higher is better)
    distances: List[float]  # Distance scores (lower is better)
    rerank_scores: Optional[List[float]] = None  # Re-ranking scores if applied
    search_type: SearchType = SearchType.HYBRID
    vector_scores: Optional[List[float]] = None  # Original vector scores
    keyword_scores: Optional[List[float]] = None  # Original keyword scores
    
    def __post_init__(self):
        """Validate and normalize results"""
        lengths = [
            len(self.ids),
            len(self.documents),
            len(self.metadata),
            len(self.scores),
            len(self.distances)
        ]
        if len(set(lengths)) > 1:
            raise ValueError("All result lists must have the same length")
        
        # Ensure scores are normalized (0-1)
        if self.scores:
            max_score = max(self.scores) if self.scores else 1.0
            min_score = min(self.scores) if self.scores else 0.0
            if max_score > min_score:
                self.scores = [
                    (s - min_score) / (max_score - min_score)
                    for s in self.scores
                ]


@dataclass
class RetrievalConfig:
    """Configuration for retrieval operations"""
    # Search configuration
    search_type: SearchType = SearchType.HYBRID
    top_k: int = 10
    vector_weight: float = 0.7  # Weight for vector search in hybrid (0-1)
    keyword_weight: float = 0.3  # Weight for keyword search in hybrid (0-1)
    fusion_method: FusionMethod = FusionMethod.RRF
    
    # Re-ranking configuration
    rerank_enabled: bool = False
    rerank_provider: RerankProvider = RerankProvider.COHERE
    rerank_top_n: int = 20  # Re-rank top N results
    rerank_threshold: float = 0.0  # Minimum score threshold for re-ranking
    
    # Query optimization
    query_expansion_enabled: bool = False
    query_preprocessing_enabled: bool = True
    
    # Filtering
    metadata_filter: Optional[Dict[str, Any]] = None
    time_filter: Optional[Dict[str, Any]] = None  # {"field": "timestamp", "start": datetime, "end": datetime}
    
    # Deduplication
    deduplication_enabled: bool = True
    deduplication_threshold: float = 0.95  # Similarity threshold for deduplication
    
    # BM25 configuration
    bm25_k1: float = 1.5  # BM25 k1 parameter
    bm25_b: float = 0.75  # BM25 b parameter
    
    # RRF configuration
    rrf_k: int = 60  # RRF constant (typically 60)
    
    def __post_init__(self):
        """Validate configuration"""
        if self.vector_weight + self.keyword_weight != 1.0:
            # Normalize weights
            total = self.vector_weight + self.keyword_weight
            if total > 0:
                self.vector_weight = self.vector_weight / total
                self.keyword_weight = self.keyword_weight / total

