"""
Two-Factor Authentication (2FA) service using TOTP
"""

import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from typing import List, Tuple, Optional
import structlog

logger = structlog.get_logger(__name__)


class TwoFactorService:
    """Two-Factor Authentication service using TOTP"""
    
    def generate_secret(self) -> str:
        """Generate a TOTP secret key"""
        return pyotp.random_base32()
    
    def generate_qr_code_url(self, secret: str, email: str, issuer: str = "DocuMind") -> str:
        """
        Generate QR code URL for authenticator app
        
        Args:
            secret: TOTP secret key
            email: User email
            issuer: Service name
        
        Returns:
            QR code data URL
        """
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=issuer
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 data URL
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/png;base64,{img_base64}"
    
    def verify_totp(self, secret: str, code: str) -> bool:
        """
        Verify a TOTP code
        
        Args:
            secret: TOTP secret key
            code: TOTP code from authenticator app
        
        Returns:
            True if code is valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=1)  # Allow 1 time step tolerance
        except Exception as e:
            logger.error("totp_verify_error", error=str(e))
            return False
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """
        Generate backup codes for 2FA recovery
        
        Args:
            count: Number of backup codes to generate
        
        Returns:
            List of backup codes
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_urlsafe(8).upper()[:8]
            codes.append(code)
        return codes
    
    def hash_backup_code(self, code: str) -> str:
        """
        Hash a backup code for storage
        
        Args:
            code: Plain backup code
        
        Returns:
            Hashed backup code
        """
        # Use SHA256 hash for backup codes (simpler than bcrypt for codes)
        return hashlib.sha256(code.encode('utf-8')).hexdigest()
    
    def verify_backup_code(self, code: str, hashed_codes: List[str]) -> bool:
        """
        Verify a backup code
        
        Args:
            code: Plain backup code
            hashed_codes: List of hashed backup codes
        
        Returns:
            True if code matches any hashed code, False otherwise
        """
        code_hash = self.hash_backup_code(code)
        return code_hash in hashed_codes


# Global 2FA service instance
_two_factor_service: Optional[TwoFactorService] = None


def get_two_factor_service() -> TwoFactorService:
    """Get the global 2FA service instance"""
    global _two_factor_service
    if _two_factor_service is None:
        _two_factor_service = TwoFactorService()
    return _two_factor_service

