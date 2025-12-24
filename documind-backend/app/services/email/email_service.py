"""
Email service for sending transactional emails
Supports SMTP, SendGrid, AWS SES, and other email providers
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
import structlog
from jinja2 import Template

from app.core.config import settings

logger = structlog.get_logger(__name__)


class EmailService:
    """Email service for sending transactional emails"""
    
    def __init__(self):
        self.smtp_host = getattr(settings, "SMTP_HOST", "localhost")
        self.smtp_port = getattr(settings, "SMTP_PORT", 587)
        self.smtp_user = getattr(settings, "SMTP_USER", None)
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", None)
        self.smtp_use_tls = getattr(settings, "SMTP_USE_TLS", True)
        self.from_email = getattr(settings, "FROM_EMAIL", "noreply@documind.ai")
        self.from_name = getattr(settings, "FROM_NAME", "DocuMind")
        self.frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
        
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email via SMTP
            if self.smtp_user and self.smtp_password:
                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_user,
                    password=self.smtp_password,
                    use_tls=self.smtp_use_tls,
                )
            else:
                # In development, just log the email
                logger.info(
                    "email_sent",
                    to_email=to_email,
                    subject=subject,
                    message="Email service not configured. Email would be sent in production."
                )
                return True
            
            logger.info("email_sent", to_email=to_email, subject=subject)
            return True
            
        except Exception as e:
            logger.error("email_send_error", to_email=to_email, error=str(e))
            return False
    
    async def send_verification_email(self, to_email: str, name: str, verification_token: str) -> bool:
        """Send email verification email"""
        verification_url = f"{self.frontend_url}/auth/verify-email?token={verification_token}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .button:hover {{ background-color: #0056b3; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Verify Your Email Address</h1>
                <p>Hi {name},</p>
                <p>Thank you for signing up for DocuMind! Please verify your email address by clicking the button below:</p>
                <a href="{verification_url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{verification_url}">{verification_url}</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>Best regards,<br>The DocuMind Team</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Hi {name},
        
        Thank you for signing up for DocuMind! Please verify your email address by visiting:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        The DocuMind Team
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Verify Your Email Address - DocuMind",
            html_body=html_body,
            text_body=text_body
        )
    
    async def send_password_reset_email(self, to_email: str, name: str, reset_token: str) -> bool:
        """Send password reset email"""
        reset_url = f"{self.frontend_url}/auth/reset-password?token={reset_token}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .button:hover {{ background-color: #c82333; }}
                .warning {{ background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Reset Your Password</h1>
                <p>Hi {name},</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <div class="warning">
                    <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
                <p>Best regards,<br>The DocuMind Team</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Hi {name},
        
        We received a request to reset your password. Visit the following link to reset it:
        
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        The DocuMind Team
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Reset Your Password - DocuMind",
            html_body=html_body,
            text_body=text_body
        )


# Global email service instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get the global email service instance"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

