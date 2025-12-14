"""
LLM service exceptions
"""


class LLMError(Exception):
    """Base exception for LLM service errors"""
    pass


class LLMConfigurationError(LLMError):
    """Exception raised for LLM configuration errors"""
    pass


class LLMRateLimitError(LLMError):
    """Exception raised when LLM API rate limit is exceeded"""
    pass


class LLMTimeoutError(LLMError):
    """Exception raised when LLM API request times out"""
    pass

