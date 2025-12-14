"""
Main LLM service with provider abstraction
"""

from typing import Optional
import structlog

from app.core.config import settings
from .base import BaseLLMService, LLMProvider, LLMConfig
from .openai_llm import OpenAILLMService
from .gemini_llm import GeminiLLMService
from .claude_llm import ClaudeLLMService
from .ollama_llm import OllamaLLMService
from .huggingface_llm import HuggingFaceLLMService
from .exceptions import LLMError, LLMConfigurationError

logger = structlog.get_logger(__name__)


class LLMService:
    """Main LLM service with provider abstraction"""
    
    def __init__(
        self,
        provider: Optional[LLMProvider] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        """
        Initialize LLM service with specified provider
        
        Args:
            provider: LLM provider to use (defaults to settings)
            api_key: API key (defaults to settings)
            model: Model name (defaults to settings)
        """
        # Use settings defaults if not provided
        provider = provider or LLMProvider(settings.LLM_PROVIDER.lower())
        model = model or settings.LLM_MODEL
        
        # Get API key from parameter or settings
        if provider == LLMProvider.OLLAMA:
            # Ollama can work with or without API key (local vs cloud)
            api_key_value = api_key or getattr(settings, "OLLAMA_API_KEY", "")
        elif api_key:
            api_key_value = api_key
        elif provider == LLMProvider.OPENAI:
            api_key_value = settings.OPENAI_API_KEY
        elif provider == LLMProvider.GEMINI:
            api_key_value = settings.GEMINI_API_KEY
        elif provider == LLMProvider.CLAUDE:
            api_key_value = settings.ANTHROPIC_API_KEY
        elif provider == LLMProvider.HUGGINGFACE:
            api_key_value = settings.HUGGINGFACE_API_KEY
        else:
            raise LLMConfigurationError(f"Unknown provider: {provider}")
        
        # Validate API key (Ollama only needs key for cloud, local doesn't need it)
        if provider != LLMProvider.OLLAMA and not api_key_value:
            raise LLMConfigurationError(f"API key not found for provider: {provider}")
        
        # For Ollama cloud, validate API key if using cloud URL
        if provider == LLMProvider.OLLAMA:
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
            if base_url.startswith("https://") and not api_key_value:
                raise LLMConfigurationError("Ollama API key is required for cloud usage. Get one from https://ollama.com")
        
        # Initialize provider-specific service
        if provider == LLMProvider.OPENAI:
            self.llm = OpenAILLMService(
                api_key=api_key_value,
                model=model,
                max_retries=settings.LLM_MAX_RETRIES,
                timeout=settings.LLM_TIMEOUT
            )
        elif provider == LLMProvider.GEMINI:
            self.llm = GeminiLLMService(
                api_key=api_key_value,
                model=model,
                max_retries=settings.LLM_MAX_RETRIES,
                timeout=settings.LLM_TIMEOUT
            )
        elif provider == LLMProvider.CLAUDE:
            self.llm = ClaudeLLMService(
                api_key=api_key_value,
                model=model,
                max_retries=settings.LLM_MAX_RETRIES,
                timeout=settings.LLM_TIMEOUT
            )
        elif provider == LLMProvider.OLLAMA:
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
            self.llm = OllamaLLMService(
                api_key=api_key_value,  # Required for cloud, optional for local
                model=model,
                max_retries=settings.LLM_MAX_RETRIES,
                timeout=settings.LLM_TIMEOUT,
                base_url=base_url
            )
        elif provider == LLMProvider.HUGGINGFACE:
            self.llm = HuggingFaceLLMService(
                api_key=api_key_value,
                model=model,
                max_retries=settings.LLM_MAX_RETRIES,
                timeout=settings.LLM_TIMEOUT
            )
        else:
            raise LLMConfigurationError(f"Unsupported provider: {provider}")
        
        self.provider = provider
        logger.info("LLM service initialized", provider=provider.value, model=model)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ):
        """Generate text completion"""
        return await self.llm.generate(prompt, system_prompt, config, **kwargs)
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ):
        """Generate streaming text completion"""
        return self.llm.generate_stream(prompt, system_prompt, config, **kwargs)
    
    async def generate_chat(
        self,
        messages: list,
        config: Optional[LLMConfig] = None,
        **kwargs
    ):
        """Generate chat completion"""
        return await self.llm.generate_chat(messages, config, **kwargs)
    
    async def generate_chat_stream(
        self,
        messages: list,
        config: Optional[LLMConfig] = None,
        **kwargs
    ):
        """Generate streaming chat completion"""
        return self.llm.generate_chat_stream(messages, config, **kwargs)

