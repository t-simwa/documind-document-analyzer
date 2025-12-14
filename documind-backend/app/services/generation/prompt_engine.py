"""
Prompt engineering system for document Q&A
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class ContextChunk:
    """Represents a retrieved context chunk"""
    content: str
    document_id: str
    chunk_id: str
    metadata: Dict[str, Any]
    score: float = 0.0
    
    def to_citation(self, index: int) -> Dict[str, Any]:
        """Convert to citation format"""
        return {
            "index": index,
            "document_id": self.document_id,
            "chunk_id": self.chunk_id,
            "page": self.metadata.get("page", None),
            "score": self.score,
            "metadata": self.metadata
        }


class PromptEngine:
    """Prompt engineering system for generating LLM prompts"""
    
    # System prompt template
    SYSTEM_PROMPT_TEMPLATE = """You are an expert document analysis assistant. Your role is to answer questions based ONLY on the provided context from documents.

CRITICAL INSTRUCTIONS:
1. Answer questions using ONLY the information provided in the context below
2. If the context does not contain enough information to answer the question, explicitly state "I cannot answer this question based on the provided documents"
3. Do NOT use any external knowledge or make assumptions beyond what is in the context
4. Always cite your sources using [Citation: X] format where X is the citation number
5. If multiple sources support your answer, cite all relevant sources
6. Be precise, accurate, and concise in your responses
7. If asked about information not in the context, politely decline and suggest what information might be needed

OUTPUT FORMAT:
- Use clear, well-structured responses
- Use markdown formatting for better readability (headings, lists, code blocks when appropriate)
- Include citations inline: [Citation: 1], [Citation: 2], etc.
- If listing multiple points, use bullet points or numbered lists
- For code or technical terms, use appropriate formatting

GROUNDING RULES:
- Base every claim on the provided context
- Quote directly from context when making specific claims
- Distinguish between what is stated in the documents vs. what you infer
- If uncertain, express the uncertainty clearly"""
    
    # User query template with context injection
    USER_QUERY_TEMPLATE = """Context from documents:

{context}

---

Question: {query}

