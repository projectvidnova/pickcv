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
    template_name: Optional[str] = None
    original_filename: Optional[str] = None
    is_optimized: bool = False
    file_format: Optional[str] = None
    ats_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ResumeDetail(ResumeResponse):
    raw_text: Optional[str] = None
    optimized_text: Optional[str] = None
    professional_summary: Optional[str] = None
    work_experience: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    contact_info: Optional[dict] = None
    sections: Optional[dict] = None


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


# ============= COLLEGE MODULE SCHEMAS =============

class CollegeRegisterRequest(BaseModel):
    institution_name: str = Field(..., min_length=2)
    official_email: EmailStr
    password: str = Field(..., min_length=6)
    contact_person_name: str = Field(..., min_length=2)
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    institution_type: Optional[str] = None


class CollegeLoginRequest(BaseModel):
    email: EmailStr
    password: str


class CollegeResponse(BaseModel):
    id: int
    institution_name: str
    official_email: str
    contact_person_name: str
    designation: Optional[str]
    phone_number: Optional[str]
    city: Optional[str]
    state: Optional[str]
    institution_type: Optional[str]
    status: str
    rejection_reason: Optional[str]
    logo_url: Optional[str]
    website: Optional[str]
    address: Optional[str]
    naac_grade: Optional[str]
    total_students: Optional[int]
    onboarding_completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CollegeProfileUpdate(BaseModel):
    institution_name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    naac_grade: Optional[str] = None
    total_students: Optional[int] = None


class StudentResumeInfo(BaseModel):
    """Resume summary visible to colleges."""
    id: int
    title: str
    original_filename: Optional[str] = None
    ats_score: Optional[float] = None
    is_optimized: bool = False
    file_format: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CollegeStudentResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    branch: Optional[str]
    graduation_year: Optional[int]
    user_id: Optional[int]
    status: str  # invited, registered, ready
    invited_at: Optional[datetime]
    registered_at: Optional[datetime]
    ready_at: Optional[datetime]
    created_at: datetime
    # Populated from user's data when available
    has_resume: bool = False
    resume_count: int = 0
    resumes: List[StudentResumeInfo] = []
    skills: List[str] = []
    cgpa: Optional[float] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class StudentUploadItem(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None


class StudentUploadResponse(BaseModel):
    total: int
    invited: int
    registered: int
    ready: int
    already_exists: int
    students: List[CollegeStudentResponse]


class ShareProfilesRequest(BaseModel):
    student_ids: List[int]
    recruiter_email: EmailStr
    message: Optional[str] = None
    expires_in_days: int = Field(default=7, ge=1, le=90)


class ShareProfilesResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: datetime
    student_count: int


class CollegeStatsResponse(BaseModel):
    total_students: int
    invited: int
    registered: int
    ready: int
    avg_cgpa: Optional[float]
    placement_ready_percent: float
    top_skills: List[dict]


# ============= ADMIN MODULE SCHEMAS =============

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: int
    email: str
    name: Optional[str]


class AdminCollegeResponse(BaseModel):
    id: int
    institution_name: str
    official_email: str
    contact_person_name: str
    designation: Optional[str]
    phone_number: Optional[str]
    city: Optional[str]
    state: Optional[str]
    institution_type: Optional[str]
    status: str
    rejection_reason: Optional[str]
    student_count: int = 0
    created_at: datetime
    approved_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AdminRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5)


class AdminStatsResponse(BaseModel):
    total_colleges: int
    pending: int
    approved: int
    rejected: int


# ============= USER PROFILE SCHEMAS =============

class SkillItem(BaseModel):
    name: str
    years: int = 0


class UserProfileFullResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    work_mode: Optional[str] = None
    preferred_locations: List[str] = []
    skills: List[SkillItem] = []
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    work_mode: Optional[str] = None
    preferred_locations: Optional[List[str]] = None
    skills: Optional[List[SkillItem]] = None
