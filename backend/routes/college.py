"""College module routes — registration, login, student management, sharing."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
import secrets
import logging

from database import get_db
from models import College, CollegeStudent, User, Resume, SharedProfile
from schemas import (
    CollegeRegisterRequest, CollegeLoginRequest, CollegeResponse,
    CollegeProfileUpdate, CollegeStudentResponse, StudentUploadResponse,
    ShareProfilesRequest, ShareProfilesResponse, CollegeStatsResponse,
    StudentUploadItem, StudentResumeInfo,
)
from services.auth_service import auth_service
from services.college_service import college_service
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Auth helpers ────────────────────────────────────────────
def _create_college_token(college_id: int, email: str) -> str:
    """Create JWT token for a college user."""
    return auth_service.create_access_token(
        data={"sub": str(college_id), "type": "college", "email": email}
    )


async def get_current_college(
    token: str = Depends(lambda: None),  # placeholder — overridden below
    db: AsyncSession = Depends(get_db),
) -> College:
    """Not used directly. See _get_college_from_token."""
    pass


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
college_security = HTTPBearer()


async def get_current_college_auth(
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    db: AsyncSession = Depends(get_db),
) -> College:
    """Verify JWT and return college entity."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "college":
        raise HTTPException(status_code=401, detail="Invalid college token")
    
    college_id = int(payload["sub"])
    result = await db.execute(select(College).where(College.id == college_id))
    college = result.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=401, detail="College not found")
    return college


# ─── Registration & Login ────────────────────────────────────

