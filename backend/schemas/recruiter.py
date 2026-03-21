"""Pydantic schemas for recruiter module — all 5 phases."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============= PHASE 1: REGISTRATION & AUTH =============

class RecruiterRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    company_name: str = Field(..., min_length=2)
    company_website: Optional[str] = None
    company_size: Optional[str] = None       # 1-10, 11-50, 51-200, 201-500, 500+
    industry: Optional[str] = None
    designation: Optional[str] = None


class RecruiterLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RecruiterLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    recruiter: "RecruiterResponse"


class RecruiterResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    company_name: str
    company_website: Optional[str]
    company_logo_url: Optional[str]
    company_size: Optional[str]
    industry: Optional[str]
    designation: Optional[str]
    is_email_verified: bool
    status: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RecruiterProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    designation: Optional[str] = None


# Admin views for recruiter approval
class AdminRecruiterResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    company_name: str
    company_website: Optional[str]
    company_size: Optional[str]
    industry: Optional[str]
    designation: Optional[str]
    status: str
    is_approved: bool
    is_email_verified: bool
    job_count: int = 0
    created_at: datetime
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True


class AdminRecruiterRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5)


# ============= PHASE 2: JOB MANAGEMENT =============

class RecruiterJobCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    benefits: Optional[str] = None
    job_type: Optional[str] = None            # Full-time, Part-time, Contract, Internship
    experience_level: Optional[str] = None
    location: Optional[str] = None
    remote_policy: Optional[str] = None       # Remote, Hybrid, On-site
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "INR"
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    pause_date: Optional[datetime] = None     # Auto-pause date


class RecruiterJobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    benefits: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    remote_policy: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    pause_date: Optional[datetime] = None


class RecruiterJobResponse(BaseModel):
    id: int
    recruiter_id: int
    title: str
    description: str
    requirements: Optional[str]
    responsibilities: Optional[str]
    benefits: Optional[str]
    job_type: Optional[str]
    experience_level: Optional[str]
    location: Optional[str]
    remote_policy: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    currency: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    status: str
    pause_date: Optional[datetime]
    application_count: int = 0
    view_count: int = 0
    company_name: str = ""
    company_logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|paused|closed)$")


# ============= PHASE 3: APPLICATIONS & INTERVIEWS =============

class ApplicationCreateRequest(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(in_review|shortlisted|interviewing|offered|hired|rejected)$")
    recruiter_notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    user_id: int
    resume_id: Optional[int]
    status: str
    cover_letter: Optional[str]
    match_score: Optional[float]
    recruiter_notes: Optional[str]
    applied_at: datetime
    reviewed_at: Optional[datetime]
    shortlisted_at: Optional[datetime]
    offered_at: Optional[datetime]
    offer_response: Optional[str]
    # Denormalized candidate info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    resume_title: Optional[str] = None
    resume_ats_score: Optional[float] = None
    # Interview summary
    total_rounds: int = 0
    completed_rounds: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewPlanCreate(BaseModel):
    """Plan interview rounds for a shortlisted candidate."""
    rounds: List["InterviewRoundCreate"]
    scheduling_mode: str = "sequential"       # sequential or bulk


class InterviewRoundCreate(BaseModel):
    round_number: int = Field(..., ge=1, le=10)
    round_title: str = Field(..., min_length=2)
    interview_type: str = "video"             # video, phone, in_person
    interviewer_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int = Field(default=60, ge=15, le=480)


class InterviewUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    interviewer_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    round_title: Optional[str] = None


class InterviewFeedbackSubmit(BaseModel):
    feedback: str = Field(..., min_length=5)
    rating: int = Field(..., ge=1, le=5)
    is_qualified: bool


class InterviewResponse(BaseModel):
    id: int
    application_id: int
    interviewer_id: Optional[int]
    round_number: int
    round_title: Optional[str]
    interview_type: str
    scheduled_at: Optional[datetime]
    duration_minutes: int
    google_meet_link: Optional[str]
    status: str
    feedback: Optional[str]
    rating: Optional[int]
    is_qualified: Optional[bool]
    invite_sent: bool
    invite_sent_at: Optional[datetime]
    # Denormalized
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============= PHASE 4: INTERVIEWER MANAGEMENT =============

class InterviewerInviteRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None


class InterviewerAcceptRequest(BaseModel):
    token: str


class InterviewerResponse(BaseModel):
    id: int
    recruiter_id: int
    email: str
    full_name: Optional[str]
    designation: Optional[str]
    phone: Optional[str]
    status: str
    is_active: bool
    accepted_at: Optional[datetime]
    created_at: datetime
    interview_count: int = 0

    class Config:
        from_attributes = True


class InterviewerUpdate(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


# ============= PHASE 5: OFFER TEMPLATES & OFFERS =============

class OfferTemplateCreate(BaseModel):
    name: str = Field(..., min_length=2)
    content: str = Field(..., min_length=10)   # HTML/Markdown with {{variables}}
    variables: List[str] = []                  # ["candidate_name", "salary", "role"]
    is_default: bool = False


class OfferTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None
    is_default: Optional[bool] = None


class OfferTemplateResponse(BaseModel):
    id: int
    recruiter_id: int
    name: str
    content: str
    variables: List[str] = []
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReleaseOfferRequest(BaseModel):
    application_id: int
    template_id: int
    variables: Dict[str, str]                  # {"candidate_name": "John", "salary": "12 LPA"}


class OfferResponse(BaseModel):
    id: int
    application_id: int
    template_id: Optional[int]
    rendered_content: str
    variables_used: Optional[Dict[str, Any]]
    pdf_url: Optional[str]
    status: str
    released_at: datetime
    responded_at: Optional[datetime]
    response_note: Optional[str]
    # Denormalized
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfferRespondRequest(BaseModel):
    response: str = Field(..., pattern="^(accepted|declined)$")
    note: Optional[str] = None


# ============= STATS =============

class RecruiterStatsResponse(BaseModel):
    total_jobs: int = 0
    open_jobs: int = 0
    paused_jobs: int = 0
    closed_jobs: int = 0
    total_applications: int = 0
    shortlisted: int = 0
    interviewing: int = 0
    offered: int = 0
    hired: int = 0
    rejected: int = 0
    total_interviewers: int = 0
    pending_interviews: int = 0


# ============= PUBLIC JOB LISTING =============

class PublicJobResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: Optional[str]
    responsibilities: Optional[str]
    benefits: Optional[str]
    job_type: Optional[str]
    experience_level: Optional[str]
    location: Optional[str]
    remote_policy: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    currency: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    company_name: str = ""
    company_logo_url: Optional[str] = None
    created_at: datetime
    has_applied: bool = False

    class Config:
        from_attributes = True
