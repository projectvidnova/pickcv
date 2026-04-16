"""College module routes — registration, login, student management, sharing."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct
from datetime import datetime, timezone, timedelta
import secrets
import logging

from database import get_db, async_session_maker
from models import (
    College, CollegeStudent, User, Resume, SharedProfile,
    Department, StudentSkill, SkillTaxonomy, COEGroup, COEMembership,
    CollegeAlert, CollegeAuditLog, UserSkill, CollegeAdmin
)
from schemas import (
    CollegeRegisterRequest, CollegeLoginRequest, CollegeResponse,
    CollegeProfileUpdate, CollegeStudentResponse, StudentUploadResponse,
    ShareProfilesRequest, ShareProfilesResponse, CollegeStatsResponse,
    StudentUploadItem, StudentResumeInfo, StudentProfileUpdate,
    StudentBulkUpdateRequest, CollegeAlertResponse, AlertDismissRequest,
    CollegeAuditLogResponse, CGPASegregationResponse, StudentCGPATier,
    CollegeAdminCreateRequest, CollegeAdminResponse, CollegeChangePasswordRequest,
)
from services.auth_service import auth_service
from services.college_service import college_service
from services.email_service import email_service
from services.skill_analytics_service import sync_student_skills_from_user, get_skill_heatmap
from config import settings, get_frontend_origin

logger = logging.getLogger(__name__)

router = APIRouter()


async def _send_invitations_background(
    college_id: int, college_name: str, frontend_url: str
):
    """Background task: send invitation emails to new students AND notify existing ones."""
    async with async_session_maker() as db:
        try:
            inv = await college_service.send_invitations(
                db, college_id, college_name, frontend_url
            )
            logger.info(
                f"Background invitation emails — sent: {inv['sent']}, "
                f"failed: {inv['failed']} (college {college_id})"
            )
        except Exception:
            logger.exception(
                f"Background invitation emails failed (college {college_id})"
            )
        try:
            notif = await college_service.notify_existing_students(
                db, college_id, college_name, frontend_url
            )
            logger.info(
                f"Background notification emails — sent: {notif['sent']}, "
                f"failed: {notif['failed']} (college {college_id})"
            )
        except Exception:
            logger.exception(
                f"Background notification emails failed (college {college_id})"
            )


# ─── Auth helpers ────────────────────────────────────────────
def _create_college_token(college_id: int, email: str, *, college_admin_id: int | None = None, role: str = "owner") -> str:
    """Create JWT token for a college user (owner or sub-admin)."""
    data = {"sub": str(college_id), "type": "college", "email": email, "role": role}
    if college_admin_id:
        data["college_admin_id"] = str(college_admin_id)
    return auth_service.create_access_token(data=data)


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
    """Verify JWT and return college entity. Works for both owner and sub-admin tokens."""
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
    background_tasks: BackgroundTasks,
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

    # Send confirmation email to the registering officer
    background_tasks.add_task(
        email_service.send_college_registration_confirmation,
        recipient_email=college.official_email,
        institution_name=college.institution_name,
        contact_person_name=college.contact_person_name or "",
    )

    # Notify admin about the new registration
    background_tasks.add_task(
        email_service.send_admin_new_registration_alert,
        admin_email=settings.admin_notification_email,
        institution_name=college.institution_name,
        official_email=college.official_email,
        contact_person_name=college.contact_person_name or "",
        designation=college.designation or "",
        city=college.city or "",
        state=college.state or "",
    )

    return college


@router.post("/login")
async def login_college(
    data: CollegeLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login for college users (owner or sub-admin). Returns JWT + college info."""

    # 1. Try owner login (colleges table)
    result = await db.execute(
        select(College).where(College.official_email == data.email)
    )
    college = result.scalar_one_or_none()

    if college and auth_service.verify_password(data.password, college.password_hash):
        # Owner login
        token = _create_college_token(college.id, college.official_email, role="owner")
        return {
            "access_token": token,
            "token_type": "bearer",
            "college_id": college.id,
            "institution_name": college.institution_name,
            "status": college.status,
            "rejection_reason": college.rejection_reason,
            "onboarding_completed": college.onboarding_completed,
            "role": "owner",
            "must_change_password": False,
        }

    # 2. Try sub-admin login (college_admins table)
    admin_result = await db.execute(
        select(CollegeAdmin).where(
            CollegeAdmin.email == data.email,
            CollegeAdmin.is_active == True,
        )
    )
    college_admin = admin_result.scalar_one_or_none()

    if college_admin and auth_service.verify_password(data.password, college_admin.password_hash):
        # Load the parent college
        college_result = await db.execute(
            select(College).where(College.id == college_admin.college_id)
        )
        college = college_result.scalar_one_or_none()
        if not college:
            raise HTTPException(status_code=401, detail="College not found")

        # Update last_login
        college_admin.last_login = datetime.now(timezone.utc)
        await db.commit()

        token = _create_college_token(
            college.id, college_admin.email,
            college_admin_id=college_admin.id, role=college_admin.role,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "college_id": college.id,
            "institution_name": college.institution_name,
            "status": college.status,
            "rejection_reason": college.rejection_reason,
            "onboarding_completed": college.onboarding_completed,
            "role": college_admin.role,
            "must_change_password": college_admin.must_change_password,
            "admin_name": college_admin.name,
        }

    raise HTTPException(status_code=401, detail="Invalid email or password")


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
    request: Request,
    file: UploadFile = File(None),
    emails: str = Form(None),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
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

    # Auto-send emails to all newly added students
    new_count = result["invited"] + result["registered"] + result["ready"]
    if new_count > 0:
        background_tasks.add_task(
            _send_invitations_background,
            college_id=college.id,
            college_name=college.institution_name,
            frontend_url=get_frontend_origin(request),
        )
        logger.info(
            f"Queued emails for {new_count} new students "
            f"(college {college.id})"
        )

    return StudentUploadResponse(
        total=result["total"],
        invited=result["invited"],
        registered=result["registered"],
        ready=result["ready"],
        already_exists=result["already_exists"],
        students=student_responses,
    )


