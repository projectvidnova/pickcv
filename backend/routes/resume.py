"""Resume management routes."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import logging

from database import get_db
from models import User, Resume
from schemas import ResumeResponse, ResumeDetail, ResumeOptimizationRequest, ResumeCompressRequest, DynamicTemplateRequest
from routes.auth import get_current_user
from services.resume_processor import resume_processor
from services.gemini_service import gemini_service
from services.scraper_service import scraper_service
from services.resume_os_orchestrator import resume_os_orchestrator
from services.gcs_service import gcs_service
from services.college_service import college_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _format_resume_as_text(data: dict) -> str:
    """Format structured resume data into a readable text block for storage."""
    lines = []
    if data.get('name'):
        lines.append(data['name'])
    contact_parts = [data.get('email', ''), data.get('phone', ''), data.get('location', '')]
    contact_line = ' | '.join(p for p in contact_parts if p)
    if contact_line:
        lines.append(contact_line)
    if data.get('linkedin'):
        lines.append(data['linkedin'])
    if data.get('summary'):
        lines.append('\nPROFESSIONAL SUMMARY')
        lines.append(data['summary'])
    if data.get('experience'):
        lines.append('\nWORK EXPERIENCE')
        for exp in data['experience']:
            if isinstance(exp, dict):
                lines.append(f"{exp.get('title', '')} at {exp.get('company', '')} ({exp.get('dates', '')})")
                for bullet in exp.get('bullets', exp.get('responsibilities', [])):
                    lines.append(f"  • {bullet}")
            else:
                lines.append(str(exp))
    if data.get('education'):
        lines.append('\nEDUCATION')
        for edu in data['education']:
            if isinstance(edu, dict):
                lines.append(f"{edu.get('degree', '')} – {edu.get('school', edu.get('institution', ''))} ({edu.get('year', edu.get('dates', ''))})")
            else:
                lines.append(str(edu))
    if data.get('skills'):
        lines.append('\nSKILLS')
        for skill in data['skills']:
            if isinstance(skill, str):
                lines.append(f"  • {skill}")
            elif isinstance(skill, dict):
                lines.append(f"  • {skill.get('name', skill.get('skill', ''))}")
    return '\n'.join(lines)


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
    
    # Read file with size limit enforcement
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    file_data = await file.read()
    if len(file_data) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb} MB."
        )
    
    # Extract text
    try:
        raw_text = resume_processor.extract_text(file_data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text: {str(e)}")
    
    # Generate embedding
    embedding = await gemini_service.generate_embedding(raw_text)
    
    # Create resume record in database first (to get ID)
    new_resume = Resume(
        user_id=current_user.id,
        title=title,
        original_filename=file.filename,
        raw_text=raw_text,
        embedding=embedding,
        file_format=file.filename.split('.')[-1].lower()
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    # Upload file to GCS (if configured)
    if settings.storage_backend == "gcs" and gcs_service.client:
        file_path = gcs_service.upload_resume(
            user_id=current_user.id,
            resume_id=new_resume.id,
            file_data=file_data,
            filename=file.filename,
            content_type=file.content_type
        )
        
        if file_path:
            new_resume.file_path = file_path
            await db.commit()
            await db.refresh(new_resume)
            logger.info(f"Resume {new_resume.id} stored in GCS: {file_path}")
        else:
            logger.warning(f"Failed to upload resume {new_resume.id} to GCS - storing locally only")
    
    # Update college student status: registered → ready (first resume uploaded)
    try:
        await college_service.update_student_status_on_resume_upload(db, current_user.id)
    except Exception as e:
        logger.warning(f"College student status update on resume upload failed: {e}")
    
    return new_resume


@router.post("/create")
async def create_resume(
    resume_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a resume from structured data (resume builder flow)."""
    title = resume_data.get('title', 'My Resume')
    template = resume_data.get('template_name', 'modern')
    contact = resume_data.get('contact', {})
    
    new_resume = Resume(
        user_id=current_user.id,
        title=title,
        template_name=template,
        is_optimized=True,
        contact_info={
            "name": contact.get('name', ''),
            "email": contact.get('email', ''),
            "phone": contact.get('phone', ''),
            "linkedin": contact.get('linkedin', ''),
            "location": contact.get('location', ''),
        },
        professional_summary=resume_data.get('summary', ''),
        sections={
            "experience": resume_data.get('experience', []),
            "skills": resume_data.get('skills', []),
            "education": resume_data.get('education', []),
            "certifications": resume_data.get('certifications', []),
        },
        ats_score=resume_data.get('ats_score'),
        optimized_text=_format_resume_as_text({
            **contact,
            'summary': resume_data.get('summary', ''),
            'experience': resume_data.get('experience', []),
            'skills': resume_data.get('skills', []),
            'education': resume_data.get('education', []),
        }),
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    return {
        "id": new_resume.id,
        "title": new_resume.title,
        "template_name": new_resume.template_name,
        "ats_score": new_resume.ats_score,
        "created_at": new_resume.created_at.isoformat() if new_resume.created_at else None,
    }


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


@router.post("/{resume_id}/optimize-for-job")
async def optimize_resume_for_job(
    resume_id: int,
    request: ResumeOptimizationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Optimize resume for a specific job with detailed comparison.
    
    Args:
        resume_id: ID of resume to optimize
        request: Request body containing job_title, job_description (optional), job_link (optional)
    """
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    job_title = request.job_title
    job_description = request.job_description
    job_link = request.job_link
    
    # ── Mode 1: Job Link — scrape the URL and extract JD ──
    if job_link:
        logger.info(f"Optimize mode: LINK — scraping {job_link}")
        job_description = scraper_service.scrape_job_description(job_link)
        if not job_description:
            raise HTTPException(
                status_code=400, 
                detail="Failed to scrape job description from link. Please try pasting the description instead."
            )
    
    # ── Mode 2: Title only — use Gemini to generate a realistic JD ──
    elif not job_description or job_description.strip() == "":
        logger.info(f"Optimize mode: TITLE ONLY — generating JD for '{job_title}'")
        job_description = await gemini_service.generate_job_description_from_title(job_title)
        if not job_description:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate job description from title. Please try pasting a description instead."
            )
    else:
        # ── Mode 3: Pasted JD — use it directly ──
        logger.info(f"Optimize mode: PASTE — using provided JD ({len(job_description)} chars)")
    
    # Resume OS agentic orchestration + optimization
    github_url = None
    github_context = None
    try:
        github_url = scraper_service.extract_github_profile_url(resume.raw_text or "")

        # Secondary fallback: check known contact/link fields if present
        if not github_url and isinstance(resume.contact_info, dict):
            for key in ("github", "github_url", "portfolio", "website", "links"):
                value = resume.contact_info.get(key)
                if isinstance(value, str):
                    github_url = scraper_service.extract_github_profile_url(value)
                    if github_url:
                        break
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            github_url = scraper_service.extract_github_profile_url(item)
                            if github_url:
                                break
                    if github_url:
                        break

        if github_url:
            github_context = scraper_service.build_github_resume_context(github_url)
            if github_context:
                logger.info(f"GitHub enrichment enabled for resume {resume_id}: {github_url}")
            else:
                logger.info(f"GitHub URL found but enrichment unavailable for resume {resume_id}: {github_url}")
    except Exception as e:
        logger.warning(f"GitHub enrichment skipped for resume {resume_id}: {e}")

    optimization_result = await resume_os_orchestrator.optimize(
        resume_text=resume.raw_text,
        job_title=job_title,
        job_description=job_description,
        job_link=job_link,
        github_context=github_context,
    )
    
    if "error" in optimization_result:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {optimization_result['error']}")
    
    # Comparison is now included in the optimization result (single Gemini call)
    comparison = optimization_result.get("comparison", {})
    
    return {
        "resume_id": resume_id,
        "job_title": job_title,
        "optimized_resume": optimization_result.get("optimized_resume", ""),
        "name": optimization_result.get("name", ""),
        "title": optimization_result.get("title", ""),
        "email": optimization_result.get("email", ""),
        "phone": optimization_result.get("phone", ""),
        "linkedin": optimization_result.get("linkedin", ""),
        "location": optimization_result.get("location", ""),
        "professional_summary": optimization_result.get("professional_summary", ""),
        "experience": optimization_result.get("experience", []),
        "skills": optimization_result.get("skills", []),
        "education": optimization_result.get("education", []),
        "changes_made": optimization_result.get("changes_made", []),
        "key_improvements": optimization_result.get("key_improvements", []),
        "keywords_added": optimization_result.get("keywords_added", []),
        "match_score": optimization_result.get("match_score", 0),
        "ats_optimized": optimization_result.get("ats_optimized", False),
        "comparison": comparison,
        "resume_variants": optimization_result.get("resume_variants", []),
        "job_link": job_link,
        "github_profile_url": github_url,
        "github_enrichment_used": bool(github_context),
        "resume_os": optimization_result.get("resume_os", {}),
    }


@router.post("/compress-variant")
async def compress_resume_variant(
    request: ResumeCompressRequest,
    current_user: User = Depends(get_current_user),
):
    """Compress a resume variant to a target page count with user-controlled deprioritization.

    Accepts the full variant data from a prior optimization, and returns a compressed
    version fitting within `target_pages` (1 or 2). Users can select predefined
    deprioritization categories and/or provide free-text instructions.

    Request body:
        variant_id: "V1" - "V10"
        variant_data: { name, summary, experience[], skills[], education[], ... }
        target_pages: 1 or 2
        role_dna: { cluster, level, environment, ... }
        deprioritize: {
            categories: ["older_experience", "reduce_bullets", ...],
            custom_text: "Remove my internship from 2018"
        }

    Returns compressed variant data + rendered text + compression notes.
    """
    try:
        result = resume_os_orchestrator.compress_variant(
            variant_data=request.variant_data,
            target_pages=request.target_pages,
            role_dna=request.role_dna,
            variant_id=request.variant_id,
            deprioritize=request.deprioritize,
        )
        return {
            "variant_id": request.variant_id,
            "target_pages": request.target_pages,
            **result,
        }
    except Exception as e:
        logger.error(f"Variant compression failed: {e}")
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")


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
    
    # Delete file from GCS if it exists
    if resume.file_path and settings.storage_backend == "gcs":
        # Extract blob name from GCS path (gs://bucket/path -> path)
        blob_name = resume.file_path.replace(f"gs://{settings.gcs_bucket_name}/", "")
        gcs_service.delete_resume(blob_name)
        logger.info(f"Resume file deleted from GCS: {resume.file_path}")
    
    # Delete database record
    await db.delete(resume)
    await db.commit()
    
    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/save-edited")
async def save_edited_resume(
    resume_id: int,
    resume_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save edited resume data with selected template.
    
    Args:
        resume_id: ID of the base resume
        resume_data: Edited resume content with structure:
            {
                "name": str,
                "title": str,
                "email": str,
                "phone": str,
                "linkedin": str,
                "location": str,
                "summary": str,
                "experience": [...],
                "skills": [...],
                "education": [...],
                "template_id": str  # selected template name
            }
    
    Returns:
        Success message with saved resume ID
    """
    # Get original resume to verify ownership
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    original_resume = result.scalar_one_or_none()
    
    if not original_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Create new resume version with edited content
    new_resume = Resume(
        user_id=current_user.id,
        title=f"{resume_data.get('name', 'Resume')} - {resume_data.get('template_id', 'custom').title()}",
        template_name=resume_data.get('template_id', 'modern'),
        is_optimized=True,
        contact_info={
            "name": resume_data.get('name'),
            "email": resume_data.get('email'),
            "phone": resume_data.get('phone'),
            "linkedin": resume_data.get('linkedin'),
            "location": resume_data.get('location')
        },
        professional_summary=resume_data.get('summary'),
        sections={
            "experience": resume_data.get('experience', []),
            "skills": resume_data.get('skills', []),
            "education": resume_data.get('education', [])
        },
        raw_text=original_resume.raw_text,  # Keep original raw text
        optimized_text=_format_resume_as_text(resume_data),  # Convert to text format
        ats_score=original_resume.ats_score,
        optimization_target_job_id=original_resume.optimization_target_job_id
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    return {
        "message": "Resume saved successfully",
        "resume_id": new_resume.id,
        "title": new_resume.title
    }


def _format_resume_as_text(data: dict) -> str:
    """Convert structured resume data to text format."""
    lines = []
    
    # Header
    lines.append(data.get('name', '').upper())
    lines.append(data.get('title', ''))
    lines.append(f"{data.get('email', '')} | {data.get('phone', '')} | {data.get('location', '')}")
    if data.get('linkedin'):
        lines.append(data.get('linkedin'))
    lines.append("")
    
    # Summary
    if data.get('summary'):
        lines.append("PROFESSIONAL SUMMARY")
        lines.append(data.get('summary'))
        lines.append("")
    
    # Experience
    if data.get('experience'):
        lines.append("WORK EXPERIENCE")
        for exp in data.get('experience', []):
            lines.append(f"\n{exp.get('role', '')} | {exp.get('company', '')} | {exp.get('location', '')}")
            lines.append(exp.get('period', ''))
            for bullet in exp.get('bullets', []):
                lines.append(f"• {bullet}")
        lines.append("")
    
    # Skills
    if data.get('skills'):
        lines.append("SKILLS")
        lines.append(", ".join(data.get('skills', [])))
        lines.append("")
    
    # Education
    if data.get('education'):
        lines.append("EDUCATION")
        for edu in data.get('education', []):
            lines.append(f"{edu.get('degree', '')} | {edu.get('school', '')} | {edu.get('period', '')}")
        lines.append("")
    
    return "\n".join(lines)


@router.get("/prefill-from-linkedin")
async def prefill_resume_from_linkedin(
    target_role: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate pre-filled resume data from user's stored LinkedIn profile + posts.
    
    Uses Gemini AI to intelligently convert LinkedIn activity into
    structured resume content that the resume builder can use.
    
    Returns structured resume data matching the resume builder form fields.
    """
    if not current_user.linkedin_profile_data:
        # Try to fetch fresh data if we have a token
        if current_user.linkedin_access_token and current_user.linkedin_sub:
            from services.linkedin_oauth_service import linkedin_oauth_service as li_service
            from datetime import datetime, timezone
            
            user_info = await li_service.get_user_info(current_user.linkedin_access_token)
            posts_raw = await li_service.get_member_posts(
                current_user.linkedin_access_token, current_user.linkedin_sub, count=100
            )
            posts_data = [li_service._extract_post_data(p) for p in (posts_raw or [])]
            
            linkedin_data = {
                "profile": user_info or {
                    "name": current_user.full_name or "",
                    "email": current_user.email,
                    "sub": current_user.linkedin_sub,
                },
                "posts": posts_data,
                "posts_count": len(posts_data),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            
            # Store it
            current_user.linkedin_profile_data = linkedin_data
            current_user.linkedin_data_fetched_at = datetime.now(timezone.utc)
            await db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No LinkedIn data available. Please sign in with LinkedIn first.",
            )
    else:
        linkedin_data = current_user.linkedin_profile_data

    # Use Gemini to convert LinkedIn data into resume content
    resume_data = await gemini_service.generate_resume_from_linkedin(
        linkedin_data,
        target_role=target_role or current_user.target_role,
    )

    # Also include raw LinkedIn info for the frontend
    resume_data["_linkedin_meta"] = {
        "posts_count": linkedin_data.get("posts_count", 0),
        "fetched_at": linkedin_data.get("fetched_at"),
        "has_posts": bool(linkedin_data.get("posts")),
    }

    return resume_data


@router.get("/linkedin-data")
async def get_stored_linkedin_data(
    current_user: User = Depends(get_current_user),
):
    """Return the raw stored LinkedIn data for the current user."""
    if not current_user.linkedin_profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn data stored. Please sign in with LinkedIn.",
        )
    return {
        "profile": current_user.linkedin_profile_data.get("profile", {}),
        "posts_count": current_user.linkedin_profile_data.get("posts_count", 0),
        "posts": current_user.linkedin_profile_data.get("posts", []),
        "fetched_at": current_user.linkedin_profile_data.get("fetched_at"),
    }


@router.post("/generate-dynamic-template")
async def generate_dynamic_template(
    request: DynamicTemplateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a unique LLM-designed template configuration for a specific person.

    Called for template slots 2-5 after the initial optimization loads.
    Each slot gets a different persona_angle (depth/impact/narrative/breadth)
    producing a truly unique template tailored to the individual.
    """
    try:
        config = await resume_os_orchestrator.generate_dynamic_template(
            resume_data=request.resume_data,
            variant_id=request.variant_id,
            persona_angle=request.persona_angle,
            slot_index=request.slot_index,
            role_dna=request.role_dna,
            static_template_config=request.static_template_config,
        )
        return config
    except Exception as e:
        logger.error(f"Dynamic template generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")

