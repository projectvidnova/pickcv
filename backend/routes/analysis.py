"""Resume analysis routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import User, Resume, ResumeAnalysis
from schemas import AnalysisResponse, SkillGapResponse
from routes.auth import get_current_user
from services.gemini_service import gemini_service

router = APIRouter()


@router.post("/resume/{resume_id}", response_model=AnalysisResponse)
async def analyze_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze a resume for ATS compatibility."""
    # Get resume
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Analyze using Gemini
    analysis_data = await gemini_service.analyze_resume(resume.raw_text)
    
    # Create analysis record
    analysis = ResumeAnalysis(
        resume_id=resume_id,
        ats_score=analysis_data.get('ats_score', 0),
        readability_score=analysis_data.get('readability_score'),
        keyword_match_score=analysis_data.get('keyword_match_score'),
        strengths=analysis_data.get('strengths'),
        weaknesses=analysis_data.get('weaknesses'),
        suggestions=analysis_data.get('suggestions'),
        missing_keywords=analysis_data.get('missing_keywords')
    )
    
    db.add(analysis)
    
    # Update resume with ATS score
    resume.ats_score = analysis_data.get('ats_score', 0)
    resume.keyword_density = analysis_data.get('keyword_match_score')
    
    await db.commit()
    await db.refresh(analysis)
    
    return analysis


@router.get("/resume/{resume_id}/history", response_model=List[AnalysisResponse])
async def get_analysis_history(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analysis history for a resume."""
    # Verify resume ownership
    resume_result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = resume_result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get analyses
    result = await db.execute(
        select(ResumeAnalysis).where(ResumeAnalysis.resume_id == resume_id)
        .order_by(ResumeAnalysis.created_at.desc())
    )
    analyses = result.scalars().all()
    
    return analyses


@router.get("/skill-gap", response_model=SkillGapResponse)
async def get_skill_gap_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get skill gap analysis for the current user."""
    # Get user's latest resume
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")
    
    # Extract skills from resume
    user_skills = await gemini_service.extract_skills(resume.raw_text)
    
    # Get market requirements (simplified - in production, aggregate from job postings)
    # For now, use common tech skills
    job_requirements = [
        "Python", "JavaScript", "React", "Node.js", "SQL", "AWS",
        "Docker", "Git", "Agile", "REST API", "TypeScript", "MongoDB"
    ]
    
    # Identify skill gaps
    skill_gap_data = await gemini_service.identify_skill_gaps(user_skills, job_requirements)
    
    # Create or update skill gap record
    from models import SkillGap
    
    # Check if exists
    existing_result = await db.execute(
        select(SkillGap).where(SkillGap.user_id == current_user.id)
        .order_by(SkillGap.created_at.desc())
        .limit(1)
    )
    existing_gap = existing_result.scalar_one_or_none()
    
    if existing_gap:
        # Update existing
        existing_gap.current_skills = ', '.join(user_skills)
        existing_gap.missing_skills = ', '.join(skill_gap_data.get('missing_skills', []))
        existing_gap.recommended_skills = ', '.join(skill_gap_data.get('recommended_skills', []))
        existing_gap.learning_paths = ', '.join(skill_gap_data.get('learning_paths', []))
        existing_gap.estimated_time = skill_gap_data.get('estimated_time', '')
        skill_gap = existing_gap
    else:
        # Create new
        skill_gap = SkillGap(
            user_id=current_user.id,
            current_skills=', '.join(user_skills),
            missing_skills=', '.join(skill_gap_data.get('missing_skills', [])),
            recommended_skills=', '.join(skill_gap_data.get('recommended_skills', [])),
            learning_paths=', '.join(skill_gap_data.get('learning_paths', [])),
            estimated_time=skill_gap_data.get('estimated_time', '')
        )
        db.add(skill_gap)
    
    await db.commit()
    await db.refresh(skill_gap)
    
    return skill_gap
