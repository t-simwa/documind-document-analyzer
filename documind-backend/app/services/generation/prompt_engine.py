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
    
    # System prompt template with XML-style structure
    SYSTEM_PROMPT_TEMPLATE = """<role>
You are an expert document analysis assistant with exceptional attention to detail and thoroughness. Your role is to provide COMPLETE, ACCURATE, and EXHAUSTIVE answers based ONLY on the provided context from documents.
</role>

<constraints>
1. Answer questions using ONLY the information provided in the context - NEVER use external knowledge
2. ALWAYS try to provide a helpful answer, even if the information is partial or indirect
3. If the question asks about something not directly mentioned, look for related information, synonyms, or similar concepts in the context
4. If you find partial information, provide what you can find and note any limitations
5. Only say "I cannot answer" if there is absolutely NO relevant information in the context, not even tangentially related
6. Do NOT make assumptions beyond what is explicitly stated in the context, but DO make reasonable connections between related concepts
7. Always cite your sources using [Citation: X] format where X is the citation number
8. If multiple sources support your answer, cite ALL relevant sources
9. Be PRECISE, ACCURATE, and THOROUGH in your responses - completeness is more important than brevity
</constraints>

<exhaustive_answering_requirements>
- Read through ALL provided context chunks carefully before answering
- Identify ALL relevant information related to the question, not just the first or most obvious
- Look for information that might be related even if not an exact match (e.g., "technology" might appear as "IT systems", "software", "digital tools", "infrastructure", etc.)
- If the question asks for a list (e.g., "what are the...", "list all..."), provide a COMPLETE list of ALL items mentioned in the context
- If the question asks about multiple aspects, address EACH aspect thoroughly
- Include ALL relevant details, examples, dates, numbers, names, and specifics from the context
- If there are multiple perspectives or viewpoints in the context, mention ALL of them
- Do not stop at the first answer - continue searching the context for additional relevant information
- Cross-reference information across different context chunks to ensure completeness
- If you find related but not exact information, provide it and explain how it relates to the question
</exhaustive_answering_requirements>

<output_format>
- Use clear, well-structured responses with proper organization
- Use markdown formatting for better readability (headings, lists, code blocks when appropriate)
- Include citations inline: [Citation: 1], [Citation: 2], etc. for EVERY claim
- If listing multiple points, use bullet points or numbered lists
- For code or technical terms, use appropriate formatting
- Organize information logically (e.g., by topic, chronologically, by importance)
</output_format>

<grounding_rules>
- Base EVERY claim on the provided context - no exceptions
- Quote directly from context when making specific claims (use quotation marks for direct quotes)
- Distinguish between what is explicitly stated in the documents vs. what you infer
- If uncertain about any part, express the uncertainty clearly
- If information appears in multiple places, cite ALL relevant sources
</grounding_rules>

Remember: A complete, thorough answer is always better than a brief, incomplete one. Take your time to ensure accuracy and completeness."""
    
    # User query template with XML-style prefixes and optimized ordering
    USER_QUERY_TEMPLATE = """<context>
{context}
</context>

<question>
{query}
</question>

<instructions>
Based on the context provided above, answer the question following these guidelines:
1. Read through ALL context chunks carefully and systematically
2. Identify ALL information relevant to the question - look for direct matches AND related concepts
3. If the exact answer isn't found, look for related information, synonyms, or similar topics
4. Provide a COMPLETE and EXHAUSTIVE answer that addresses all aspects of the question
5. Include ALL relevant details, examples, dates, numbers, and specifics from the context
6. If the question asks for a list, provide ALL items mentioned in the context
7. If you find partial information, provide what you can and note what information is missing
8. Cite your sources using [Citation: X] format for EVERY claim you make
9. Ensure your answer is thorough and comprehensive - completeness is essential
10. Be helpful: even if the answer isn't perfect, provide what information is available
</instructions>

<answer>
"""
    
    # Few-shot examples with realistic context format (enabled by default per Google's recommendations)
    FEW_SHOT_EXAMPLES = [
        {
            "context": """[Citation: 1]
Source: technical_report.pdf, Page 5
Machine learning is a subset of artificial intelligence that enables systems to learn from data without being explicitly programmed. It uses algorithms to identify patterns and make predictions based on historical data.

[Citation: 2]
Source: technical_report.pdf, Page 7
Deep learning uses neural networks with multiple layers to process complex data. It is a type of machine learning that can handle unstructured data like images, text, and audio.""",
            "query": "What is machine learning?",
            "answer": "Machine learning is a subset of artificial intelligence that enables systems to learn from data without being explicitly programmed [Citation: 1]. It uses algorithms to identify patterns and make predictions based on historical data. Deep learning, which uses neural networks with multiple layers [Citation: 2], is a type of machine learning that can handle unstructured data like images, text, and audio."
        },
        {
            "context": """[Citation: 1]
Source: project_plan.pdf, Page 3
The project timeline spans 6 months, starting in January 2024. The first phase focuses on research and planning, which will take 2 months.

[Citation: 2]
Source: project_plan.pdf, Page 10
Budget allocation includes $50,000 for development, $20,000 for testing, and $10,000 for deployment. The total project budget is $80,000.

[Citation: 3]
Source: project_plan.pdf, Page 15
The project team consists of 5 developers, 2 QA engineers, and 1 project manager. All team members have experience in cloud technologies.""",
            "query": "What are the project details?",
            "answer": "The project has the following details:\n\n**Timeline:** The project spans 6 months, starting in January 2024, with the first phase (research and planning) taking 2 months [Citation: 1].\n\n**Budget:** The total project budget is $80,000, allocated as follows: $50,000 for development, $20,000 for testing, and $10,000 for deployment [Citation: 2].\n\n**Team:** The project team consists of 5 developers, 2 QA engineers, and 1 project manager, all with experience in cloud technologies [Citation: 3]."
        },
        {
            "context": """[Citation: 1]
Source: research_paper.pdf, Page 2
The study analyzed data from 1,000 participants across three different age groups: 18-30, 31-50, and 51-70 years old.

[Citation: 2]
Source: research_paper.pdf, Page 8
Results showed that 65% of participants in the 18-30 age group preferred online shopping, compared to 45% in the 31-50 group and 30% in the 51-70 group.

[Citation: 3]
Source: research_paper.pdf, Page 12
The research concluded that age is a significant factor in online shopping preferences, with younger participants showing higher adoption rates.""",
            "query": "What were the key findings about online shopping preferences?",
            "answer": "The key findings about online shopping preferences are:\n\n1. **Age Group Preferences:** The study found significant differences across age groups. Among participants aged 18-30, 65% preferred online shopping [Citation: 2]. This compares to 45% in the 31-50 age group and 30% in the 51-70 age group [Citation: 2].\n\n2. **Overall Conclusion:** The research concluded that age is a significant factor in online shopping preferences, with younger participants showing higher adoption rates [Citation: 3].\n\nThe study analyzed data from 1,000 participants across these three age groups [Citation: 1]."
        }
    ]
    
    def __init__(
        self,
        include_few_shot: bool = True,  # Enabled by default per Google's strong recommendation
        max_context_length: int = 8000,
        citation_format: str = "[Citation: {index}]"
    ):
        """
        Initialize prompt engine
        
        Args:
            include_few_shot: Whether to include few-shot examples (default: True, per Google's recommendations)
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
        include_metadata: bool = True,
        use_structured_outputs: bool = False
    ) -> str:
        """
        Build user prompt with context injection and few-shot examples
        
        Args:
            query: User query/question
            chunks: Retrieved context chunks
            include_metadata: Whether to include metadata in context
            use_structured_outputs: Whether structured outputs will be used
            
        Returns:
            Formatted user prompt
        """
        context = self.build_context_string(chunks, include_metadata)
        
        # Build the main prompt with context and question
        prompt_parts = []
        
        # Add few-shot examples BEFORE the actual context/question (per Google's recommendations)
        if self.include_few_shot:
            examples_text = "<examples>\n"
            # Use 2-3 examples (limit to avoid token waste)
            num_examples = min(3, len(self.FEW_SHOT_EXAMPLES))
            for i, example in enumerate(self.FEW_SHOT_EXAMPLES[:num_examples], 1):
                examples_text += f"\nExample {i}:\n"
                examples_text += f"<context>\n{example['context']}\n</context>\n\n"
                examples_text += f"<question>\n{example['query']}\n</question>\n\n"
                examples_text += f"<answer>\n{example['answer']}\n</answer>\n"
                if i < num_examples:
                    examples_text += "\n---\n"
            examples_text += "\n</examples>\n\n---\n\n"
            prompt_parts.append(examples_text)
        
        # Add actual context and question (context first, question last per Google's recommendations)
        prompt_parts.append(self.USER_QUERY_TEMPLATE.format(
            context=context,
            query=query
        ))
        
        # Add structured output reminder if enabled
        if use_structured_outputs:
            prompt_parts.append("\n\n<output_format>\nJSON:\n")
        
        return "".join(prompt_parts)
    
    def build_chat_messages(
        self,
        query: str,
        chunks: List[ContextChunk],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        custom_instructions: Optional[str] = None,
        output_format: Optional[str] = None,
        include_metadata: bool = True,
        use_structured_outputs: bool = False
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
            use_structured_outputs: Whether structured outputs will be used (for Gemini)
            
        Returns:
            List of message dicts with 'role' and 'content' keys
        """
        messages = []
        
        # System prompt
        system_prompt = self.build_system_prompt(custom_instructions, output_format)
        
        # Add structured output instructions if enabled
        if use_structured_outputs:
            structured_instructions = """<output_format>
IMPORTANT: You will receive a JSON schema that defines the expected output format. 
Your response must be valid JSON matching this schema. Include citation indices in the 'citations_used' array 
for every claim you make in your answer. Each citation index corresponds to a context chunk numbered 1, 2, 3, etc.
</output_format>"""
            system_prompt += "\n\n" + structured_instructions
        
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                # Ensure messages have correct format
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    messages.append(msg)
        
        # Build user prompt with context (includes few-shot examples and structured output formatting)
        user_prompt = self.build_user_prompt(
            query=query,
            chunks=chunks,
            include_metadata=include_metadata,
            use_structured_outputs=use_structured_outputs
        )
        
        # Structured output formatting is already handled in build_user_prompt, so no need to add it here
        
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

