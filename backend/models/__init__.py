"""Database models for PickCV application - Production Ready."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean, Date, ARRAY, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from database import Base


class User(Base):
    """User model for authentication and profile."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))
    location = Column(String(255))
    linkedin_url = Column(String(500))
    profile_picture_url = Column(String(500))
    target_role = Column(String(255))
    experience_level = Column(String(50))  # Entry, Mid, Senior, Lead
    work_mode = Column(String(50))  # Remote, Hybrid, On-site
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False, index=True)  # Email verified
    email_verified_at = Column(DateTime(timezone=True))  # When email was verified
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    experiences = relationship("WorkExperience", back_populates="user", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    """Extended user profile information."""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text)
    preferred_locations = Column(ARRAY(String(255)))  # Array of locations
    preferred_job_types = Column(ARRAY(String(50)))  # ['Full-time', 'Remote', 'Hybrid']
    career_stage = Column(String(50))
    industry_focus = Column(String(255))
    notification_preferences = Column(JSONB, default={})
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")


class Resume(Base):
    """Resume model for storing user resume data."""
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    template_name = Column(String(50))  # classic, modern, minimal, etc.
    original_filename = Column(String(500))
    
    # Resume content
    raw_text = Column(Text)
    optimized_text = Column(Text)
    
    # Contact info (structured)
    contact_info = Column(JSONB)  # {name, email, phone, location, linkedin}
    professional_summary = Column(Text)
    
    # Sections (structured as JSON)
    sections = Column(JSONB)  # {experience: [...], education: [...], skills: [...]}
    
    # Metadata & Scores
    is_optimized = Column(Boolean, default=False)
    optimization_target_job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"))
    ats_score = Column(Float)
    keyword_density = Column(Float)
    
    # Vector embeddings for semantic search
    embedding = Column(Vector(768))  # Gemini embedding dimension
    
    # File storage
    file_path = Column(String(500))
    file_format = Column(String(20))  # pdf, docx, txt
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_modified = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    analyses = relationship("ResumeAnalysis", back_populates="resume", cascade="all, delete-orphan")


class UserSkill(Base):
    """User skills with proficiency levels."""
    __tablename__ = "user_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(255), nullable=False)
    proficiency_level = Column(String(50))  # beginner, intermediate, expert
    years_of_experience = Column(Float)
    endorsement_count = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="skills")


class WorkExperience(Base):
    """User work experience."""
    __tablename__ = "work_experiences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"))
    
    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    location = Column(String(255))
    
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    
    description = Column(Text)
    achievements = Column(ARRAY(Text))  # Array of bullet points
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="experiences")


class Education(Base):
    """User education details."""
    __tablename__ = "education"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"))
    
    degree_type = Column(String(100))  # Bachelor, Master, PhD
    field_of_study = Column(String(255))
    school_name = Column(String(255), nullable=False)
    graduation_date = Column(Date)
    
    gpa = Column(Float)
    activities = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="education")


class Job(Base):
    """Job posting model."""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    company_logo_url = Column(String(500))
    
    # Job details
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    benefits = Column(Text)
    
    # Classification
    job_type = Column(String(50), index=True)  # Full-time, Part-time, Contract, Remote
    experience_level = Column(String(50), index=True)  # Entry, Mid, Senior, Lead
    industry = Column(String(255))
    
    # Location
    location = Column(String(255), index=True)
    remote_policy = Column(String(50))  # Fully Remote, Hybrid, On-site
    
    # Compensation
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    currency = Column(String(10), default="USD")  # USD, GBP, etc.
    
    # Metadata
    source = Column(String(100))  # linkedin, indeed, api, etc.
    external_job_id = Column(String(255))
    external_url = Column(String(500))
    
    # AI
    keywords = Column(ARRAY(String(255)))
    embedding = Column(Vector(768))  # For semantic search
    
    # Status
    posted_date = Column(DateTime(timezone=True), index=True)
    expiry_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    """Job application tracking."""
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"))
    
    # Application status
    status = Column(String(50), index=True)  # applied, reviewing, interview, offer, rejected
    
    # Timeline
    applied_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    first_response_date = Column(DateTime(timezone=True))
    last_updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Tracking
    match_score = Column(Float)  # Calculated by system
    custom_cover_letter = Column(Text)
    notes = Column(Text)
    is_bookmarked = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="job_applications")
    job = relationship("Job", back_populates="applications")


