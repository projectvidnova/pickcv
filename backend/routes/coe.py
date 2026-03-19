"""Center of Excellence (COE) group management routes — Phase 1.

Endpoints:
  POST   /coe                        — Create COE group
  GET    /coe                        — List COE groups
  GET    /coe/{id}                   — Get COE detail with members
  PUT    /coe/{id}                   — Update COE group
  DELETE /coe/{id}                   — Deactivate COE group
  POST   /coe/{id}/members           — Add students to COE
  DELETE /coe/{id}/members/{student}  — Remove student from COE
  GET    /coe/{id}/members           — List COE members
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import AsyncSessionLocal
from models import (
    College, COEGroup, COEMembership, CollegeStudent,
    SkillTaxonomy, CollegeAuditLog
)
from schemas import (
    COEGroupCreate, COEGroupUpdate, COEGroupResponse,
    COEMembershipCreate, COEMembershipResponse
)
from services.auth_service import auth_service
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/college", tags=["College - COE Groups"])
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


async def _build_coe_response(db: AsyncSession, coe: COEGroup) -> COEGroupResponse:
    """Build a COEGroupResponse with aggregated member stats."""
    # Member stats
    stats = await db.execute(
        select(
            func.count(COEMembership.id).label("member_count"),
            func.count(COEMembership.id).filter(COEMembership.status == "active").label("active_count"),
        )
        .where(COEMembership.coe_id == coe.id)
    )
    row = stats.one()
    
    # Avg resume score and CGPA from members
    avg_stats = await db.execute(
        select(
            func.avg(CollegeStudent.resume_score).label("avg_resume_score"),
            func.avg(CollegeStudent.cgpa).label("avg_cgpa"),
        )
        .join(COEMembership, COEMembership.student_id == CollegeStudent.id)
        .where(COEMembership.coe_id == coe.id)
    )
    avg_row = avg_stats.one()
    
    # Resolve focus skill names
    focus_skills = []
    if coe.focus_skills:
        result = await db.execute(
            select(SkillTaxonomy.id, SkillTaxonomy.name)
            .where(SkillTaxonomy.id.in_(coe.focus_skills))
        )
        focus_skills = [{"skill_id": r.id, "skill_name": r.name} for r in result.all()]
    
    return COEGroupResponse(
        id=coe.id,
        college_id=coe.college_id,
        name=coe.name,
        code=coe.code,
        description=coe.description,
        focus_skills=focus_skills,
        faculty_lead_name=coe.faculty_lead_name,
        faculty_lead_email=coe.faculty_lead_email,
        max_capacity=coe.max_capacity,
        is_active=coe.is_active,
        member_count=row.member_count,
        active_count=row.active_count,
        avg_resume_score=round(avg_row.avg_resume_score, 1) if avg_row.avg_resume_score else None,
        avg_cgpa=round(avg_row.avg_cgpa, 2) if avg_row.avg_cgpa else None,
        created_at=coe.created_at,
    )


# ─── COE GROUP CRUD ──────────────────────────────────────────

@router.post("/coe", response_model=COEGroupResponse, status_code=201)
async def create_coe_group(
    data: COEGroupCreate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Create a new Center of Excellence group."""
    college = await db.get(College, college_id)
    if not college or college.status != "approved":
        raise HTTPException(status_code=403, detail="College not found or not approved")
    
    # Check for duplicate code
    existing = await db.execute(
        select(COEGroup).where(
            and_(COEGroup.college_id == college_id, COEGroup.code == data.code.upper())
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"COE with code '{data.code}' already exists")
    
    # Validate skill IDs exist
    valid_skill_ids = []
    for sid in data.focus_skill_ids:
        skill = await db.get(SkillTaxonomy, sid)
        if skill:
            valid_skill_ids.append(sid)
    
    coe = COEGroup(
        college_id=college_id,
        name=data.name,
        code=data.code.upper(),
        description=data.description,
        focus_skills=valid_skill_ids,
        faculty_lead_name=data.faculty_lead_name,
        faculty_lead_email=data.faculty_lead_email,
        max_capacity=data.max_capacity,
    )
    db.add(coe)
    await db.flush()  # Get coe.id before creating audit log
    
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="coe_created",
        entity_type="coe",
        entity_id=coe.id,
        details={"name": data.name, "code": data.code},
    ))
    
    await db.commit()
    await db.refresh(coe)
    
    return await _build_coe_response(db, coe)


