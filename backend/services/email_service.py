"""
Email service for sending verification emails and notifications.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import settings


class EmailService:
    """Service for sending emails."""
    
    def __init__(self):
        """Initialize email service."""
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.sender_email = settings.sender_email
        self.sender_password = settings.sender_password
    
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
            # Create verification link
            verification_link = f"{frontend_url}/verify-email?token={verification_token}"
            
            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Verify your PickCV Email"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # HTML content
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
            
            # Plain text content
            text = f"""\
            Welcome to PickCV!
            
            Please verify your email address by visiting this link:
            {verification_link}
            
            This link expires in 24 hours.
            
            If you didn't create this account, please ignore this email.
            """
            
            # Attach content
            message.attach(MIMEText(text, "plain"))
            message.attach(MIMEText(html, "html"))
            
            # Send email
            if not settings.sender_password:
                # No credentials configured - just log
                print(f"\n📧 EMAIL VERIFICATION (Development Mode - No SMTP Configured)")
                print(f"To: {recipient_email}")
                print(f"Verification Link: {verification_link}")
                print("=" * 60)
                print("\n💡 To send real emails, configure Mailtrap:")
                print("   1. Sign up at https://mailtrap.io (free)")
                print("   2. Add SMTP credentials to your .env file")
                print("   3. Restart the application")
                print("=" * 60 + "\n")
                return True
            else:
                # Send via SMTP
                try:
                    with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                        server.starttls()
                        server.login(self.sender_email, self.sender_password)
                        server.send_message(message)
                    print(f"\n✅ Verification email sent to {recipient_email}")
                    print(f"📧 View in Mailtrap: https://mailtrap.io/inboxes")
                    return True
                except Exception as e:
                    print(f"❌ Failed to send email: {e}")
                    # Don't block registration if email fails
                    return False
                
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return False
    
    def send_welcome_email(self, recipient_email: str, full_name: Optional[str] = None) -> bool:
        """
        Send welcome email after verification.
        
        Args:
            recipient_email: Email address to send to
            full_name: User's full name
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            name = full_name or "User"
            
            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to PickCV - Start Optimizing Your Resume"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # HTML content
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
                  
                  <div style="margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard" style="background-color: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Go to Dashboard
                    </a>
                  </div>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 30px;">Happy optimizing!</p>
                  <p style="color: #999; font-size: 12px;">The PickCV Team</p>
                </div>
              </body>
            </html>
            """
            
            # Plain text content
            text = f"""\
            Welcome, {name}!
            
            Your email has been verified. You can now use all PickCV features:
            - Upload and optimize your resume
            - Get ATS recommendations
            - Find job opportunities
            - Track applications
            
            Happy optimizing!
            The PickCV Team
            """
            
            # Attach content
            message.attach(MIMEText(text, "plain"))
            message.attach(MIMEText(html, "html"))
            
            # Send email
            if not settings.sender_password:
                print(f"\n📧 WELCOME EMAIL (Development Mode - No SMTP Configured)")
                print(f"To: {recipient_email}")
                print("=" * 60)
                return True
            else:
                try:
                    with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                        server.starttls()
                        server.login(self.sender_email, self.sender_password)
                        server.send_message(message)
                    print(f"\n✅ Welcome email sent to {recipient_email}")
                    return True
                except Exception as e:
                    print(f"❌ Failed to send welcome email: {e}")
                    return False
                
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            return False


email_service = EmailService()
