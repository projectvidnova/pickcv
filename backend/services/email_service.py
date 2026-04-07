"""
Email service for sending transactional emails.

Priority chain:  SendGrid → Resend → SMTP → Dev-mode console log.

Supported emails:
  • Email verification (registration)
  • Welcome email (after verification)
  • Payment / subscription confirmation
  • Student invitation (college module)
"""

import smtplib
import httpx
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


# ─── Branded HTML wrapper ────────────────────────────────────

def _wrap_html(body_html: str) -> str:
    """Wrap email body in a consistent PickCV branded template."""
    return f"""\
<html>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="color:#0d9488; font-size:28px; margin:0; letter-spacing:-0.5px;">PickCV</h1>
      <p style="color:#94a3b8; font-size:13px; margin:4px 0 0;">AI-Powered Resume Optimization</p>
    </div>
    <div style="background:#ffffff; border-radius:12px; padding:36px 32px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      {body_html}
    </div>
    <div style="text-align:center; margin-top:30px; color:#94a3b8; font-size:12px;">
      <p style="margin:0;">&copy; 2025 PickCV. All rights reserved.</p>
      <p style="margin:4px 0 0;">You're receiving this because you have a PickCV account.</p>
    </div>
  </div>
</body>
</html>"""


class EmailService:
    """Transactional email service with SendGrid / Resend / SMTP fallback."""

    def __init__(self):
        self.sendgrid_api_key: str = getattr(settings, "sendgrid_api_key", "") or ""
        self.resend_api_key: str = getattr(settings, "resend_api_key", "") or ""
        self.smtp_server: str = settings.smtp_server
        self.smtp_port: int = settings.smtp_port
        self.sender_email: str = settings.sender_email
        self.sender_password: str = settings.sender_password

    # ── Low-level senders ─────────────────────────────────────

    def _send_via_sendgrid(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """Send via Twilio SendGrid Web API v3 (uses plain httpx — no SDK needed)."""
        try:
            resp = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {self.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": self.sender_email, "name": "PickCV"},
                    "subject": subject,
                    "content": [
                        {"type": "text/plain", "value": text},
                        {"type": "text/html", "value": html},
                    ],
                },
                timeout=15,
            )
            if resp.status_code in (200, 201, 202):
                logger.info("✅ Email sent via SendGrid to %s", to_email)
                return True
            else:
                logger.error("❌ SendGrid error (%s): %s", resp.status_code, resp.text)
                return False
        except Exception as e:
            logger.error("❌ SendGrid request failed: %s", e)
            return False

    def _send_via_resend(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """Send via Resend HTTP API."""
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
                logger.info("✅ Email sent via Resend to %s", to_email)
                return True
            else:
                logger.error("❌ Resend error (%s): %s", resp.status_code, resp.text)
                return False
        except Exception as e:
            logger.error("❌ Resend request failed: %s", e)
            return False

    def _send_via_smtp(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """Send via SMTP (Gmail, etc.)."""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email
            message.attach(MIMEText(text, "plain"))
            message.attach(MIMEText(html, "html"))
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            logger.info("✅ Email sent via SMTP to %s", to_email)
            return True
        except Exception as e:
            logger.error("❌ SMTP send failed: %s", e)
            return False

    def _send_email(self, to_email: str, subject: str, html: str, text: str) -> bool:
        """Unified sender — tries providers in priority order with fallback."""
        # 1. SendGrid (primary)
        if self.sendgrid_api_key:
            if self._send_via_sendgrid(to_email, subject, html, text):
                return True
            logger.warning("SendGrid failed for %s — trying fallback providers", to_email)
        # 2. Resend (fallback)
        if self.resend_api_key:
            if self._send_via_resend(to_email, subject, html, text):
                return True
            logger.warning("Resend failed for %s — trying next fallback", to_email)
        # 3. SMTP (fallback)
        if self.sender_password:
            if self._send_via_smtp(to_email, subject, html, text):
                return True
            logger.warning("SMTP failed for %s — no more providers", to_email)
        # 4. Dev mode — console log only (no provider configured or all failed)
        if not (self.sendgrid_api_key or self.resend_api_key or self.sender_password):
            logger.warning(
                "📧 EMAIL (Dev Mode — no provider configured)  To: %s  Subject: %s",
                to_email, subject,
            )
            print(f"\n📧 DEV EMAIL → {to_email}")
            print(f"   Subject: {subject}")
            print("=" * 60)
            return True  # Don't block the flow in dev
        return False

    # ── Public email methods ──────────────────────────────────

    def send_email(self, to_email: str, subject: str, body_html: str) -> bool:
        """Send a branded email with auto-generated plain-text fallback.

        This is the general-purpose public sender used by recruiter_service
        and any other caller that already has its own HTML body.
        """
        import re as _re
        text = _re.sub(r'<[^>]+>', '', body_html).strip()
        return self._send_email(to_email, subject, _wrap_html(body_html), text)

    def send_verification_email(
        self,
        recipient_email: str,
        verification_token: str,
        frontend_url: str = "",
    ) -> bool:
        """Send email verification link after registration."""
        try:
            base = frontend_url or settings.frontend_url
            verification_link = f"{base}/verify-email?token={verification_token}"

            subject = "Verify your PickCV Email"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Welcome to PickCV! 🎉</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Thank you for signing up. Please verify your email address to get started.
</p>
<div style="text-align:center; margin:32px 0;">
  <a href="{verification_link}"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Verify Email Address
  </a>
</div>
<p style="color:#64748b; font-size:13px;">Or copy this link into your browser:</p>
<p style="color:#0d9488; word-break:break-all; font-size:12px; background:#f0fdfa;
          padding:10px; border-radius:6px;">{verification_link}</p>
<p style="color:#94a3b8; font-size:12px; margin-top:24px;">This link expires in 24 hours.</p>
<p style="color:#94a3b8; font-size:12px;">If you didn't create this account, please ignore this email.</p>"""

            text = (
                f"Welcome to PickCV!\n\n"
                f"Please verify your email: {verification_link}\n\n"
                f"This link expires in 24 hours."
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send verification email: %s", e)
            return False

    def send_welcome_email(
        self, recipient_email: str, full_name: Optional[str] = None, frontend_url: str = ""
    ) -> bool:
        """Send welcome email after email verification."""
        try:
            base = frontend_url or settings.frontend_url
            name = full_name or "there"
            subject = "Welcome to PickCV — Let's Optimize Your Resume"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Welcome, {name}! 🚀</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Your email is verified and you're all set. Here's what you can do next:
</p>
<table style="width:100%; margin:24px 0;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
    <span style="font-size:20px;">📄</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Upload your resume and get an instant ATS score</span>
  </td></tr>
  <tr><td style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
    <span style="font-size:20px;">🎯</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Optimize for specific job descriptions with AI</span>
  </td></tr>
  <tr><td style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
    <span style="font-size:20px;">💼</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Browse and apply to matching job opportunities</span>
  </td></tr>
  <tr><td style="padding:12px 0;">
    <span style="font-size:20px;">📊</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Track your progress and skill gaps</span>
  </td></tr>
</table>
<div style="text-align:center; margin:28px 0;">
  <a href="{base}/onboarding"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Get Started
  </a>
</div>
<p style="color:#94a3b8; font-size:13px; text-align:center;">Happy optimizing! — The PickCV Team</p>"""

            text = (
                f"Welcome, {name}!\n\n"
                f"Your email is verified. Start using PickCV to optimize your resume.\n\n"
                f"Get started: {base}/onboarding\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send welcome email: %s", e)
            return False

    def send_payment_confirmation_email(
        self,
        recipient_email: str,
        full_name: Optional[str] = None,
        amount: Optional[float] = None,
        plan_type: str = "resume_download",
        payment_id: str = "",
        frontend_url: str = "",
    ) -> bool:
        """Send payment / subscription confirmation email."""
        try:
            base = frontend_url or settings.frontend_url
            name = full_name or "there"
            amount_str = f"₹{amount:.0f}" if amount else "—"

            plan_labels = {
                "resume_download": "Resume Download",
                "subscription_monthly": "Monthly Plan (30 days)",
                "subscription_yearly": "Annual Plan (365 days)",
            }
            plan_label = plan_labels.get(plan_type, plan_type)
            is_subscription = "subscription" in plan_type

            subject = (
                "Your PickCV subscription is active!"
                if is_subscription
                else "Payment confirmed — PickCV"
            )

            sub_note = ""
            if is_subscription:
                sub_note = """\
<div style="background:#f0fdfa; border-radius:8px; padding:16px; margin:20px 0;">
  <p style="color:#0d9488; font-weight:600; margin:0 0 6px;">✅ Subscription Active</p>
  <p style="color:#334155; font-size:14px; margin:0;">
    You now have <strong>unlimited resume downloads</strong> for the duration of your plan. Enjoy!
  </p>
</div>"""

            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Payment Confirmed! 🎉</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Hi {name}, your payment was successful. Here's your receipt:
</p>
<table style="width:100%; margin:24px 0; border-collapse:collapse;">
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Plan</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; font-weight:600; text-align:right; border-bottom:1px solid #f1f5f9;">{plan_label}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Amount</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; font-weight:600; text-align:right; border-bottom:1px solid #f1f5f9;">{amount_str}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px;">Payment ID</td>
    <td style="padding:10px 0; color:#334155; font-size:13px; text-align:right; font-family:monospace;">{payment_id or '—'}</td>
  </tr>
</table>
{sub_note}
<div style="text-align:center; margin:28px 0;">
  <a href="{base}/profile"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Go to Dashboard
  </a>
</div>
<p style="color:#94a3b8; font-size:12px;">Questions? Contact us at support@pickcv.com</p>"""

            text = (
                f"Hi {name},\n\n"
                f"Your payment was successful.\n"
                f"Plan: {plan_label}\n"
                f"Amount: {amount_str}\n"
                f"Payment ID: {payment_id}\n\n"
                f"Visit {base}/profile to continue.\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send payment confirmation email: %s", e)
            return False

    def send_student_invitation_email(
        self,
        recipient_email: str,
        student_name: str,
        college_name: str,
        invitation_token: str = "",
        frontend_url: str = "",
    ) -> bool:
        """Send invitation email to a student from their college."""
        try:
            base = frontend_url or settings.frontend_url
            name_display = student_name if student_name else "Student"
            register_link = f"{base}/invite"
            if invitation_token:
                register_link += f"?token={invitation_token}"

            subject = f"{college_name} invites you to join PickCV"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Hello {name_display}! 🎓</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  <strong>{college_name}</strong> has invited you to join <strong>PickCV</strong> —
  an AI-powered platform that helps you build, optimize, and manage your professional resume.
</p>
<table style="width:100%; margin:24px 0;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
    <span style="font-size:18px;">📄</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Upload your resume and get AI-powered optimization</span>
  </td></tr>
  <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
    <span style="font-size:18px;">🎯</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Get ATS-friendly suggestions for any job</span>
  </td></tr>
  <tr><td style="padding:10px 0;">
    <span style="font-size:18px;">💼</span>
    <span style="color:#334155; font-size:14px; margin-left:8px;">Discover matched job opportunities</span>
  </td></tr>
</table>
<div style="text-align:center; margin:28px 0;">
  <a href="{register_link}"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Register Now
  </a>
</div>
<p style="color:#64748b; font-size:13px;">
  Once you register and upload your first resume, your college will be able to
  track your career readiness and share your profile with recruiters.
</p>
<p style="color:#94a3b8; font-size:12px; margin-top:24px;">
  This invitation was sent by {college_name} via PickCV.
  If this wasn't meant for you, please ignore this email.
</p>"""

            text = (
                f"Hello {name_display},\n\n"
                f"{college_name} has invited you to join PickCV.\n\n"
                f"Register here: {register_link}\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send student invitation email: %s", e)
            return False


    def send_student_college_linked_email(
        self,
        recipient_email: str,
        student_name: str,
        college_name: str,
        frontend_url: str = "",
    ) -> bool:
        """Notify an existing user that their college has added them to PickCV."""
        try:
            base = frontend_url or settings.frontend_url
            name_display = student_name if student_name else "Student"
            dashboard_link = f"{base}/profile"

            subject = f"{college_name} has linked your PickCV profile"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Hello {name_display}! 🎓</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  <strong>{college_name}</strong> has added you to their student network on
  <strong>PickCV</strong>. Your college can now track your career readiness
  and share your profile with top recruiters.
</p>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Make sure your resume is up to date so you don't miss any opportunities!
</p>
<div style="text-align:center; margin:28px 0;">
  <a href="{dashboard_link}"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Go to Dashboard
  </a>
</div>
<p style="color:#94a3b8; font-size:12px; margin-top:24px;">
  This notification was sent by {college_name} via PickCV.
</p>"""

            text = (
                f"Hello {name_display},\n\n"
                f"{college_name} has added you to their student network on PickCV.\n\n"
                f"Visit your dashboard: {dashboard_link}\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send college-linked notification email: %s", e)
            return False


    def send_college_registration_confirmation(
        self,
        recipient_email: str,
        institution_name: str,
        contact_person_name: str,
    ) -> bool:
        """Send thank-you email to institution after registration."""
        try:
            name = contact_person_name or "there"
            subject = "Thank you for registering with PickCV!"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Thank You for Registering! \U0001f3eb</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Hi {name},
</p>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Thank you for registering <strong>{institution_name}</strong> on PickCV.
  Your application has been received and is currently under review by our admin team.
</p>
<div style="background:#fffbeb; border-radius:8px; padding:16px; margin:20px 0; border-left:4px solid #f59e0b;">
  <p style="color:#92400e; font-weight:600; margin:0 0 6px;">\u23f3 Under Review</p>
  <p style="color:#78350f; font-size:14px; margin:0;">
    Our admin team will review and approve your request within <strong>48 hours</strong>.
    You will receive an email notification once your account has been approved.
  </p>
</div>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Once approved, you can log in to your institution dashboard and start inviting students,
  managing placements, and more.
</p>
<p style="color:#94a3b8; font-size:12px; margin-top:24px;">
  If you have any questions, contact us at support@pickcv.com
</p>"""

            text = (
                f"Hi {name},\n\n"
                f"Thank you for registering {institution_name} on PickCV.\n\n"
                f"Your application is under review. Our admin team will review and approve "
                f"your request within 48 hours. You will receive an email once approved.\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send college registration confirmation email: %s", e)
            return False

    def send_admin_new_registration_alert(
        self,
        admin_email: str,
        institution_name: str,
        official_email: str,
        contact_person_name: str,
        designation: str,
        city: str,
        state: str,
    ) -> bool:
        """Notify admin about a new college registration."""
        try:
            subject = f"New Institution Registration: {institution_name}"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">New Registration Alert \U0001f514</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  A new institution has registered on PickCV and is awaiting approval.
</p>
<table style="width:100%; margin:24px 0; border-collapse:collapse;">
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Institution</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; font-weight:600; text-align:right; border-bottom:1px solid #f1f5f9;">{institution_name}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Email</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; text-align:right; border-bottom:1px solid #f1f5f9;">{official_email}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Contact Person</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; text-align:right; border-bottom:1px solid #f1f5f9;">{contact_person_name}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9;">Designation</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; text-align:right; border-bottom:1px solid #f1f5f9;">{designation}</td>
  </tr>
  <tr>
    <td style="padding:10px 0; color:#64748b; font-size:14px;">Location</td>
    <td style="padding:10px 0; color:#334155; font-size:14px; text-align:right;">{city}, {state}</td>
  </tr>
</table>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Please review and approve or reject this registration from the admin dashboard.
</p>"""

            text = (
                f"New Institution Registration\n\n"
                f"Institution: {institution_name}\n"
                f"Email: {official_email}\n"
                f"Contact: {contact_person_name} ({designation})\n"
                f"Location: {city}, {state}\n\n"
                f"Please review this from the admin dashboard."
            )
            return self._send_email(admin_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send admin registration alert: %s", e)
            return False

    def send_college_approval_email(
        self,
        recipient_email: str,
        institution_name: str,
        contact_person_name: str,
        frontend_url: str = "",
    ) -> bool:
        """Notify institution that their registration has been approved."""
        try:
            base = frontend_url or settings.frontend_url
            name = contact_person_name or "there"
            login_link = f"{base}/college/login"

            subject = "Your PickCV registration has been approved!"
            body = f"""\
<h2 style="color:#0d9488; margin:0 0 16px;">Registration Approved! \U0001f389</h2>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Hi {name},
</p>
<p style="color:#334155; font-size:15px; line-height:1.6;">
  Great news! Your registration for <strong>{institution_name}</strong> on PickCV
  has been reviewed and <strong>approved</strong> by our admin team.
</p>
<div style="background:#f0fdfa; border-radius:8px; padding:16px; margin:20px 0; border-left:4px solid #0d9488;">
  <p style="color:#0d9488; font-weight:600; margin:0 0 6px;">\u2705 Account Active</p>
  <p style="color:#334155; font-size:14px; margin:0;">
    You can now sign in to your institution dashboard and start managing your students.
  </p>
</div>
<div style="text-align:center; margin:28px 0;">
  <a href="{login_link}"
     style="background:linear-gradient(135deg,#0d9488,#10b981); color:white;
            padding:14px 40px; text-decoration:none; border-radius:8px;
            display:inline-block; font-weight:600; font-size:15px;">
    Sign In Now
  </a>
</div>
<p style="color:#94a3b8; font-size:12px; margin-top:24px;">
  If you have any questions, contact us at support@pickcv.com
</p>"""

            text = (
                f"Hi {name},\n\n"
                f"Great news! Your registration for {institution_name} on PickCV has been approved.\n\n"
                f"You can now sign in at: {login_link}\n\n"
                f"The PickCV Team"
            )
            return self._send_email(recipient_email, subject, _wrap_html(body), text)
        except Exception as e:
            logger.error("Failed to send college approval email: %s", e)
            return False


email_service = EmailService()
