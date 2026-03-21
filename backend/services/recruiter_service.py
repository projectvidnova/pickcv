"""Recruiter service — authentication, email helpers, job auto-pause cron."""
import logging
import secrets
from datetime import datetime, timezone

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
            expires_minutes=1440,  # 24 hours
        )

    # ─── Email helpers ────────────────────────────────────

    async def send_recruiter_verification_email(self, email: str, token: str):
        verify_url = f"{settings.frontend_url}/recruiter/verify-email?token={token}"
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
        await email_service.send_email(email, "Verify your PickCV recruiter account", body)

    async def send_admin_approval_notification(self, recruiter: Recruiter):
        """Notify admins that a new recruiter needs approval."""
        body = f"""
        <h2 style="color:#1a1a2e;">New Recruiter Pending Approval</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; color:#64748b;">Name</td><td style="padding:8px; font-weight:600;">{recruiter.full_name}</td></tr>
            <tr><td style="padding:8px; color:#64748b;">Email</td><td style="padding:8px;">{recruiter.email}</td></tr>
            <tr><td style="padding:8px; color:#64748b;">Company</td><td style="padding:8px; font-weight:600;">{recruiter.company_name}</td></tr>
            <tr><td style="padding:8px; color:#64748b;">Industry</td><td style="padding:8px;">{recruiter.industry or 'N/A'}</td></tr>
            <tr><td style="padding:8px; color:#64748b;">Designation</td><td style="padding:8px;">{recruiter.designation or 'N/A'}</td></tr>
        </table>
        <div style="text-align:center; margin:24px 0;">
            <a href="{settings.frontend_url}/admin/recruiters"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:12px 28px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Review in Admin Panel
            </a>
        </div>
        """
        await email_service.send_email("admin@pickcv.com", "New recruiter pending approval", body)

    async def send_welcome_email(self, recruiter: Recruiter):
        body = f"""
        <h2 style="color:#1a1a2e; margin-bottom:16px;">Welcome to PickCV, {recruiter.full_name}! 🎉</h2>
        <p style="color:#4a5568; line-height:1.6;">
            Your recruiter account for <strong>{recruiter.company_name}</strong> has been approved!
            You can now start posting jobs and finding top talent.
        </p>
        <div style="text-align:center; margin:32px 0;">
            <a href="{settings.frontend_url}/recruiter/dashboard"
               style="background:#0d9488; color:#fff; text-decoration:none;
                      padding:14px 36px; border-radius:8px; font-weight:600;
                      display:inline-block;">
                Go to Dashboard
            </a>
        </div>
        """
        await email_service.send_email(recruiter.email, "Welcome to PickCV — Account Approved!", body)

    async def send_rejection_email(self, recruiter: Recruiter, reason: str):
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
        await email_service.send_email(recruiter.email, "PickCV Recruiter Account Update", body)

    async def send_interviewer_invite(self, interviewer_email: str, recruiter: Recruiter, token: str):
        accept_url = f"{settings.frontend_url}/recruiter/accept-invite?token={token}"
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
        await email_service.send_email(interviewer_email, f"Interview Panel Invite — {recruiter.company_name}", body)

    async def send_interview_invite_email(
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
        await email_service.send_email(candidate_email, f"Interview: {round_title} — {company_name}", body)

    async def send_offer_email(
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
        await email_service.send_email(candidate_email, f"Offer Letter — {company_name}", body)

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
