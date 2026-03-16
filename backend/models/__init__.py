"""Database models for PickCV application - Production Ready."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean, Date, ARRAY
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
    
    # Relationships
    students = relationship("CollegeStudent", back_populates="college", cascade="all, delete-orphan")
    shared_profiles = relationship("SharedProfile", back_populates="college", cascade="all, delete-orphan")


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
    
    # Timestamps
    invited_at = Column(DateTime(timezone=True))
    registered_at = Column(DateTime(timezone=True))
    ready_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    college = relationship("College", back_populates="students")
    user = relationship("User")


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
    
    # Relationships
    college = relationship("College", back_populates="shared_profiles")