@router.get("/coe", response_model=list[COEGroupResponse])
async def list_coe_groups(
    active_only: bool = Query(True),
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """List all COE groups for this college."""
    query = select(COEGroup).where(COEGroup.college_id == college_id)
    if active_only:
        query = query.where(COEGroup.is_active == True)
    query = query.order_by(COEGroup.name)
    
    result = await db.execute(query)
    coe_groups = result.scalars().all()
    
    responses = []
    for coe in coe_groups:
        resp = await _build_coe_response(db, coe)
        responses.append(resp)
    
    return responses


@router.get("/coe/{coe_id}", response_model=COEGroupResponse)
async def get_coe_group(
    coe_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed COE group info."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    return await _build_coe_response(db, coe)


@router.put("/coe/{coe_id}", response_model=COEGroupResponse)
async def update_coe_group(
    coe_id: int,
    data: COEGroupUpdate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Update a COE group."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Handle focus_skill_ids → focus_skills column
    focus_skill_ids = update_data.pop("focus_skill_ids", None)
    if focus_skill_ids is not None:
        valid = []
        for sid in focus_skill_ids:
            if await db.get(SkillTaxonomy, sid):
                valid.append(sid)
        coe.focus_skills = valid
    
    for key, value in update_data.items():
        setattr(coe, key, value)
    
    await db.commit()
    await db.refresh(coe)
    
    return await _build_coe_response(db, coe)


@router.delete("/coe/{coe_id}", status_code=204)
async def deactivate_coe_group(
    coe_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Soft-deactivate a COE group."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    coe.is_active = False
    
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="coe_deactivated",
        entity_type="coe",
        entity_id=coe_id,
    ))
    
    await db.commit()


# ─── COE MEMBERSHIP ─────────────────────────────────────────

@router.post("/coe/{coe_id}/members", response_model=list[COEMembershipResponse], status_code=201)
async def add_coe_members(
    coe_id: int,
    data: COEMembershipCreate,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Add students to a COE group (batch)."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    if not coe.is_active:
        raise HTTPException(status_code=400, detail="COE group is inactive")
    
    # Check capacity
    if coe.max_capacity:
        current_count = await db.execute(
            select(func.count(COEMembership.id))
            .where(and_(COEMembership.coe_id == coe_id, COEMembership.status == "active"))
        )
        current = current_count.scalar() or 0
        if current + len(data.student_ids) > coe.max_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Adding {len(data.student_ids)} would exceed capacity ({coe.max_capacity}). Current: {current}"
            )
    
    added = []
    for student_id in data.student_ids:
        # Verify student belongs to this college
        student = await db.get(CollegeStudent, student_id)
        if not student or student.college_id != college_id:
            continue
        
        # Check if already a member
        existing = await db.execute(
            select(COEMembership).where(
                and_(COEMembership.coe_id == coe_id, COEMembership.student_id == student_id)
            )
        )
        if existing.scalar_one_or_none():
            continue
        
        membership = COEMembership(
            coe_id=coe_id,
            student_id=student_id,
            role=data.role,
        )
        db.add(membership)
        await db.flush()
        
        added.append(COEMembershipResponse(
            id=membership.id,
            coe_id=coe_id,
            student_id=student_id,
            student_name=student.name,
            student_email=student.email,
            role=membership.role,
            status=membership.status,
            joined_at=membership.joined_at,
        ))
    
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="coe_members_added",
        entity_type="coe",
        entity_id=coe_id,
        details={"student_ids": data.student_ids, "added": len(added)},
    ))
    
    await db.commit()
    return added


@router.get("/coe/{coe_id}/members", response_model=list[COEMembershipResponse])
async def list_coe_members(
    coe_id: int,
    status_filter: str = Query(None, alias="status"),
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """List members of a COE group."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    query = (
        select(COEMembership, CollegeStudent)
        .join(CollegeStudent, CollegeStudent.id == COEMembership.student_id)
        .where(COEMembership.coe_id == coe_id)
    )
    if status_filter:
        query = query.where(COEMembership.status == status_filter)
    query = query.order_by(CollegeStudent.name)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        COEMembershipResponse(
            id=m.id,
            coe_id=m.coe_id,
            student_id=m.student_id,
            student_name=s.name,
            student_email=s.email,
            role=m.role,
            status=m.status,
            joined_at=m.joined_at,
        )
        for m, s in rows
    ]


@router.delete("/coe/{coe_id}/members/{student_id}", status_code=204)
async def remove_coe_member(
    coe_id: int,
    student_id: int,
    college_id: int = Depends(get_current_college),
    db: AsyncSession = Depends(get_db)
):
    """Remove a student from a COE group."""
    coe = await db.get(COEGroup, coe_id)
    if not coe or coe.college_id != college_id:
        raise HTTPException(status_code=404, detail="COE group not found")
    
    result = await db.execute(
        select(COEMembership).where(
            and_(COEMembership.coe_id == coe_id, COEMembership.student_id == student_id)
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    await db.delete(membership)
    
    db.add(CollegeAuditLog(
        college_id=college_id,
        actor_type="college_admin",
        actor_id=college_id,
        action="coe_member_removed",
        entity_type="coe",
        entity_id=coe_id,
        details={"student_id": student_id},
    ))
    
    await db.commit()
