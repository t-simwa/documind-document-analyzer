"""
Google Gemini LLM service implementation using google-genai package
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog

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
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate text completion using Gemini"""
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
        
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=full_prompt,
                config=generation_config,
                **kwargs
            )
            
            content = response.text if hasattr(response, 'text') and response.text else ""
            
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
                metadata={"response_id": getattr(response, "id", None)}
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
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using Gemini"""
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
        
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=chat_prompt,
                config=generation_config,
                **kwargs
            )
            
            content = response.text if hasattr(response, 'text') and response.text else ""
            
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
                metadata={"response_id": getattr(response, "id", None)}
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

