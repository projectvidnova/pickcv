"""Skill taxonomy and analytics routes — Phase 1.

Endpoints:
  GET    /skills/search                  — Search skill taxonomy
  GET    /skills/taxonomy                — List all skill categories
  POST   /skills/taxonomy               — Add custom skill (college admin)
  GET    /college/skills/analytics       — Full skill analytics for college
  GET    /college/skills/heatmap         — Skill heatmap
  GET    /college/skills/gaps            — Skill gap analysis
  POST   /college/students/{id}/skills   — Add skills to a student
  GET    /college/students/{id}/skills   — Get student's skills
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import (
    SkillTaxonomy, StudentSkill, CollegeStudent, College
)
from schemas import (
    SkillTaxonomyResponse, SkillTaxonomyCreate,
    StudentSkillCreate, StudentSkillResponse,
    SkillAnalyticsResponse, SkillHeatmapItem, SkillGapItem
)
from services.skill_analytics_service import (
    get_full_skill_analytics, get_skill_heatmap, get_skill_gaps,
    search_skills, get_or_create_skill, extract_and_store_student_skills
)
from services.auth_service import auth_service
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Two routers: public (skill search) + college-authenticated (analytics)
public_router = APIRouter(prefix="/skills", tags=["Skills - Taxonomy"])
college_router = APIRouter(prefix="/college/skills", tags=["College - Skill Analytics"])
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


# ─── PUBLIC: Skill Taxonomy Search ───────────────────────────

@public_router.get("/search", response_model=list[SkillTaxonomyResponse])
async def search_skill_taxonomy(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search skill taxonomy by name. Public endpoint for autocomplete."""
    skills = await search_skills(db, q, limit)
    return [
        SkillTaxonomyResponse(
            id=s.id,
            name=s.name,
            name_lower=s.name_lower,
            category=s.category,
            subcategory=s.subcategory,
            is_verified=s.is_verified,
            aliases=s.aliases or [],
            demand_score=s.demand_score or 0,
        )
        for s in skills
    ]


@public_router.get("/taxonomy", response_model=list[dict])
async def list_skill_categories(
    db: AsyncSession = Depends(get_db)
):
    """List all skill categories with counts."""
    result = await db.execute(
        select(
            SkillTaxonomy.category,
            SkillTaxonomy.subcategory,
            func.count(SkillTaxonomy.id).label("count")
        )
        .group_by(SkillTaxonomy.category, SkillTaxonomy.subcategory)
        .order_by(SkillTaxonomy.category, SkillTaxonomy.subcategory)
    )
    rows = result.all()
    
    return [
        {"category": r.category, "subcategory": r.subcategory, "count": r.count}
        for r in rows
    ]


