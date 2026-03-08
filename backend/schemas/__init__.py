"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Resume Optimization Request
class ResumeOptimizationRequest(BaseModel):
    job_title: str = Field(..., min_length=1)
    job_description: Optional[str] = None
    job_link: Optional[str] = None
    
    class Config:
        from_attributes = True

# Resume Schemas
class ResumeBase(BaseModel):
    title: str


class ResumeCreate(ResumeBase):
    pass


class ResumeUpload(BaseModel):
    title: str
    file_data: str  # Base64 encoded file


class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    ats_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResumeDetail(ResumeResponse):
    raw_text: Optional[str]
    optimized_text: Optional[str]
    professional_summary: Optional[str]
    work_experience: Optional[str]
    skills: Optional[str]
    education: Optional[str]


# Analysis Schemas
class AnalysisResponse(BaseModel):
    id: int
    resume_id: int
    ats_score: float
    readability_score: Optional[float]
    keyword_match_score: Optional[float]
    strengths: Optional[str]
    weaknesses: Optional[str]
    suggestions: Optional[str]
    missing_keywords: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Job Schemas
class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str]
    job_type: Optional[str]
    description: str


class JobCreate(JobBase):
    requirements: Optional[str]
    responsibilities: Optional[str]
    salary_range: Optional[str]
    application_url: Optional[str]


class JobResponse(JobBase):
    id: int
    is_active: bool
    created_at: datetime
    match_score: Optional[float] = None  # Added when matching against user
    
    class Config:
        from_attributes = True


class JobDetail(JobResponse):
    requirements: Optional[str]
    responsibilities: Optional[str]
    salary_range: Optional[str]
    application_url: Optional[str]


# Job Application Schemas
class JobApplicationCreate(BaseModel):
    job_id: int
    resume_id: Optional[int]
    cover_letter: Optional[str]


class JobApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_id: Optional[int]
    status: str
    match_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Skill Gap Schemas
class SkillGapResponse(BaseModel):
    id: int
    current_skills: Optional[str]
    missing_skills: Optional[str]
    recommended_skills: Optional[str]
    learning_paths: Optional[str]
    estimated_time: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
