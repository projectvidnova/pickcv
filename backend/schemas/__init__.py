"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


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
    # Phase 1 fields
    subscription_tier: Optional[str] = "free"
    max_students: Optional[int] = 500
    academic_year: Optional[str] = None
    placement_season_start: Optional[date] = None
    placement_season_end: Optional[date] = None
    autonomy_status: Optional[str] = None
    affiliated_university: Optional[str] = None
    
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
    # Phase 1: Enhanced student fields
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    roll_number: Optional[str] = None
    degree_type: Optional[str] = None
    current_semester: Optional[int] = None
    admission_year: Optional[int] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_score: Optional[float] = None
    resume_status: Optional[str] = "none"
    interview_readiness_score: Optional[float] = 0
    placement_status: Optional[str] = "not_started"
    placed_company: Optional[str] = None
    placed_role: Optional[str] = None
    placed_salary_lpa: Optional[float] = None
    skill_details: List[Dict[str, Any]] = []       # [{skill_name, proficiency, source}]
    coe_groups: List[Dict[str, Any]] = []           # [{coe_name, coe_code, role}]
    
    class Config:
        from_attributes = True


class StudentUploadItem(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    roll_number: Optional[str] = None
    department_code: Optional[str] = None
    degree_type: Optional[str] = None
    current_semester: Optional[int] = None
    cgpa: Optional[float] = None
    admission_year: Optional[int] = None
    phone: Optional[str] = None


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
    recruiter_name: Optional[str] = None
    recruiter_company: Optional[str] = None
    message: Optional[str] = None
    expires_in_days: int = Field(default=7, ge=1, le=90)
    filter_criteria: Optional[Dict[str, Any]] = None


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
    # Phase 1 enhanced stats
    department_breakdown: List[Dict[str, Any]] = []    # [{dept, count, avg_cgpa}]
    placement_stats: Dict[str, Any] = {}               # {placed, preparing, opted_out, avg_salary}
    resume_stats: Dict[str, Any] = {}                  # {none, uploaded, optimized, avg_score}
    skill_heatmap: List[Dict[str, Any]] = []           # [{skill, category, count, proficiency_dist}]
    coe_stats: List[Dict[str, Any]] = []               # [{coe_name, member_count, avg_score}]
    alerts_count: int = 0


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


# ============= PHASE 1: DEPARTMENT SCHEMAS =============

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2)
    code: str = Field(..., min_length=1, max_length=20)
    degree_type: str = Field(..., min_length=2)         # B.Tech, M.Tech, BCA
    duration_semesters: int = Field(default=8, ge=2, le=12)


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    degree_type: Optional[str] = None
    duration_semesters: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    id: int
    college_id: int
    name: str
    code: Optional[str]
    degree_type: Optional[str]
    duration_semesters: int
    is_active: bool
    student_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= PHASE 1: CURRICULUM SCHEMAS =============

class CourseCreate(BaseModel):
    department_id: int
    semester_number: int = Field(..., ge=1, le=12)
    course_name: str = Field(..., min_length=2)
    course_code: Optional[str] = None
    credits: int = Field(default=3, ge=1, le=10)
    course_type: str = Field(default="core")            # core, elective, lab, project, internship
    description: Optional[str] = None
    skill_ids: List[int] = []                           # skill_taxonomy IDs this course teaches


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    credits: Optional[int] = None
    course_type: Optional[str] = None
    description: Optional[str] = None
    skill_ids: Optional[List[int]] = None


class CourseResponse(BaseModel):
    id: int
    department_id: int
    semester_number: int
    course_name: str
    course_code: Optional[str]
    credits: int
    course_type: str
    description: Optional[str]
    skills: List[Dict[str, Any]] = []                   # [{skill_id, skill_name, expected_level}]
    created_at: datetime
    
    class Config:
        from_attributes = True


class CurriculumSemesterView(BaseModel):
    """Grouped view of courses by semester."""
    semester_number: int
    courses: List[CourseResponse]
    total_credits: int
    skills_covered: List[str]


class CurriculumOverview(BaseModel):
    """Full curriculum for a department."""
    department_id: int
    department_name: str
    degree_type: str
    total_semesters: int
    semesters: List[CurriculumSemesterView]
    total_skills_mapped: int


# ============= PHASE 1: SKILL SCHEMAS =============

