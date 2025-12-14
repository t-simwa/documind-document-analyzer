"""
Hugging Face Inference API LLM service implementation (FREE tier available)
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog
import httpx

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)


class HuggingFaceLLMService(BaseLLMService):
    """Hugging Face Inference API LLM service implementation"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "mistralai/Mistral-7B-Instruct-v0.2",
        max_retries: int = 3,
        timeout: int = 60,
        base_url: str = "https://api-inference.huggingface.co"
    ):
        """
        Initialize Hugging Face LLM service
        
        Args:
            api_key: Hugging Face API key (get from https://huggingface.co/settings/tokens)
            model: Model name (e.g., "mistralai/Mistral-7B-Instruct-v0.2", "meta-llama/Llama-2-7b-chat-hf")
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
            base_url: Hugging Face API base URL
        """
        super().__init__(api_key, model, max_retries, timeout)
        if not api_key:
            raise LLMConfigurationError("Hugging Face API key is required (get free token from https://huggingface.co/settings/tokens)")
        
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate text completion using Hugging Face"""
        self._validate_prompt(prompt)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        
        # Combine system prompt and user prompt
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        try:
            response = await self.client.post(
                f"{self.base_url}/models/{model}",
                json={
                    "inputs": full_prompt,
                    "parameters": {
                        "temperature": temperature,
                        "max_new_tokens": max_tokens,
                        "return_full_text": False,
                    }
                }
            )
            
            # Handle rate limiting and model loading
            if response.status_code == 503:
                # Model is loading, wait and retry
                await asyncio.sleep(10)
                response = await self.client.post(
                    f"{self.base_url}/models/{model}",
                    json={
                        "inputs": full_prompt,
                        "parameters": {
                            "temperature": temperature,
                            "max_new_tokens": max_tokens,
                            "return_full_text": False,
                        }
                    }
                )
            
            response.raise_for_status()
            data = response.json()
            
            # Extract text from response (format varies by model)
            if isinstance(data, list) and len(data) > 0:
                content = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                content = data.get("generated_text", "")
            else:
                content = str(data)
            
            # Estimate token usage
            prompt_tokens = len(full_prompt.split()) * 1.3
            completion_tokens = len(content.split()) * 1.3
            
            return LLMResponse(
                content=content,
                model=model,
                provider="huggingface",
                usage={
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                    "total_tokens": int(prompt_tokens + completion_tokens)
                },
                finish_reason="stop",
                metadata={}
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.error("Hugging Face rate limit exceeded", error=str(e))
                raise LLMRateLimitError(f"Hugging Face rate limit exceeded: {str(e)}")
            logger.error("Hugging Face API error", error=str(e), status_code=e.response.status_code)
            raise LLMError(f"Hugging Face API error: {str(e)}")
        except httpx.TimeoutException as e:
            logger.error("Hugging Face request timeout", error=str(e))
            raise LLMTimeoutError(f"Hugging Face request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Hugging Face generation", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming text completion using Hugging Face"""
        self._validate_prompt(prompt)
        
        model = config.model if config else self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/models/{model}",
                json={
                    "inputs": full_prompt,
                    "parameters": {
                        "temperature": temperature,
                        "max_new_tokens": max_tokens,
                        "return_full_text": False,
                    },
                    "stream": True
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            import json
                            data = json.loads(line)
                            if "token" in data and "text" in data["token"]:
                                yield data["token"]["text"]
                        except (json.JSONDecodeError, KeyError):
                            continue
        except Exception as e:
            logger.error("Unexpected error in Hugging Face streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using Hugging Face"""
        self._validate_messages(messages)
        
        # Convert messages to prompt format
        prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                prompt = f"{content}\n\n{prompt}"
            elif role == "user":
                prompt += f"User: {content}\n\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n\n"
        
        prompt = prompt.strip()
        
        # Use generate method
        return await self.generate(prompt, None, config, **kwargs)
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using Hugging Face"""
        self._validate_messages(messages)
        
        # Convert messages to prompt format
        prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                prompt = f"{content}\n\n{prompt}"
            elif role == "user":
                prompt += f"User: {content}\n\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n\n"
        
        prompt = prompt.strip()
        
        # Use streaming generate method
        async for chunk in self.generate_stream(prompt, None, config, **kwargs):
            yield chunk
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

