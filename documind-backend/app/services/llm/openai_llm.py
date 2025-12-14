"""
OpenAI LLM service implementation
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog
from openai import AsyncOpenAI
from openai import APIError, RateLimitError, APITimeoutError

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)


class OpenAILLMService(BaseLLMService):
    """OpenAI LLM service implementation"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4",
        max_retries: int = 3,
        timeout: int = 60
    ):
        """
        Initialize OpenAI LLM service
        
        Args:
            api_key: OpenAI API key
            model: Model name (e.g., "gpt-4", "gpt-3.5-turbo")
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, model, max_retries, timeout)
        if not api_key:
            raise LLMConfigurationError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=api_key, timeout=timeout)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate text completion using OpenAI"""
        self._validate_prompt(prompt)
        
        # Use config or instance defaults
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        frequency_penalty = config.frequency_penalty if config else 0.0
        presence_penalty = config.presence_penalty if config else 0.0
        stop = config.stop_sequences if config and config.stop_sequences else None
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop,
                **kwargs
            )
            
            choice = response.choices[0]
            return LLMResponse(
                content=choice.message.content or "",
                model=response.model,
                provider="openai",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                finish_reason=choice.finish_reason,
                metadata={"response_id": response.id}
            )
        except RateLimitError as e:
            logger.error("OpenAI rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"OpenAI rate limit exceeded: {str(e)}")
        except APITimeoutError as e:
            logger.error("OpenAI request timeout", error=str(e))
            raise LLMTimeoutError(f"OpenAI request timeout: {str(e)}")
        except APIError as e:
            logger.error("OpenAI API error", error=str(e))
            raise LLMError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in OpenAI generation", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming text completion using OpenAI"""
        self._validate_prompt(prompt)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        frequency_penalty = config.frequency_penalty if config else 0.0
        presence_penalty = config.presence_penalty if config else 0.0
        stop = config.stop_sequences if config and config.stop_sequences else None
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except RateLimitError as e:
            logger.error("OpenAI rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"OpenAI rate limit exceeded: {str(e)}")
        except APITimeoutError as e:
            logger.error("OpenAI request timeout", error=str(e))
            raise LLMTimeoutError(f"OpenAI request timeout: {str(e)}")
        except APIError as e:
            logger.error("OpenAI API error", error=str(e))
            raise LLMError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in OpenAI streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using OpenAI"""
        self._validate_messages(messages)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        frequency_penalty = config.frequency_penalty if config else 0.0
        presence_penalty = config.presence_penalty if config else 0.0
        stop = config.stop_sequences if config and config.stop_sequences else None
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop,
                **kwargs
            )
            
            choice = response.choices[0]
            return LLMResponse(
                content=choice.message.content or "",
                model=response.model,
                provider="openai",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                finish_reason=choice.finish_reason,
                metadata={"response_id": response.id}
            )
        except RateLimitError as e:
            logger.error("OpenAI rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"OpenAI rate limit exceeded: {str(e)}")
        except APITimeoutError as e:
            logger.error("OpenAI request timeout", error=str(e))
            raise LLMTimeoutError(f"OpenAI request timeout: {str(e)}")
        except APIError as e:
            logger.error("OpenAI API error", error=str(e))
            raise LLMError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in OpenAI chat", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using OpenAI"""
        self._validate_messages(messages)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        frequency_penalty = config.frequency_penalty if config else 0.0
        presence_penalty = config.presence_penalty if config else 0.0
        stop = config.stop_sequences if config and config.stop_sequences else None
        
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except RateLimitError as e:
            logger.error("OpenAI rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"OpenAI rate limit exceeded: {str(e)}")
        except APITimeoutError as e:
            logger.error("OpenAI request timeout", error=str(e))
            raise LLMTimeoutError(f"OpenAI request timeout: {str(e)}")
        except APIError as e:
            logger.error("OpenAI API error", error=str(e))
            raise LLMError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in OpenAI chat streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")