class SkillTaxonomyResponse(BaseModel):
    id: int
    name: str
    name_lower: str
    category: Optional[str]
    subcategory: Optional[str]
    is_verified: bool
    aliases: List[str] = []
    demand_score: float = 0
    
    class Config:
        from_attributes = True


class SkillTaxonomyCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: Optional[str] = None
    subcategory: Optional[str] = None
    aliases: List[str] = []


class StudentSkillCreate(BaseModel):
    skill_id: int
    proficiency: str = Field(default="beginner")        # beginner, intermediate, advanced, expert
    source: str = Field(default="self")                 # resume, curriculum, self, certification


class StudentSkillResponse(BaseModel):
    id: int
    student_id: int
    skill_id: int
    skill_name: str
    skill_category: Optional[str]
    proficiency: str
    source: str
    verified: bool
    
    class Config:
        from_attributes = True


class SkillHeatmapItem(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    subcategory: Optional[str] = None
    student_count: int
    beginner_count: int = 0
    intermediate_count: int = 0
    advanced_count: int = 0
    expert_count: int = 0
    demand_score: float = 0


class SkillGapItem(BaseModel):
    """Gap between curriculum skills and student actual skills."""
    skill_name: str
    expected_from_curriculum: int                       # How many students should have it
    actually_have: int                                  # How many actually do
    gap_percent: float                                  # % of students missing it


class SkillAnalyticsResponse(BaseModel):
    college_id: int
    total_students: int
    total_skills_tracked: int
    heatmap: List[SkillHeatmapItem]
    top_skills: List[Dict[str, Any]]                    # Top 20 skills by student count
    skill_gaps: List[SkillGapItem]                      # Where curriculum expects but students lack
    department_skill_distribution: List[Dict[str, Any]]
    demand_alignment_score: float = 0                   # % of student skills matching high-demand


# ============= PHASE 1: COE SCHEMAS =============

class COEGroupCreate(BaseModel):
    name: str = Field(..., min_length=2)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    focus_skill_ids: List[int] = []                     # skill_taxonomy IDs
    faculty_lead_name: Optional[str] = None
    faculty_lead_email: Optional[EmailStr] = None
    max_capacity: Optional[int] = None


class COEGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    focus_skill_ids: Optional[List[int]] = None
    faculty_lead_name: Optional[str] = None
    faculty_lead_email: Optional[str] = None
    max_capacity: Optional[int] = None
    is_active: Optional[bool] = None


class COEGroupResponse(BaseModel):
    id: int
    college_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str]
    focus_skills: List[Dict[str, Any]] = []             # [{skill_id, skill_name}]
    faculty_lead_name: Optional[str]
    faculty_lead_email: Optional[str]
    max_capacity: Optional[int]
    is_active: bool
    member_count: int = 0
    active_count: int = 0
    avg_resume_score: Optional[float] = None
    avg_cgpa: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class COEMembershipCreate(BaseModel):
    student_ids: List[int]                              # Batch add
    role: str = Field(default="member")                 # member, lead, mentor


class COEMembershipResponse(BaseModel):
    id: int
    coe_id: int
    student_id: int
    student_name: Optional[str]
    student_email: str
    role: str
    status: str
    joined_at: datetime
    
    class Config:
        from_attributes = True


# ============= PHASE 1: ALERT SCHEMAS =============

class CollegeAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AlertDismissRequest(BaseModel):
    alert_ids: List[int]


# ============= PHASE 1: STUDENT BULK UPDATE =============

class StudentProfileUpdate(BaseModel):
    """Update a single student's enhanced profile."""
    roll_number: Optional[str] = None
    department_id: Optional[int] = None
    degree_type: Optional[str] = None
    current_semester: Optional[int] = None
    cgpa: Optional[float] = None
    admission_year: Optional[int] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    placement_status: Optional[str] = None


class StudentBulkUpdateItem(BaseModel):
    student_id: int
    updates: StudentProfileUpdate


class StudentBulkUpdateRequest(BaseModel):
    students: List[StudentBulkUpdateItem]


# ============= PHASE 1: AUDIT LOG SCHEMAS =============

class CollegeAuditLogResponse(BaseModel):
    id: int
    actor_type: str
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= PHASE 1: PAGINATION =============

class PaginatedResponse(BaseModel):
    """Standard paginated response wrapper for scale."""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
