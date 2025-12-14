"""
Ollama LLM service implementation (Supports both Local and Cloud)
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator
import structlog
import httpx

from .base import BaseLLMService, LLMResponse, LLMConfig
from .exceptions import LLMError, LLMConfigurationError, LLMRateLimitError, LLMTimeoutError

logger = structlog.get_logger(__name__)


class OllamaLLMService(BaseLLMService):
    """Ollama LLM service implementation (Supports Local and Cloud)"""
    
    def __init__(
        self,
        api_key: str = "",
        model: str = "llama3",
        max_retries: int = 3,
        timeout: int = 120,
        base_url: str = "http://localhost:11434"
    ):
        """
        Initialize Ollama LLM service
        
        Args:
            api_key: API key for Ollama Cloud (required for cloud, not needed for local)
            model: Model name (e.g., "llama3", "mistral", "codellama", "gpt-oss:120b" for cloud)
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
            base_url: Ollama API base URL
                - Local: http://localhost:11434 (default)
                - Cloud: https://ollama.com
        """
        super().__init__(api_key or "not_required", model, max_retries, timeout)
        self.base_url = base_url.rstrip("/")
        self.is_cloud = base_url.startswith("https://")
        self.api_key = api_key  # Store API key for reference
        
        # Setup headers for cloud API
        headers = {}
        if self.is_cloud:
            # For cloud, API key is required
            if api_key and api_key != "not_required" and api_key.strip():
                headers["Authorization"] = f"Bearer {api_key}"
                logger.info("Ollama cloud API configured", base_url=self.base_url, has_api_key=True)
            else:
                logger.warning(
                    "Ollama cloud URL detected but no valid API key provided",
                    base_url=self.base_url,
                    api_key_provided=bool(api_key),
                    api_key_value=api_key[:10] + "..." if api_key and len(api_key) > 10 else "empty"
                )
        
        self.client = httpx.AsyncClient(timeout=timeout, headers=headers)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate text completion using Ollama"""
        self._validate_prompt(prompt)
        
        # Use model from config only if explicitly set (not default "gpt-4"), otherwise use instance model
        if config and config.model and config.model != "gpt-4":
            model = config.model
        else:
            model = self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            # Ollama Cloud uses /api/generate, local uses /api/chat
            if self.is_cloud:
                # Cloud API: /api/generate with prompt
                prompt_text = prompt
                if system_prompt:
                    prompt_text = f"{system_prompt}\n\n{prompt}"
                
                # Ensure Authorization header is set for cloud API
                request_headers = dict(self.client.headers)
                if self.is_cloud and self.api_key and self.api_key != "not_required" and self.api_key.strip():
                    request_headers["Authorization"] = f"Bearer {self.api_key}"
                
                # Log request details for debugging
                logger.info(
                    "Ollama cloud API request",
                    url=f"{self.base_url}/api/generate",
                    model=model,
                    has_auth_header=bool(request_headers.get("Authorization")),
                    auth_header_present="Authorization" in request_headers,
                    base_url=self.base_url,
                    api_key_set=bool(self.api_key and self.api_key != "not_required")
                )
                
                # Create a new client with the correct headers for this request
                async_client = httpx.AsyncClient(timeout=self.timeout, headers=request_headers)
                try:
                    response = await async_client.post(
                        f"{self.base_url}/api/generate",
                        json={
                            "model": model,
                            "prompt": prompt_text,
                            "stream": False,
                            "options": {
                                "temperature": temperature,
                                "num_predict": max_tokens,
                                "top_p": top_p,
                            }
                        }
                    )
                finally:
                    await async_client.aclose()
                response.raise_for_status()
                data = response.json()
                content = data.get("response", "")
            else:
                # Local API: /api/chat with messages
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = await self.client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_p": top_p,
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data.get("message", {}).get("content", "")
            
            # Estimate token usage (Ollama doesn't provide exact counts)
            prompt_tokens = len(prompt.split()) * 1.3
            completion_tokens = len(content.split()) * 1.3
            
            return LLMResponse(
                content=content,
                model=model,
                provider="ollama",
                usage={
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                    "total_tokens": int(prompt_tokens + completion_tokens)
                },
                finish_reason=data.get("done", True) and "stop" or "length",
                metadata={"response_id": data.get("created_at")}
            )
        except httpx.TimeoutException as e:
            logger.error("Ollama request timeout", error=str(e))
            raise LLMTimeoutError(f"Ollama request timeout: {str(e)}")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise LLMRateLimitError(f"Ollama rate limit exceeded: {str(e)}")
            logger.error(
                "Ollama API error",
                error=str(e),
                status_code=e.response.status_code,
                url=e.request.url,
                has_auth=bool(self.is_cloud and self.api_key)
            )
            if e.response.status_code == 404:
                if self.is_cloud:
                    raise LLMError(
                        f"Ollama Cloud API endpoint not found. "
                        f"Please verify your API key and that the endpoint is correct. "
                        f"URL: {e.request.url}"
                    )
                else:
                    raise LLMError(
                        f"Ollama local API endpoint not found. "
                        f"Make sure Ollama is running on {self.base_url}"
                    )
            raise LLMError(f"Ollama API error: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Ollama generation", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming text completion using Ollama"""
        self._validate_prompt(prompt)
        
        # Use model from config only if explicitly set (not default "gpt-4"), otherwise use instance model
        if config and config.model and config.model != "gpt-4":
            model = config.model
        else:
            model = self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            # Ollama Cloud uses /api/generate, local uses /api/chat
            if self.is_cloud:
                # Cloud API: /api/generate with prompt
                prompt_text = prompt
                if system_prompt:
                    prompt_text = f"{system_prompt}\n\n{prompt}"
                
                async with self.client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt_text,
                        "stream": True,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_p": top_p,
                        }
                    }
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                import json
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                            except json.JSONDecodeError:
                                continue
            else:
                # Local API: /api/chat with messages
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                async with self.client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_p": top_p,
                        }
                    }
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                import json
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    yield data["message"]["content"]
                            except json.JSONDecodeError:
                                continue
        except httpx.TimeoutException as e:
            logger.error("Ollama streaming timeout", error=str(e))
            raise LLMTimeoutError(f"Ollama request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Ollama streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate chat completion using Ollama"""
        self._validate_messages(messages)
        
        # Use model from config only if explicitly set (not default "gpt-4"), otherwise use instance model
        if config and config.model and config.model != "gpt-4":
            model = config.model
        else:
            model = self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            # Ollama Cloud uses /api/generate, local uses /api/chat
            if self.is_cloud:
                # Cloud API: /api/generate with prompt
                # Convert messages to prompt format
                prompt_parts = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "system":
                        prompt_parts.insert(0, f"System: {content}")
                    elif role == "user":
                        prompt_parts.append(f"User: {content}")
                    elif role == "assistant":
                        prompt_parts.append(f"Assistant: {content}")
                prompt_text = "\n\n".join(prompt_parts)
                
                # Ensure Authorization header is set for cloud API
                # Start with empty headers dict, don't copy from self.client.headers
                request_headers = {}
                if self.is_cloud and self.api_key and self.api_key != "not_required" and self.api_key.strip():
                    request_headers["Authorization"] = f"Bearer {self.api_key}"
                    logger.info("Authorization header set", api_key_prefix=self.api_key[:10] + "...")
                else:
                    logger.error(
                        "No API key available for Ollama cloud",
                        is_cloud=self.is_cloud,
                        api_key_provided=bool(self.api_key),
                        api_key_value=self.api_key if self.api_key else "None"
                    )
                
                # Set Content-Type
                request_headers["Content-Type"] = "application/json"
                
                # Log request details for debugging (mask API key in logs)
                auth_header = request_headers.get("Authorization", "")
                masked_auth = f"Bearer {auth_header.split(' ')[1][:10]}..." if auth_header and len(auth_header.split(' ')) > 1 else "NOT SET"
                
                logger.info(
                    "Ollama cloud API request (generate_chat)",
                    url=f"{self.base_url}/api/generate",
                    model=model,
                    headers_keys=list(request_headers.keys()),
                    has_auth_header=bool(request_headers.get("Authorization")),
                    auth_header_masked=masked_auth,
                    base_url=self.base_url,
                    api_key_stored=bool(self.api_key and self.api_key != "not_required")
                )
                
                logger.info(
                    "Making Ollama cloud API request",
                    url=f"{self.base_url}/api/generate",
                    model=model,
                    headers=dict(request_headers),  # Log all headers (but mask API key)
                    prompt_length=len(prompt_text)
                )
                
                async_client = httpx.AsyncClient(timeout=self.timeout, headers=request_headers)
                try:
                    response = await async_client.post(
                        f"{self.base_url}/api/generate",
                        json={
                            "model": model,
                            "prompt": prompt_text,
                            "stream": False,
                            "options": {
                                "temperature": temperature,
                                "num_predict": max_tokens,
                                "top_p": top_p,
                            }
                        }
                    )
                    
                    # Log response details
                    logger.info(
                        "Ollama API response",
                        status_code=response.status_code,
                        url=str(response.url),
                        headers=dict(response.headers)
                    )
                    
                    response.raise_for_status()
                    data = response.json()
                    content = data.get("response", "")
                except httpx.HTTPStatusError as e:
                    # Log detailed error information
                    logger.error(
                        "Ollama API HTTP error",
                        status_code=e.response.status_code,
                        url=str(e.request.url),
                        method=e.request.method,
                        request_headers=dict(e.request.headers),
                        response_text=e.response.text[:500] if e.response.text else None,
                        response_headers=dict(e.response.headers)
                    )
                    raise
                finally:
                    await async_client.aclose()
            else:
                # Local API: /api/chat with messages
                response = await self.client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_p": top_p,
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data.get("message", {}).get("content", "")
            
            # Estimate token usage
            total_text = " ".join([msg.get("content", "") for msg in messages]) if not self.is_cloud else prompt_text
            prompt_tokens = len(total_text.split()) * 1.3
            completion_tokens = len(content.split()) * 1.3
            
            return LLMResponse(
                content=content,
                model=model,
                provider="ollama",
                usage={
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                    "total_tokens": int(prompt_tokens + completion_tokens)
                },
                finish_reason=data.get("done", True) and "stop" or "length",
                metadata={"response_id": data.get("created_at")}
            )
        except httpx.TimeoutException as e:
            logger.error("Ollama request timeout", error=str(e))
            raise LLMTimeoutError(f"Ollama request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Ollama chat", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming chat completion using Ollama"""
        self._validate_messages(messages)
        
        # Use model from config only if explicitly set (not default "gpt-4"), otherwise use instance model
        if config and config.model and config.model != "gpt-4":
            model = config.model
        else:
            model = self.model
        temperature = config.temperature if config else 0.7
        max_tokens = config.max_tokens if config else 2000
        top_p = config.top_p if config else 1.0
        
        try:
            # Ollama Cloud uses /api/generate, local uses /api/chat
            if self.is_cloud:
                # Cloud API: /api/generate with prompt
                prompt_parts = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "system":
                        prompt_parts.insert(0, f"System: {content}")
                    elif role == "user":
                        prompt_parts.append(f"User: {content}")
                    elif role == "assistant":
                        prompt_parts.append(f"Assistant: {content}")
                prompt_text = "\n\n".join(prompt_parts)
                
                # Ensure Authorization header is set for cloud API
                request_headers = dict(self.client.headers)
                if self.is_cloud and self.api_key and self.api_key != "not_required" and self.api_key.strip():
                    request_headers["Authorization"] = f"Bearer {self.api_key}"
                
                # Create a new client with the correct headers for this request
                async_client = httpx.AsyncClient(timeout=self.timeout, headers=request_headers)
                try:
                    async with async_client.stream(
                        "POST",
                        f"{self.base_url}/api/generate",
                        json={
                            "model": model,
                            "prompt": prompt_text,
                            "stream": True,
                            "options": {
                                "temperature": temperature,
                                "num_predict": max_tokens,
                                "top_p": top_p,
                            }
                        }
                    ) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    import json
                                    data = json.loads(line)
                                    if "response" in data:
                                        yield data["response"]
                                except json.JSONDecodeError:
                                    continue
                finally:
                    await async_client.aclose()
            else:
                # Local API: /api/chat with messages
                async with self.client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_p": top_p,
                        }
                    }
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                import json
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    yield data["message"]["content"]
                            except json.JSONDecodeError:
                                continue
        except httpx.TimeoutException as e:
            logger.error("Ollama streaming timeout", error=str(e))
            raise LLMTimeoutError(f"Ollama request timeout: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error in Ollama chat streaming", error=str(e))
            raise LLMError(f"Unexpected error: {str(e)}")
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

