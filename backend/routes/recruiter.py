"""Recruiter routes — full recruitment lifecycle (Phases 1-5).

Phase 1: Registration, email verification, admin approval
Phase 2: Job CRUD, pause/resume, auto-pause
Phase 3: Applications, shortlisting, interview planning
Phase 4: Interviewer invites, Google Meet link generation
Phase 5: Offer templates, release offer, candidate accept/decline
"""
import logging
import re
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from typing import Optional, List

from database import get_db
from models import (
    Recruiter, RecruiterJob, CandidateApplication, Interview,
    Interviewer, OfferTemplate, Offer, User, Resume,
)
from schemas.recruiter import (
    RecruiterRegisterRequest, RecruiterLoginRequest, RecruiterLoginResponse,
    RecruiterResponse, RecruiterProfileUpdate,
    RecruiterJobCreate, RecruiterJobUpdate, RecruiterJobResponse, JobStatusUpdate,
    ApplicationCreateRequest, ApplicationStatusUpdate, ApplicationResponse,
    InterviewPlanCreate, InterviewUpdate, InterviewFeedbackSubmit, InterviewResponse,
    InterviewerInviteRequest, InterviewerAcceptRequest, InterviewerResponse, InterviewerUpdate,
    OfferTemplateCreate, OfferTemplateUpdate, OfferTemplateResponse,
    ReleaseOfferRequest, OfferResponse, OfferRespondRequest,
    RecruiterStatsResponse, PublicJobResponse,
)
from services.auth_service import auth_service
from services.recruiter_service import recruiter_service
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
recruiter_security = HTTPBearer()


# ═══════════════════════════════════════════════════════
# Auth Helpers
# ═══════════════════════════════════════════════════════

