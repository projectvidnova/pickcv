"""Admin module routes — login, college management."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
import logging

from database import get_db
from models import Admin, College, CollegeStudent
from schemas import (
    AdminLoginRequest, AdminLoginResponse,
    AdminCollegeResponse, AdminRejectRequest, AdminStatsResponse,
)
from services.auth_service import auth_service

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
            )
        )

    return responses


@router.put("/colleges/{college_id}/approve")
async def approve_college(
    college_id: int,
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
