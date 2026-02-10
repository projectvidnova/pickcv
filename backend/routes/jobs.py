"""Job matching and application routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from database import get_db
from models import User, Job, JobApplication, Resume
from schemas import JobResponse, JobDetail, JobApplicationCreate, JobApplicationResponse
from routes.auth import get_current_user
from services.gemini_service import gemini_service

router = APIRouter()


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List available jobs with match scores based on user's resume."""
    # Get user's latest resume
    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    resume = resume_result.scalar_one_or_none()
    
    # Get jobs
    result = await db.execute(
        select(Job).where(Job.is_active == True)
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    jobs = result.scalars().all()
    
    # Calculate match scores if resume exists
    if resume and resume.embedding:
        for job in jobs:
            if job.embedding:
                # Calculate cosine similarity (simplified)
                # In production, use pgvector's <=> operator
                match_score = 75 + (len(str(job.id)) % 20)  # Placeholder
                job.match_score = match_score
    
    return jobs


@router.get("/{job_id}", response_model=JobDetail)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed job information."""
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.is_active == True)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Calculate match score
    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    resume = resume_result.scalar_one_or_none()
    
    if resume and resume.embedding and job.embedding:
        match_score = 75 + (job_id % 20)  # Placeholder
        job.match_score = match_score
    
    return job


@router.post("/{job_id}/apply", response_model=JobApplicationResponse)
async def apply_to_job(
    job_id: int,
    application_data: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply to a job."""
    # Verify job exists
    job_result = await db.execute(
        select(Job).where(Job.id == job_id, Job.is_active == True)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already applied
    existing_result = await db.execute(
        select(JobApplication).where(
            JobApplication.user_id == current_user.id,
            JobApplication.job_id == job_id
        )
    )
    existing_application = existing_result.scalar_one_or_none()
    
    if existing_application:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    # Get resume if specified
    if application_data.resume_id:
        resume_result = await db.execute(
            select(Resume).where(
                Resume.id == application_data.resume_id,
                Resume.user_id == current_user.id
            )
        )
        resume = resume_result.scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    
    # Calculate match score
    match_score = 75 + (job_id % 20)  # Placeholder
    
    # Create application
    from datetime import datetime
    application = JobApplication(
        user_id=current_user.id,
        job_id=job_id,
        resume_id=application_data.resume_id,
        cover_letter=application_data.cover_letter,
        match_score=match_score,
        status="applied",
        applied_at=datetime.utcnow()
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    return application


@router.get("/applications/", response_model=List[JobApplicationResponse])
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's job applications."""
    result = await db.execute(
        select(JobApplication).where(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
    )
    applications = result.scalars().all()
    
    return applications
