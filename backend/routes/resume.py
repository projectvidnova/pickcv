"""Resume management routes."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import User, Resume
from schemas import ResumeResponse, ResumeDetail
from routes.auth import get_current_user
from services.resume_processor import resume_processor
from services.gemini_service import gemini_service

router = APIRouter()


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and process a resume file."""
    # Validate file type
    allowed_types = ['application/pdf', 'application/msword', 
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX allowed.")
    
    # Read file
    file_data = await file.read()
    
    # Extract text
    try:
        raw_text = resume_processor.extract_text(file_data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text: {str(e)}")
    
    # Generate embedding
    embedding = await gemini_service.generate_embedding(raw_text)
    
    # Create resume record
    new_resume = Resume(
        user_id=current_user.id,
        title=title,
        original_filename=file.filename,
        raw_text=raw_text,
        embedding=embedding
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    return new_resume


@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all resumes for current user."""
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return resumes


@router.get("/{resume_id}", response_model=ResumeDetail)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed resume information."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume


@router.post("/{resume_id}/optimize", response_model=ResumeDetail)
async def optimize_resume(
    resume_id: int,
    target_role: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Optimize resume for ATS compatibility."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Optimize using Gemini
    optimized_text = await gemini_service.optimize_resume(resume.raw_text, target_role)
    
    # Update resume
    resume.optimized_text = optimized_text
    await db.commit()
    await db.refresh(resume)
    
    return resume


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a resume."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    await db.delete(resume)
    await db.commit()
    
    return {"message": "Resume deleted successfully"}
