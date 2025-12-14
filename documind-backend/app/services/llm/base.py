"""
Base LLM service interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass, field
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    OLLAMA = "ollama"  # FREE, local
    HUGGINGFACE = "huggingface"  # FREE tier available


@dataclass
class LLMConfig:
    """Configuration for LLM generation"""
    provider: LLMProvider = LLMProvider.OPENAI
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2000
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    stop_sequences: List[str] = field(default_factory=list)
    stream: bool = False
    timeout: int = 60
    max_retries: int = 3
    api_key: Optional[str] = None
    
    def __post_init__(self):
        """Validate configuration"""
        if self.temperature < 0 or self.temperature > 2:
            raise ValueError("Temperature must be between 0 and 2")
        if self.max_tokens < 1:
            raise ValueError("Max tokens must be at least 1")
        if self.top_p < 0 or self.top_p > 1:
            raise ValueError("Top-p must be between 0 and 1")


@dataclass
class LLMResponse:
    """Response from LLM generation"""
    content: str
    model: str
    provider: str
    usage: Dict[str, Any] = field(default_factory=dict)
    finish_reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize default values"""
        if not self.usage:
            self.usage = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }


class BaseLLMService(ABC):
    """Base class for LLM service implementations"""
    
    def __init__(
        self,
        api_key: str,
        model: str,
        max_retries: int = 3,
        timeout: int = 60
    ):
        """
        Initialize LLM service
        
        Args:
            api_key: API key for the LLM provider
            model: Model name to use
            max_retries: Maximum number of retries for failed requests
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.model = model
        self.max_retries = max_retries
        self.timeout = timeout
        self.provider_name = self.__class__.__name__.replace("LLMService", "").lower()
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate text completion
        
        Args:
            prompt: User prompt/message
            system_prompt: Optional system prompt
            config: LLM configuration (overrides instance defaults)
            **kwargs: Additional provider-specific arguments
            
        Returns:
            LLMResponse with generated content and metadata
            
        Raises:
            LLMError: If generation fails
        """
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Generate text completion with streaming
        
        Args:
            prompt: User prompt/message
            system_prompt: Optional system prompt
            config: LLM configuration (overrides instance defaults)
            **kwargs: Additional provider-specific arguments
            
        Yields:
            String chunks of generated content
            
        Raises:
            LLMError: If generation fails
        """
        pass
    
    @abstractmethod
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate chat completion with message history
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            config: LLM configuration (overrides instance defaults)
            **kwargs: Additional provider-specific arguments
            
        Returns:
            LLMResponse with generated content and metadata
            
        Raises:
            LLMError: If generation fails
        """
        pass
    
    @abstractmethod
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[LLMConfig] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Generate chat completion with streaming
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            config: LLM configuration (overrides instance defaults)
            **kwargs: Additional provider-specific arguments
            
        Yields:
            String chunks of generated content
            
        Raises:
            LLMError: If generation fails
        """
        pass
    
    def _validate_prompt(self, prompt: str) -> None:
        """Validate input prompt"""
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")
    
    def _validate_messages(self, messages: List[Dict[str, str]]) -> None:
        """Validate message list"""
        if not messages:
            raise ValueError("Messages list cannot be empty")
        
        for msg in messages:
            if not isinstance(msg, dict):
                raise ValueError("All messages must be dictionaries")
            if "role" not in msg or "content" not in msg:
                raise ValueError("All messages must have 'role' and 'content' keys")
            if not isinstance(msg["content"], str) or not msg["content"].strip():
                raise ValueError("Message content cannot be empty")

