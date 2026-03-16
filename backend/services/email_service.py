"""
Email service for sending verification emails and notifications.
Supports SMTP and Resend HTTP API.
"""

import smtplib
import httpx
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP or Resend API."""
    
    def __init__(self):
        """Initialize email service."""
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.sender_email = settings.sender_email
        self.sender_password = settings.sender_password
        self.resend_api_key = getattr(settings, 'resend_api_key', '') or ''

    def _has_email_backend(self) -> bool:
        """Return True if any email sending backend is configured."""
        return bool(self.sender_password) or bool(self.resend_api_key)

    def _send_via_resend(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """Send email using the Resend HTTP API (https://resend.com)."""
        try:
            resp = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {self.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"PickCV <{self.sender_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html,
                    "text": text,
                },
                timeout=15,
            )
            if resp.status_code in (200, 201):
                logger.info(f"✅ Email sent via Resend to {to_email}")
                return True
            else:
                logger.error(f"❌ Resend API error ({resp.status_code}): {resp.text}")
                return False
        except Exception as e:
            logger.error(f"❌ Resend request failed: {e}")
            return False

    def _send_via_smtp(self, message: MIMEMultipart) -> bool:
        """Send email using SMTP."""
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            return True
        except Exception as e:
            logger.error(f"❌ SMTP send failed: {e}")
            return False

    def _send_email(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """
        Unified email sender: tries Resend first, then SMTP, then dev-mode logging.
        """
        # 1. Try Resend API
        if self.resend_api_key:
            return self._send_via_resend(to_email, subject, html, text)

        # 2. Try SMTP
        if self.sender_password:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email
            message.attach(MIMEText(text, "plain"))
            message.attach(MIMEText(html, "html"))
            return self._send_via_smtp(message)

        # 3. Dev mode — log only
        logger.warning(
            f"📧 EMAIL (Dev Mode — no SMTP/Resend configured)\n"
            f"   To: {to_email}\n"
            f"   Subject: {subject}"
        )
        print(f"\n📧 EMAIL (Dev Mode — no backend configured)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("=" * 60)
        return True  # Don't block the flow
    
    def send_verification_email(self, recipient_email: str, verification_token: str, frontend_url: str = "http://localhost:3000") -> bool:
        """
        Send email verification link to user.
        
        Args:
            recipient_email: Email address to send to
            verification_token: Token for verification link
            frontend_url: Frontend base URL for verification link
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            verification_link = f"{frontend_url}/verify-email?token={verification_token}"
            
            subject = "Verify your PickCV Email"
            
            html = f"""
            <html>
              <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Welcome to PickCV!</h2>
                  
                  <p>Thank you for signing up. Please verify your email address to get started.</p>
                  
                  <div style="margin: 30px 0;">
                    <a href="{verification_link}" style="background-color: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Verify Email
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">Or copy this link:</p>
                  <p style="color: #0d9488; word-break: break-all; font-size: 12px;">{verification_link}</p>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 30px;">This link expires in 24 hours.</p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  
                  <p style="color: #999; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
                </div>
              </body>
            </html>
            """
            
            text = f"Welcome to PickCV!\n\nPlease verify your email: {verification_link}\n\nThis link expires in 24 hours."
            
            return self._send_email(recipient_email, subject, html, text)
                
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return False
    
    def send_welcome_email(self, recipient_email: str, full_name: Optional[str] = None) -> bool:
        """Send welcome email after verification."""
        try:
            name = full_name or "User"
            
            subject = "Welcome to PickCV - Start Optimizing Your Resume"
            
            html = f"""\
            <html>
              <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Welcome, {name}! 🎉</h2>
                  
                  <p>Your email has been verified and you're all set to start using PickCV.</p>
                  
                  <h3 style="color: #0d9488; margin-top: 30px;">What you can do:</h3>
                  <ul>
                    <li>📄 Upload and optimize your resume</li>
                    <li>🎯 Get ATS-optimized resume suggestions</li>
                    <li>💼 Find job opportunities</li>
                    <li>📊 Track your applications</li>
                  </ul>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 30px;">Happy optimizing!</p>
                  <p style="color: #999; font-size: 12px;">The PickCV Team</p>
                </div>
              </body>
            </html>
            """
            
            text = f"Welcome, {name}!\n\nYour email has been verified. Start using PickCV to optimize your resume.\n\nThe PickCV Team"
            
            return self._send_email(recipient_email, subject, html, text)
                
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
            return False


    def send_student_invitation_email(
        self,
        recipient_email: str,
        student_name: str,
        college_name: str,
        invitation_token: str = "",
        frontend_url: str = "http://localhost:3000",
    ) -> bool:
        """
        Send invitation email to a student asking them to register on PickCV.

        Args:
            recipient_email: Student's email address
            student_name: Student name (may be empty)
            college_name: Name of the college inviting them
            invitation_token: Unique token for tracking this invitation
            frontend_url: Frontend base URL

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            name_display = student_name if student_name else "Student"
            register_link = f"{frontend_url}/auth?register=true"
            if invitation_token:
                register_link += f"&invite={invitation_token}"

            subject = f"{college_name} invites you to join PickCV"

            html = f"""
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border-radius: 8px;">
                  <h2 style="color: #0d9488;">Hello {name_display}! 🎓</h2>

                  <p><strong>{college_name}</strong> has invited you to join <strong>PickCV</strong> — an AI-powered platform that helps you build, optimize, and manage your professional resume.</p>

                  <h3 style="color: #0d9488;">What you can do on PickCV:</h3>
                  <ul>
                    <li>📄 Upload your resume and get AI-powered optimization</li>
                    <li>🎯 Get ATS-friendly suggestions tailored to job descriptions</li>
                    <li>📊 Track your skills and career readiness</li>
                    <li>💼 Discover job opportunities matched to your profile</li>
                  </ul>

                  <div style="margin: 30px 0; text-align: center;">
                    <a href="{register_link}" style="background-color: #0d9488; color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                      Register Now
                    </a>
                  </div>

                  <p style="color: #666; font-size: 14px;">Once you register and upload your first resume, your college will be able to track your career readiness and even share your profile with recruiters.</p>

                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  <p style="color: #999; font-size: 12px;">This invitation was sent by {college_name} via PickCV. If this wasn't meant for you, please ignore this email.</p>
                </div>
              </body>
            </html>
            """

            text = (
                f"Hello {name_display},\n\n"
                f"{college_name} has invited you to join PickCV — an AI-powered resume optimization platform.\n\n"
                f"Register here: {register_link}\n\n"
                f"Once you register and upload your first resume, your college can track your career readiness "
                f"and share your profile with recruiters.\n\n"
                f"This invitation was sent by {college_name} via PickCV."
            )

            return self._send_email(recipient_email, subject, html, text)

        except Exception as e:
            logger.error(f"Failed to send student invitation email: {e}")
            return False


email_service = EmailService()
