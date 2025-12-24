"""
API versioning utilities
Provides versioning strategy and deprecation support
"""

from typing import Optional
from fastapi import Header, HTTPException
from datetime import datetime
from app.schemas.common import ErrorCode


class APIVersion:
    """API version information"""
    
    CURRENT_VERSION = "v1"
    SUPPORTED_VERSIONS = ["v1"]
    
    @staticmethod
    def get_current_version() -> str:
        """Get current API version"""
        return APIVersion.CURRENT_VERSION
    
    @staticmethod
    def is_supported(version: str) -> bool:
        """Check if version is supported"""
        return version in APIVersion.SUPPORTED_VERSIONS
    
    @staticmethod
    def get_latest_version() -> str:
        """Get latest API version"""
        return APIVersion.SUPPORTED_VERSIONS[-1]


class DeprecatedEndpoint:
    """Mark endpoint as deprecated"""
    
    def __init__(
        self,
        deprecated_since: str,
        sunset_date: Optional[str] = None,
        replacement: Optional[str] = None,
        reason: Optional[str] = None
    ):
        """
        Initialize deprecation information
        
        Args:
            deprecated_since: Version when endpoint was deprecated (e.g., "v1.2")
            sunset_date: Date when endpoint will be removed (ISO format)
            replacement: Replacement endpoint URL
            reason: Reason for deprecation
        """
        self.deprecated_since = deprecated_since
        self.sunset_date = sunset_date
        self.replacement = replacement
        self.reason = reason
    
    def to_header_value(self) -> str:
        """Convert to Deprecation header value"""
        parts = [f"version={self.deprecated_since}"]
        if self.sunset_date:
            parts.append(f"sunset={self.sunset_date}")
        return ", ".join(parts)
    
    def to_link_header(self) -> Optional[str]:
        """Convert to Link header value for replacement"""
        if self.replacement:
            return f'<{self.replacement}>; rel="successor-version"'
        return None


def check_api_version(
    api_version: Optional[str] = Header(
        None,
        alias="API-Version",
        description="API version (e.g., v1). If not provided, defaults to current version."
    )
) -> str:
    """
    Dependency to check API version from header
    
    Args:
        api_version: API version from header
        
    Returns:
        Validated API version
        
    Raises:
        HTTPException: If version is not supported
    """
    if api_version is None:
        return APIVersion.get_current_version()
    
    if not APIVersion.is_supported(api_version):
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": ErrorCode.INVALID_INPUT.value,
                    "message": f"Unsupported API version: {api_version}",
                    "type": "UnsupportedVersionError",
                    "details": [{
                        "message": f"Supported versions: {', '.join(APIVersion.SUPPORTED_VERSIONS)}",
                        "code": ErrorCode.INVALID_INPUT.value
                    }]
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return api_version


def add_deprecation_headers(
    response,
    deprecated_info: DeprecatedEndpoint
):
    """
    Add deprecation headers to response
    
    Args:
        response: FastAPI response object
        deprecated_info: Deprecation information
    """
    response.headers["Deprecation"] = deprecated_info.to_header_value()
    
    if deprecated_info.replacement:
        link_header = deprecated_info.to_link_header()
        if link_header:
            existing_link = response.headers.get("Link", "")
            if existing_link:
                response.headers["Link"] = f"{existing_link}, {link_header}"
            else:
                response.headers["Link"] = link_header
    
    # Add warning header
    warning_msg = f'299 - "Deprecated API endpoint"'
    if deprecated_info.sunset_date:
        warning_msg += f', sunset="{deprecated_info.sunset_date}"'
    response.headers["Warning"] = warning_msg

