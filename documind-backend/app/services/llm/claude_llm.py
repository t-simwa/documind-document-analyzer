"""
Anthropic Claude LLM service implementation
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)

try:
    from anthropic import AsyncAnthropic
    from anthropic import APIError, RateLimitError as AnthropicRateLimitError, APITimeoutError as AnthropicTimeoutError
    CLAUDE_AVAILABLE = True
except ImportError:
    CLAUDE_AVAILABLE = False
    logger.warning("anthropic package not installed. Claude LLM service will not be available.")


class ClaudeLLMService(BaseLLMService):
    """Anthropic Claude LLM service implementation"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-opus-20240229",
        max_retries: int = 3,
        timeout: int = 60
    ):
        """
        Initialize Claude LLM service
        
        Args:
            api_key: Anthropic API key
            model: Model name (e.g., "claude-3-opus-20240229", "claude-3-sonnet-20240229")
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        if not CLAUDE_AVAILABLE:
            raise LLMConfigurationError("anthropic package is not installed")
        
        super().__init__(api_key, model, max_retries, timeout)
        if not api_key:
            raise LLMConfigurationError("Claude API key is required")
        
        self.client = AsyncAnthropic(api_key=api_key, timeout=timeout)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate text completion using Claude"""
        self._validate_prompt(prompt)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                system=system_prompt if system_prompt else "",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                **kwargs
            )
            
            content = ""
            if response.content and len(response.content) > 0:
                # Claude returns content as a list of text blocks
                content = "".join(
                    block.text for block in response.content
                    if hasattr(block, "text")
                )
            
            return LLMResponse(
                content=content,
                model=response.model,
                provider="claude",
                usage={
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                finish_reason=response.stop_reason,
                metadata={"response_id": response.id}
            )
        except AnthropicRateLimitError as e:
            logger.error("Claude rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Claude rate limit exceeded: {str(e)}")
        except AnthropicTimeoutError as e:
            logger.error("Claude request timeout", error=str(e))
            raise LLMTimeoutError(f"Claude request timeout: {str(e)}")
        except APIError as e:
            logger.error("Claude API error", error=str(e))
            raise LLMError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Claude generation", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming text completion using Claude"""
        self._validate_prompt(prompt)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            async with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                system=system_prompt if system_prompt else "",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                **kwargs
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except AnthropicRateLimitError as e:
            logger.error("Claude rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Claude rate limit exceeded: {str(e)}")
        except AnthropicTimeoutError as e:
            logger.error("Claude request timeout", error=str(e))
            raise LLMTimeoutError(f"Claude request timeout: {str(e)}")
        except APIError as e:
            logger.error("Claude API error", error=str(e))
            raise LLMError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Claude streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using Claude"""
        self._validate_messages(messages)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        # Separate system prompt from messages
        system_prompt = None
        claude_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            else:
                # Claude uses "assistant" not "assistant"
                role = "assistant" if msg["role"] == "assistant" else msg["role"]
                claude_messages.append({"role": role, "content": msg["content"]})
        
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                system=system_prompt if system_prompt else "",
                messages=claude_messages,
                **kwargs
            )
            
            content = ""
            if response.content and len(response.content) > 0:
                content = "".join(
                    block.text for block in response.content
                    if hasattr(block, "text")
                )
            
            return LLMResponse(
                content=content,
                model=response.model,
                provider="claude",
                usage={
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                finish_reason=response.stop_reason,
                metadata={"response_id": response.id}
            )
        except AnthropicRateLimitError as e:
            logger.error("Claude rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Claude rate limit exceeded: {str(e)}")
        except AnthropicTimeoutError as e:
            logger.error("Claude request timeout", error=str(e))
            raise LLMTimeoutError(f"Claude request timeout: {str(e)}")
        except APIError as e:
            logger.error("Claude API error", error=str(e))
            raise LLMError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Claude chat", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using Claude"""
        self._validate_messages(messages)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        system_prompt = None
        claude_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            else:
                role = "assistant" if msg["role"] == "assistant" else msg["role"]
                claude_messages.append({"role": role, "content": msg["content"]})
        
        try:
            async with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                system=system_prompt if system_prompt else "",
                messages=claude_messages,
                **kwargs
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except AnthropicRateLimitError as e:
            logger.error("Claude rate limit exceeded", error=str(e))
            raise LLMRateLimitError(f"Claude rate limit exceeded: {str(e)}")
        except AnthropicTimeoutError as e:
            logger.error("Claude request timeout", error=str(e))
            raise LLMTimeoutError(f"Claude request timeout: {str(e)}")
        except APIError as e:
            logger.error("Claude API error", error=str(e))
            raise LLMError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Claude chat streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")

