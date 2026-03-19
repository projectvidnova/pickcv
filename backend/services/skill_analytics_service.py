"""Skill analytics service for college dashboard — Phase 1.

Handles:
- Skill extraction from resumes (via Gemini)
- Skill taxonomy lookups (fuzzy matching with aliases)
- Skill heatmap aggregation
- Gap analysis (curriculum vs actual)
- Student skill CRUD
"""
import logging
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import select, func, case, and_, distinct, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    SkillTaxonomy, StudentSkill, CollegeStudent, Department,
    CurriculumCourse, CourseSkillMapping, COEGroup, COEMembership,
    User, UserSkill, Resume
)

logger = logging.getLogger(__name__)


async def lookup_skill(db: AsyncSession, skill_name: str) -> Optional[SkillTaxonomy]:
    """Find a skill in taxonomy by name or alias. Case-insensitive."""
    name_lower = skill_name.strip().lower()
    
    # Direct match
    result = await db.execute(
        select(SkillTaxonomy).where(SkillTaxonomy.name_lower == name_lower)
    )
    skill = result.scalar_one_or_none()
    if skill:
        return skill
    
    # Alias match — check if the name appears in any skill's aliases array
    result = await db.execute(
        select(SkillTaxonomy).where(
            SkillTaxonomy.aliases.any(name_lower)
        )
    )
    skill = result.scalar_one_or_none()
    return skill


async def get_or_create_skill(db: AsyncSession, skill_name: str, category: str = None) -> SkillTaxonomy:
    """Get existing skill or create new unverified one."""
    skill = await lookup_skill(db, skill_name)
    if skill:
        return skill
    
    # Create new unverified skill
    new_skill = SkillTaxonomy(
        name=skill_name.strip(),
        name_lower=skill_name.strip().lower(),
        category=category or "Other",
        is_verified=False,
        aliases=[]
    )
    db.add(new_skill)
    await db.flush()
    return new_skill


async def extract_and_store_student_skills(
    db: AsyncSession,
    student_id: int,
    skills_list: List[str],
    source: str = "resume"
) -> int:
    """
    Given a list of skill names (e.g. extracted from resume),
    match them to taxonomy and store as StudentSkill records.
    Returns count of skills stored.
    """
    count = 0
    for skill_name in skills_list:
        if not skill_name or not skill_name.strip():
            continue
        
        skill = await get_or_create_skill(db, skill_name)
        
        # Check if already exists for this student+skill+source
        existing = await db.execute(
            select(StudentSkill).where(
                and_(
                    StudentSkill.student_id == student_id,
                    StudentSkill.skill_id == skill.id,
                    StudentSkill.source == source
                )
            )
        )
        if existing.scalar_one_or_none():
            continue
        
        student_skill = StudentSkill(
            student_id=student_id,
            skill_id=skill.id,
            proficiency="intermediate" if source == "resume" else "beginner",
            source=source,
            verified=(source in ("certification", "project"))
        )
        db.add(student_skill)
        count += 1
    
    await db.flush()
    return count


async def sync_student_skills_from_user(db: AsyncSession, student_id: int, user_id: int) -> int:
    """
    When a college student links to a user account, pull skills from
    their UserSkill records and resumes into StudentSkill.
    """
    # Get user skills
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == user_id)
    )
    user_skills = result.scalars().all()
    
    skills_list = [s.skill_name for s in user_skills if s.skill_name]
    count = await extract_and_store_student_skills(db, student_id, skills_list, source="resume")
    
    return count