@router.post("/students/add")
async def add_students_manual(
    request: Request,
    students: List[StudentUploadItem],
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Add students via JSON (manual form entry). Each item has full student fields."""
    students_data = [s.model_dump() for s in students]
    if not students_data:
        raise HTTPException(status_code=400, detail="No students provided")

    result = await college_service.process_student_emails(db, college.id, students_data)

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

    # Auto-send emails to all newly added students
    new_count = result["invited"] + result["registered"] + result["ready"]
    if new_count > 0:
        background_tasks.add_task(
            _send_invitations_background,
            college_id=college.id,
            college_name=college.institution_name,
            frontend_url=get_frontend_origin(request),
        )
        logger.info(
            f"Queued emails for {new_count} new students "
            f"(college {college.id})"
        )

    return StudentUploadResponse(
        total=result["total"],
        invited=result["invited"],
        registered=result["registered"],
        ready=result["ready"],
        already_exists=result["already_exists"],
        students=student_responses,
    )


@router.get("/students/template")
async def download_student_template():
    """Download a CSV template for bulk student upload."""
    from fastapi.responses import StreamingResponse
    headers_row = "name,email,branch,year,sem,cgpa\n"
    sample_row = "John Doe,student@college.edu,Computer Science,2025,8,8.5\n"
    csv_content = headers_row + sample_row
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_upload_template.csv"},
    )


# ─── Public invite verification (no auth required) ──────────
@router.get("/invite/verify")
async def verify_invite_token(
    token: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    """Public: validate an invitation token and return college + student info."""
    result = await db.execute(
        select(CollegeStudent).where(CollegeStudent.invitation_token == token)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")

    college_result = await db.execute(
        select(College).where(College.id == student.college_id)
    )
    college = college_result.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    return {
        "college_name": college.institution_name,
        "college_logo": college.logo_url,
        "student_email": student.email,
        "student_name": student.name,
        "status": student.status,
    }


@router.post("/students/invite")
async def invite_students(
    request: Request,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Send invitation emails to all 'invited' students."""
    result = await college_service.send_invitations(
        db=db,
        college_id=college.id,
        college_name=college.institution_name,
        frontend_url=get_frontend_origin(request),
    )
    return result


@router.get("/students", response_model=list[CollegeStudentResponse])
async def list_students(
    department_id: int = Query(None),
    graduation_year: int = Query(None),
    current_semester: int = Query(None),
    status_filter: str = Query(None, alias="status"),
    placement_status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """List all students for this college with enriched user data. Supports filtering and pagination."""
    query = select(CollegeStudent).where(CollegeStudent.college_id == college.id)
    
    # Apply filters
    if department_id:
        query = query.where(CollegeStudent.department_id == department_id)
    if graduation_year:
        query = query.where(CollegeStudent.graduation_year == graduation_year)
    if current_semester:
        query = query.where(CollegeStudent.current_semester == current_semester)
    if status_filter:
        query = query.where(CollegeStudent.status == status_filter)
    if placement_status:
        query = query.where(CollegeStudent.placement_status == placement_status)
    
    # Pagination
    query = query.order_by(CollegeStudent.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    students = result.scalars().all()

    enriched = []
    for s in students:
        # Get department name
        dept_name = None
        if s.department_id:
            dept = await db.get(Department, s.department_id)
            dept_name = dept.name if dept else None
        
        # Get student skills
        skill_details = []
        skill_names = []
        skills_result = await db.execute(
            select(StudentSkill, SkillTaxonomy)
            .join(SkillTaxonomy, SkillTaxonomy.id == StudentSkill.skill_id)
            .where(StudentSkill.student_id == s.id)
            .order_by(SkillTaxonomy.name)
        )
        for ss, st in skills_result.all():
            skill_details.append({
                "skill_name": st.name,
                "proficiency": ss.proficiency,
                "source": ss.source,
            })
            skill_names.append(st.name)
        
        # Get COE memberships
        coe_info = []
        coe_result = await db.execute(
            select(COEMembership, COEGroup)
            .join(COEGroup, COEGroup.id == COEMembership.coe_id)
            .where(and_(COEMembership.student_id == s.id, COEMembership.status == "active"))
        )
        for cm, cg in coe_result.all():
            coe_info.append({
                "coe_name": cg.name,
                "coe_code": cg.code,
                "role": cm.role,
            })
        
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
            # Phase 1 enhanced fields from college_student record
            department_id=s.department_id,
            department_name=dept_name,
            roll_number=s.roll_number,
            degree_type=s.degree_type,
            current_semester=s.current_semester,
            cgpa=s.cgpa,
            admission_year=s.admission_year,
            phone=s.phone,
            linkedin_url=s.linkedin_url,
            github_url=s.github_url,
            portfolio_url=s.portfolio_url,
            resume_score=s.resume_score,
            resume_status=s.resume_status or "none",
            interview_readiness_score=s.interview_readiness_score or 0,
            placement_status=s.placement_status or "not_started",
            placed_company=s.placed_company,
            placed_role=s.placed_role,
            placed_salary_lpa=s.placed_salary_lpa,
            skills=skill_names,
            skill_details=skill_details,
            coe_groups=coe_info,
        )

        # Enrich with user data if linked
        if s.user_id:
            user_result = await db.execute(select(User).where(User.id == s.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                resp.full_name = user.full_name or s.name
                resp.phone = resp.phone or user.phone
                resp.linkedin_url = resp.linkedin_url or user.linkedin_url
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
                
                # Update denormalized resume_score from best resume
                if user_resumes:
                    best_score = max((r.ats_score or 0) for r in user_resumes)
                    if best_score > 0 and best_score != s.resume_score:
                        s.resume_score = best_score
                        s.resume_status = "optimized" if any(r.is_optimized for r in user_resumes) else "uploaded"

        enriched.append(resp)

    # Commit any denormalized updates
    await db.commit()

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
    cid = college.id
    
    # Count by status
    total_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(CollegeStudent.college_id == cid)
    )
    total = total_result.scalar() or 0

    invited_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == cid, CollegeStudent.status == "invited",
        )
    )
    invited = invited_result.scalar() or 0

    registered_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == cid, CollegeStudent.status == "registered",
        )
    )
    registered = registered_result.scalar() or 0

    ready_result = await db.execute(
        select(func.count(CollegeStudent.id)).where(
            CollegeStudent.college_id == cid, CollegeStudent.status == "ready",
        )
    )
    ready = ready_result.scalar() or 0

    placement_ready_percent = (ready / total * 100) if total > 0 else 0.0
    
    # Phase 1: Real avg CGPA
    avg_cgpa_result = await db.execute(
        select(func.avg(CollegeStudent.cgpa))
        .where(and_(CollegeStudent.college_id == cid, CollegeStudent.cgpa.isnot(None)))
    )
    avg_cgpa = avg_cgpa_result.scalar()
    avg_cgpa = round(avg_cgpa, 2) if avg_cgpa else None
    
    # Phase 1: Department breakdown
    dept_result = await db.execute(
        select(
            Department.name,
            Department.code,
            func.count(CollegeStudent.id).label("count"),
            func.avg(CollegeStudent.cgpa).label("avg_cgpa"),
        )
        .outerjoin(CollegeStudent, CollegeStudent.department_id == Department.id)
        .where(Department.college_id == cid)
        .group_by(Department.id, Department.name, Department.code)
        .order_by(Department.name)
    )
    department_breakdown = [
        {
            "department": row.name,
            "code": row.code,
            "count": row.count,
            "avg_cgpa": round(row.avg_cgpa, 2) if row.avg_cgpa else None,
        }
        for row in dept_result.all()
    ]
    
    # Phase 1: Placement stats
    placement_counts = {}
    for ps in ["not_started", "preparing", "applying", "interviewing", "placed", "opted_out"]:
        r = await db.execute(
            select(func.count(CollegeStudent.id))
            .where(and_(CollegeStudent.college_id == cid, CollegeStudent.placement_status == ps))
        )
        placement_counts[ps] = r.scalar() or 0
    
    avg_salary_result = await db.execute(
        select(func.avg(CollegeStudent.placed_salary_lpa))
        .where(and_(CollegeStudent.college_id == cid, CollegeStudent.placed_salary_lpa.isnot(None)))
    )
    avg_salary = avg_salary_result.scalar()
    
    placement_stats = {
        **placement_counts,
        "avg_salary_lpa": round(avg_salary, 2) if avg_salary else None,
        "placement_rate": round((placement_counts["placed"] / total * 100), 1) if total > 0 else 0,
    }
    
    # Phase 1: Resume stats
    resume_counts = {}
    for rs in ["none", "uploaded", "optimized"]:
        r = await db.execute(
            select(func.count(CollegeStudent.id))
            .where(and_(CollegeStudent.college_id == cid, CollegeStudent.resume_status == rs))
        )
        resume_counts[rs] = r.scalar() or 0
    
    avg_score_result = await db.execute(
        select(func.avg(CollegeStudent.resume_score))
        .where(and_(CollegeStudent.college_id == cid, CollegeStudent.resume_score.isnot(None)))
    )
    avg_resume_score = avg_score_result.scalar()
    resume_stats = {
        **resume_counts,
        "avg_score": round(avg_resume_score, 1) if avg_resume_score else None,
    }
    
    # Phase 1: Top skills from student_skills
    top_skills_result = await db.execute(
        select(
            SkillTaxonomy.name,
            SkillTaxonomy.category,
            func.count(distinct(StudentSkill.student_id)).label("count"),
        )
        .join(StudentSkill, StudentSkill.skill_id == SkillTaxonomy.id)
        .join(CollegeStudent, CollegeStudent.id == StudentSkill.student_id)
        .where(CollegeStudent.college_id == cid)
        .group_by(SkillTaxonomy.id, SkillTaxonomy.name, SkillTaxonomy.category)
        .order_by(func.count(distinct(StudentSkill.student_id)).desc())
        .limit(20)
    )
    top_skills = [
        {"name": row.name, "category": row.category, "count": row.count}
        for row in top_skills_result.all()
    ]
    
    # Phase 1: COE stats
    coe_result = await db.execute(
        select(
            COEGroup.name,
            COEGroup.code,
            func.count(COEMembership.id).label("member_count"),
            func.avg(CollegeStudent.resume_score).label("avg_score"),
        )
        .outerjoin(COEMembership, COEMembership.coe_id == COEGroup.id)
        .outerjoin(CollegeStudent, CollegeStudent.id == COEMembership.student_id)
        .where(and_(COEGroup.college_id == cid, COEGroup.is_active == True))
        .group_by(COEGroup.id, COEGroup.name, COEGroup.code)
        .order_by(COEGroup.name)
    )
    coe_stats = [
        {
            "coe_name": row.name,
            "coe_code": row.code,
            "member_count": row.member_count,
            "avg_resume_score": round(row.avg_score, 1) if row.avg_score else None,
        }
        for row in coe_result.all()
    ]
    
    # Alert count
    alerts_result = await db.execute(
        select(func.count(CollegeAlert.id))
        .where(and_(CollegeAlert.college_id == cid, CollegeAlert.is_read == False))
    )
    alerts_count = alerts_result.scalar() or 0

    return CollegeStatsResponse(
        total_students=total,
        invited=invited,
        registered=registered,
        ready=ready,
        avg_cgpa=avg_cgpa,
        placement_ready_percent=round(placement_ready_percent, 1),
        top_skills=top_skills,
        department_breakdown=department_breakdown,
        placement_stats=placement_stats,
        resume_stats=resume_stats,
        skill_heatmap=[],  # Use /college/skills/heatmap for full data
        coe_stats=coe_stats,
        alerts_count=alerts_count,
    )