class SavedJob(Base):
    """Jobs saved by users."""
    __tablename__ = "saved_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    saved_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")


class ResumeAnalysis(Base):
    """Resume analysis results."""
    __tablename__ = "resume_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"))
    
    # Analysis results
    ats_score = Column(Float)
    ats_score_breakdown = Column(JSONB)  # {formatting: 85, keywords: 75, structure: 90}
    
    # Keywords
    matched_keywords = Column(ARRAY(String(255)))
    missing_keywords = Column(ARRAY(String(255)))
    keyword_frequency = Column(JSONB)  # {keyword: count}
    
    # Suggestions
    suggestions = Column(JSONB)  # [{type: 'add_skill', suggestion: 'Python', priority: 'high'}]
    
    # Confidence
    confidence_score = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="analyses")


class AuditLog(Base):
    """Audit log for tracking changes and user actions."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(255), index=True)  # resume_created, resume_optimized, job_applied
    entity_type = Column(String(100), index=True)  # resume, job, application
    entity_id = Column(Integer)
    details = Column(JSONB)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


# ============= COLLEGE MODULE MODELS =============

class Admin(Base):
    """Admin user model."""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))


class College(Base):
    """College/institution model."""
    __tablename__ = "colleges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String(500), nullable=False)
    official_email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    contact_person_name = Column(String(255), nullable=False)
    designation = Column(String(255))
    phone_number = Column(String(20))
    city = Column(String(255))
    state = Column(String(255))
    institution_type = Column(String(50))  # engineering, university, medical, arts, other
    
    # Approval
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected
    rejection_reason = Column(Text)
    
    # Profile (filled during onboarding)
    logo_url = Column(String(500))
    website = Column(String(500))
    address = Column(Text)
    naac_grade = Column(String(10))
    total_students = Column(Integer, default=0)
    onboarding_completed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"))
    
    # Phase 1: Enhanced college fields
    subscription_tier = Column(String(50), default="free")       # free, basic, premium, enterprise
    max_students = Column(Integer, default=500)
    academic_year = Column(String(20))                           # "2025-26"
    placement_season_start = Column(Date)
    placement_season_end = Column(Date)
    autonomy_status = Column(String(50))                         # autonomous, affiliated, deemed
    affiliated_university = Column(String(500))
    
    # Relationships
    students = relationship("CollegeStudent", back_populates="college", cascade="all, delete-orphan")
    shared_profiles = relationship("SharedProfile", back_populates="college", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="college", cascade="all, delete-orphan")
    coe_groups = relationship("COEGroup", back_populates="college", cascade="all, delete-orphan")
    alerts = relationship("CollegeAlert", back_populates="college", cascade="all, delete-orphan")


class CollegeStudent(Base):
    """Student linked to a college — tracks onboarding status."""
    __tablename__ = "college_students"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    name = Column(String(255))
    branch = Column(String(255))
    graduation_year = Column(Integer)
    
    # Link to actual user account
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    
    # Status: invited → registered → ready
    status = Column(String(20), default="invited", index=True)
    invitation_token = Column(String(255))
    
    # Phase 1: Enhanced student profile
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), index=True)
    roll_number = Column(String(50))
    degree_type = Column(String(100))                              # B.Tech, M.Tech, BCA, MBA
    current_semester = Column(Integer, default=1)
    cgpa = Column(Float)
    admission_year = Column(Integer)
    
    # Contact & external profiles
    phone = Column(String(20))
    linkedin_url = Column(String(500))
    github_url = Column(String(500))
    portfolio_url = Column(String(500))
    
    # Resume & readiness tracking (denormalized for fast queries at scale)
    resume_score = Column(Float)                                   # Latest ATS score
    resume_status = Column(String(30), default="none")             # none, uploaded, optimized
    interview_readiness_score = Column(Float, default=0)           # 0-100 computed
    
    # Placement tracking
    placement_status = Column(String(30), default="not_started", index=True)  # not_started, preparing, applying, interviewing, placed, opted_out
    placed_company = Column(String(255))
    placed_role = Column(String(255))
    placed_salary_lpa = Column(Float)
    placed_at = Column(DateTime(timezone=True))
    
    # Timestamps
    invited_at = Column(DateTime(timezone=True))
    registered_at = Column(DateTime(timezone=True))
    ready_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Composite indexes for scale
    __table_args__ = (
        Index('idx_cs_college_dept', 'college_id', 'department_id'),
        Index('idx_cs_college_year', 'college_id', 'graduation_year'),
        Index('idx_cs_college_roll', 'college_id', 'roll_number'),
    )
    
    # Relationships
    college = relationship("College", back_populates="students")
    user = relationship("User")
    department = relationship("Department", back_populates="students")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    coe_memberships = relationship("COEMembership", back_populates="student", cascade="all, delete-orphan")


class SharedProfile(Base):
    """Shared student profiles with recruiters."""
    __tablename__ = "shared_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    share_token = Column(String(255), unique=True, nullable=False, index=True)
    recruiter_email = Column(String(255), nullable=False)
    message = Column(Text)
    student_ids = Column(ARRAY(Integer), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Phase 1: Enhanced share tracking
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime(timezone=True))
    recruiter_name = Column(String(255))
    recruiter_company = Column(String(255))
    is_active = Column(Boolean, default=True)
    filter_criteria = Column(JSONB)  # {"skills": [...], "min_cgpa": 7.0, "coe": "AI_ML"}
    
    # Relationships
    college = relationship("College", back_populates="shared_profiles")


# ============= PHASE 1: NEW MODELS =============

class SkillTaxonomy(Base):
    """Master skill catalog — normalized, prevents duplication at scale."""
    __tablename__ = "skill_taxonomy"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)                    # Display: "Python"
    name_lower = Column(String(255), unique=True, nullable=False, index=True)  # Lookup: "python"
    category = Column(String(100), index=True)                    # Programming Language, Framework, etc.
    subcategory = Column(String(100))                             # Backend, Frontend, Data Science
    is_verified = Column(Boolean, default=True)
    aliases = Column(ARRAY(String(255)))                          # ["py", "python3"]
    demand_score = Column(Float, default=0)                       # 0-100, from job market data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student_skills = relationship("StudentSkill", back_populates="skill")
    course_mappings = relationship("CourseSkillMapping", back_populates="skill")


class Department(Base):
    """Department within a college — e.g. CSE, ECE, ME."""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)                    # "Computer Science and Engineering"
    code = Column(String(20))                                     # "CSE", "ECE"
    degree_type = Column(String(100))                             # "B.Tech", "M.Tech", "BCA"
    duration_semesters = Column(Integer, default=8)               # 8 for B.Tech, 4 for M.Tech
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('college_id', 'code', 'degree_type', name='uq_dept_college_code_degree'),
    )
    
    # Relationships
    college = relationship("College", back_populates="departments")
    students = relationship("CollegeStudent", back_populates="department")
    courses = relationship("CurriculumCourse", back_populates="department", cascade="all, delete-orphan")


class CurriculumCourse(Base):
    """Course mapped to semester + department."""
    __tablename__ = "curriculum_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_number = Column(Integer, nullable=False)
    course_name = Column(String(500), nullable=False)
    course_code = Column(String(50))
    credits = Column(Integer, default=3)
    course_type = Column(String(50), default="core")              # core, elective, lab, project, internship
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('department_id', 'course_code', name='uq_course_dept_code'),
        CheckConstraint('semester_number >= 1 AND semester_number <= 12', name='ck_semester_range'),
        Index('idx_curriculum_courses_sem', 'department_id', 'semester_number'),
    )
    
    # Relationships
    department = relationship("Department", back_populates="courses")
    skill_mappings = relationship("CourseSkillMapping", back_populates="course", cascade="all, delete-orphan")


class CourseSkillMapping(Base):
    """Maps courses to skills they teach."""
    __tablename__ = "course_skill_mapping"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("curriculum_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skill_taxonomy.id", ondelete="CASCADE"), nullable=False, index=True)
    expected_level = Column(String(50), default="intermediate")   # beginner, intermediate, advanced
    
    __table_args__ = (
        UniqueConstraint('course_id', 'skill_id', name='uq_course_skill'),
    )
    
    # Relationships
    course = relationship("CurriculumCourse", back_populates="skill_mappings")
    skill = relationship("SkillTaxonomy", back_populates="course_mappings")


class StudentSkill(Base):
    """Individual skill record per student — from resume, curriculum, self-declared, etc."""
    __tablename__ = "student_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("college_students.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skill_taxonomy.id", ondelete="CASCADE"), nullable=False, index=True)
    proficiency = Column(String(50), default="beginner")          # beginner, intermediate, advanced, expert
    source = Column(String(50), default="self")                   # resume, curriculum, self, certification, project
    verified = Column(Boolean, default=False)
    last_assessed = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('student_id', 'skill_id', 'source', name='uq_student_skill_source'),
    )
    
    # Relationships
    student = relationship("CollegeStudent", back_populates="skills")
    skill = relationship("SkillTaxonomy", back_populates="student_skills")


class COEGroup(Base):
    """Center of Excellence group within a college."""
    __tablename__ = "coe_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)                    # "AI/ML Center of Excellence"
    code = Column(String(50))                                     # "AI_ML", "WEB_DEV"
    description = Column(Text)
    focus_skills = Column(ARRAY(Integer))                         # skill_taxonomy IDs
    faculty_lead_name = Column(String(255))
    faculty_lead_email = Column(String(255))
    max_capacity = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('college_id', 'code', name='uq_coe_college_code'),
    )
    
    # Relationships
    college = relationship("College", back_populates="coe_groups")
    memberships = relationship("COEMembership", back_populates="coe_group", cascade="all, delete-orphan")


class COEMembership(Base):
    """Student membership in a COE group."""
    __tablename__ = "coe_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    coe_id = Column(Integer, ForeignKey("coe_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("college_students.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(String(50), default="member")                   # member, lead, mentor
    status = Column(String(50), default="active")                 # active, inactive, graduated
    
    __table_args__ = (
        UniqueConstraint('coe_id', 'student_id', name='uq_coe_student'),
    )
    
    # Relationships
    coe_group = relationship("COEGroup", back_populates="memberships")
    student = relationship("CollegeStudent", back_populates="coe_memberships")


class CollegeAlert(Base):
    """Alerts for college dashboard — red flags, opportunities, milestones."""
    __tablename__ = "college_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)               # red_flag, opportunity, milestone, deadline
    severity = Column(String(20), default="info")                 # critical, warning, info
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50))                              # student, coe, batch, recruiter
    entity_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    college = relationship("College", back_populates="alerts")


class CollegeAuditLog(Base):
    """Audit log for college dashboard actions — security & compliance."""
    __tablename__ = "college_audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_type = Column(String(50), nullable=False)               # college_admin, faculty, system
    actor_id = Column(Integer)
    action = Column(String(100), nullable=False)                  # student_uploaded, coe_created, share_sent
    entity_type = Column(String(50))                              # student, coe, share, department
    entity_id = Column(Integer)
    details = Column(JSONB)
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


# ============= PAYMENT MODELS =============

class Payment(Base):
    """Payment records for resume downloads via Zoho Payments."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), index=True)

    # Zoho Payments references
    zoho_session_id = Column(String(100), unique=True, index=True)       # payments_session_id
    zoho_payment_id = Column(String(100), unique=True, index=True)       # payment_id from widget response

    # Payment details
    amount = Column(Float, nullable=False)                               # e.g. 49.0
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="pending", index=True)           # pending, succeeded, failed, refunded
    description = Column(String(500))
    reference_number = Column(String(100))                               # internal ref

    # Product info
    product_type = Column(String(50), default="resume_download")         # resume_download, subscription, etc.

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    paid_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", backref="payments")
    resume = relationship("Resume", backref="payments")


class Subscription(Base):
    """User subscription plans for unlimited resume downloads."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_type = Column(String(50), nullable=False)               # monthly, yearly
    status = Column(String(50), default="active", index=True)    # active, expired, cancelled
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="SET NULL"), index=True)

    starts_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    cancelled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="subscriptions")
    payment = relationship("Payment", backref="subscription")

