"""Schemas for job scraping and display."""
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime


class ScrapedJobBase(BaseModel):
    """Base schema for scraped jobs."""
    job_title: str
    company_name: str
    company_logo_url: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    
    location: Optional[str] = None
    remote_policy: Optional[str] = None  # Fully Remote, Hybrid, On-site
    job_type: Optional[str] = None  # Full-time, Part-time, Contract
    experience_level: Optional[str] = None
    industry: Optional[str] = None
    
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    
    source: str  # indeed, linkedin, etc.
    external_job_id: Optional[str] = None
    external_url: str
    
    posted_date: Optional[datetime] = None
    keywords: Optional[List[str]] = None


class ScrapedJobCreate(ScrapedJobBase):
    """Schema for creating a scraped job."""
    job_hash: Optional[str] = None
    expiry_date: Optional[datetime] = None


class ScrapedJobUpdate(BaseModel):
    """Schema for updating a scraped job."""
    is_active: Optional[bool] = None
    last_verified: Optional[datetime] = None
    scrape_count: Optional[int] = None


class ScrapedJobResponse(ScrapedJobBase):
    """Schema for scraped job response."""
    id: int
    job_hash: str
    is_active: bool
    scraped_date: datetime
    last_verified: Optional[datetime] = None
    scrape_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ScrapedJobDetailResponse(ScrapedJobResponse):
    """Detailed scraped job response."""
    embedding: Optional[List[float]] = None


class ScrapedJobListResponse(BaseModel):
    """Response for list of scraped jobs."""
    jobs: List[ScrapedJobResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ScraperStatusResponse(BaseModel):
    """Response for scraper status."""
    last_scraped: Optional[datetime] = None
    total_jobs_scraped: int
    active_jobs_count: int
    sources: List[str]
    last_error: Optional[str] = None
    next_scheduled_scrape: Optional[datetime] = None


class JobSearchRequest(BaseModel):
    """Request for job search."""
    query: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    remote_policy: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    source: Optional[str] = None
    page: int = 1
    per_page: int = 20


class JobSearchResponse(BaseModel):
    """Response for job search."""
    jobs: List[ScrapedJobResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    filters_applied: dict
