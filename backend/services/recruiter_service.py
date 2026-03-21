"""Recruiter service — authentication, email helpers, job auto-pause cron."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Recruiter, RecruiterJob
from services.auth_service import auth_service
from services.email_service import email_service
from config import settings

logger = logging.getLogger(__name__)


class RecruiterService:
    """Business logic for recruiter module."""

    # ─── Auth ─────────────────────────────────────────────

    def create_recruiter_token(self, recruiter_id: int, email: str) -> str:
        return auth_service.create_access_token(
            data={"sub": str(recruiter_id), "type": "recruiter", "email": email}
        )

    def create_verification_token(self, recruiter_id: int) -> str:
        return auth_service.create_access_token(
            data={"sub": str(recruiter_id), "type": "recruiter_verify"},
            expires_delta=timedelta(hours=24),
        )

    # ─── Email helpers ────────────────────────────────────

    def send_recruiter_verification_email(self, email: str, token: str, frontend_origin: str = ""):
        base = frontend_origin or settings.frontend_url
        verify_url = f"{base}/recruiter/verify-email?token={token}"
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">Verify Your Recruiter Account</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Thanks for registering on <strong>PickCV</strong> as a recruiter.
            Please verify your email to proceed.
        </p>
        <div style="text-align:center; margin:32px 0;">
            <a href="{verify_url}"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Verify Email
            </a>
        </div>
        <p style="color:#94a3b8; font-size:13px;">
            If the button doesn't work, copy this link:<br>
            <a href="{verify_url}" style="color:#0d9488;">{verify_url}</a>
        </p>
        """
        email_service.send_email(email, "Verify your PickCV recruiter account", body)

    def send_admin_approval_notification(self, recruiter: Recruiter, frontend_origin: str = ""):
        """Notify the PickCV team at connect@pickcv.com that a new company registered."""
        base = frontend_origin or settings.frontend_url
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">🏢 New Company Registration</h2>
        <p style="color:#4a5568; line-height:1.6;">
            A new company has completed email verification and is awaiting approval.
            Please review the details below and approve or reject from the admin portal.
        </p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Contact Name</td>
                <td style="padding:12px 8px; font-weight:600; color:#1a1a2e;">{recruiter.full_name}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Email</td>
                <td style="padding:12px 8px; color:#1a1a2e;"><a href="mailto:{recruiter.email}" style="color:#0d9488;">{recruiter.email}</a></td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Phone</td>
                <td style="padding:12px 8px; color:#1a1a2e;">{recruiter.phone or 'Not provided'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Company Name</td>
                <td style="padding:12px 8px; font-weight:600; color:#1a1a2e;">{recruiter.company_name}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Company Website</td>
                <td style="padding:12px 8px; color:#1a1a2e;">{recruiter.company_website or 'Not provided'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Company Size</td>
                <td style="padding:12px 8px; color:#1a1a2e;">{recruiter.company_size or 'Not provided'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Industry</td>
                <td style="padding:12px 8px; color:#1a1a2e;">{recruiter.industry or 'Not provided'}</td>
            </tr>
            <tr>
                <td style="padding:12px 8px; color:#64748b; font-size:14px;">Designation</td>
                <td style="padding:12px 8px; color:#1a1a2e;">{recruiter.designation or 'Not provided'}</td>
            </tr>
        </table>
        <div style="text-align:center; margin:28px 0;">
            <a href="{base}/admin/recruiters"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Login to Admin Portal &amp; Approve
            </a>
        </div>
        <p style="color:#94a3b8; font-size:13px; text-align:center;">Please review and approve within 24 hours.</p>
        """
        email_service.send_email("connect@pickcv.com", f"New Company Registration — {recruiter.company_name}", body)

    def send_verification_success_email(self, recruiter: Recruiter, frontend_origin: str = ""):
        """Notify recruiter that email verification succeeded — wait for admin approval."""
        base = frontend_origin or settings.frontend_url
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">Email Verified Successfully! ✅</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Hi <strong>{recruiter.full_name}</strong>, your email has been verified successfully.
        </p>
        <div style="background:#fffbeb; border:1px solid #fbbf24; border-radius:12px; padding:20px; margin:24px 0;">
            <p style="color:#92400e; font-weight:600; margin:0 0 8px;">⏳ What happens next?</p>
            <p style="color:#78350f; margin:0; line-height:1.6;">
                Our team will review your company registration and confirm your account
                within <strong>24 hours</strong> if everything checks out. You'll receive
                an email once your account is approved.
            </p>
        </div>
        <p style="color:#4a5568; line-height:1.6;">
            In the meantime, if you have any questions, feel free to reach out to us at
            <a href="mailto:connect@pickcv.com" style="color:#0d9488; font-weight:600;">connect@pickcv.com</a>.
        </p>
        <p style="color:#94a3b8; font-size:13px; margin-top:24px;">Thank you for choosing PickCV!</p>
        """
        email_service.send_email(recruiter.email, "PickCV — Email Verified, Registration Under Review", body)

    def send_welcome_email(self, recruiter: Recruiter, frontend_origin: str = ""):
        base = frontend_origin or settings.frontend_url
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">Registration Approved — Welcome to PickCV! 🎉</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Hi <strong>{recruiter.full_name}</strong>, great news!
        </p>
        <div style="background:#f0fdf4; border:1px solid #22c55e; border-radius:12px; padding:20px; margin:20px 0;">
            <p style="color:#166534; font-weight:600; margin:0 0 8px;">✅ Your registration has been approved!</p>
            <p style="color:#15803d; margin:0; line-height:1.6;">
                Your recruiter account for <strong>{recruiter.company_name}</strong> is now active.
                You can log in and start posting jobs, reviewing candidates, and finding top talent.
            </p>
        </div>
        <div style="text-align:center; margin:32px 0;">
            <a href="{base}/recruiter/login"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Login to Your Account
            </a>
        </div>
        <p style="color:#4a5568; line-height:1.6; font-size:14px;">
            If you have any questions, contact us at
            <a href="mailto:connect@pickcv.com" style="color:#0d9488;">connect@pickcv.com</a>.
        </p>
        """
        email_service.send_email(recruiter.email, "PickCV — Registration Approved! You Can Now Login", body)

    def send_rejection_email(self, recruiter: Recruiter, reason: str):
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">Account Review Update</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Hi {recruiter.full_name}, we've reviewed your recruiter registration
            for <strong>{recruiter.company_name}</strong>.
        </p>
        <p style="color:#e53e3e; line-height:1.6;">
            Unfortunately, we were unable to approve your account at this time.
        </p>
        <p style="color:#4a5568;"><strong>Reason:</strong> {reason}</p>
        <p style="color:#4a5568;">
            If you think this is a mistake, please contact us at support@pickcv.com.
        </p>
        """
        email_service.send_email(recruiter.email, "PickCV Recruiter Account Update", body)

    def send_interviewer_invite(self, interviewer_email: str, recruiter: Recruiter, token: str, frontend_origin: str = ""):
        base = frontend_origin or settings.frontend_url
        accept_url = f"{base}/recruiter/accept-invite?token={token}"
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">You've been invited to interview!</h2>
        <p style="color:#4a5568; line-height:1.6;">
            <strong>{recruiter.full_name}</strong> from <strong>{recruiter.company_name}</strong>
            has invited you to join their interview panel on PickCV.
        </p>
        <div style="text-align:center; margin:32px 0;">
            <a href="{accept_url}"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Accept Invitation
            </a>
        </div>
        """
        email_service.send_email(interviewer_email, f"Interview Panel Invite — {recruiter.company_name}", body)

    def send_interview_invite_email(
        self, candidate_email: str, candidate_name: str,
        job_title: str, company_name: str,
        round_title: str, scheduled_at: datetime,
        meet_link: str | None,
    ):
        time_str = scheduled_at.strftime("%B %d, %Y at %I:%M %p UTC")
        meet_html = f'<p style="text-align:center; margin:24px 0;"><a href="{meet_link}" style="background:#0d9488; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; display:inline-block;">Join Google Meet</a></p>' if meet_link else ""
        body = f"""
        <h2 style="color:#1a1a2e;">Interview Invitation</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Hi {candidate_name}, you have an upcoming interview for
            <strong>{job_title}</strong> at <strong>{company_name}</strong>.
        </p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
            <tr><td style="padding:8px; color:#64748b;">Round</td><td style="padding:8px; font-weight:600;">{round_title}</td></tr>
            <tr><td style="padding:8px; color:#64748b;">When</td><td style="padding:8px; font-weight:600;">{time_str}</td></tr>
        </table>
        {meet_html}
        """
        email_service.send_email(candidate_email, f"Interview: {round_title} — {company_name}", body)

    def send_offer_email(
        self, candidate_email: str, candidate_name: str,
        job_title: str, company_name: str,
        offer_url: str,
    ):
        body = f"""
        <h2 style="color:#1a1a2e;">Congratulations, {candidate_name}! 🎉</h2>
        <p style="color:#4a5568; line-height:1.6;">
            We are pleased to offer you the position of
            <strong>{job_title}</strong> at <strong>{company_name}</strong>.
        </p>
        <div style="text-align:center; margin:32px 0;">
            <a href="{offer_url}"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                View & Respond to Offer
            </a>
        </div>
        """
        email_service.send_email(candidate_email, f"Offer Letter — {company_name}", body)

    # ─── Job Auto-Pause Cron ─────────────────────────────

    async def auto_pause_expired_jobs(self, db: AsyncSession):
        """Background task: pause jobs whose pause_date has passed."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            update(RecruiterJob)
            .where(
                and_(
                    RecruiterJob.status == "open",
                    RecruiterJob.pause_date != None,  # noqa: E711
                    RecruiterJob.pause_date <= now,
                )
            )
            .values(status="paused", paused_at=now)
            .returning(RecruiterJob.id)
        )
        paused_ids = [row[0] for row in result.fetchall()]
        if paused_ids:
            await db.commit()
            logger.info(f"Auto-paused {len(paused_ids)} jobs: {paused_ids}")
        return paused_ids

    def generate_invitation_token(self) -> str:
        return secrets.token_urlsafe(32)


recruiter_service = RecruiterService()
