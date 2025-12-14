"""
Keyword search using BM25 algorithm
"""

import math
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter, defaultdict
import structlog

from .base import RetrievalConfig

logger = structlog.get_logger(__name__)


class BM25Index:
    """BM25 index for keyword search"""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        """
        Initialize BM25 index
        
        Args:
            k1: BM25 k1 parameter (term frequency saturation)
            b: BM25 b parameter (length normalization)
        """
        self.k1 = k1
        self.b = b
        
        # Document frequency (df) - number of documents containing term
        self.doc_freq: Dict[str, int] = defaultdict(int)
        
        # Term frequency (tf) per document
        self.term_freq: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        # Document lengths
        self.doc_lengths: Dict[str, int] = {}
        
        # Document IDs
        self.doc_ids: List[str] = []
        
        # Average document length
        self.avg_doc_length: float = 0.0
        
        # Total number of documents
        self.num_docs: int = 0
    
    def add_document(self, doc_id: str, text: str):
        """
        Add document to index
        
        Args:
            doc_id: Document ID
            text: Document text
        """
        # Tokenize text (simple word splitting, can be enhanced)
        tokens = self._tokenize(text)
        
        # Count term frequencies
        term_counts = Counter(tokens)
        
        # Update document length
        doc_length = len(tokens)
        self.doc_lengths[doc_id] = doc_length
        
        # Update term frequencies and document frequencies
        for term, count in term_counts.items():
            self.term_freq[term][doc_id] = count
            if doc_id not in self.doc_ids:
                self.doc_freq[term] += 1
        
        # Track document
        if doc_id not in self.doc_ids:
            self.doc_ids.append(doc_id)
            self.num_docs += 1
        
        # Update average document length
        if self.num_docs > 0:
            total_length = sum(self.doc_lengths.values())
            self.avg_doc_length = total_length / self.num_docs
    
    def add_documents(self, documents: List[Tuple[str, str]]):
        """
        Add multiple documents to index
        
        Args:
            documents: List of (doc_id, text) tuples
        """
        for doc_id, text in documents:
            self.add_document(doc_id, text)
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Search documents using BM25
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of (doc_id, score) tuples sorted by score (descending)
        """
        if self.num_docs == 0:
            return []
        
        # Tokenize query
        query_terms = self._tokenize(query)
        query_term_counts = Counter(query_terms)
        
        # Calculate BM25 scores
        scores: Dict[str, float] = defaultdict(float)
        
        for term, query_tf in query_term_counts.items():
            if term not in self.term_freq:
                continue
            
            # Inverse document frequency (IDF)
            df = self.doc_freq[term]
            if df == 0:
                continue
            
            idf = math.log((self.num_docs - df + 0.5) / (df + 0.5) + 1.0)
            
            # Calculate BM25 score for each document containing this term
            for doc_id, term_tf in self.term_freq[term].items():
                doc_length = self.doc_lengths[doc_id]
                
                # BM25 formula
                numerator = idf * term_tf * (self.k1 + 1)
                denominator = term_tf + self.k1 * (1 - self.b + self.b * (doc_length / self.avg_doc_length))
                
                score = numerator / denominator
                scores[doc_id] += score
        
        # Sort by score (descending)
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        # Return top_k results
        return sorted_results[:top_k]
    
    def _tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into terms
        
        Args:
            text: Input text
            
        Returns:
            List of tokens
        """
        if not text:
            return []
        
        # Simple tokenization (lowercase, split on whitespace)
        # Can be enhanced with stemming, lemmatization, etc.
        import re
        text = text.lower()
        tokens = re.findall(r'\b\w+\b', text)
        return tokens
    
    def clear(self):
        """Clear the index"""
        self.doc_freq.clear()
        self.term_freq.clear()
        self.doc_lengths.clear()
        self.doc_ids.clear()
        self.avg_doc_length = 0.0
        self.num_docs = 0


class KeywordSearchService:
    """Keyword search service using BM25"""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        """
        Initialize keyword search service
        
        Args:
            k1: BM25 k1 parameter
            b: BM25 b parameter
        """
        self.k1 = k1
        self.b = b
        self.indexes: Dict[str, BM25Index] = {}  # Per-collection indexes
    
    def build_index(
        self,
        collection_name: str,
        documents: List[Tuple[str, str]],
        tenant_id: Optional[str] = None
    ):
        """
        Build BM25 index for a collection
        
        Args:
            collection_name: Collection name
            documents: List of (doc_id, text) tuples
            tenant_id: Optional tenant ID
        """
        index_key = self._get_index_key(collection_name, tenant_id)
        
        # Create or get index
        if index_key not in self.indexes:
            self.indexes[index_key] = BM25Index(k1=self.k1, b=self.b)
        
        # Add documents
        self.indexes[index_key].add_documents(documents)
        
        logger.info(
            "bm25_index_built",
            collection=collection_name,
            tenant_id=tenant_id,
            num_docs=len(documents)
        )
    
    def search(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        tenant_id: Optional[str] = None
    ) -> List[Tuple[str, float]]:
        """
        Search using BM25
        
        Args:
            query: Search query
            collection_name: Collection name
            top_k: Number of results
            tenant_id: Optional tenant ID
            
        Returns:
            List of (doc_id, score) tuples
        """
        index_key = self._get_index_key(collection_name, tenant_id)
        
        if index_key not in self.indexes:
            logger.warning(
                "bm25_index_not_found",
                collection=collection_name,
                tenant_id=tenant_id
            )
            return []
        
        results = self.indexes[index_key].search(query, top_k=top_k)
        
        logger.debug(
            "bm25_search_completed",
            collection=collection_name,
            query=query,
            results_count=len(results)
        )
        
        return results
    
    def _get_index_key(self, collection_name: str, tenant_id: Optional[str] = None) -> str:
        """Get index key for collection and tenant"""
        if tenant_id:
            return f"{tenant_id}_{collection_name}"
        return collection_name
    
    def clear_index(self, collection_name: str, tenant_id: Optional[str] = None):
        """Clear index for a collection"""
        index_key = self._get_index_key(collection_name, tenant_id)
        if index_key in self.indexes:
            self.indexes[index_key].clear()
            del self.indexes[index_key]

