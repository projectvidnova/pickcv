"""Admin module routes — login, college management, payment oversight."""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

from database import get_db
from models import Admin, College, CollegeStudent, Payment, Subscription, User, Resume, Recruiter
from schemas import (
    AdminLoginRequest, AdminLoginResponse,
    AdminCollegeResponse, AdminRejectRequest, AdminStatsResponse,
    AdminSetPlanRequest,
)
from schemas.recruiter import AdminRecruiterResponse, AdminRecruiterRejectRequest
from services.auth_service import auth_service
from services.email_service import email_service
from services.recruiter_service import recruiter_service

logger = logging.getLogger(__name__)

router = APIRouter()
admin_security = HTTPBearer()


# ─── Auth helpers ────────────────────────────────────────────

def _create_admin_token(admin_id: int, email: str) -> str:
    """Create JWT token for an admin user."""
    return auth_service.create_access_token(
        data={"sub": str(admin_id), "type": "admin", "email": email}
    )


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(admin_security),
    db: AsyncSession = Depends(get_db),
) -> Admin:
    """Verify JWT and return admin entity."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "admin":
        raise HTTPException(status_code=401, detail="Invalid admin token")

    admin_id = int(payload["sub"])
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


# ─── Login ────────────────────────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    data: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Admin login — returns JWT."""
    result = await db.execute(
        select(Admin).where(Admin.email == data.email, Admin.is_active == True)
    )
    admin = result.scalar_one_or_none()

    if not admin or not auth_service.verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Update last login
    admin.last_login = datetime.now(timezone.utc)
    await db.commit()

    token = _create_admin_token(admin.id, admin.email)
    return AdminLoginResponse(
        access_token=token,
        admin_id=admin.id,
        email=admin.email,
        name=admin.name,
    )


# ─── College Management ──────────────────────────────────────

@router.get("/colleges", response_model=list[AdminCollegeResponse])
async def list_colleges(
    status_filter: str = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all college registrations with optional status filter."""
    query = select(College).order_by(College.created_at.desc())
    if status_filter and status_filter in ("pending", "approved", "rejected"):
        query = query.where(College.status == status_filter)

    result = await db.execute(query)
    colleges = result.scalars().all()

    responses = []
    for c in colleges:
        # Count students
        count_result = await db.execute(
            select(func.count(CollegeStudent.id)).where(CollegeStudent.college_id == c.id)
        )
        student_count = count_result.scalar() or 0

        responses.append(
            AdminCollegeResponse(
                id=c.id,
                institution_name=c.institution_name,
                official_email=c.official_email,
                contact_person_name=c.contact_person_name,
                designation=c.designation,
                phone_number=c.phone_number,
                city=c.city,
                state=c.state,
                institution_type=c.institution_type,
                status=c.status,
                rejection_reason=c.rejection_reason,
                student_count=student_count,
                created_at=c.created_at,
                approved_at=c.approved_at,
                plan_type=c.plan_type or "none",
                plan_status=c.plan_status or "none",
                plan_start_date=c.plan_start_date,
                plan_end_date=c.plan_end_date,
            )
        )

    return responses


@router.put("/colleges/{college_id}/approve")
async def approve_college(
    college_id: int,
    background_tasks: BackgroundTasks,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending college registration."""
    result = await db.execute(select(College).where(College.id == college_id))
    college = result.scalar_one_or_none()

    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    if college.status == "approved":
        return {"message": "College is already approved"}

    college.status = "approved"
    college.approved_at = datetime.now(timezone.utc)
    college.approved_by = admin.id
    college.rejection_reason = None
    await db.commit()

    logger.info(f"College approved: {college.institution_name} by admin {admin.email}")

    # Send approval email to the institution
    background_tasks.add_task(
        email_service.send_college_approval_email,
        recipient_email=college.official_email,
        institution_name=college.institution_name,
        contact_person_name=college.contact_person_name or "",
    )

    return {"message": f"College '{college.institution_name}' approved successfully"}


@router.put("/colleges/{college_id}/reject")
async def reject_college(
    college_id: int,
    data: AdminRejectRequest,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reject a college registration with a reason."""
    result = await db.execute(select(College).where(College.id == college_id))
    college = result.scalar_one_or_none()

    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    college.status = "rejected"
    college.rejection_reason = data.reason
    await db.commit()

    logger.info(f"College rejected: {college.institution_name} by admin {admin.email}")
    return {"message": f"College '{college.institution_name}' rejected"}


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get overall admin dashboard statistics."""
    total = (await db.execute(select(func.count(College.id)))).scalar() or 0
    pending = (await db.execute(
        select(func.count(College.id)).where(College.status == "pending")
    )).scalar() or 0
    approved = (await db.execute(
        select(func.count(College.id)).where(College.status == "approved")
    )).scalar() or 0
    rejected = (await db.execute(
        select(func.count(College.id)).where(College.status == "rejected")
    )).scalar() or 0

    return AdminStatsResponse(
        total_colleges=total,
        pending=pending,
        approved=approved,
        rejected=rejected,
    )


# ─── Payments Management ─────────────────────────────────────

@router.get("/payments")
async def list_all_payments(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, succeeded, failed"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all payments across all users (admin view)."""
    query = (
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.resume))
        .order_by(Payment.created_at.desc())
    )

    if status_filter and status_filter in ("pending", "succeeded", "failed", "refunded"):
        query = query.where(Payment.status == status_filter)

    # Count total before pagination
    count_query = select(func.count(Payment.id))
    if status_filter and status_filter in ("pending", "succeeded", "failed", "refunded"):
        count_query = count_query.where(Payment.status == status_filter)
    total_count = (await db.execute(count_query)).scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    payments = result.unique().scalars().all()

    items = []
    for p in payments:
        items.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_email": p.user.email if p.user else None,
            "user_name": p.user.full_name if p.user else None,
            "resume_id": p.resume_id,
            "resume_title": p.resume.title if p.resume else None,
            "zoho_session_id": p.zoho_session_id,
            "zoho_payment_id": p.zoho_payment_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "description": p.description,
            "reference_number": p.reference_number,
            "product_type": p.product_type,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "pages": (total_count + per_page - 1) // per_page,
    }


