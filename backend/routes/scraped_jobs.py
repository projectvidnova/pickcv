"""Routes for scraped jobs display and management."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import ScrapedJob
from schemas.scraped_jobs import (
    ScrapedJobResponse, 
    ScrapedJobListResponse,
    JobSearchRequest,
    JobSearchResponse,
    ScraperStatusResponse
)

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.get("/jobs", response_model=ScrapedJobListResponse)
async def list_scraped_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all active scraped jobs with pagination.
    
    Args:
        page: Page number (1-indexed)
        per_page: Number of jobs per page
    
    Returns:
        Paginated list of scraped jobs
    """
    # Count total active jobs
    count_result = await db.execute(
        select(func.count(ScrapedJob.id)).where(ScrapedJob.is_active == True)
    )
    total = count_result.scalar() or 0
    
    # Fetch jobs for current page
    offset = (page - 1) * per_page
    result = await db.execute(
        select(ScrapedJob)
        .where(ScrapedJob.is_active == True)
        .order_by(desc(ScrapedJob.posted_date), desc(ScrapedJob.scraped_date))
        .offset(offset)
        .limit(per_page)
    )
    jobs = result.scalars().all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return ScrapedJobListResponse(
        jobs=[ScrapedJobResponse.model_validate(job) for job in jobs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.post("/search", response_model=JobSearchResponse)
async def search_jobs(
    request: JobSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search scraped jobs with advanced filters.
    
    Args:
        request: Search parameters
    
    Returns:
        Filtered jobs list
    """
    # Build query filters
    filters = [ScrapedJob.is_active == True]
    
    # Text search on title, company, description
    if request.query:
        query_filter = or_(
            ScrapedJob.job_title.ilike(f"%{request.query}%"),
            ScrapedJob.company_name.ilike(f"%{request.query}%"),
            ScrapedJob.description.ilike(f"%{request.query}%"),
            ScrapedJob.requirements.ilike(f"%{request.query}%")
        )
        filters.append(query_filter)
    
    # Location filter
    if request.location:
        filters.append(
            or_(
                ScrapedJob.location.ilike(f"%{request.location}%"),
                ScrapedJob.remote_policy.ilike("Remote")
            )
        )
    
    # Job type filter
    if request.job_type:
        filters.append(ScrapedJob.job_type.ilike(f"%{request.job_type}%"))
    
    # Remote policy filter
    if request.remote_policy:
        filters.append(ScrapedJob.remote_policy.ilike(f"%{request.remote_policy}%"))
    
    # Experience level filter
    if request.experience_level:
        filters.append(ScrapedJob.experience_level.ilike(f"%{request.experience_level}%"))
    
    # Salary range filter
    if request.salary_min:
        filters.append(
            or_(
                ScrapedJob.salary_min >= request.salary_min,
                ScrapedJob.salary_max >= request.salary_min
            )
        )
    if request.salary_max:
        filters.append(
            or_(
                ScrapedJob.salary_max <= request.salary_max,
                ScrapedJob.salary_min <= request.salary_max
            )
        )
    
    # Source filter
    if request.source:
        filters.append(ScrapedJob.source == request.source)
    
    # Count total matching jobs
    count_result = await db.execute(
        select(func.count(ScrapedJob.id)).where(and_(*filters))
    )
    total = count_result.scalar() or 0
    
    # Fetch jobs for current page
    offset = (request.page - 1) * request.per_page
    result = await db.execute(
        select(ScrapedJob)
        .where(and_(*filters))
        .order_by(desc(ScrapedJob.posted_date), desc(ScrapedJob.scraped_date))
        .offset(offset)
        .limit(request.per_page)
    )
    jobs = result.scalars().all()
    
    total_pages = (total + request.per_page - 1) // request.per_page
    
    return JobSearchResponse(
        jobs=[ScrapedJobResponse.model_validate(job) for job in jobs],
        total=total,
        page=request.page,
        per_page=request.per_page,
        total_pages=total_pages,
        filters_applied={
            "query": request.query,
            "location": request.location,
            "job_type": request.job_type,
            "remote_policy": request.remote_policy,
            "experience_level": request.experience_level,
            "salary_range": f"{request.salary_min}-{request.salary_max}" if request.salary_min or request.salary_max else None,
            "source": request.source
        }
    )


@router.get("/jobs/{job_id}", response_model=ScrapedJobResponse)
async def get_job_detail(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific scraped job.
    
    Args:
        job_id: ID of the scraped job
    
    Returns:
        Job details
    """
    result = await db.execute(
        select(ScrapedJob).where(ScrapedJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return ScrapedJobResponse.model_validate(job)


@router.get("/by-source/{source}", response_model=ScrapedJobListResponse)
async def get_jobs_by_source(
    source: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all jobs from a specific source (indeed, linkedin, etc.).
    
    Args:
        source: Job source name
        page: Page number
        per_page: Jobs per page
    
    Returns:
        Jobs from specified source
    """
    # Count total jobs from source
    count_result = await db.execute(
        select(func.count(ScrapedJob.id)).where(
            and_(ScrapedJob.is_active == True, ScrapedJob.source == source)
        )
    )
    total = count_result.scalar() or 0
    
    # Fetch jobs
    offset = (page - 1) * per_page
    result = await db.execute(
        select(ScrapedJob)
        .where(and_(ScrapedJob.is_active == True, ScrapedJob.source == source))
        .order_by(desc(ScrapedJob.posted_date))
        .offset(offset)
        .limit(per_page)
    )
    jobs = result.scalars().all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return ScrapedJobListResponse(
        jobs=[ScrapedJobResponse.model_validate(job) for job in jobs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/status", response_model=ScraperStatusResponse)
async def get_scraper_status(db: AsyncSession = Depends(get_db)):
    """
    Get scraper status and statistics.
    
    Returns:
        Scraper status information
    """
    # Count active jobs
    active_result = await db.execute(
        select(func.count(ScrapedJob.id)).where(ScrapedJob.is_active == True)
    )
    active_count = active_result.scalar() or 0
    
    # Count total jobs
    total_result = await db.execute(
        select(func.count(ScrapedJob.id))
    )
    total_count = total_result.scalar() or 0
    
    # Get last scraped job
    last_scraped_result = await db.execute(
        select(ScrapedJob.scraped_date)
        .order_by(desc(ScrapedJob.scraped_date))
        .limit(1)
    )
    last_scraped = last_scraped_result.scalar_one_or_none()
    
    # Get all sources
    sources_result = await db.execute(
        select(ScrapedJob.source).distinct()
        .where(ScrapedJob.is_active == True)
    )
    sources = [row[0] for row in sources_result.all()]
    
    return ScraperStatusResponse(
        last_scraped=last_scraped,
        total_jobs_scraped=total_count,
        active_jobs_count=active_count,
        sources=sources,
        next_scheduled_scrape=None  # Will be set by scheduler
    )


@router.get("/jobs-by-location/{location}", response_model=ScrapedJobListResponse)
async def get_jobs_by_location(
    location: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get jobs in a specific location.
    
    Args:
        location: Location name
        page: Page number
        per_page: Jobs per page
    
    Returns:
        Jobs in specified location
    """
    # Count total jobs in location
    count_result = await db.execute(
        select(func.count(ScrapedJob.id)).where(
            and_(
                ScrapedJob.is_active == True,
                or_(
                    ScrapedJob.location.ilike(f"%{location}%"),
                    ScrapedJob.remote_policy.ilike("Remote")
                )
            )
        )
    )
    total = count_result.scalar() or 0
    
    # Fetch jobs
    offset = (page - 1) * per_page
    result = await db.execute(
        select(ScrapedJob)
        .where(
            and_(
                ScrapedJob.is_active == True,
                or_(
                    ScrapedJob.location.ilike(f"%{location}%"),
                    ScrapedJob.remote_policy.ilike("Remote")
                )
            )
        )
        .order_by(desc(ScrapedJob.posted_date))
        .offset(offset)
        .limit(per_page)
    )
    jobs = result.scalars().all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return ScrapedJobListResponse(
        jobs=[ScrapedJobResponse.model_validate(job) for job in jobs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )
