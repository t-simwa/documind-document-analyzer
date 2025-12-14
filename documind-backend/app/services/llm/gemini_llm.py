"""
Google Gemini LLM service implementation
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)

try:
    import google.generativeai as genai
    from google.api_core import exceptions as google_exceptions
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Gemini LLM service will not be available.")


class GeminiLLMService(BaseLLMService):
    """Google Gemini LLM service implementation"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "gemini-pro",
        max_retries: int = 3,
        timeout: int = 60
    ):
        """
        Initialize Gemini LLM service
        
        Args:
            api_key: Google API key
            model: Model name (e.g., "gemini-pro", "gemini-pro-vision")
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        if not GEMINI_AVAILABLE:
            raise LLMConfigurationError("google-generativeai package is not installed")
        
        super().__init__(api_key, model, max_retries, timeout)
        if not api_key:
            raise LLMConfigurationError("Gemini API key is required")
        
        genai.configure(api_key=api_key)
        self.model_instance = genai.GenerativeModel(model)
    
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
                self.model_instance.generate_content,
                full_prompt,
                generation_config=generation_config,
                **kwargs
            )
            
            content = response.text if response.text else ""
            
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
        except google_exceptions.ResourceExhausted as e:
            logger.error("Gemini rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Gemini rate limit exceeded: {str(e)}")
        except google_exceptions.DeadlineExceeded as e:
            logger.error("Gemini request timeout", error=str(e))
            raise LLMTimeoutError(f"Gemini request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Gemini generation", error=str(e))
            raise LLMError(f"Gemini API error: {str(e)}")
    
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
                self.model_instance.generate_content,
                full_prompt,
                generation_config=generation_config,
                stream=True,
                **kwargs
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except google_exceptions.ResourceExhausted as e:
            logger.error("Gemini rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Gemini rate limit exceeded: {str(e)}")
        except google_exceptions.DeadlineExceeded as e:
            logger.error("Gemini request timeout", error=str(e))
            raise LLMTimeoutError(f"Gemini request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Gemini streaming", error=str(e))
            raise LLMError(f"Gemini API error: {str(e)}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using Gemini"""
        self._validate_messages(messages)
        
        # Convert messages to Gemini format
        # Gemini uses a single prompt with role prefixes
        chat_prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                chat_prompt = f"{content}\n\n{chat_prompt}"
            elif role == "user":
                chat_prompt += f"User: {content}\n\n"
            elif role == "assistant":
                chat_prompt += f"Assistant: {content}\n\n"
        
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
                self.model_instance.generate_content,
                chat_prompt,
                generation_config=generation_config,
                **kwargs
            )
            
            content = response.text if response.text else ""
            
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
        except google_exceptions.ResourceExhausted as e:
            logger.error("Gemini rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Gemini rate limit exceeded: {str(e)}")
        except google_exceptions.DeadlineExceeded as e:
            logger.error("Gemini request timeout", error=str(e))
            raise LLMTimeoutError(f"Gemini request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Gemini chat", error=str(e))
            raise LLMError(f"Gemini API error: {str(e)}")
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using Gemini"""
        self._validate_messages(messages)
        
        chat_prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                chat_prompt = f"{content}\n\n{chat_prompt}"
            elif role == "user":
                chat_prompt += f"User: {content}\n\n"
            elif role == "assistant":
                chat_prompt += f"Assistant: {content}\n\n"
        
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
                self.model_instance.generate_content,
                chat_prompt,
                generation_config=generation_config,
                stream=True,
                **kwargs
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except google_exceptions.ResourceExhausted as e:
            logger.error("Gemini rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Gemini rate limit exceeded: {str(e)}")
        except google_exceptions.DeadlineExceeded as e:
            logger.error("Gemini request timeout", error=str(e))
            raise LLMTimeoutError(f"Gemini request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Gemini chat streaming", error=str(e))
            raise LLMError(f"Gemini API error: {str(e)}")

