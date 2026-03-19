"""Department and curriculum management routes — Phase 1.

Endpoints:
  POST   /departments              — Create department
  GET    /departments              — List departments
  PUT    /departments/{id}         — Update department
  DELETE /departments/{id}         — Deactivate department
  POST   /departments/{id}/courses — Add course to department
  GET    /departments/{id}/curriculum — Full curriculum view
  PUT    /courses/{id}             — Update course
  DELETE /courses/{id}             — Delete course
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import AsyncSessionLocal
from models import (
    College, Department, CurriculumCourse, CourseSkillMapping,
    SkillTaxonomy, CollegeStudent, CollegeAuditLog
)
from schemas import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    CourseCreate, CourseUpdate, CourseResponse,
    CurriculumSemesterView, CurriculumOverview
)
from services.auth_service import auth_service
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/college", tags=["College - Departments"])
college_security = HTTPBearer()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_college(credentials: HTTPAuthorizationCredentials = Depends(college_security)) -> int:
    """Validate college JWT and return college_id."""
    payload = auth_service.decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "college":
        raise HTTPException(status_code=401, detail="Invalid college token")
    try:
        return int(payload["sub"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid college token")


# ─── DEPARTMENTS ─────────────────────────────────────────────

@router.post("/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Create a new department in this college."""
    # Verify college exists and is approved
    college = await db.get(College, college_id)
    if not college or college.status != "approved":
        raise HTTPException(status_code=403, detail="College not found or not approved")
    
    # Check for duplicate
    existing = await db.execute(
        select(Department).where(
            and_(
                Department.college_id == college_id,
                Department.code == data.code,
                Department.degree_type == data.degree_type
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Department {data.code} ({data.degree_type}) already exists")
    
    dept = Department(
        college_id=college_id,
        name=data.name,
        code=data.code.upper(),
        degree_type=data.degree_type,
        duration_semesters=data.duration_semesters,
    )
    db.add(dept)
    await db.flush()  # Get dept.id before creating audit log
    
    # Audit log
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="department_created",
        entity_type="department",
        entity_id=dept.id,
        details={"name": data.name, "code": data.code, "degree_type": data.degree_type}
    ))
    
    await db.commit()
    await db.refresh(dept)
    
    return DepartmentResponse(
        id=dept.id,
        college_id=dept.college_id,
        name=dept.name,
        code=dept.code,
        degree_type=dept.degree_type,
        duration_semesters=dept.duration_semesters,
        is_active=dept.is_active,
        student_count=0,
        created_at=dept.created_at,
    )


@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """List all departments for this college with student counts."""
    result = await db.execute(
        select(
            Department,
            func.count(CollegeStudent.id).label("student_count")
        )
        .outerjoin(CollegeStudent, CollegeStudent.department_id == Department.id)
        .where(Department.college_id == college_id)
        .group_by(Department.id)
        .order_by(Department.name)
    )
    rows = result.all()
    
    return [
        DepartmentResponse(
            id=dept.id,
            college_id=dept.college_id,
            name=dept.name,
            code=dept.code,
            degree_type=dept.degree_type,
            duration_semesters=dept.duration_semesters,
            is_active=dept.is_active,
            student_count=count,
            created_at=dept.created_at,
        )
        for dept, count in rows
    ]


@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    data: DepartmentUpdate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Update a department."""
    dept = await db.get(Department, department_id)
    if not dept or dept.college_id != college_id:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "code" and value:
            value = value.upper()
        setattr(dept, key, value)
    
    await db.commit()
    await db.refresh(dept)
    
    # Get student count
    count_q = await db.execute(
        select(func.count(CollegeStudent.id)).where(CollegeStudent.department_id == department_id)
    )
    student_count = count_q.scalar() or 0
    
    return DepartmentResponse(
        id=dept.id,
        college_id=dept.college_id,
        name=dept.name,
        code=dept.code,
        degree_type=dept.degree_type,
        duration_semesters=dept.duration_semesters,
        is_active=dept.is_active,
        student_count=student_count,
        created_at=dept.created_at,
    )


@router.delete("/departments/{department_id}", status_code=204)
async def deactivate_department(
    department_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Soft-delete (deactivate) a department."""
    dept = await db.get(Department, department_id)
    if not dept or dept.college_id != college_id:
        raise HTTPException(status_code=404, detail="Department not found")
    
    dept.is_active = False
    
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="department_deactivated",
        entity_type="department",
        entity_id=department_id,
    ))
    
    await db.commit()


# ─── COURSES ─────────────────────────────────────────────────

