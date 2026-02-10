"""Database models for PickCV application."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    resumes = relationship("Resume", back_populates="user")
    job_applications = relationship("JobApplication", back_populates="user")


class Resume(Base):
    """Resume model for storing user resume data."""
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    
    # Resume content
    raw_text = Column(Text)
    optimized_text = Column(Text)
    
    # Structured data
    professional_summary = Column(Text)
    work_experience = Column(Text)
    skills = Column(Text)
    education = Column(Text)
    
    # ATS metrics
    ats_score = Column(Float)
    keyword_density = Column(Float)
    
    # Vector embeddings for semantic search
    embedding = Column(Vector(768))  # Gemini embedding dimension
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    analyses = relationship("ResumeAnalysis", back_populates="resume")


class ResumeAnalysis(Base):
    """Resume analysis results."""
    __tablename__ = "resume_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    
    ats_score = Column(Float, nullable=False)
    readability_score = Column(Float)
    keyword_match_score = Column(Float)
    
    # Detailed feedback
    strengths = Column(Text)
    weaknesses = Column(Text)
    suggestions = Column(Text)
    missing_keywords = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="analyses")


class Job(Base):
    """Job posting model."""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    job_type = Column(String(50))  # Full-time, Part-time, Contract, etc.
    
    # Job details
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(Text)
    salary_range = Column(String(100))
    
    # Metadata
    posted_date = Column(DateTime(timezone=True))
    application_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    
    # Vector embeddings for semantic matching
    embedding = Column(Vector(768))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    applications = relationship("JobApplication", back_populates="job")


class JobApplication(Base):
    """Job application tracking."""
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    
    # Application status
    status = Column(String(50), default="pending")  # pending, applied, rejected, interview, offer
    match_score = Column(Float)  # Cosine similarity score
    
    # Application details
    cover_letter = Column(Text)
    applied_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="job_applications")
    job = relationship("Job", back_populates="applications")


class SkillGap(Base):
    """Skill gap analysis for users."""
    __tablename__ = "skill_gaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Gap analysis
    current_skills = Column(Text)
    missing_skills = Column(Text)
    recommended_skills = Column(Text)
    
    # Learning recommendations
    learning_paths = Column(Text)
    estimated_time = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