async def get_skill_heatmap(
    db: AsyncSession,
    college_id: int,
    department_id: Optional[int] = None,
    graduation_year: Optional[int] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get skill distribution heatmap for a college.
    Aggregates student skills with proficiency breakdown.
    """
    # Build base query
    query = (
        select(
            SkillTaxonomy.id.label("skill_id"),
            SkillTaxonomy.name.label("skill_name"),
            SkillTaxonomy.category,
            SkillTaxonomy.subcategory,
            SkillTaxonomy.demand_score,
            func.count(distinct(StudentSkill.student_id)).label("student_count"),
            func.count(distinct(StudentSkill.student_id)).filter(
                StudentSkill.proficiency == "beginner"
            ).label("beginner_count"),
            func.count(distinct(StudentSkill.student_id)).filter(
                StudentSkill.proficiency == "intermediate"
            ).label("intermediate_count"),
            func.count(distinct(StudentSkill.student_id)).filter(
                StudentSkill.proficiency == "advanced"
            ).label("advanced_count"),
            func.count(distinct(StudentSkill.student_id)).filter(
                StudentSkill.proficiency == "expert"
            ).label("expert_count"),
        )
        .join(StudentSkill, StudentSkill.skill_id == SkillTaxonomy.id)
        .join(CollegeStudent, CollegeStudent.id == StudentSkill.student_id)
        .where(CollegeStudent.college_id == college_id)
    )
    
    if department_id:
        query = query.where(CollegeStudent.department_id == department_id)
    if graduation_year:
        query = query.where(CollegeStudent.graduation_year == graduation_year)
    
    query = query.group_by(
        SkillTaxonomy.id, SkillTaxonomy.name,
        SkillTaxonomy.category, SkillTaxonomy.subcategory,
        SkillTaxonomy.demand_score
    ).order_by(text("student_count DESC")).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "skill_id": row.skill_id,
            "skill_name": row.skill_name,
            "category": row.category or "Other",
            "subcategory": row.subcategory,
            "student_count": row.student_count,
            "beginner_count": row.beginner_count,
            "intermediate_count": row.intermediate_count,
            "advanced_count": row.advanced_count,
            "expert_count": row.expert_count,
            "demand_score": row.demand_score or 0,
        }
        for row in rows
    ]


async def get_skill_gaps(
    db: AsyncSession,
    college_id: int,
    department_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Analyze gap between curriculum-expected skills and actual student skills.
    Returns skills that curriculum teaches but students haven't acquired.
    """
    # Get department IDs to analyze
    dept_filter = [Department.college_id == college_id]
    if department_id:
        dept_filter.append(Department.id == department_id)
    
    # Count students per department
    student_count_query = (
        select(func.count(CollegeStudent.id))
        .where(CollegeStudent.college_id == college_id)
    )
    if department_id:
        student_count_query = student_count_query.where(CollegeStudent.department_id == department_id)
    student_count_q = await db.execute(student_count_query)
    total_students = student_count_q.scalar() or 1  # Avoid division by zero
    
    # Get skills expected from curriculum
    curriculum_skills_q = (
        select(
            SkillTaxonomy.id.label("skill_id"),
            SkillTaxonomy.name.label("skill_name"),
            func.count(distinct(CurriculumCourse.id)).label("course_count"),
        )
        .join(CourseSkillMapping, CourseSkillMapping.skill_id == SkillTaxonomy.id)
        .join(CurriculumCourse, CurriculumCourse.id == CourseSkillMapping.course_id)
        .join(Department, Department.id == CurriculumCourse.department_id)
        .where(and_(*dept_filter))
        .group_by(SkillTaxonomy.id, SkillTaxonomy.name)
    )
    result = await db.execute(curriculum_skills_q)
    curriculum_skills = result.all()
    
    gaps = []
    for row in curriculum_skills:
        # Count students who actually have this skill
        actual_filters = [
            StudentSkill.skill_id == row.skill_id,
            CollegeStudent.college_id == college_id,
        ]
        if department_id:
            actual_filters.append(CollegeStudent.department_id == department_id)
        actual_q = await db.execute(
            select(func.count(distinct(StudentSkill.student_id)))
            .join(CollegeStudent, CollegeStudent.id == StudentSkill.student_id)
            .where(and_(*actual_filters))
        )
        actual_count = actual_q.scalar() or 0
        
        gap_percent = round(((total_students - actual_count) / total_students) * 100, 1) if total_students > 0 else 0
        
        if gap_percent > 0:
            gaps.append({
                "skill_name": row.skill_name,
                "expected_from_curriculum": total_students,
                "actually_have": actual_count,
                "gap_percent": gap_percent,
            })
    
    # Sort by gap percentage descending
    gaps.sort(key=lambda x: x["gap_percent"], reverse=True)
    return gaps[:20]  # Top 20 gaps


async def get_department_skill_distribution(
    db: AsyncSession,
    college_id: int
) -> List[Dict[str, Any]]:
    """Get skill distribution broken down by department."""
    query = (
        select(
            Department.id.label("department_id"),
            Department.name.label("department_name"),
            Department.code.label("department_code"),
            SkillTaxonomy.category.label("skill_category"),
            func.count(distinct(StudentSkill.student_id)).label("student_count"),
        )
        .join(CollegeStudent, CollegeStudent.department_id == Department.id)
        .join(StudentSkill, StudentSkill.student_id == CollegeStudent.id)
        .join(SkillTaxonomy, SkillTaxonomy.id == StudentSkill.skill_id)
        .where(Department.college_id == college_id)
        .group_by(Department.id, Department.name, Department.code, SkillTaxonomy.category)
        .order_by(Department.name, text("student_count DESC"))
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Group by department
    dept_map: Dict[int, Dict] = {}
    for row in rows:
        if row.department_id not in dept_map:
            dept_map[row.department_id] = {
                "department_id": row.department_id,
                "department_name": row.department_name,
                "department_code": row.department_code,
                "skill_categories": [],
            }
        dept_map[row.department_id]["skill_categories"].append({
            "category": row.skill_category or "Other",
            "student_count": row.student_count,
        })
    
    return list(dept_map.values())


async def compute_demand_alignment_score(
    db: AsyncSession,
    college_id: int
) -> float:
    """
    What % of students have at least one high-demand skill (demand_score > 70)?
    Higher = better placement readiness.
    """
    # Total students
    total_q = await db.execute(
        select(func.count(CollegeStudent.id))
        .where(CollegeStudent.college_id == college_id)
    )
    total = total_q.scalar() or 1
    
    # Students with at least one high-demand skill
    aligned_q = await db.execute(
        select(func.count(distinct(StudentSkill.student_id)))
        .join(CollegeStudent, CollegeStudent.id == StudentSkill.student_id)
        .join(SkillTaxonomy, SkillTaxonomy.id == StudentSkill.skill_id)
        .where(
            and_(
                CollegeStudent.college_id == college_id,
                SkillTaxonomy.demand_score > 70
            )
        )
    )
    aligned = aligned_q.scalar() or 0
    
    return round((aligned / total) * 100, 1)


async def get_full_skill_analytics(
    db: AsyncSession,
    college_id: int,
    department_id: Optional[int] = None
) -> Dict[str, Any]:
    """Aggregate all skill analytics for the college dashboard."""
    
    # Total students
    student_q = await db.execute(
        select(func.count(CollegeStudent.id))
        .where(CollegeStudent.college_id == college_id)
    )
    total_students = student_q.scalar() or 0
    
    # Total unique skills tracked
    skills_q = await db.execute(
        select(func.count(distinct(StudentSkill.skill_id)))
        .join(CollegeStudent, CollegeStudent.id == StudentSkill.student_id)
        .where(CollegeStudent.college_id == college_id)
    )
    total_skills = skills_q.scalar() or 0
    
    heatmap = await get_skill_heatmap(db, college_id, department_id)
    skill_gaps = await get_skill_gaps(db, college_id, department_id)
    dept_dist = await get_department_skill_distribution(db, college_id)
    demand_score = await compute_demand_alignment_score(db, college_id)
    
    # Top 20 skills
    top_skills = [
        {"skill_name": h["skill_name"], "category": h["category"], "count": h["student_count"]}
        for h in heatmap[:20]
    ]
    
    return {
        "college_id": college_id,
        "total_students": total_students,
        "total_skills_tracked": total_skills,
        "heatmap": heatmap,
        "top_skills": top_skills,
        "skill_gaps": skill_gaps,
        "department_skill_distribution": dept_dist,
        "demand_alignment_score": demand_score,
    }


async def search_skills(
    db: AsyncSession,
    query: str,
    limit: int = 20
) -> List[SkillTaxonomy]:
    """Search skill taxonomy by name (fuzzy via trigram)."""
    q = query.strip().lower()
    result = await db.execute(
        select(SkillTaxonomy)
        .where(SkillTaxonomy.name_lower.ilike(f"%{q}%"))
        .order_by(SkillTaxonomy.demand_score.desc())
        .limit(limit)
    )
    return result.scalars().all()