async def get_current_recruiter(
    credentials: HTTPAuthorizationCredentials = Depends(recruiter_security),
    db: AsyncSession = Depends(get_db),
) -> Recruiter:
    """Verify JWT and return recruiter entity (must be approved)."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "recruiter":
        raise HTTPException(status_code=401, detail="Invalid recruiter token")

    recruiter_id = int(payload["sub"])
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=401, detail="Recruiter not found")
    if not rec.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return rec


async def get_approved_recruiter(
    recruiter: Recruiter = Depends(get_current_recruiter),
) -> Recruiter:
    """Ensure recruiter is email-verified AND admin-approved."""
    if not recruiter.is_email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    if not recruiter.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")
    return recruiter


# ═══════════════════════════════════════════════════════
# PHASE 1 — Registration & Auth
# ═══════════════════════════════════════════════════════

@router.post("/register", response_model=RecruiterResponse, status_code=201)
async def register(
    data: RecruiterRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Register a new recruiter account."""
    existing = await db.execute(select(Recruiter).where(Recruiter.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    rec = Recruiter(
        email=data.email,
        hashed_password=auth_service.get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        company_name=data.company_name,
        company_website=data.company_website,
        company_size=data.company_size,
        industry=data.industry,
        designation=data.designation,
        status="pending_verification",
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    # Send verification email in background
    token = recruiter_service.create_verification_token(rec.id)
    background_tasks.add_task(recruiter_service.send_recruiter_verification_email, rec.email, token)

    return rec


@router.post("/verify-email")
async def verify_email(
    token: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Verify recruiter email and move to pending_approval."""
    payload = auth_service.decode_access_token(token)
    if not payload or payload.get("type") != "recruiter_verify":
        raise HTTPException(400, "Invalid or expired verification token")

    rec_id = int(payload["sub"])
    result = await db.execute(select(Recruiter).where(Recruiter.id == rec_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(404, "Recruiter not found")

    if rec.is_email_verified:
        return {"message": "Email already verified"}

    rec.is_email_verified = True
    rec.email_verified_at = datetime.now(timezone.utc)
    rec.status = "pending_approval"
    await db.commit()

    # Notify admin
    background_tasks.add_task(recruiter_service.send_admin_approval_notification, rec)

    return {"message": "Email verified. Your account is pending admin approval."}


@router.post("/login", response_model=RecruiterLoginResponse)
async def login(data: RecruiterLoginRequest, db: AsyncSession = Depends(get_db)):
    """Recruiter login — returns JWT."""
    result = await db.execute(
        select(Recruiter).where(Recruiter.email == data.email, Recruiter.is_active == True)
    )
    rec = result.scalar_one_or_none()
    if not rec or not auth_service.verify_password(data.password, rec.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    if not rec.is_email_verified:
        raise HTTPException(403, "Please verify your email first")

    rec.last_login = datetime.now(timezone.utc)
    await db.commit()

    token = recruiter_service.create_recruiter_token(rec.id, rec.email)
    return RecruiterLoginResponse(
        access_token=token,
        recruiter=RecruiterResponse.model_validate(rec),
    )


@router.get("/me", response_model=RecruiterResponse)
async def get_profile(recruiter: Recruiter = Depends(get_current_recruiter)):
    return recruiter


@router.patch("/me", response_model=RecruiterResponse)
async def update_profile(
    data: RecruiterProfileUpdate,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(recruiter, field, value)
    await db.commit()
    await db.refresh(recruiter)
    return recruiter


@router.get("/stats", response_model=RecruiterStatsResponse)
async def get_stats(
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats for recruiter."""
    # Job counts
    jobs_q = await db.execute(
        select(RecruiterJob.status, func.count()).where(
            RecruiterJob.recruiter_id == recruiter.id
        ).group_by(RecruiterJob.status)
    )
    job_counts = dict(jobs_q.all())

    # Application counts
    apps_q = await db.execute(
        select(CandidateApplication.status, func.count())
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(RecruiterJob.recruiter_id == recruiter.id)
        .group_by(CandidateApplication.status)
    )
    app_counts = dict(apps_q.all())

    # Interviewer count
    interviewers_q = await db.execute(
        select(func.count()).where(
            Interviewer.recruiter_id == recruiter.id,
            Interviewer.status == "accepted",
        )
    )
    interviewer_count = interviewers_q.scalar() or 0

    # Pending interviews
    pending_q = await db.execute(
        select(func.count())
        .select_from(Interview)
        .join(CandidateApplication, Interview.application_id == CandidateApplication.id)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(
            RecruiterJob.recruiter_id == recruiter.id,
            Interview.status.in_(["pending", "scheduled"]),
        )
    )
    pending_interviews = pending_q.scalar() or 0

    return RecruiterStatsResponse(
        total_jobs=sum(job_counts.values()),
        open_jobs=job_counts.get("open", 0),
        paused_jobs=job_counts.get("paused", 0),
        closed_jobs=job_counts.get("closed", 0),
        total_applications=sum(app_counts.values()),
        shortlisted=app_counts.get("shortlisted", 0),
        interviewing=app_counts.get("interviewing", 0),
        offered=app_counts.get("offered", 0),
        hired=app_counts.get("hired", 0),
        rejected=app_counts.get("rejected", 0),
        total_interviewers=interviewer_count,
        pending_interviews=pending_interviews,
    )


# ═══════════════════════════════════════════════════════
# PHASE 2 — Job Management
# ═══════════════════════════════════════════════════════

@router.post("/jobs", response_model=RecruiterJobResponse, status_code=201)
async def create_job(
    data: RecruiterJobCreate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    job = RecruiterJob(
        recruiter_id=recruiter.id,
        **data.model_dump(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    resp = RecruiterJobResponse.model_validate(job)
    resp.company_name = recruiter.company_name
    resp.company_logo_url = recruiter.company_logo_url
    return resp


@router.get("/jobs", response_model=List[RecruiterJobResponse])
async def list_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    q = select(RecruiterJob).where(RecruiterJob.recruiter_id == recruiter.id)
    if status_filter:
        q = q.where(RecruiterJob.status == status_filter)
    q = q.order_by(RecruiterJob.created_at.desc())
    result = await db.execute(q)
    jobs = result.scalars().all()
    out = []
    for j in jobs:
        r = RecruiterJobResponse.model_validate(j)
        r.company_name = recruiter.company_name
        r.company_logo_url = recruiter.company_logo_url
        out.append(r)
    return out


@router.get("/jobs/{job_id}", response_model=RecruiterJobResponse)
async def get_job(
    job_id: int,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterJob).where(
            RecruiterJob.id == job_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    r = RecruiterJobResponse.model_validate(job)
    r.company_name = recruiter.company_name
    r.company_logo_url = recruiter.company_logo_url
    return r


@router.patch("/jobs/{job_id}", response_model=RecruiterJobResponse)
async def update_job(
    job_id: int,
    data: RecruiterJobUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterJob).where(
            RecruiterJob.id == job_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    await db.commit()
    await db.refresh(job)
    r = RecruiterJobResponse.model_validate(job)
    r.company_name = recruiter.company_name
    return r


@router.post("/jobs/{job_id}/status", response_model=RecruiterJobResponse)
async def update_job_status(
    job_id: int,
    data: JobStatusUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Manually pause/resume/close a job."""
    result = await db.execute(
        select(RecruiterJob).where(
            RecruiterJob.id == job_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    now = datetime.now(timezone.utc)
    job.status = data.status
    if data.status == "paused":
        job.paused_at = now
    elif data.status == "closed":
        job.closed_at = now
    elif data.status == "open":
        job.paused_at = None

    await db.commit()
    await db.refresh(job)
    r = RecruiterJobResponse.model_validate(job)
    r.company_name = recruiter.company_name
    return r


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(
    job_id: int,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterJob).where(
            RecruiterJob.id == job_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    await db.delete(job)
    await db.commit()


# ─── Auto-pause cron endpoint (called by Cloud Scheduler) ────

@router.post("/cron/auto-pause-jobs")
async def cron_auto_pause(db: AsyncSession = Depends(get_db)):
    """Endpoint for Cloud Scheduler to auto-pause expired jobs."""
    paused = await recruiter_service.auto_pause_expired_jobs(db)
    return {"paused_count": len(paused), "paused_job_ids": paused}


# ─── Public job listing (for candidates) ─────────────────────

@router.get("/public/jobs", response_model=List[PublicJobResponse])
async def list_public_jobs(
    search: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    location: Optional[str] = None,
    remote_policy: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all open jobs (public — no auth required)."""
    q = (
        select(RecruiterJob, Recruiter.company_name, Recruiter.company_logo_url)
        .join(Recruiter, RecruiterJob.recruiter_id == Recruiter.id)
        .where(
            RecruiterJob.status == "open",
            Recruiter.is_approved == True,
            Recruiter.is_active == True,
        )
    )
    if search:
        q = q.where(
            or_(
                RecruiterJob.title.ilike(f"%{search}%"),
                RecruiterJob.description.ilike(f"%{search}%"),
            )
        )
    if job_type:
        q = q.where(RecruiterJob.job_type == job_type)
    if experience_level:
        q = q.where(RecruiterJob.experience_level == experience_level)
    if location:
        q = q.where(RecruiterJob.location.ilike(f"%{location}%"))
    if remote_policy:
        q = q.where(RecruiterJob.remote_policy == remote_policy)

    q = q.order_by(RecruiterJob.created_at.desc())
    q = q.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(q)
    rows = result.all()
    out = []
    for job, company_name, logo in rows:
        r = PublicJobResponse.model_validate(job)
        r.company_name = company_name or ""
        r.company_logo_url = logo
        out.append(r)
    return out


@router.get("/public/jobs/{job_id}", response_model=PublicJobResponse)
async def get_public_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RecruiterJob, Recruiter.company_name, Recruiter.company_logo_url)
        .join(Recruiter, RecruiterJob.recruiter_id == Recruiter.id)
        .where(
            RecruiterJob.id == job_id,
            RecruiterJob.status == "open",
            Recruiter.is_approved == True,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(404, "Job not found")
    job, company_name, logo = row
    # Increment view count
    job.view_count = (job.view_count or 0) + 1
    await db.commit()
    r = PublicJobResponse.model_validate(job)
    r.company_name = company_name or ""
    r.company_logo_url = logo
    return r


# ═══════════════════════════════════════════════════════
# PHASE 3 — Applications & Interviews
# ═══════════════════════════════════════════════════════

user_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_candidate_user(
    token: str = Depends(user_oauth2),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user (candidate) from standard user JWT."""
    payload = auth_service.decode_access_token(token)
    if not payload:
        raise HTTPException(401, "Invalid credentials")
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user


@router.post("/candidate/apply", response_model=ApplicationResponse, status_code=201)
async def candidate_apply(
    data: ApplicationCreateRequest,
    user: User = Depends(get_candidate_user),
    db: AsyncSession = Depends(get_db),
):
    """Candidate applies to a recruiter job."""
    # Verify job is open
    job_q = await db.execute(
        select(RecruiterJob).where(RecruiterJob.id == data.job_id, RecruiterJob.status == "open")
    )
    job = job_q.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found or not accepting applications")

    # Check duplicate
    dup = await db.execute(
        select(CandidateApplication).where(
            CandidateApplication.job_id == data.job_id,
            CandidateApplication.user_id == user.id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, "You have already applied to this job")

    app = CandidateApplication(
        job_id=data.job_id,
        user_id=user.id,
        resume_id=data.resume_id,
        cover_letter=data.cover_letter,
        status="applied",
    )
    db.add(app)

    # Increment application count on job
    job.application_count = (job.application_count or 0) + 1

    await db.commit()
    await db.refresh(app)

    return ApplicationResponse(
        id=app.id, job_id=app.job_id, user_id=app.user_id,
        resume_id=app.resume_id, status=app.status,
        cover_letter=app.cover_letter,
        applied_at=app.applied_at,
        candidate_name=user.full_name,
        candidate_email=user.email,
        total_rounds=0, completed_rounds=0,
        created_at=app.created_at,
    )


@router.get("/candidate/applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    user: User = Depends(get_candidate_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for the current candidate."""
    result = await db.execute(
        select(CandidateApplication, RecruiterJob.title)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(CandidateApplication.user_id == user.id)
        .order_by(CandidateApplication.applied_at.desc())
    )
    rows = result.all()
    out = []
    for app, job_title in rows:
        out.append(ApplicationResponse(
            id=app.id, job_id=app.job_id, user_id=app.user_id,
            resume_id=app.resume_id, status=app.status,
            cover_letter=app.cover_letter, match_score=app.match_score,
            applied_at=app.applied_at, offer_response=app.offer_response,
            candidate_name=user.full_name, candidate_email=user.email,
            total_rounds=0, completed_rounds=0,
            created_at=app.created_at,
        ))
    return out


# ─── Recruiter: view applications ─────────────────────

@router.get("/jobs/{job_id}/applications", response_model=List[ApplicationResponse])
async def list_applications(
    job_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """List all applications for a job."""
    # Verify job belongs to recruiter
    job_check = await db.execute(
        select(RecruiterJob).where(
            RecruiterJob.id == job_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    if not job_check.scalar_one_or_none():
        raise HTTPException(404, "Job not found")

    q = (
        select(CandidateApplication, User.full_name, User.email, User.phone,
               Resume.title, Resume.ats_score)
        .join(User, CandidateApplication.user_id == User.id)
        .outerjoin(Resume, CandidateApplication.resume_id == Resume.id)
        .where(CandidateApplication.job_id == job_id)
    )
    if status_filter:
        q = q.where(CandidateApplication.status == status_filter)
    q = q.order_by(CandidateApplication.applied_at.desc())

    result = await db.execute(q)
    rows = result.all()
    out = []
    for app, name, email, phone, resume_title, ats_score in rows:
        # Count interview rounds
        rounds_q = await db.execute(
            select(func.count(), func.count().filter(Interview.status.in_(["completed", "qualified", "not_qualified"])))
            .where(Interview.application_id == app.id)
        )
        total_rounds, completed = rounds_q.first() or (0, 0)

        r = ApplicationResponse(
            id=app.id, job_id=app.job_id, user_id=app.user_id,
            resume_id=app.resume_id, status=app.status,
            cover_letter=app.cover_letter, match_score=app.match_score,
            recruiter_notes=app.recruiter_notes,
            applied_at=app.applied_at, reviewed_at=app.reviewed_at,
            shortlisted_at=app.shortlisted_at, offered_at=app.offered_at,
            offer_response=app.offer_response,
            candidate_name=name, candidate_email=email,
            candidate_phone=phone, resume_title=resume_title,
            resume_ats_score=ats_score,
            total_rounds=total_rounds or 0, completed_rounds=completed or 0,
            created_at=app.created_at,
        )
        out.append(r)
    return out


@router.patch("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Update candidate application status (e.g. shortlist, reject)."""
    result = await db.execute(
        select(CandidateApplication)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(
            CandidateApplication.id == app_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")

    now = datetime.now(timezone.utc)
    app.status = data.status
    if data.recruiter_notes:
        app.recruiter_notes = data.recruiter_notes

    if data.status == "in_review":
        app.reviewed_at = now
    elif data.status == "shortlisted":
        app.shortlisted_at = now
    elif data.status == "offered":
        app.offered_at = now

    await db.commit()
    await db.refresh(app)

    # Fetch denormalized data
    user_q = await db.execute(select(User).where(User.id == app.user_id))
    user = user_q.scalar_one_or_none()

    return ApplicationResponse(
        id=app.id, job_id=app.job_id, user_id=app.user_id,
        resume_id=app.resume_id, status=app.status,
        cover_letter=app.cover_letter, match_score=app.match_score,
        recruiter_notes=app.recruiter_notes,
        applied_at=app.applied_at, reviewed_at=app.reviewed_at,
        shortlisted_at=app.shortlisted_at, offered_at=app.offered_at,
        offer_response=app.offer_response,
        candidate_name=user.full_name if user else None,
        candidate_email=user.email if user else None,
        total_rounds=0, completed_rounds=0,
        created_at=app.created_at,
    )


# ─── Interview Planning ──────────────────────────────

@router.post("/applications/{app_id}/interviews", response_model=List[InterviewResponse])
async def plan_interviews(
    app_id: int,
    data: InterviewPlanCreate,
    background_tasks: BackgroundTasks,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Plan interview rounds for a shortlisted candidate."""
    # Verify application belongs to recruiter
    result = await db.execute(
        select(CandidateApplication)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(
            CandidateApplication.id == app_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")

    if app.status not in ("shortlisted", "interviewing"):
        raise HTTPException(400, "Candidate must be shortlisted first")

    # Update status to interviewing
    app.status = "interviewing"

    # Get job and candidate details for emails
    job_q = await db.execute(select(RecruiterJob).where(RecruiterJob.id == app.job_id))
    job = job_q.scalar_one()
    user_q = await db.execute(select(User).where(User.id == app.user_id))
    candidate = user_q.scalar_one()

    created = []
    for r in data.rounds:
        interview = Interview(
            application_id=app_id,
            round_number=r.round_number,
            round_title=r.round_title,
            interview_type=r.interview_type,
            interviewer_id=r.interviewer_id,
            scheduled_at=r.scheduled_at,
            duration_minutes=r.duration_minutes,
            status="scheduled" if r.scheduled_at else "pending",
        )
        db.add(interview)
        created.append(interview)

    await db.commit()

    # Send invites based on scheduling mode
    out = []
    for interview in created:
        await db.refresh(interview)

        # For bulk mode: send all invites now
        # For sequential mode: only send Round 1
        should_send = (
            data.scheduling_mode == "bulk"
            or interview.round_number == 1
        )

        if should_send and interview.scheduled_at:
            interview.invite_sent = True
            interview.invite_sent_at = datetime.now(timezone.utc)
            await db.commit()

            # Send invite email
            background_tasks.add_task(
                recruiter_service.send_interview_invite_email,
                candidate.email,
                candidate.full_name or candidate.email,
                job.title,
                recruiter.company_name,
                interview.round_title or f"Round {interview.round_number}",
                interview.scheduled_at,
                interview.google_meet_link,
            )

        # Build response
        interviewer_name = None
        interviewer_email = None
        if interview.interviewer_id:
            iv_q = await db.execute(select(Interviewer).where(Interviewer.id == interview.interviewer_id))
            iv = iv_q.scalar_one_or_none()
            if iv:
                interviewer_name = iv.full_name
                interviewer_email = iv.email

        out.append(InterviewResponse(
            id=interview.id, application_id=interview.application_id,
            interviewer_id=interview.interviewer_id,
            round_number=interview.round_number,
            round_title=interview.round_title,
            interview_type=interview.interview_type,
            scheduled_at=interview.scheduled_at,
            duration_minutes=interview.duration_minutes,
            google_meet_link=interview.google_meet_link,
            status=interview.status,
            feedback=interview.feedback, rating=interview.rating,
            is_qualified=interview.is_qualified,
            invite_sent=interview.invite_sent,
            invite_sent_at=interview.invite_sent_at,
            interviewer_name=interviewer_name,
            interviewer_email=interviewer_email,
            candidate_name=candidate.full_name,
            candidate_email=candidate.email,
            created_at=interview.created_at,
        ))
    return out


@router.get("/applications/{app_id}/interviews", response_model=List[InterviewResponse])
async def list_interviews(
    app_id: int,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    # Verify
    check = await db.execute(
        select(CandidateApplication)
        .join(RecruiterJob)
        .where(CandidateApplication.id == app_id, RecruiterJob.recruiter_id == recruiter.id)
    )
    if not check.scalar_one_or_none():
        raise HTTPException(404, "Application not found")

    q = select(Interview).where(Interview.application_id == app_id).order_by(Interview.round_number)
    result = await db.execute(q)
    interviews = result.scalars().all()

    # Get candidate
    app_q = await db.execute(select(CandidateApplication).where(CandidateApplication.id == app_id))
    app = app_q.scalar_one()
    user_q = await db.execute(select(User).where(User.id == app.user_id))
    candidate = user_q.scalar_one()

    out = []
    for iv in interviews:
        iv_name = iv_email = None
        if iv.interviewer_id:
            iv_q = await db.execute(select(Interviewer).where(Interviewer.id == iv.interviewer_id))
            iv_obj = iv_q.scalar_one_or_none()
            if iv_obj:
                iv_name = iv_obj.full_name
                iv_email = iv_obj.email
        out.append(InterviewResponse(
            id=iv.id, application_id=iv.application_id,
            interviewer_id=iv.interviewer_id,
            round_number=iv.round_number, round_title=iv.round_title,
            interview_type=iv.interview_type,
            scheduled_at=iv.scheduled_at,
            duration_minutes=iv.duration_minutes,
            google_meet_link=iv.google_meet_link,
            status=iv.status, feedback=iv.feedback, rating=iv.rating,
            is_qualified=iv.is_qualified,
            invite_sent=iv.invite_sent, invite_sent_at=iv.invite_sent_at,
            interviewer_name=iv_name, interviewer_email=iv_email,
            candidate_name=candidate.full_name, candidate_email=candidate.email,
            created_at=iv.created_at,
        ))
    return out


@router.patch("/interviews/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    data: InterviewUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Update interview schedule/interviewer."""
    result = await db.execute(
        select(Interview)
        .join(CandidateApplication, Interview.application_id == CandidateApplication.id)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(Interview.id == interview_id, RecruiterJob.recruiter_id == recruiter.id)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interview not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(iv, field, value)
    if data.scheduled_at and iv.status == "pending":
        iv.status = "scheduled"
    await db.commit()
    await db.refresh(iv)

    return InterviewResponse(
        id=iv.id, application_id=iv.application_id,
        interviewer_id=iv.interviewer_id,
        round_number=iv.round_number, round_title=iv.round_title,
        interview_type=iv.interview_type,
        scheduled_at=iv.scheduled_at, duration_minutes=iv.duration_minutes,
        google_meet_link=iv.google_meet_link,
        status=iv.status, feedback=iv.feedback, rating=iv.rating,
        is_qualified=iv.is_qualified,
        invite_sent=iv.invite_sent, invite_sent_at=iv.invite_sent_at,
        created_at=iv.created_at,
    )


@router.post("/interviews/{interview_id}/feedback", response_model=InterviewResponse)
async def submit_feedback(
    interview_id: int,
    data: InterviewFeedbackSubmit,
    background_tasks: BackgroundTasks,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback for an interview. Triggers next round invite if sequential."""
    result = await db.execute(
        select(Interview)
        .join(CandidateApplication, Interview.application_id == CandidateApplication.id)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(Interview.id == interview_id, RecruiterJob.recruiter_id == recruiter.id)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interview not found")

    iv.feedback = data.feedback
    iv.rating = data.rating
    iv.is_qualified = data.is_qualified
    iv.status = "qualified" if data.is_qualified else "not_qualified"
    await db.commit()

    # Sequential scheduling: if qualified, send invite for next round
    if data.is_qualified:
        next_q = await db.execute(
            select(Interview).where(
                Interview.application_id == iv.application_id,
                Interview.round_number == iv.round_number + 1,
                Interview.invite_sent == False,
            )
        )
        next_iv = next_q.scalar_one_or_none()
        if next_iv and next_iv.scheduled_at:
            next_iv.invite_sent = True
            next_iv.invite_sent_at = datetime.now(timezone.utc)
            if next_iv.status == "pending":
                next_iv.status = "scheduled"

            # Get candidate info for email
            app_q = await db.execute(
                select(CandidateApplication).where(CandidateApplication.id == iv.application_id)
            )
            app = app_q.scalar_one()
            user_q = await db.execute(select(User).where(User.id == app.user_id))
            candidate = user_q.scalar_one()
            job_q = await db.execute(select(RecruiterJob).where(RecruiterJob.id == app.job_id))
            job = job_q.scalar_one()

            background_tasks.add_task(
                recruiter_service.send_interview_invite_email,
                candidate.email,
                candidate.full_name or candidate.email,
                job.title,
                recruiter.company_name,
                next_iv.round_title or f"Round {next_iv.round_number}",
                next_iv.scheduled_at,
                next_iv.google_meet_link,
            )
            await db.commit()

    await db.refresh(iv)
    return InterviewResponse(
        id=iv.id, application_id=iv.application_id,
        interviewer_id=iv.interviewer_id,
        round_number=iv.round_number, round_title=iv.round_title,
        interview_type=iv.interview_type,
        scheduled_at=iv.scheduled_at, duration_minutes=iv.duration_minutes,
        google_meet_link=iv.google_meet_link,
        status=iv.status, feedback=iv.feedback, rating=iv.rating,
        is_qualified=iv.is_qualified,
        invite_sent=iv.invite_sent, invite_sent_at=iv.invite_sent_at,
        created_at=iv.created_at,
    )


# ═══════════════════════════════════════════════════════
# PHASE 4 — Interviewer Management
# ═══════════════════════════════════════════════════════

@router.post("/interviewers", response_model=InterviewerResponse, status_code=201)
async def invite_interviewer(
    data: InterviewerInviteRequest,
    background_tasks: BackgroundTasks,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Invite a team member as an interviewer."""
    # Check duplicate
    existing = await db.execute(
        select(Interviewer).where(
            Interviewer.recruiter_id == recruiter.id,
            Interviewer.email == data.email,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Interviewer already invited")

    token = recruiter_service.generate_invitation_token()
    iv = Interviewer(
        recruiter_id=recruiter.id,
        email=data.email,
        full_name=data.full_name,
        designation=data.designation,
        phone=data.phone,
        invitation_token=token,
    )
    db.add(iv)
    await db.commit()
    await db.refresh(iv)

    # Send invite email
    background_tasks.add_task(
        recruiter_service.send_interviewer_invite, data.email, recruiter, token
    )

    return InterviewerResponse(
        id=iv.id, recruiter_id=iv.recruiter_id, email=iv.email,
        full_name=iv.full_name, designation=iv.designation, phone=iv.phone,
        status=iv.status, is_active=iv.is_active,
        accepted_at=iv.accepted_at, created_at=iv.created_at,
    )


@router.get("/interviewers", response_model=List[InterviewerResponse])
async def list_interviewers(
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interviewer).where(Interviewer.recruiter_id == recruiter.id)
        .order_by(Interviewer.created_at.desc())
    )
    interviewers = result.scalars().all()
    out = []
    for iv in interviewers:
        # Count interviews
        count_q = await db.execute(
            select(func.count()).where(Interview.interviewer_id == iv.id)
        )
        count = count_q.scalar() or 0
        out.append(InterviewerResponse(
            id=iv.id, recruiter_id=iv.recruiter_id, email=iv.email,
            full_name=iv.full_name, designation=iv.designation, phone=iv.phone,
            status=iv.status, is_active=iv.is_active,
            accepted_at=iv.accepted_at, created_at=iv.created_at,
            interview_count=count,
        ))
    return out


@router.patch("/interviewers/{iv_id}", response_model=InterviewerResponse)
async def update_interviewer(
    iv_id: int,
    data: InterviewerUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interviewer).where(
            Interviewer.id == iv_id,
            Interviewer.recruiter_id == recruiter.id,
        )
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interviewer not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(iv, field, value)
    await db.commit()
    await db.refresh(iv)

    return InterviewerResponse(
        id=iv.id, recruiter_id=iv.recruiter_id, email=iv.email,
        full_name=iv.full_name, designation=iv.designation, phone=iv.phone,
        status=iv.status, is_active=iv.is_active,
        accepted_at=iv.accepted_at, created_at=iv.created_at,
    )


@router.delete("/interviewers/{iv_id}", status_code=204)
async def remove_interviewer(
    iv_id: int,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interviewer).where(
            Interviewer.id == iv_id,
            Interviewer.recruiter_id == recruiter.id,
        )
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interviewer not found")
    await db.delete(iv)
    await db.commit()


# ─── Accept invite (public — no auth) ────────────────

@router.post("/interviewers/accept")
async def accept_interviewer_invite(
    data: InterviewerAcceptRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interviewer).where(Interviewer.invitation_token == data.token)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Invalid invitation token")

    if iv.status == "accepted":
        return {"message": "Invitation already accepted"}

    iv.status = "accepted"
    iv.accepted_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Invitation accepted", "company": None}


# ═══════════════════════════════════════════════════════
# PHASE 5 — Offer Templates & Offers
# ═══════════════════════════════════════════════════════

@router.post("/offer-templates", response_model=OfferTemplateResponse, status_code=201)
async def create_offer_template(
    data: OfferTemplateCreate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    # If setting as default, unset previous defaults
    if data.is_default:
        await db.execute(
            update(OfferTemplate)
            .where(OfferTemplate.recruiter_id == recruiter.id, OfferTemplate.is_default == True)
            .values(is_default=False)
        )

    tpl = OfferTemplate(
        recruiter_id=recruiter.id,
        name=data.name,
        content=data.content,
        variables=data.variables,
        is_default=data.is_default,
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return tpl


@router.get("/offer-templates", response_model=List[OfferTemplateResponse])
async def list_offer_templates(
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OfferTemplate).where(OfferTemplate.recruiter_id == recruiter.id)
        .order_by(OfferTemplate.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/offer-templates/{tpl_id}", response_model=OfferTemplateResponse)
async def update_offer_template(
    tpl_id: int,
    data: OfferTemplateUpdate,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OfferTemplate).where(
            OfferTemplate.id == tpl_id,
            OfferTemplate.recruiter_id == recruiter.id,
        )
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")

    if data.is_default:
        await db.execute(
            update(OfferTemplate)
            .where(OfferTemplate.recruiter_id == recruiter.id, OfferTemplate.is_default == True)
            .values(is_default=False)
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tpl, field, value)
    await db.commit()
    await db.refresh(tpl)
    return tpl


@router.delete("/offer-templates/{tpl_id}", status_code=204)
async def delete_offer_template(
    tpl_id: int,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OfferTemplate).where(
            OfferTemplate.id == tpl_id,
            OfferTemplate.recruiter_id == recruiter.id,
        )
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")
    await db.delete(tpl)
    await db.commit()


@router.post("/offers/release", response_model=OfferResponse, status_code=201)
async def release_offer(
    data: ReleaseOfferRequest,
    background_tasks: BackgroundTasks,
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Generate offer letter from template and send to candidate."""
    # Verify application
    result = await db.execute(
        select(CandidateApplication)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .where(
            CandidateApplication.id == data.application_id,
            RecruiterJob.recruiter_id == recruiter.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")

    # Get template
    tpl_q = await db.execute(
        select(OfferTemplate).where(
            OfferTemplate.id == data.template_id,
            OfferTemplate.recruiter_id == recruiter.id,
        )
    )
    tpl = tpl_q.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")

    # Render template
    rendered = tpl.content
    for key, value in data.variables.items():
        rendered = rendered.replace("{{" + key + "}}", value)

    # Create offer
    offer = Offer(
        application_id=app.id,
        template_id=tpl.id,
        rendered_content=rendered,
        variables_used=data.variables,
        status="released",
    )
    db.add(offer)

    # Update application status
    app.status = "offered"
    app.offered_at = datetime.now(timezone.utc)
    app.offer_response = "pending"

    await db.commit()
    await db.refresh(offer)

    # Get candidate and job details
    user_q = await db.execute(select(User).where(User.id == app.user_id))
    candidate = user_q.scalar_one()
    job_q = await db.execute(select(RecruiterJob).where(RecruiterJob.id == app.job_id))
    job = job_q.scalar_one()

    # Send offer email
    offer_url = f"{settings.frontend_url}/recruiter/offer/{offer.id}"
    background_tasks.add_task(
        recruiter_service.send_offer_email,
        candidate.email,
        candidate.full_name or candidate.email,
        job.title,
        recruiter.company_name,
        offer_url,
    )

    return OfferResponse(
        id=offer.id, application_id=offer.application_id,
        template_id=offer.template_id,
        rendered_content=offer.rendered_content,
        variables_used=offer.variables_used,
        pdf_url=offer.pdf_url, status=offer.status,
        released_at=offer.released_at, responded_at=offer.responded_at,
        response_note=offer.response_note,
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        job_title=job.title,
        created_at=offer.created_at,
    )


@router.get("/offers", response_model=List[OfferResponse])
async def list_offers(
    recruiter: Recruiter = Depends(get_approved_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """List all offers made by this recruiter."""
    result = await db.execute(
        select(Offer, CandidateApplication, User.full_name, User.email, RecruiterJob.title)
        .join(CandidateApplication, Offer.application_id == CandidateApplication.id)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .join(User, CandidateApplication.user_id == User.id)
        .where(RecruiterJob.recruiter_id == recruiter.id)
        .order_by(Offer.created_at.desc())
    )
    out = []
    for offer, app, name, email, job_title in result.all():
        out.append(OfferResponse(
            id=offer.id, application_id=offer.application_id,
            template_id=offer.template_id,
            rendered_content=offer.rendered_content,
            variables_used=offer.variables_used,
            pdf_url=offer.pdf_url, status=offer.status,
            released_at=offer.released_at, responded_at=offer.responded_at,
            response_note=offer.response_note,
            candidate_name=name, candidate_email=email,
            job_title=job_title,
            created_at=offer.created_at,
        ))
    return out


# ─── Candidate offer view & respond (public with offer ID) ───

@router.get("/offers/{offer_id}/view", response_model=OfferResponse)
async def view_offer(offer_id: int, db: AsyncSession = Depends(get_db)):
    """Public view of an offer (for candidate)."""
    result = await db.execute(
        select(Offer, CandidateApplication, User.full_name, User.email, RecruiterJob.title)
        .join(CandidateApplication, Offer.application_id == CandidateApplication.id)
        .join(RecruiterJob, CandidateApplication.job_id == RecruiterJob.id)
        .join(User, CandidateApplication.user_id == User.id)
        .where(Offer.id == offer_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(404, "Offer not found")
    offer, app, name, email, job_title = row
    return OfferResponse(
        id=offer.id, application_id=offer.application_id,
        template_id=offer.template_id,
        rendered_content=offer.rendered_content,
        variables_used=offer.variables_used,
        pdf_url=offer.pdf_url, status=offer.status,
        released_at=offer.released_at, responded_at=offer.responded_at,
        response_note=offer.response_note,
        candidate_name=name, candidate_email=email,
        job_title=job_title,
        created_at=offer.created_at,
    )


@router.post("/offers/{offer_id}/respond")
async def respond_to_offer(
    offer_id: int,
    data: OfferRespondRequest,
    db: AsyncSession = Depends(get_db),
):
    """Candidate accepts or declines an offer."""
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offer not found")

    if offer.status != "released":
        raise HTTPException(400, f"Offer already {offer.status}")

    now = datetime.now(timezone.utc)
    offer.status = data.response
    offer.responded_at = now
    offer.response_note = data.note

    # Update application
    app_q = await db.execute(
        select(CandidateApplication).where(CandidateApplication.id == offer.application_id)
    )
    app = app_q.scalar_one()
    app.offer_response = data.response
    app.offer_responded_at = now
    if data.response == "accepted":
        app.status = "hired"

    await db.commit()

    return {"message": f"Offer {data.response}", "status": data.response}
