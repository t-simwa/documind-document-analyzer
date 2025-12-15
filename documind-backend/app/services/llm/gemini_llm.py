"""
Google Gemini LLM service implementation using google-genai package
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog
import json

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed. Gemini LLM service will not be available.")


class GeminiLLMService(BaseLLMService):
    """Google Gemini LLM service implementation"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.5-flash",
        max_retries: int = 3,
        timeout: int = 60
    ):
        """
        Initialize Gemini LLM service using google-genai package
        
        Args:
            api_key: Google API key
            model: Model name (e.g., "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash")
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        if not GEMINI_AVAILABLE:
            raise LLMConfigurationError("google-genai package is not installed")
        
        super().__init__(api_key, model, max_retries, timeout)
        if not api_key:
            raise LLMConfigurationError("Gemini API key is required")
        
        self.client = genai.Client(api_key=api_key)
    
    def _is_retryable_error(self, error: Exception) -> bool:
        """Check if an error is retryable (transient errors)"""
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        # Check for 503, 429, 500, 502, 504 (server errors)
        if any(code in error_str for code in ["503", "429", "500", "502", "504"]):
            return True
        
        # Check for "unavailable", "overloaded", "service unavailable"
        if any(term in error_str for term in ["unavailable", "overloaded", "service unavailable", "try again"]):
            return True
        
        # Check for specific error types from google-genai
        if "ServerError" in error_type or "InternalServerError" in error_type:
            return True
        
        return False
    
    async def _retry_with_backoff(
        self,
        func,
        *args,
        max_retries: Optional[int] = None,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        **kwargs
    ):
        """Retry a function with exponential backoff for retryable errors"""
        if max_retries is None:
            max_retries = self.max_retries
        
        delay = initial_delay
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e
                
                # Don't retry if it's not a retryable error
                if not self._is_retryable_error(e):
                    raise
                
                # Don't retry on the last attempt
                if attempt == max_retries:
                    break
                
                # Log retry attempt
                logger.warning(
                    "Retrying Gemini API call after error",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    delay=delay,
                    error=str(e)[:200]
                )
                
                # Wait before retrying
                await asyncio.sleep(delay)
                
                # Exponential backoff with max delay cap
                delay = min(delay * backoff_factor, max_delay)
        
        # If we exhausted retries, raise the last error
        raise last_error
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        structured_output_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate text completion using Gemini
        
        Args:
            prompt: User prompt
            system_prompt: System prompt/instructions
            config: LLM configuration
            structured_output_schema: Optional JSON schema for structured outputs (Pydantic model schema)
            **kwargs: Additional arguments
            
        Returns:
            LLMResponse with generated content
        """
        self._validate_prompt(prompt)
        
        # Combine system prompt and user prompt
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": top_p,
        }
        
        # Add structured output configuration if schema provided
        if structured_output_schema:
            generation_config["response_mime_type"] = "application/json"
            generation_config["response_json_schema"] = structured_output_schema
        
        async def _generate():
            return await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=full_prompt,
                config=generation_config,
                **kwargs
            )
        
        try:
            response = await self._retry_with_backoff(_generate)
            
            content = response.text if hasattr(response, 'text') and response.text else ""
            
            # If structured output was requested, parse JSON
            metadata = {"response_id": getattr(response, "id", None)}
            if structured_output_schema:
                try:
                    # Parse JSON response
                    parsed_json = json.loads(content)
                    metadata["structured_output"] = parsed_json
                    # Keep the answer text as the main content
                    if isinstance(parsed_json, dict) and "answer" in parsed_json:
                        content = parsed_json["answer"]
                except json.JSONDecodeError:
                    logger.warning("Failed to parse structured output JSON", content=content[:100])
                    # Fall back to raw content
            
            # Estimate token usage (Gemini doesn't provide exact counts)
            prompt_tokens = len(full_prompt.split()) * 1.3  # Rough estimate
            completion_tokens = len(content.split()) * 1.3
            
            return LLMResponse(
                content=content,
                model=self.model,
                provider="gemini",
                usage={
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                    "total_tokens": int(prompt_tokens + completion_tokens)
                },
                finish_reason=getattr(response, "finish_reason", None),
                metadata=metadata
            )
        except Exception as e:
            error_str = str(e)
            if "rate limit" in error_str.lower() or "quota" in error_str.lower():
                logger.error("Gemini rate limit exceeded", error=error_str)
                raise LLMRateLimitError(f"Gemini rate limit exceeded: {error_str}")
            elif "timeout" in error_str.lower() or "deadline" in error_str.lower():
                logger.error("Gemini request timeout", error=error_str)
                raise LLMTimeoutError(f"Gemini request timeout: {error_str}")
            else:
                logger.error("Unexpected error in Gemini generation", error=error_str)
                raise LLMError(f"Gemini API error: {error_str}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming text completion using Gemini"""
        self._validate_prompt(prompt)
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": top_p,
        }
        
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content_stream,
                model=self.model,
                contents=full_prompt,
                config=generation_config,
                **kwargs
            )
            
            for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
        except Exception as e:
            error_str = str(e)
            if "rate limit" in error_str.lower() or "quota" in error_str.lower():
                logger.error("Gemini rate limit exceeded", error=error_str)
                raise LLMRateLimitError(f"Gemini rate limit exceeded: {error_str}")
            elif "timeout" in error_str.lower() or "deadline" in error_str.lower():
                logger.error("Gemini request timeout", error=error_str)
                raise LLMTimeoutError(f"Gemini request timeout: {error_str}")
            else:
                logger.error("Unexpected error in Gemini streaming", error=error_str)
                raise LLMError(f"Gemini API error: {error_str}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        structured_output_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate chat completion using Gemini
        
        Args:
            messages: List of chat messages
            config: LLM configuration
            structured_output_schema: Optional JSON schema for structured outputs
            **kwargs: Additional arguments
            
        Returns:
            LLMResponse with generated content
        """
        self._validate_messages(messages)
        
        # Convert messages to Gemini format
        # For now, convert to a single prompt string (the new API may support message objects)
        chat_prompt = ""
        system_prompt = None
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                system_prompt = content
            elif role == "user":
                chat_prompt += f"User: {content}\n\n"
            elif role == "assistant":
                chat_prompt += f"Assistant: {content}\n\n"
        
        # Combine system prompt if present
        if system_prompt:
            chat_prompt = f"{system_prompt}\n\n{chat_prompt}"
        
        # Remove trailing newlines
        chat_prompt = chat_prompt.strip()
        
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": top_p,
        }
        
        # Add structured output configuration if schema provided
        if structured_output_schema:
            generation_config["response_mime_type"] = "application/json"
            generation_config["response_json_schema"] = structured_output_schema
        
        async def _generate_chat():
            return await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=chat_prompt,
                config=generation_config,
                **kwargs
            )
        
        try:
            response = await self._retry_with_backoff(_generate_chat)
            
            content = response.text if hasattr(response, 'text') and response.text else ""
            
            # If structured output was requested, parse JSON
            metadata = {"response_id": getattr(response, "id", None)}
            if structured_output_schema:
                try:
                    # Parse JSON response
                    parsed_json = json.loads(content)
                    metadata["structured_output"] = parsed_json
                    # Extract the answer text as the main content (CRITICAL: never return JSON)
                    if isinstance(parsed_json, dict) and "answer" in parsed_json:
                        extracted_answer = parsed_json["answer"]
                        # Ensure answer is a string, not nested JSON
                        if isinstance(extracted_answer, str):
                            content = extracted_answer
                        else:
                            content = str(extracted_answer)
                            logger.warning("Converted answer to string", original_type=type(extracted_answer).__name__)
                    else:
                        logger.warning("Structured output missing 'answer' field", keys=list(parsed_json.keys()) if isinstance(parsed_json, dict) else [])
                except json.JSONDecodeError as e:
                    logger.warning("Failed to parse structured output JSON", error=str(e), content=content[:200])
                    # Fall back to raw content, but try to extract if it's a JSON string
                    if content.strip().startswith('{') and '"answer"' in content:
                        try:
                            parsed = json.loads(content)
                            if isinstance(parsed, dict) and "answer" in parsed:
                                content = parsed["answer"]
                                logger.info("Extracted answer from fallback JSON parsing")
                        except:
                            pass  # Use raw content as-is
            
            prompt_tokens = len(chat_prompt.split()) * 1.3
            completion_tokens = len(content.split()) * 1.3
            
            return LLMResponse(
                content=content,
                model=self.model,
                provider="gemini",
                usage={
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                    "total_tokens": int(prompt_tokens + completion_tokens)
                },
                finish_reason=getattr(response, "finish_reason", None),
                metadata=metadata
            )
        except Exception as e:
            error_str = str(e)
            if "rate limit" in error_str.lower() or "quota" in error_str.lower():
                logger.error("Gemini rate limit exceeded", error=error_str)
                raise LLMRateLimitError(f"Gemini rate limit exceeded: {error_str}")
            elif "timeout" in error_str.lower() or "deadline" in error_str.lower():
                logger.error("Gemini request timeout", error=error_str)
                raise LLMTimeoutError(f"Gemini request timeout: {error_str}")
            else:
                logger.error("Unexpected error in Gemini chat", error=error_str)
                raise LLMError(f"Gemini API error: {error_str}")
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using Gemini"""
        self._validate_messages(messages)
        
        chat_prompt = ""
        system_prompt = None
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                system_prompt = content
            elif role == "user":
                chat_prompt += f"User: {content}\n\n"
            elif role == "assistant":
                chat_prompt += f"Assistant: {content}\n\n"
        
        # Combine system prompt if present
        if system_prompt:
            chat_prompt = f"{system_prompt}\n\n{chat_prompt}"
        
        chat_prompt = chat_prompt.strip()
        
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": top_p,
        }
        
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content_stream,
                model=self.model,
                contents=chat_prompt,
                config=generation_config,
                **kwargs
            )
            
            for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
        except Exception as e:
            error_str = str(e)
            if "rate limit" in error_str.lower() or "quota" in error_str.lower():
                logger.error("Gemini rate limit exceeded", error=error_str)
                raise LLMRateLimitError(f"Gemini rate limit exceeded: {error_str}")
            elif "timeout" in error_str.lower() or "deadline" in error_str.lower():
                logger.error("Gemini request timeout", error=error_str)
                raise LLMTimeoutError(f"Gemini request timeout: {error_str}")
            else:
                logger.error("Unexpected error in Gemini chat streaming", error=error_str)
                raise LLMError(f"Gemini API error: {error_str}")