@public_router.post("/taxonomy", response_model=SkillTaxonomyResponse, status_code=201)
async def create_skill(
    data: SkillTaxonomyCreate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Add a custom skill to taxonomy (college admin only)."""
    skill = await get_or_create_skill(db, data.name, data.category)
    
    # Update fields if provided
    if data.subcategory:
        skill.subcategory = data.subcategory
    if data.aliases:
        skill.aliases = list(set((skill.aliases or []) + data.aliases))
    
    await db.commit()
    await db.refresh(skill)
    
    return SkillTaxonomyResponse(
        id=skill.id,
        name=skill.name,
        name_lower=skill.name_lower,
        category=skill.category,
        subcategory=skill.subcategory,
        is_verified=skill.is_verified,
        aliases=skill.aliases or [],
        demand_score=skill.demand_score or 0,
    )


# ─── COLLEGE: Skill Analytics ───────────────────────────────

@college_router.get("/analytics", response_model=SkillAnalyticsResponse)
async def get_college_skill_analytics(
    department_id: int = Query(None),
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Full skill analytics for the college dashboard."""
    data = await get_full_skill_analytics(db, college_id, department_id)
    
    return SkillAnalyticsResponse(
        college_id=data["college_id"],
        total_students=data["total_students"],
        total_skills_tracked=data["total_skills_tracked"],
        heatmap=[SkillHeatmapItem(**h) for h in data["heatmap"]],
        top_skills=data["top_skills"],
        skill_gaps=[SkillGapItem(**g) for g in data["skill_gaps"]],
        department_skill_distribution=data["department_skill_distribution"],
        demand_alignment_score=data["demand_alignment_score"],
    )


@college_router.get("/heatmap", response_model=list[SkillHeatmapItem])
async def get_college_skill_heatmap(
    department_id: int = Query(None),
    graduation_year: int = Query(None),
    limit: int = Query(50, ge=1, le=200),
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Skill heatmap — filterable by department and graduation year."""
    heatmap = await get_skill_heatmap(db, college_id, department_id, graduation_year, limit)
    return [SkillHeatmapItem(**h) for h in heatmap]


@college_router.get("/gaps", response_model=list[SkillGapItem])
async def get_college_skill_gaps(
    department_id: int = Query(None),
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Skill gap analysis — curriculum expectation vs actual student skills."""
    gaps = await get_skill_gaps(db, college_id, department_id)
    return [SkillGapItem(**g) for g in gaps]


# ─── COLLEGE: Student Skills ────────────────────────────────

@college_router.post("/students/{student_id}/skills", response_model=list[StudentSkillResponse], status_code=201)
async def add_student_skills(
    student_id: int,
    skills: list[StudentSkillCreate],
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Add skills to a student (batch)."""
    student = await db.get(CollegeStudent, student_id)
    if not student or student.college_id != college_id:
        raise HTTPException(status_code=404, detail="Student not found")
    
    added = []
    for skill_data in skills:
        skill = await db.get(SkillTaxonomy, skill_data.skill_id)
        if not skill:
            continue
        
        # Upsert: update proficiency if exists
        existing = await db.execute(
            select(StudentSkill).where(
                StudentSkill.student_id == student_id,
                StudentSkill.skill_id == skill_data.skill_id,
                StudentSkill.source == skill_data.source,
            )
        )
        existing_skill = existing.scalar_one_or_none()
        
        if existing_skill:
            existing_skill.proficiency = skill_data.proficiency
            await db.flush()
            added.append(StudentSkillResponse(
                id=existing_skill.id,
                student_id=student_id,
                skill_id=skill.id,
                skill_name=skill.name,
                skill_category=skill.category,
                proficiency=skill_data.proficiency,
                source=skill_data.source,
                verified=existing_skill.verified,
            ))
        else:
            new_skill = StudentSkill(
                student_id=student_id,
                skill_id=skill_data.skill_id,
                proficiency=skill_data.proficiency,
                source=skill_data.source,
            )
            db.add(new_skill)
            await db.flush()
            added.append(StudentSkillResponse(
                id=new_skill.id,
                student_id=student_id,
                skill_id=skill.id,
                skill_name=skill.name,
                skill_category=skill.category,
                proficiency=skill_data.proficiency,
                source=skill_data.source,
                verified=new_skill.verified,
            ))
    
    await db.commit()
    return added


@college_router.get("/students/{student_id}/skills", response_model=list[StudentSkillResponse])
async def get_student_skills(
    student_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Get all skills for a specific student."""
    student = await db.get(CollegeStudent, student_id)
    if not student or student.college_id != college_id:
        raise HTTPException(status_code=404, detail="Student not found")
    
    result = await db.execute(
        select(StudentSkill, SkillTaxonomy)
        .join(SkillTaxonomy, SkillTaxonomy.id == StudentSkill.skill_id)
        .where(StudentSkill.student_id == student_id)
        .order_by(SkillTaxonomy.category, SkillTaxonomy.name)
    )
    rows = result.all()
    
    return [
        StudentSkillResponse(
            id=ss.id,
            student_id=ss.student_id,
            skill_id=ss.skill_id,
            skill_name=st.name,
            skill_category=st.category,
            proficiency=ss.proficiency,
            source=ss.source,
            verified=ss.verified,
        )
        for ss, st in rows
    ]
