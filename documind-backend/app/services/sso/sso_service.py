"""
SSO (Single Sign-On) service for OAuth2/OIDC providers
Supports Google, Microsoft, Okta, and other OAuth2 providers
"""

from typing import Optional, Dict, Tuple
import secrets
import base64
from authlib.integrations.httpx_client import AsyncOAuth2Client
from authlib.oauth2.rfc6749 import OAuth2Token
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class SSOService:
    """SSO service for OAuth2/OIDC authentication"""
    
    def __init__(self):
        self.redirect_uri = settings.SSO_REDIRECT_URI
        self.google_client_id = getattr(settings, "SSO_GOOGLE_CLIENT_ID", None)
        self.google_client_secret = getattr(settings, "SSO_GOOGLE_CLIENT_SECRET", None)
        self.microsoft_client_id = getattr(settings, "SSO_MICROSOFT_CLIENT_ID", None)
        self.microsoft_client_secret = getattr(settings, "SSO_MICROSOFT_CLIENT_SECRET", None)
        self.okta_domain = getattr(settings, "SSO_OKTA_DOMAIN", None)
        self.okta_client_id = getattr(settings, "SSO_OKTA_CLIENT_ID", None)
        self.okta_client_secret = getattr(settings, "SSO_OKTA_CLIENT_SECRET", None)
    
    def generate_state_token(self) -> str:
        """Generate a secure state token for CSRF protection"""
        random_bytes = secrets.token_bytes(32)
        return base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    
    def get_provider_config(self, provider: str) -> Optional[Dict]:
        """Get OAuth2 configuration for a provider"""
        configs = {
            "google": {
                "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
                "scopes": ["openid", "email", "profile"],
                "client_id": self.google_client_id,
                "client_secret": self.google_client_secret,
            },
            "microsoft": {
                "authorize_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                "userinfo_url": "https://graph.microsoft.com/v1.0/me",
                "scopes": ["openid", "email", "profile"],
                "client_id": self.microsoft_client_id,
                "client_secret": self.microsoft_client_secret,
            },
            "okta": {
                "authorize_url": f"https://{self.okta_domain}/oauth2/v1/authorize",
                "token_url": f"https://{self.okta_domain}/oauth2/v1/token",
                "userinfo_url": f"https://{self.okta_domain}/oauth2/v1/userinfo",
                "scopes": ["openid", "email", "profile"],
                "client_id": self.okta_client_id,
                "client_secret": self.okta_client_secret,
            },
        }
        
        return configs.get(provider.lower())
    
    async def initiate_oauth(self, provider: str, redirect_uri: Optional[str] = None) -> Tuple[str, str]:
        """
        Initiate OAuth2 flow
        
        Returns:
            Tuple of (authorization_url, state_token)
        """
        config = self.get_provider_config(provider)
        if not config:
            raise ValueError(f"Unsupported SSO provider: {provider}")
        
        if not config["client_id"] or not config["client_secret"]:
            raise ValueError(f"SSO provider {provider} is not configured")
        
        state_token = self.generate_state_token()
        redirect_uri = redirect_uri or self.redirect_uri
        
        client = AsyncOAuth2Client(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=redirect_uri,
        )
        
        authorization_url, _ = client.create_authorization_url(
            config["authorize_url"],
            state=state_token,
            scope=" ".join(config["scopes"]),
        )
        
        return authorization_url, state_token
    
    async def exchange_code_for_token(
        self,
        provider: str,
        code: str,
        redirect_uri: Optional[str] = None
    ) -> OAuth2Token:
        """
        Exchange authorization code for access token
        
        Returns:
            OAuth2Token object with access_token and user info
        """
        config = self.get_provider_config(provider)
        if not config:
            raise ValueError(f"Unsupported SSO provider: {provider}")
        
        redirect_uri = redirect_uri or self.redirect_uri
        
        client = AsyncOAuth2Client(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=redirect_uri,
        )
        
        token = await client.fetch_token(
            config["token_url"],
            code=code,
        )
        
        return token
    
    async def get_user_info(self, provider: str, access_token: str) -> Dict:
        """
        Get user information from provider
        
        Returns:
            Dictionary with user information (email, name, etc.)
        """
        config = self.get_provider_config(provider)
        if not config:
            raise ValueError(f"Unsupported SSO provider: {provider}")
        
        client = AsyncOAuth2Client(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
        )
        
        async with client:
            resp = await client.get(
                config["userinfo_url"],
                token=access_token,
            )
            resp.raise_for_status()
            user_info = resp.json()
        
        # Normalize user info across providers
        normalized = {
            "email": user_info.get("email") or user_info.get("mail") or user_info.get("userPrincipalName"),
            "name": user_info.get("name") or user_info.get("displayName") or f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip(),
            "provider_id": user_info.get("id") or user_info.get("sub"),
        }
        
        return normalized


# Global SSO service instance
_sso_service: Optional[SSOService] = None


def get_sso_service() -> SSOService:
    """Get the global SSO service instance"""
    global _sso_service
    if _sso_service is None:
        _sso_service = SSOService()
    return _sso_service