@router.post("/register", response_model=CollegeResponse, status_code=201)
async def register_college(
    data: CollegeRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new college/institution."""
    # Check duplicate email
    existing = await db.execute(
        select(College).where(College.official_email == data.official_email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email is already registered")

    hashed_pw = auth_service.get_password_hash(data.password)
    college = College(
        institution_name=data.institution_name,
        official_email=data.official_email,
        password_hash=hashed_pw,
        contact_person_name=data.contact_person_name,
        designation=data.designation,
        phone_number=data.phone_number,
        city=data.city,
        state=data.state,
        institution_type=data.institution_type,
        status="pending",
    )
    db.add(college)
    await db.commit()
    await db.refresh(college)
    logger.info(f"College registered: {college.institution_name} ({college.official_email})")
    return college


@router.post("/login")
async def login_college(
    data: CollegeLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login for college users. Returns JWT + college info."""
    result = await db.execute(
        select(College).where(College.official_email == data.email)
    )
    college = result.scalar_one_or_none()

    if not college or not auth_service.verify_password(data.password, college.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Return status info so frontend can decide next step
    token = _create_college_token(college.id, college.official_email)

    return {
        "access_token": token,
        "token_type": "bearer",
        "college_id": college.id,
        "institution_name": college.institution_name,
        "status": college.status,  # pending, approved, rejected
        "rejection_reason": college.rejection_reason,
        "onboarding_completed": college.onboarding_completed,
    }


# ─── Profile ─────────────────────────────────────────────────

@router.get("/profile", response_model=CollegeResponse)
async def get_college_profile(
    college: College = Depends(get_current_college_auth),
):
    """Get the current college's profile."""
    return college


@router.put("/profile", response_model=CollegeResponse)
async def update_college_profile(
    data: CollegeProfileUpdate,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Update college profile (during onboarding or settings)."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(college, field, value)
    await db.commit()
    await db.refresh(college)
    return college


@router.post("/onboarding/complete", response_model=CollegeResponse)
async def complete_onboarding(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Mark college onboarding as complete."""
    college.onboarding_completed = True
    await db.commit()
    await db.refresh(college)
    return college


# ─── Student Management ──────────────────────────────────────

@router.post("/students/upload")
async def upload_students(
    file: UploadFile = File(None),
    emails: str = Form(None),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload student list — accepts:
    - Excel (.xlsx) file
    - CSV file
    - Plain text email list (one per line) via 'emails' form field
    
    For each email, determines status: invited / registered / ready.
    """
    students_data = []

    if file:
        file_data = await file.read()
        filename = (file.filename or "").lower()

        if filename.endswith(".xlsx"):
            students_data = college_service.parse_excel_content(file_data)
        elif filename.endswith(".csv"):
            content = file_data.decode("utf-8")
            students_data = college_service.parse_csv_content(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use .xlsx or .csv")
    elif emails:
        students_data = college_service.parse_email_list(emails)
    else:
        raise HTTPException(status_code=400, detail="Provide a file or email list")

    if not students_data:
        raise HTTPException(status_code=400, detail="No valid student emails found in the upload")

    result = await college_service.process_student_emails(db, college.id, students_data)

    # Build response
    student_responses = []
    for s in result["students"]:
        student_responses.append(
            CollegeStudentResponse(
                id=s.id,
                email=s.email,
                name=s.name,
                branch=s.branch,
                graduation_year=s.graduation_year,
                user_id=s.user_id,
                status=s.status,
                invited_at=s.invited_at,
                registered_at=s.registered_at,
                ready_at=s.ready_at,
                created_at=s.created_at,
            )
        )

    return StudentUploadResponse(
        total=result["total"],
        invited=result["invited"],
        registered=result["registered"],
        ready=result["ready"],
        already_exists=result["already_exists"],
        students=student_responses,
    )


@router.post("/students/invite")
async def invite_students(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Send invitation emails to all 'invited' students."""
    if college.status != "approved":
        raise HTTPException(status_code=403, detail="College must be approved before sending invitations")

    result = await college_service.send_invitations(
        db=db,
        college_id=college.id,
        college_name=college.institution_name,
        frontend_url=settings.frontend_url,
    )
    return result


@router.get("/students", response_model=list[CollegeStudentResponse])
async def list_students(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """List all students for this college with enriched user data."""
    result = await db.execute(
        select(CollegeStudent)
        .where(CollegeStudent.college_id == college.id)
        .order_by(CollegeStudent.created_at.desc())
    )
    students = result.scalars().all()

    enriched = []
    for s in students:
        resp = CollegeStudentResponse(
            id=s.id,
            email=s.email,
            name=s.name,
            branch=s.branch,
            graduation_year=s.graduation_year,
            user_id=s.user_id,
            status=s.status,
            invited_at=s.invited_at,
            registered_at=s.registered_at,
            ready_at=s.ready_at,
            created_at=s.created_at,
        )

        # Enrich with user data if linked
        if s.user_id:
            user_result = await db.execute(select(User).where(User.id == s.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                resp.full_name = user.full_name
                resp.phone = user.phone
                resp.linkedin_url = user.linkedin_url
                resp.profile_picture_url = user.profile_picture_url

                # Fetch resumes
                resume_result = await db.execute(
                    select(Resume)
                    .where(Resume.user_id == user.id)
                    .order_by(Resume.created_at.desc())
                )
                user_resumes = resume_result.scalars().all()
                resp.resume_count = len(user_resumes)
                resp.has_resume = resp.resume_count > 0
                resp.resumes = [
                    StudentResumeInfo(
                        id=r.id,
                        title=r.title,
                        original_filename=r.original_filename,
                        ats_score=r.ats_score,
                        is_optimized=r.is_optimized or False,
                        file_format=r.file_format,
                        created_at=r.created_at,
                        updated_at=r.updated_at,
                    )
                    for r in user_resumes
                ]

        enriched.append(resp)

    return enriched


@router.get("/students/{student_id}/resumes")
async def get_student_resumes(
    student_id: int,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed resume data for a specific student (college must own the student)."""
    cs_result = await db.execute(
        select(CollegeStudent).where(
            CollegeStudent.id == student_id,
            CollegeStudent.college_id == college.id,
        )
    )
    cs = cs_result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Student not found")
    if not cs.user_id:
        return []

    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == cs.user_id).order_by(Resume.created_at.desc())
    )
    resumes = resume_result.scalars().all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "original_filename": r.original_filename,
            "ats_score": r.ats_score,
            "is_optimized": r.is_optimized or False,
            "file_format": r.file_format,
            "raw_text": r.raw_text[:2000] if r.raw_text else None,
            "professional_summary": r.professional_summary,
            "contact_info": r.contact_info,
            "sections": r.sections,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in resumes
    ]


@router.get("/students/stats", response_model=CollegeStatsResponse)
async def get_student_stats(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated student statistics for the college dashboard."""
    # Count by status
    total_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(CollegeStudent.college_id == college.id)
    )
    total = total_result.scalar() or 0

    invited_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == college.id,
            CollegeStudent.status == "invited",
        )
    )
    invited = invited_result.scalar() or 0

    registered_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == college.id,
            CollegeStudent.status == "registered",
        )
    )
    registered = registered_result.scalar() or 0

    ready_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == college.id,
            CollegeStudent.status == "ready",
        )
    )
    ready = ready_result.scalar() or 0

    placement_ready_percent = (ready / total * 100) if total > 0 else 0.0

    return CollegeStatsResponse(
        total_students=total,
        invited=invited,
        registered=registered,
        ready=ready,
        avg_cgpa=None,  # Would need education data to compute
        placement_ready_percent=round(placement_ready_percent, 1),
        top_skills=[],  # Would need skills extraction from resumes
    )


# ─── Share Profiles ───────────────────────────────────────────

@router.post("/share", response_model=ShareProfilesResponse)
async def share_profiles(
    data: ShareProfilesRequest,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Generate a shareable link for selected student profiles."""
    # Verify all student IDs belong to this college
    for sid in data.student_ids:
        result = await db.execute(
            select(CollegeStudent).where(
                CollegeStudent.id == sid,
                CollegeStudent.college_id == college.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Student ID {sid} not found in your college")

    share_token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

    shared = SharedProfile(
        college_id=college.id,
        share_token=share_token,
        recruiter_email=data.recruiter_email,
        message=data.message,
        student_ids=data.student_ids,
        expires_at=expires_at,
    )
    db.add(shared)
    await db.commit()
    await db.refresh(shared)

    share_url = f"{settings.frontend_url}/shared/{share_token}"

    return ShareProfilesResponse(
        share_token=share_token,
        share_url=share_url,
        expires_at=expires_at,
        student_count=len(data.student_ids),
    )
