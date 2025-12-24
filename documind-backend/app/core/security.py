"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Handle bcrypt 72-byte limit
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Verify using bcrypt directly
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Bcrypt has a 72 byte limit - truncate if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generate salt and hash using bcrypt directly
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Verify token type
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT refresh token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Verify token type
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def generate_api_key(prefix: str = "dm_live_") -> str:
    """Generate a secure API key"""
    import secrets
    import base64
    
    # Generate 32 random bytes
    random_bytes = secrets.token_bytes(32)
    # Encode to base64url (URL-safe base64)
    key_suffix = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    # Combine prefix and suffix
    api_key = f"{prefix}{key_suffix}"
    return api_key


def hash_api_key(api_key: str) -> str:
    """Hash an API key using bcrypt (similar to password hashing)"""
    # API keys can be longer than 72 bytes, so we hash them first with SHA256
    # then use bcrypt on the hash
    import hashlib
    
    # First hash with SHA256 to get a fixed-length string
    sha256_hash = hashlib.sha256(api_key.encode('utf-8')).hexdigest()
    # Then use bcrypt on the SHA256 hash
    return get_password_hash(sha256_hash)


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """Verify an API key against its hash"""
    import hashlib
    
    # Hash the plain key with SHA256 first
    sha256_hash = hashlib.sha256(plain_key.encode('utf-8')).hexdigest()
    # Then verify against the bcrypt hash
    return verify_password(sha256_hash, hashed_key)