@router.post("/departments/{department_id}/courses", response_model=CourseResponse, status_code=201)
async def create_course(
    department_id: int,
    data: CourseCreate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Add a course to a department's curriculum."""
    # Verify department belongs to college
    dept = await db.get(Department, department_id)
    if not dept or dept.college_id != college_id:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if data.semester_number > dept.duration_semesters:
        raise HTTPException(
            status_code=400,
            detail=f"Semester {data.semester_number} exceeds department duration ({dept.duration_semesters} semesters)"
        )
    
    course = CurriculumCourse(
        department_id=department_id,
        semester_number=data.semester_number,
        course_name=data.course_name,
        course_code=data.course_code,
        credits=data.credits,
        course_type=data.course_type,
        description=data.description,
    )
    db.add(course)
    await db.flush()
    
    # Map skills to course
    skills_info = []
    for skill_id in data.skill_ids:
        skill = await db.get(SkillTaxonomy, skill_id)
        if skill:
            mapping = CourseSkillMapping(
                course_id=course.id,
                skill_id=skill_id,
            )
            db.add(mapping)
            skills_info.append({"skill_id": skill.id, "skill_name": skill.name, "expected_level": "intermediate"})
    
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        department_id=course.department_id,
        semester_number=course.semester_number,
        course_name=course.course_name,
        course_code=course.course_code,
        credits=course.credits,
        course_type=course.course_type,
        description=course.description,
        skills=skills_info,
        created_at=course.created_at,
    )


@router.get("/departments/{department_id}/curriculum", response_model=CurriculumOverview)
async def get_curriculum(
    department_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Get full curriculum for a department, grouped by semester."""
    dept = await db.get(Department, department_id)
    if not dept or dept.college_id != college_id:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Get all courses with skill mappings
    result = await db.execute(
        select(CurriculumCourse)
        .options(selectinload(CurriculumCourse.skill_mappings).selectinload(CourseSkillMapping.skill))
        .where(CurriculumCourse.department_id == department_id)
        .order_by(CurriculumCourse.semester_number, CurriculumCourse.course_name)
    )
    courses = result.scalars().all()
    
    # Group by semester
    semesters: dict[int, list] = {}
    all_skills = set()
    
    for course in courses:
        sem = course.semester_number
        if sem not in semesters:
            semesters[sem] = []
        
        skill_list = []
        for mapping in course.skill_mappings:
            skill_list.append({
                "skill_id": mapping.skill.id,
                "skill_name": mapping.skill.name,
                "expected_level": mapping.expected_level,
            })
            all_skills.add(mapping.skill.name)
        
        semesters[sem].append(CourseResponse(
            id=course.id,
            department_id=course.department_id,
            semester_number=course.semester_number,
            course_name=course.course_name,
            course_code=course.course_code,
            credits=course.credits,
            course_type=course.course_type,
            description=course.description,
            skills=skill_list,
            created_at=course.created_at,
        ))
    
    semester_views = []
    for sem_num in sorted(semesters.keys()):
        sem_courses = semesters[sem_num]
        semester_views.append(CurriculumSemesterView(
            semester_number=sem_num,
            courses=sem_courses,
            total_credits=sum(c.credits for c in sem_courses),
            skills_covered=list(set(
                s["skill_name"] for c in sem_courses for s in c.skills
            )),
        ))
    
    return CurriculumOverview(
        department_id=dept.id,
        department_name=dept.name,
        degree_type=dept.degree_type or "",
        total_semesters=dept.duration_semesters,
        semesters=semester_views,
        total_skills_mapped=len(all_skills),
    )


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Update a course and optionally its skill mappings."""
    # Verify ownership through department → college
    result = await db.execute(
        select(CurriculumCourse)
        .options(selectinload(CurriculumCourse.skill_mappings).selectinload(CourseSkillMapping.skill))
        .join(Department, Department.id == CurriculumCourse.department_id)
        .where(
            and_(
                CurriculumCourse.id == course_id,
                Department.college_id == college_id
            )
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = data.model_dump(exclude_unset=True)
    skill_ids = update_data.pop("skill_ids", None)
    
    for key, value in update_data.items():
        setattr(course, key, value)
    
    # Update skill mappings if provided
    if skill_ids is not None:
        # Remove old mappings
        for mapping in course.skill_mappings:
            await db.delete(mapping)
        await db.flush()
        
        # Add new mappings
        for skill_id in skill_ids:
            mapping = CourseSkillMapping(course_id=course.id, skill_id=skill_id)
            db.add(mapping)
    
    await db.commit()
    
    # Reload to get updated skill mappings
    result = await db.execute(
        select(CurriculumCourse)
        .options(selectinload(CurriculumCourse.skill_mappings).selectinload(CourseSkillMapping.skill))
        .where(CurriculumCourse.id == course_id)
    )
    course = result.scalar_one()
    
    skills_info = [
        {"skill_id": m.skill.id, "skill_name": m.skill.name, "expected_level": m.expected_level}
        for m in course.skill_mappings
    ]
    
    return CourseResponse(
        id=course.id,
        department_id=course.department_id,
        semester_number=course.semester_number,
        course_name=course.course_name,
        course_code=course.course_code,
        credits=course.credits,
        course_type=course.course_type,
        description=course.description,
        skills=skills_info,
        created_at=course.created_at,
    )


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course and its skill mappings."""
    result = await db.execute(
        select(CurriculumCourse)
        .join(Department, Department.id == CurriculumCourse.department_id)
        .where(
            and_(
                CurriculumCourse.id == course_id,
                Department.college_id == college_id
            )
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    await db.delete(course)
    await db.commit()
