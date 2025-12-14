"""
Generation service exceptions
"""


class GenerationError(Exception):
    """Base exception for generation service errors"""
    pass


class GenerationValidationError(GenerationError):
    """Exception raised for generation validation errors"""
    pass