Please answer the question based on the context provided above. Remember to cite your sources using [Citation: X] format."""
    
    # Few-shot examples (optional, can be enabled/disabled)
    FEW_SHOT_EXAMPLES = [
        {
            "query": "What is the main topic of this document?",
            "context": "[Context chunk 1]",
            "answer": "Based on the provided context, the main topic is [topic]. [Citation: 1]"
        },
        {
            "query": "What are the key findings?",
            "context": "[Context chunk 1] [Context chunk 2]",
            "answer": "The key findings are:\n1. [Finding 1] [Citation: 1]\n2. [Finding 2] [Citation: 2]"
        }
    ]
    
    def __init__(
        self,
        include_few_shot: bool = False,
        max_context_length: int = 8000,
        citation_format: str = "[Citation: {index}]"
    ):
        """
        Initialize prompt engine
        
        Args:
            include_few_shot: Whether to include few-shot examples
            max_context_length: Maximum characters for context (approximate)
            citation_format: Format string for citations
        """
        self.include_few_shot = include_few_shot
        self.max_context_length = max_context_length
        self.citation_format = citation_format
    
    def build_system_prompt(
        self,
        custom_instructions: Optional[str] = None,
        output_format: Optional[str] = None
    ) -> str:
        """
        Build system prompt
        
        Args:
            custom_instructions: Additional custom instructions
            output_format: Specific output format requirements
            
        Returns:
            System prompt string
        """
        prompt = self.SYSTEM_PROMPT_TEMPLATE
        
        if output_format:
            prompt += f"\n\nSPECIFIC OUTPUT FORMAT:\n{output_format}"
        
        if custom_instructions:
            prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{custom_instructions}"
        
        return prompt
    
    def build_context_string(
        self,
        chunks: List[ContextChunk],
        include_metadata: bool = True
    ) -> str:
        """
        Build context string from retrieved chunks
        
        Args:
            chunks: List of context chunks
            include_metadata: Whether to include metadata in context
            
        Returns:
            Formatted context string
        """
        context_parts = []
        current_length = 0
        
        for idx, chunk in enumerate(chunks, start=1):
            # Build chunk text
            chunk_text = f"[Citation: {idx}]\n"
            
            if include_metadata and chunk.metadata:
                # Add metadata if available
                doc_name = chunk.metadata.get("document_name", "Document")
                page = chunk.metadata.get("page")
                if page is not None:
                    chunk_text += f"Source: {doc_name}, Page {page}\n"
                else:
                    chunk_text += f"Source: {doc_name}\n"
            
            chunk_text += f"{chunk.content}\n\n"
            
            # Check if adding this chunk would exceed max length
            if current_length + len(chunk_text) > self.max_context_length:
                logger.warning(
                    "Context length limit reached",
                    chunks_included=len(context_parts),
                    total_chunks=len(chunks)
                )
                break
            
            context_parts.append(chunk_text)
            current_length += len(chunk_text)
        
        return "".join(context_parts).strip()
    
    def build_user_prompt(
        self,
        query: str,
        chunks: List[ContextChunk],
        include_metadata: bool = True
    ) -> str:
        """
        Build user prompt with context injection
        
        Args:
            query: User query/question
            chunks: Retrieved context chunks
            include_metadata: Whether to include metadata in context
            
        Returns:
            Formatted user prompt
        """
        context = self.build_context_string(chunks, include_metadata)
        
        prompt = self.USER_QUERY_TEMPLATE.format(
            context=context,
            query=query
        )
        
        if self.include_few_shot:
            # Add few-shot examples (simplified for now)
            examples_text = "\n\n---\n\nExamples:\n"
            for example in self.FEW_SHOT_EXAMPLES[:2]:  # Limit to 2 examples
                examples_text += f"\nQ: {example['query']}\nA: {example['answer']}\n"
            prompt = examples_text + "\n---\n\n" + prompt
        
        return prompt
    
    def build_chat_messages(
        self,
        query: str,
        chunks: List[ContextChunk],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        custom_instructions: Optional[str] = None,
        output_format: Optional[str] = None,
        include_metadata: bool = True
    ) -> List[Dict[str, str]]:
        """
        Build chat messages for LLM
        
        Args:
            query: User query/question
            chunks: Retrieved context chunks
            conversation_history: Previous conversation messages
            custom_instructions: Additional custom instructions
            output_format: Specific output format requirements
            include_metadata: Whether to include metadata in context
            
        Returns:
            List of message dicts with 'role' and 'content' keys
        """
        messages = []
        
        # System prompt
        system_prompt = self.build_system_prompt(custom_instructions, output_format)
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                # Ensure messages have correct format
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    messages.append(msg)
        
        # Build user prompt with context
        user_prompt = self.build_user_prompt(query, chunks, include_metadata)
        messages.append({"role": "user", "content": user_prompt})
        
        return messages
    
    def extract_citations_from_response(
        self,
        response: str
    ) -> List[int]:
        """
        Extract citation indices from response text
        
        Args:
            response: LLM response text
            
        Returns:
            List of citation indices found in response
        """
        import re
        # Match [Citation: X] or [Citation:X] patterns
        pattern = r'\[Citation:\s*(\d+)\]'
        matches = re.findall(pattern, response, re.IGNORECASE)
        return [int(m) for m in matches]
    
    def format_response_with_citations(
        self,
        response: str,
        chunks: List[ContextChunk]
    ) -> Dict[str, Any]:
        """
        Format response with citation details
        
        Args:
            response: LLM response text
            chunks: Context chunks used for generation
            
        Returns:
            Dict with formatted response and citation details
        """
        citation_indices = self.extract_citations_from_response(response)
        citations = []
        
        for idx in citation_indices:
            if 1 <= idx <= len(chunks):
                chunk = chunks[idx - 1]  # Convert to 0-based index
                citations.append(chunk.to_citation(idx))
        
        return {
            "response": response,
            "citations": citations,
            "citation_count": len(citations)
        }

