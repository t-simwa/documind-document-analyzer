"""
Query preprocessing and expansion utilities
"""

import re
from typing import List, Set, Optional
import structlog

logger = structlog.get_logger(__name__)


class QueryOptimizer:
    """Query preprocessing and expansion"""
    
    # Common stop words (can be extended)
    STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
        "to", "was", "will", "with", "the", "this", "but", "they", "have",
        "had", "what", "said", "each", "which", "their", "time", "if",
        "up", "out", "many", "then", "them", "these", "so", "some", "her",
        "would", "make", "like", "into", "him", "has", "two", "more",
        "very", "after", "words", "long", "than", "first", "been", "call",
        "who", "oil", "sit", "now", "find", "down", "day", "did", "get",
        "come", "made", "may", "part"
    }
    
    @staticmethod
    def preprocess_query(query: str, lowercase: bool = True, remove_stopwords: bool = False) -> str:
        """
        Preprocess query text
        
        Args:
            query: Original query string
            lowercase: Convert to lowercase
            remove_stopwords: Remove stop words
            
        Returns:
            Preprocessed query string
        """
        if not query:
            return ""
        
        # Convert to lowercase
        if lowercase:
            query = query.lower()
        
        # Remove special characters but keep spaces and alphanumeric
        query = re.sub(r'[^\w\s]', ' ', query)
        
        # Remove extra whitespace
        query = re.sub(r'\s+', ' ', query).strip()
        
        # Remove stop words if requested
        if remove_stopwords:
            words = query.split()
            words = [w for w in words if w not in QueryOptimizer.STOP_WORDS]
            query = ' '.join(words)
        
        return query
    
    @staticmethod
    def expand_query(query: str, method: str = "synonym") -> str:
        """
        Expand query with synonyms or related terms
        
        Args:
            query: Original query
            method: Expansion method (currently supports basic synonym expansion)
            
        Returns:
            Expanded query string
        """
        if not query:
            return query
        
        # Basic synonym expansion (can be enhanced with WordNet, embeddings, etc.)
        # For now, we'll do simple word variations
        expanded_terms = []
        words = query.lower().split()
        
        # Simple synonym mapping (can be extended or loaded from external source)
        synonyms = {
            "document": ["file", "paper", "record"],
            "search": ["find", "look", "seek"],
            "analyze": ["examine", "review", "study"],
            "information": ["data", "details", "facts"],
            "contract": ["agreement", "deal", "pact"],
            "report": ["summary", "analysis", "review"],
        }
        
        for word in words:
            expanded_terms.append(word)
            if word in synonyms:
                expanded_terms.extend(synonyms[word][:2])  # Add up to 2 synonyms
        
        # Remove duplicates while preserving order
        seen = set()
        unique_terms = []
        for term in expanded_terms:
            if term not in seen:
                seen.add(term)
                unique_terms.append(term)
        
        expanded_query = ' '.join(unique_terms)
        
        logger.debug(
            "query_expanded",
            original=query,
            expanded=expanded_query,
            method=method
        )
        
        return expanded_query
    
    @staticmethod
    def extract_keywords(query: str, max_keywords: int = 10) -> List[str]:
        """
        Extract keywords from query
        
        Args:
            query: Query string
            max_keywords: Maximum number of keywords to extract
            
        Returns:
            List of keywords
        """
        if not query:
            return []
        
        # Preprocess
        processed = QueryOptimizer.preprocess_query(query, lowercase=True, remove_stopwords=True)
        
        # Split into words
        words = processed.split()
        
        # Remove duplicates while preserving order
        seen = set()
        keywords = []
        for word in words:
            if word not in seen and len(word) > 2:  # Filter very short words
                seen.add(word)
                keywords.append(word)
                if len(keywords) >= max_keywords:
                    break
        
        return keywords
    
    @staticmethod
    def normalize_query(query: str) -> str:
        """
        Normalize query for consistent processing
        
        Args:
            query: Query string
            
        Returns:
            Normalized query string
        """
        if not query:
            return ""
        
        # Basic normalization
        query = query.strip()
        query = re.sub(r'\s+', ' ', query)  # Normalize whitespace
        
        return query