@router.get("/students/cgpa-segregation", response_model=CGPASegregationResponse)
async def get_students_by_cgpa(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get students segregated by CGPA ranges for the registered (linked) students in the college."""
    cid = college.id
    
    # Fetch all students with CGPA data and their resume info
    result = await db.execute(
        select(
            CollegeStudent.id,
            CollegeStudent.email,
            User.full_name,
            CollegeStudent.cgpa,
            Department.name.label("department"),
            CollegeStudent.status,
            CollegeStudent.placement_status,
            func.count(Resume.id).label("resume_count"),
        )
        .outerjoin(User, CollegeStudent.user_id == User.id)
        .outerjoin(Department, CollegeStudent.department_id == Department.id)
        .outerjoin(Resume, Resume.user_id == User.id)
        .where(CollegeStudent.college_id == cid)
        .group_by(
            CollegeStudent.id, CollegeStudent.email, User.full_name,
            CollegeStudent.cgpa, Department.name, CollegeStudent.status,
            CollegeStudent.placement_status
        )
    )
    
    students = result.all()
    
    # Segregate by CGPA tiers
    segregation = {
        "elite": [],
        "excellent": [],
        "very_good": [],
        "good": [],
        "average": [],
        "no_cgpa": [],
    }
    
    total_with_cgpa = 0
    sum_cgpa = 0.0
    
    for student in students:
        cgpa = student.cgpa
        resume_count = student.resume_count or 0
        
        student_obj = StudentCGPATier(
            id=student.id,
            email=student.email,
            name=student.full_name,
            cgpa=cgpa,
            department=student.department,
            status=student.status,
            placement_status=student.placement_status,
            resume_uploaded=resume_count > 0,
        )
        
        # Segregate
        if cgpa is None:
            segregation["no_cgpa"].append(student_obj)
        elif cgpa >= 3.7:
            segregation["elite"].append(student_obj)
            total_with_cgpa += 1
            sum_cgpa += cgpa
        elif cgpa >= 3.4:
            segregation["excellent"].append(student_obj)
            total_with_cgpa += 1
            sum_cgpa += cgpa
        elif cgpa >= 3.0:
            segregation["very_good"].append(student_obj)
            total_with_cgpa += 1
            sum_cgpa += cgpa
        elif cgpa >= 2.5:
            segregation["good"].append(student_obj)
            total_with_cgpa += 1
            sum_cgpa += cgpa
        else:
            segregation["average"].append(student_obj)
            total_with_cgpa += 1
            sum_cgpa += cgpa
    
    # Calculate statistics
    avg_cgpa = (sum_cgpa / total_with_cgpa) if total_with_cgpa > 0 else None
    total_count = len(students)
    
    return CGPASegregationResponse(
        elite=segregation["elite"],
        excellent=segregation["excellent"],
        very_good=segregation["very_good"],
        good=segregation["good"],
        average=segregation["average"],
        no_cgpa=segregation["no_cgpa"],
        total_count=total_count,
        avg_cgpa=round(avg_cgpa, 2) if avg_cgpa else None,
        cgpa_provided_count=total_with_cgpa,
    )

@router.post("/share", response_model=ShareProfilesResponse)
async def share_profiles(
    data: ShareProfilesRequest,
    request: Request,
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
        recruiter_name=data.recruiter_name,
        recruiter_company=data.recruiter_company,
        message=data.message,
        student_ids=data.student_ids,
        expires_at=expires_at,
        filter_criteria=data.filter_criteria,
    )
    db.add(shared)
    
    # Audit log
    db.add(CollegeAuditLog(
        college_id=college.id,
        actor_type="college_admin",
        actor_id=college.id,
        action="profiles_shared",
        entity_type="share",
        details={
            "recruiter_email": data.recruiter_email,
            "student_count": len(data.student_ids),
            "expires_in_days": data.expires_in_days,
        },
    ))
    
    await db.commit()
    await db.refresh(shared)

    share_url = f"{get_frontend_origin(request)}/shared/{share_token}"

    return ShareProfilesResponse(
        share_token=share_token,
        share_url=share_url,
        expires_at=expires_at,
        student_count=len(data.student_ids),
    )


# ─── Delete Student ───────────────────────────────────────────

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Delete a student from this college."""
    student = await db.get(CollegeStudent, student_id)
    if not student or student.college_id != college.id:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.delete(student)
    await db.commit()
    return {"success": True, "message": "Student removed"}


# ─── College Admin (Multi-user) Management ────────────────────

def _get_token_role(credentials: HTTPAuthorizationCredentials) -> dict:
    """Extract role and admin info from JWT."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "college":
        raise HTTPException(status_code=401, detail="Invalid college token")
    return payload


@router.get("/admins", response_model=list[CollegeAdminResponse])
async def list_college_admins(
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """List all admins for this college. Includes the owner as a virtual entry."""
    result = await db.execute(
        select(CollegeAdmin)
        .where(CollegeAdmin.college_id == college.id)
        .order_by(CollegeAdmin.created_at)
    )
    admins = result.scalars().all()

    # Include the owner (from colleges table) as the first entry
    owner_entry = CollegeAdminResponse(
        id=0,
        college_id=college.id,
        email=college.official_email,
        name=college.contact_person_name,
        role="owner",
        is_active=True,
        must_change_password=False,
        last_login=None,
        created_at=college.created_at,
    )
    return [owner_entry] + [CollegeAdminResponse.model_validate(a) for a in admins]


@router.post("/admins", response_model=CollegeAdminResponse, status_code=201)
async def add_college_admin(
    data: CollegeAdminCreateRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Add a new placement officer / admin. Only the owner can do this."""
    payload = _get_token_role(credentials)
    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the institution owner can add admins")

    # Check email not already used as owner
    if data.email.lower() == college.official_email.lower():
        raise HTTPException(status_code=400, detail="This email is the institution owner email")

    # Check email not already an admin for this college
    existing = await db.execute(
        select(CollegeAdmin).where(
            CollegeAdmin.college_id == college.id,
            CollegeAdmin.email == data.email,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email is already an admin for your institution")

    # Generate a random temporary password
    temp_password = secrets.token_urlsafe(10)
    hashed_pw = auth_service.get_password_hash(temp_password)

    new_admin = CollegeAdmin(
        college_id=college.id,
        email=data.email,
        password_hash=hashed_pw,
        name=data.name,
        role="admin",
        is_active=True,
        must_change_password=True,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    logger.info(f"College admin added: {new_admin.email} for college {college.institution_name} (ID {college.id})")

    # Send credentials email
    background_tasks.add_task(
        email_service.send_college_admin_credentials,
        recipient_email=new_admin.email,
        admin_name=new_admin.name,
        institution_name=college.institution_name,
        temp_password=temp_password,
        login_url=f"{get_frontend_origin(request)}/college/login",
    )

    return CollegeAdminResponse.model_validate(new_admin)


@router.delete("/admins/{admin_id}")
async def remove_college_admin(
    admin_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Remove a sub-admin. Only the owner can do this."""
    payload = _get_token_role(credentials)
    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the institution owner can remove admins")

    admin = await db.get(CollegeAdmin, admin_id)
    if not admin or admin.college_id != college.id:
        raise HTTPException(status_code=404, detail="Admin not found")

    await db.delete(admin)
    await db.commit()
    logger.info(f"College admin removed: {admin.email} from college {college.id}")
    return {"success": True, "message": "Admin removed"}


@router.put("/admins/{admin_id}/toggle")
async def toggle_college_admin(
    admin_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Activate/deactivate a sub-admin. Owner only."""
    payload = _get_token_role(credentials)
    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the institution owner can manage admins")

    admin = await db.get(CollegeAdmin, admin_id)
    if not admin or admin.college_id != college.id:
        raise HTTPException(status_code=404, detail="Admin not found")

    admin.is_active = not admin.is_active
    await db.commit()
    await db.refresh(admin)
    status_str = "activated" if admin.is_active else "deactivated"
    logger.info(f"College admin {status_str}: {admin.email} (college {college.id})")
    return {"success": True, "is_active": admin.is_active, "message": f"Admin {status_str}"}


@router.post("/change-password")
async def change_password(
    data: CollegeChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    db: AsyncSession = Depends(get_db),
):
    """Change password for the logged-in college user (owner or sub-admin)."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "college":
        raise HTTPException(status_code=401, detail="Invalid college token")

    college_admin_id = payload.get("college_admin_id")

    if college_admin_id:
        # Sub-admin changing password
        admin = await db.get(CollegeAdmin, int(college_admin_id))
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        if not auth_service.verify_password(data.current_password, admin.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        admin.password_hash = auth_service.get_password_hash(data.new_password)
        admin.must_change_password = False
        await db.commit()
        logger.info(f"College admin password changed: {admin.email}")
    else:
        # Owner changing password
        college_id = int(payload["sub"])
        result = await db.execute(select(College).where(College.id == college_id))
        college = result.scalar_one_or_none()
        if not college:
            raise HTTPException(status_code=404, detail="College not found")
        if not auth_service.verify_password(data.current_password, college.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        college.password_hash = auth_service.get_password_hash(data.new_password)
        await db.commit()
        logger.info(f"College owner password changed: {college.official_email}")

    return {"success": True, "message": "Password changed successfully"}


@router.get("/me")
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(college_security),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get info about the currently logged-in college user (owner or admin)."""
    payload = _get_token_role(credentials)
    college_admin_id = payload.get("college_admin_id")

    if college_admin_id:
        admin = await db.get(CollegeAdmin, int(college_admin_id))
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        return {
            "role": admin.role,
            "name": admin.name,
            "email": admin.email,
            "must_change_password": admin.must_change_password,
            "college_id": college.id,
            "institution_name": college.institution_name,
        }
    else:
        return {
            "role": "owner",
            "name": college.contact_person_name,
            "email": college.official_email,
            "must_change_password": False,
            "college_id": college.id,
            "institution_name": college.institution_name,
        }


@router.delete("/students/bulk")
async def bulk_delete_students(
    student_ids: List[int],
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple students from this college."""
    deleted = 0
    for sid in student_ids:
        student = await db.get(CollegeStudent, sid)
        if student and student.college_id == college.id:
            await db.delete(student)
            deleted += 1
    await db.commit()
    return {"success": True, "deleted": deleted}


# ─── Phase 1: Student Profile Update ─────────────────────────

@router.put("/students/{student_id}", response_model=CollegeStudentResponse)
async def update_student_profile(
    student_id: int,
    data: StudentProfileUpdate,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Update a single student's enhanced profile fields."""
    student = await db.get(CollegeStudent, student_id)
    if not student or student.college_id != college.id:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    
    await db.commit()
    await db.refresh(student)
    
    return CollegeStudentResponse(
        id=student.id,
        email=student.email,
        name=student.name,
        branch=student.branch,
        graduation_year=student.graduation_year,
        user_id=student.user_id,
        status=student.status,
        invited_at=student.invited_at,
        registered_at=student.registered_at,
        ready_at=student.ready_at,
        created_at=student.created_at,
        department_id=student.department_id,
        roll_number=student.roll_number,
        degree_type=student.degree_type,
        current_semester=student.current_semester,
        cgpa=student.cgpa,
        admission_year=student.admission_year,
        phone=student.phone,
        linkedin_url=student.linkedin_url,
        github_url=student.github_url,
        portfolio_url=student.portfolio_url,
        resume_score=student.resume_score,
        resume_status=student.resume_status or "none",
        placement_status=student.placement_status or "not_started",
        placed_company=student.placed_company,
        placed_role=student.placed_role,
        placed_salary_lpa=student.placed_salary_lpa,
    )


@router.put("/students/bulk-update")
async def bulk_update_students(
    data: StudentBulkUpdateRequest,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Bulk update student profiles (e.g., assign departments, semesters, CGPA from CSV)."""
    updated = 0
    errors = []
    
    for item in data.students:
        student = await db.get(CollegeStudent, item.student_id)
        if not student or student.college_id != college.id:
            errors.append({"student_id": item.student_id, "error": "Not found"})
            continue
        
        update_fields = item.updates.model_dump(exclude_unset=True)
        for key, value in update_fields.items():
            setattr(student, key, value)
        updated += 1
    
    db.add(CollegeAuditLog(
        college_id=college.id,
        actor_type="college_admin",
        actor_id=college.id,
        action="students_bulk_updated",
        entity_type="student",
        details={"updated": updated, "errors": len(errors)},
    ))
    
    await db.commit()
    
    return {"updated": updated, "errors": errors}


# ─── Phase 1: Alerts ─────────────────────────────────────────

@router.get("/alerts", response_model=list[CollegeAlertResponse])
async def list_alerts(
    unread_only: bool = Query(False),
    alert_type: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get college alerts."""
    query = select(CollegeAlert).where(CollegeAlert.college_id == college.id)
    
    if unread_only:
        query = query.where(CollegeAlert.is_read == False)
    if alert_type:
        query = query.where(CollegeAlert.alert_type == alert_type)
    
    query = query.order_by(CollegeAlert.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/alerts/dismiss")
async def dismiss_alerts(
    data: AlertDismissRequest,
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Mark alerts as read/dismissed."""
    for alert_id in data.alert_ids:
        alert = await db.get(CollegeAlert, alert_id)
        if alert and alert.college_id == college.id:
            alert.is_read = True
            alert.is_dismissed = True
            alert.read_at = datetime.now(timezone.utc)
    
    await db.commit()
    return {"dismissed": len(data.alert_ids)}


# ─── Phase 1: Audit Log ─────────────────────────────────────

@router.get("/audit-log", response_model=list[CollegeAuditLogResponse])
async def get_audit_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action_filter: str = Query(None, alias="action"),
    college: College = Depends(get_current_college_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get audit log for the college dashboard."""
    query = select(CollegeAuditLog).where(CollegeAuditLog.college_id == college.id)
    
    if action_filter:
        query = query.where(CollegeAuditLog.action == action_filter)
    
    query = query.order_by(CollegeAuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    return result.scalars().all()