@router.get("/payments/stats")
async def payment_stats(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate payment statistics for the admin dashboard."""
    total = (await db.execute(select(func.count(Payment.id)))).scalar() or 0
    succeeded = (await db.execute(
        select(func.count(Payment.id)).where(Payment.status == "succeeded")
    )).scalar() or 0
    failed = (await db.execute(
        select(func.count(Payment.id)).where(Payment.status == "failed")
    )).scalar() or 0
    pending = (await db.execute(
        select(func.count(Payment.id)).where(Payment.status == "pending")
    )).scalar() or 0

    total_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == "succeeded")
    )
    total_revenue = float(total_revenue_result.scalar() or 0)

    # Subscription stats
    from datetime import datetime, timezone as tz
    now = datetime.now(tz.utc)
    active_subscriptions = (await db.execute(
        select(func.count(Subscription.id)).where(
            and_(Subscription.status == "active", Subscription.expires_at > now)
        )
    )).scalar() or 0

    monthly_subs = (await db.execute(
        select(func.count(Subscription.id)).where(
            and_(Subscription.status == "active", Subscription.plan_type == "monthly", Subscription.expires_at > now)
        )
    )).scalar() or 0

    yearly_subs = (await db.execute(
        select(func.count(Subscription.id)).where(
            and_(Subscription.status == "active", Subscription.plan_type == "yearly", Subscription.expires_at > now)
        )
    )).scalar() or 0

    free_downloads = (await db.execute(
        select(func.count(Payment.id)).where(
            and_(Payment.product_type == "free_download", Payment.status == "succeeded")
        )
    )).scalar() or 0

    return {
        "total_payments": total,
        "succeeded": succeeded,
        "failed": failed,
        "pending": pending,
        "total_revenue": total_revenue,
        "currency": "INR",
        "active_subscriptions": active_subscriptions,
        "monthly_subscriptions": monthly_subs,
        "yearly_subscriptions": yearly_subs,
        "free_downloads_used": free_downloads,
    }


# ─── Recruiter Management ────────────────────────────────────

@router.get("/recruiters", response_model=list[AdminRecruiterResponse])
async def list_recruiters(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all recruiter accounts for admin review."""
    q = select(Recruiter)
    if status_filter:
        q = q.where(Recruiter.status == status_filter)
    q = q.order_by(Recruiter.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/recruiters/{recruiter_id}", response_model=AdminRecruiterResponse)
async def get_recruiter(
    recruiter_id: int,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    return rec


@router.post("/recruiters/{recruiter_id}/approve")
async def approve_recruiter(
    recruiter_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a recruiter account."""
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(404, "Recruiter not found")

    if not rec.is_email_verified:
        raise HTTPException(400, "Recruiter has not verified email yet")

    rec.is_approved = True
    rec.status = "approved"
    rec.approved_at = datetime.now(timezone.utc)
    rec.approved_by = admin.id
    await db.commit()

    # Send welcome email
    from config import get_frontend_origin
    background_tasks.add_task(recruiter_service.send_welcome_email, rec, get_frontend_origin(request))

    return {"message": f"Recruiter {rec.full_name} approved"}


@router.post("/recruiters/{recruiter_id}/reject")
async def reject_recruiter(
    recruiter_id: int,
    data: AdminRecruiterRejectRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reject a recruiter account."""
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(404, "Recruiter not found")

    rec.status = "rejected"
    rec.rejection_reason = data.reason
    rec.is_active = False
    await db.commit()

    # Send rejection email
    background_tasks.add_task(
        recruiter_service.send_rejection_email, rec, data.reason
    )

    return {"message": f"Recruiter {rec.full_name} rejected"}


# ─── College Plan Management ─────────────────────────────────

PLAN_DURATIONS = {
    "monthly": timedelta(days=30),
    "quarterly": timedelta(days=90),
    "half_yearly": timedelta(days=182),
    "yearly": timedelta(days=365),
}

PLAN_LABELS = {
    "monthly": "1 Month",
    "quarterly": "3 Months",
    "half_yearly": "6 Months",
    "yearly": "1 Year",
}


@router.put("/colleges/{college_id}/plan")
async def set_college_plan(
    college_id: int,
    data: AdminSetPlanRequest,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Set or update a college's plan. Starts immediately."""
    result = await db.execute(select(College).where(College.id == college_id))
    college = result.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    if college.status != "approved":
        raise HTTPException(status_code=400, detail="College must be approved before setting a plan")

    now = datetime.now(timezone.utc)
    duration = PLAN_DURATIONS[data.plan_type]

    college.plan_type = data.plan_type
    college.plan_start_date = now
    college.plan_end_date = now + duration
    college.plan_status = "active"
    college.plan_set_by = admin.id
    college.plan_set_at = now
    await db.commit()

    logger.info(
        f"Plan '{data.plan_type}' set for college {college.institution_name} "
        f"(id={college_id}) by admin {admin.email}, expires {college.plan_end_date.date()}"
    )

    return {
        "message": f"{PLAN_LABELS[data.plan_type]} plan activated for {college.institution_name}",
        "plan_type": data.plan_type,
        "plan_start_date": college.plan_start_date.isoformat(),
        "plan_end_date": college.plan_end_date.isoformat(),
    }


@router.delete("/colleges/{college_id}/plan")
async def remove_college_plan(
    college_id: int,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove / deactivate a college's plan immediately."""
    result = await db.execute(select(College).where(College.id == college_id))
    college = result.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    college.plan_type = "none"
    college.plan_start_date = None
    college.plan_end_date = None
    college.plan_status = "none"
    college.plan_set_at = datetime.now(timezone.utc)
    college.plan_set_by = admin.id
    await db.commit()

    logger.info(f"Plan removed for college {college.institution_name} (id={college_id}) by admin {admin.email}")
    return {"message": f"Plan removed for {college.institution_name}"}
