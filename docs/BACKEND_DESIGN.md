# PickCV Backend & Database Design Document

**Version:** 1.0.0  
**Date:** March 5, 2026  
**Status:** Design Phase - Ready for Implementation

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Features & Functionality](#core-features--functionality)
3. [Database Schema](#database-schema)
4. [API Architecture](#api-architecture)
5. [Data Models & Schemas](#data-models--schemas)
6. [Business Logic](#business-logic)
7. [Authentication & Security](#authentication--security)
8. [Integration Points](#integration-points)

---

## 🎯 System Overview

**PickCV** is an AI-powered resume optimization and job matching platform that helps users:
- Create and optimize resumes for ATS (Applicant Tracking Systems)
- Match with relevant job opportunities
- Track job applications
- Analyze resume quality and keyword optimization

### Core Technology Stack

```
Backend: FastAPI 0.129.1 (Python)
Database: PostgreSQL 15 + pgvector (for AI embeddings)
Authentication: JWT + bcrypt
AI/ML: Google Gemini API (resume analysis & optimization)
```

---

## 🚀 Core Features & Functionality

### 1. **Authentication & User Management**
- User registration with email & password
- JWT-based authentication
- User profile management
- Session handling with refresh tokens

### 2. **Resume Management**
- Resume upload (PDF, DOCX)
- Resume parsing (extract structure: education, experience, skills)
- Resume building from scratch
- Multiple resume storage per user
- Resume versioning & history

### 3. **Resume Optimization**
- ATS score calculation
- Keyword matching against job descriptions
- AI-powered resume suggestions
- Template-based resume generation (6 templates)
- Dynamic resume tailoring for specific jobs

### 4. **Job Matching**
- Job search with filters (location, type, experience level, salary)
- AI-powered job recommendations based on user profile
- Semantic similarity matching using embeddings
- Save job functionality

### 5. **Application Tracking**
- Track applied jobs
- Application status management (applied, reviewing, interview, offer, rejected)
- Historical tracking of applications

### 6. **Resume Analysis**
- Extract key metrics from resumes
- Identify missing skills
- Suggest improvements
- Keyword frequency analysis

---

## 🗄️ Database Schema

### Core Tables

#### **1. Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    linkedin_url VARCHAR(500),
    profile_picture_url VARCHAR(500),
    target_role VARCHAR(255),
    experience_level VARCHAR(50),
    work_mode VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);
```

#### **2. User Profiles Table**
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    preferred_locations TEXT[], -- Array of locations
    preferred_job_types TEXT[], -- ['Full-time', 'Remote', 'Hybrid']
    career_stage VARCHAR(50),
    industry_focus VARCHAR(255),
    notification_preferences JSONB,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. Resumes Table**
```sql
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    template_name VARCHAR(50), -- 'classic', 'modern', 'minimal', etc.
    original_filename VARCHAR(500),
    
    -- Resume Content (Structured)
    contact_info JSONB, -- {name, email, phone, location, linkedin}
    professional_summary TEXT,
    
    -- Raw/Parsed Content
    raw_text TEXT,
    optimized_text TEXT,
    
    -- Sections (JSON)
    sections JSONB, -- {experience: [...], education: [...], skills: [...]}
    
    -- Metadata & Scores
    is_optimized BOOLEAN DEFAULT false,
    optimization_target_job_id INTEGER,
    ats_score FLOAT,
    keyword_density FLOAT,
    
    -- AI Embeddings
    embedding vector(768), -- Gemini text embeddings
    
    -- File Storage
    file_path VARCHAR(500),
    file_format VARCHAR(20), -- 'pdf', 'docx', 'txt'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

#### **4. Skills Table**
```sql
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
    years_of_experience FLOAT,
    endorsement_count INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (user_id, skill_name),
    INDEX idx_user_id (user_id),
    INDEX idx_skill_name (skill_name)
);
```

#### **5. Work Experience Table**
```sql
CREATE TABLE work_experiences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    
    description TEXT,
    achievements TEXT[], -- Array of bullet points
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_resume_id (resume_id)
);
```

#### **6. Education Table**
```sql
CREATE TABLE education (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    
    degree_type VARCHAR(100), -- 'Bachelor', 'Master', 'PhD'
    field_of_study VARCHAR(255),
    school_name VARCHAR(255) NOT NULL,
    graduation_date DATE,
    
    gpa FLOAT,
    activities TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id)
);
```

#### **7. Jobs Table**
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url VARCHAR(500),
    
    -- Job Details
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    
    -- Classification
    job_type VARCHAR(50), -- 'Full-time', 'Part-time', 'Contract', 'Remote'
    experience_level VARCHAR(50), -- 'Entry', 'Mid', 'Senior', 'Lead'
    industry VARCHAR(255),
    
    -- Location
    location VARCHAR(255),
    remote_policy VARCHAR(50), -- 'Fully Remote', 'Hybrid', 'On-site'
    
    -- Compensation
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10), -- 'USD', 'GBP', etc.
    
    -- Metadata
    source VARCHAR(100), -- 'linkedin', 'indeed', 'api', etc.
    external_job_id VARCHAR(255),
    external_url VARCHAR(500),
    
    -- AI
    keywords TEXT[],
    embedding vector(768), -- For semantic search
    
    -- Timestamps & Status
    posted_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (source, external_job_id),
    INDEX idx_job_title (job_title),
    INDEX idx_company (company_name),
    INDEX idx_location (location),
    INDEX idx_experience_level (experience_level),
    INDEX idx_posted_date (posted_date)
);
```

#### **8. Job Applications Table**
```sql
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id),
    
    -- Application Status
    status VARCHAR(50), -- 'applied', 'reviewing', 'interview', 'offer', 'rejected'
    
    -- Timeline
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_response_date TIMESTAMP WITH TIME ZONE,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Tracking
    match_score FLOAT, -- Calculated by system
    custom_cover_letter TEXT,
    notes TEXT,
    is_bookmarked BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (user_id, job_id, resume_id),
    INDEX idx_user_id (user_id),
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_applied_date (applied_date)
);
```

#### **9. Saved Jobs Table**
```sql
CREATE TABLE saved_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    UNIQUE (user_id, job_id),
    INDEX idx_user_id (user_id),
    INDEX idx_saved_at (saved_at)
);
```

#### **10. Resume Analysis Results Table**
```sql
CREATE TABLE resume_analyses (
    id SERIAL PRIMARY KEY,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Analysis Results
    ats_score FLOAT,
    ats_score_breakdown JSONB, -- {formatting: 85, keywords: 75, structure: 90}
    
    -- Keywords
    matched_keywords TEXT[],
    missing_keywords TEXT[],
    keyword_frequency JSONB, -- {keyword: count}
    
    -- Suggestions
    suggestions JSONB, -- [{type: 'add_skill', suggestion: 'Python', priority: 'high'}]
    
    -- Confidence
    confidence_score FLOAT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resume_id (resume_id),
    INDEX idx_job_id (job_id)
);
```

#### **11. Audit Log Table** (for tracking changes)
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255), -- 'resume_created', 'resume_optimized', 'job_applied'
    entity_type VARCHAR(100), -- 'resume', 'job', 'application'
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

---

## 🔌 API Architecture

### Base URL
```
Production: https://www.pickcv.com/api
Development: http://localhost:8000/api
```

### Authentication
All endpoints (except `/auth/register` and `/auth/login`) require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📚 Data Models & API Schemas

### **Authentication Endpoints**

#### `POST /auth/register`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### `POST /auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### `GET /auth/me`
**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "(555) 123-4567",
  "location": "San Francisco, CA",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "target_role": "Senior Product Manager",
  "experience_level": "Senior",
  "work_mode": "Remote",
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

### **Resume Endpoints**

#### `POST /resume/upload`
Upload existing resume for parsing
**Request:** Form Data
```
file: <binary PDF/DOCX>
```

**Response (201):**
```json
{
  "resume_id": 5,
  "title": "Product Manager Resume",
  "extracted_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "summary": "Product Manager with 8+ years...",
    "experience": [
      {
        "title": "Senior Product Manager",
        "company": "TechCorp",
        "period": "2020-Present",
        "bullets": ["Led team of 12...", "Increased engagement by 40%..."]
      }
    ],
    "education": [
      {
        "degree": "MBA",
        "school": "Stanford",
        "year": "2017"
      }
    ],
    "skills": ["Product Management", "Leadership", "Data Analysis"]
  }
}
```

#### `POST /resume/create`
Create resume from scratch
**Request:**
```json
{
  "title": "Manager Resume - Tech Role",
  "template": "modern",
  "contact_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe"
  },
  "professional_summary": "Experienced Product Manager...",
  "experience": [
    {
      "title": "Senior Product Manager",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "period": "2020-Present",
      "bullets": ["Led cross-functional team...", "Delivered $2M ARR..."]
    }
  ],
  "education": [
    {
      "degree": "MBA",
      "school": "Stanford Graduate School of Business",
      "year": "2017"
    }
  ],
  "skills": ["Product Management", "Agile", "Data Analysis"]
}
```

**Response (201):**
```json
{
  "resume_id": 6,
  "title": "Manager Resume - Tech Role",
  "template": "modern",
  "created_at": "2026-03-05T14:22:00Z",
  "status": "draft"
}
```

#### `GET /resume/list`
Get all user resumes
**Response (200):**
```json
{
  "resumes": [
    {
      "id": 5,
      "title": "Product Manager Resume",
      "template": "classic",
      "ats_score": 78.5,
      "created_at": "2026-02-20T10:15:00Z",
      "updated_at": "2026-03-01T15:45:00Z"
    },
    {
      "id": 6,
      "title": "Manager Resume - Tech Role",
      "template": "modern",
      "ats_score": 82.3,
      "created_at": "2026-03-05T14:22:00Z"
    }
  ]
}
```

#### `GET /resume/{resume_id}`
Get specific resume details
**Response (200):**
```json
{
  "id": 5,
  "title": "Product Manager Resume",
  "template": "classic",
  "contact_info": { ... },
  "professional_summary": "...",
  "experience": [ ... ],
  "education": [ ... ],
  "skills": [ ... ],
  "ats_score": 78.5,
  "last_modified": "2026-03-01T15:45:00Z"
}
```

#### `PUT /resume/{resume_id}`
Update resume
**Request:**
```json
{
  "title": "Updated Title",
  "professional_summary": "New summary...",
  "experience": [ ... ],
  "education": [ ... ],
  "skills": [ ... ]
}
```

**Response (200):** Updated resume object

#### `DELETE /resume/{resume_id}`
Delete resume
**Response (204):** No content

---

### **Analysis Endpoints**

#### `POST /analysis/optimize`
Optimize resume for specific job
**Request:**
```json
{
  "resume_id": 5,
  "job_id": 123,
  "optimization_type": "keyword_matching" // or "full_optimization"
}
```

**Response (200):**
```json
{
  "optimization_id": 42,
  "resume_id": 5,
  "job_id": 123,
  "ats_score": 85.7,
  "ats_score_breakdown": {
    "formatting": 90,
    "keywords": 82,
    "structure": 85,
    "content_quality": 83
  },
  "matched_keywords": [
    "Product Management",
    "Agile",
    "Leadership",
    "Data Analysis"
  ],
  "missing_keywords": [
    "SQL",
    "Tableau",
    "OKR Frameworks"
  ],
  "suggestions": [
    {
      "type": "add_skill",
      "suggestion": "Add SQL experience to skills section",
      "priority": "high",
      "impact": "Could increase ATS score by 5%"
    },
    {
      "type": "highlight_achievement",
      "suggestion": "Emphasize data-driven metrics in achievements",
      "priority": "high"
    }
  ],
  "optimized_resume": { /* full resume object with suggestions */ }
}
```

#### `GET /analysis/{resume_id}`
Get resume analysis
**Response (200):** Full analysis object

---

### **Jobs Endpoints**

#### `GET /jobs/search`
Search jobs with filters
**Query Parameters:**
```
keyword=string
location=string
job_type=full-time,part-time,remote
experience_level=entry,mid,senior,lead
salary_min=integer
salary_max=integer
industry=string
date_posted=24h,week,month,any
page=integer
limit=integer (default: 20, max: 100)
sort_by=relevance,newest,salary (default: relevance)
```

**Response (200):**
```json
{
  "total": 156,
  "page": 1,
  "limit": 20,
  "jobs": [
    {
      "id": 123,
      "title": "Senior Product Manager",
      "company": "Stripe",
      "company_logo": "https://...",
      "location": "San Francisco, CA",
      "job_type": "Full-time",
      "experience_level": "Senior",
      "salary": "$160k - $200k USD",
      "match_score": 92.5, // If user logged in
      "posted_date": "2026-03-01T10:00:00Z",
      "remote_policy": "Hybrid"
    }
  ]
}
```

#### `GET /jobs/{job_id}`
Get job details
**Response (200):**
```json
{
  "id": 123,
  "title": "Senior Product Manager",
  "company": "Stripe",
  "description": "Long job description...",
  "requirements": "- 7+ years PM experience\n- Strong leadership skills",
  "benefits": "- Health insurance\n- 401k match\n- Remote flexibility",
  "location": "San Francisco, CA",
  "salary_min": 160000,
  "salary_max": 200000,
  "job_type": "Full-time",
  "experience_level": "Senior",
  "remote_policy": "Hybrid",
  "keywords": ["Product Management", "Leadership", "Data Analysis"],
  "posted_date": "2026-03-01T10:00:00Z",
  "external_url": "https://stripe.com/jobs/123"
}
```

#### `POST /jobs/apply`
Apply for a job
**Request:**
```json
{
  "job_id": 123,
  "resume_id": 5,
  "cover_letter": "Optional cover letter text..."
}
```

**Response (201):**
```json
{
  "application_id": 1,
  "user_id": 1,
  "job_id": 123,
  "resume_id": 5,
  "status": "applied",
  "applied_date": "2026-03-05T15:30:00Z",
  "match_score": 92.5
}
```

#### `GET /jobs/recommendations`
Get AI-powered job recommendations
**Query Parameters:**
```
limit=integer (default: 10)
resume_id=integer (optional, use specific resume; default: best matching)
```

**Response (200):**
```json
{
  "recommendations": [
    {
      "id": 125,
      "title": "Senior Product Manager",
      "company": "Notion",
      "match_score": 95.2,
      "match_reason": "Closely matches your profile and experience",
      "key_matches": ["Product Management", "Leadership", "Remote-first culture"],
      "posted_date": "2026-03-02T10:00:00Z"
    }
  ]
}
```

---

### **Application Tracking Endpoints**

#### `GET /applications`
Get user's job applications
**Query Parameters:**
```
status=applied,reviewing,interview,offer,rejected (optional, filter by status)
page=integer
limit=integer
sort_by=applied_date,status (default: applied_date)
```

**Response (200):**
```json
{
  "total": 24,
  "applications": [
    {
      "application_id": 1,
      "job": {
        "id": 123,
        "title": "Senior Product Manager",
        "company": "Stripe",
        "location": "San Francisco, CA"
      },
      "status": "interview",
      "applied_date": "2026-03-02T10:00:00Z",
      "first_response_date": "2026-03-04T14:22:00Z",
      "last_updated_date": "2026-03-05T09:15:00Z",
      "match_score": 92.5,
      "notes": "Initial phone screen scheduled for March 10"
    }
  ]
}
```

#### `PUT /applications/{application_id}`
Update application status
**Request:**
```json
{
  "status": "interview",
  "notes": "Scheduled for March 10 at 2 PM"
}
```

**Response (200):** Updated application object

#### `GET /applications/stats`
Get application statistics
**Response (200):**
```json
{
  "total_applications": 24,
  "by_status": {
    "applied": 8,
    "reviewing": 5,
    "interview": 3,
    "offer": 1,
    "rejected": 7
  },
  "conversion_rate": 0.125,
  "average_response_time_days": 4.5
}
```

---

### **User Profile Endpoints**

#### `GET /profile`
Get user profile
**Response (200):**
```json
{
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "location": "San Francisco, CA",
  "target_role": "Senior Product Manager",
  "experience_level": "Senior",
  "work_mode": "Remote",
  "preferred_locations": ["San Francisco, CA", "New York, NY", "Remote"],
  "preferred_job_types": ["Full-time", "Remote"],
  "skills": [
    { "name": "Product Management", "years": 8, "proficiency": "expert" },
    { "name": "Leadership", "years": 6, "proficiency": "expert" },
    { "name": "Data Analysis", "years": 7, "proficiency": "advanced" }
  ],
  "resumes": [5, 6],
  "onboarding_completed": true,
  "created_at": "2026-01-15T10:30:00Z"
}
```

#### `PUT /profile`
Update user profile
**Request:**
```json
{
  "name": "John Doe",
  "phone": "(555) 987-6543",
  "location": "New York, NY",
  "target_role": "Head of Product",
  "preferred_locations": ["New York, NY", "Remote"],
  "preferred_job_types": ["Full-time"],
  "skills": [
    { "name": "Product Strategy", "years": 8 }
  ]
}
```

**Response (200):** Updated profile object

---

## 🧠 Business Logic

### **1. ATS Score Calculation**
```python
def calculate_ats_score(resume_text: str, job_description: str) -> dict:
    """
    Calculate ATS score based on multiple factors:
    - Keyword matching (40%)
    - Formatting & structure (30%)
    - Content quality (20%)
    - Recency of skills (10%)
    """
    
    scores = {
        "keyword_matching": calculate_keyword_match(resume_text, job_description),
        "formatting": evaluate_formatting(resume_text),
        "structure": check_section_structure(resume_text),
        "content_quality": assess_content_quality(resume_text),
    }
    
    weights = {
        "keyword_matching": 0.40,
        "formatting": 0.30,
        "structure": 0.20,
        "content_quality": 0.10,
    }
    
    final_score = sum(scores[k] * weights[k] for k in scores)
    return {"ats_score": final_score, "breakdown": scores}
```

### **2. Job Matching Algorithm**
```python
def calculate_match_score(user_profile: User, job: Job) -> float:
    """
    Calculate match score using multiple factors:
    - Skill match (semantic similarity) (35%)
    - Experience level match (25%)
    - Location preference (20%)
    - Job type preference (20%)
    """
    
    # Extract skills from user and job
    user_embedding = get_user_skill_embedding(user_profile)
    job_embedding = get_job_embedding(job)
    
    skill_similarity = calculate_cosine_similarity(user_embedding, job_embedding)
    
    # Other factors
    exp_match = is_experience_level_match(user_profile.experience_level, job.experience_level)
    location_match = is_location_match(user_profile.preferred_locations, job.location)
    job_type_match = is_job_type_match(user_profile.work_mode, job.job_type)
    
    # Calculate weighted score
    match_score = (
        skill_similarity * 0.35 +
        (1.0 if exp_match else 0.5) * 0.25 +
        (1.0 if location_match else 0.5) * 0.20 +
        (1.0 if job_type_match else 0.5) * 0.20
    )
    
    return match_score * 100  # Return as percentage
```

### **3. Resume Optimization Suggestions**
```python
def generate_optimization_suggestions(resume: Resume, job: Job) -> List[dict]:
    """
    Generate AI-powered suggestions for resume optimization:
    1. Identify missing keywords from job description
    2. Suggest achievement highlighting
    3. Recommend section reordering
    4. Flag formatting issues
    """
    
    suggestions = []
    
    # Extract keywords from job
    job_keywords = extract_keywords(job.description)
    resume_keywords = extract_keywords(resume.text)
    
    missing_keywords = set(job_keywords) - set(resume_keywords)
    
    for keyword in missing_keywords:
        suggestions.append({
            "type": "add_keyword",
            "keyword": keyword,
            "priority": "high" if keyword in job.requirements else "medium",
            "suggestion": f"Add '{keyword}' to your resume",
            "impact": "Could increase ATS score by 2-5%"
        })
    
    # Suggest highlighting metrics
    if not has_metrics(resume.experience):
        suggestions.append({
            "type": "highlight_metrics",
            "priority": "high",
            "suggestion": "Add quantifiable metrics to your achievements",
            "impact": "Jobs with metrics get 30% more callbacks"
        })
    
    return suggestions
```

### **4. Resume Parsing from File**
```python
def parse_resume(file_path: str) -> dict:
    """
    Parse resume file and extract structured data:
    - Extract text from PDF/DOCX
    - Use NLP to identify sections
    - Extract contact info, skills, experience, education
    - Return structured JSON
    """
    
    # Extract text
    text = extract_text_from_file(file_path)
    
    # Identify sections using NLP
    sections = identify_sections(text)
    
    # Extract information
    parsed = {
        "contact_info": extract_contact_info(sections.get("contact")),
        "professional_summary": sections.get("summary"),
        "experience": parse_experience(sections.get("experience")),
        "education": parse_education(sections.get("education")),
        "skills": parse_skills(sections.get("skills")),
    }
    
    return parsed
```

---

## 🔐 Authentication & Security

### **JWT Token Structure**
```python
# Payload
{
    "sub": "user_id",
    "email": "user@example.com",
    "exp": 1646000000,  # Expiration (24 hours from creation)
    "iat": 1645913600,  # Issued at
}

# Header
{
    "alg": "HS256",
    "typ": "JWT"
}
```

### **Password Security**
- Hash: bcrypt with salt rounds = 12
- Minimum length: 8 characters
- Required: uppercase, lowercase, number

### **CORS Policy**
```python
ALLOWED_ORIGINS = [
    "https://www.pickcv.com",
    "https://pickcv.com",
    "http://localhost:3000",
]
```

### **Rate Limiting**
```
- Auth endpoints: 5 requests per minute per IP
- Job search: 100 requests per hour per user
- Resume upload: 10 requests per day per user
```

---

## 🔗 Integration Points

### **1. Google Gemini API**
- **Purpose:** Resume optimization, keyword extraction, ATS analysis
- **Endpoints Used:**
  - Text embeddings (768 dimensions)
  - Content analysis
  - Suggestion generation

### **2. Resume Parsing**
- **Libraries:** pdfplumber, python-docx
- **Process:** Extract text → NLP section detection → Structured data

### **3. Job Data Sources**
- **Initial:** Mock data (in `frontend/src/mocks/jobs.ts`)
- **Future Integration:** LinkedIn API, Indeed API, job board aggregators

### **4. File Storage** (Future)
- **Purpose:** Store uploaded resumes
- **Service:** Google Cloud Storage or AWS S3
- **Access:** Generate signed URLs for secure downloads

### **5. Email Notifications** (Future)
- **Service:** SendGrid or AWS SES
- **Events:** New job match, application status change, resume analysis complete

---

## 📊 Database Relationships

```
users (1) ──── (N) resumes
       ├──────── (N) user_skills
       ├──────── (N) work_experiences
       ├──────── (N) education
       ├──────── (N) job_applications
       └──────── (N) saved_jobs

resumes (1) ─── (1) jobs (via optimization_target_job_id)
       ├──────── (N) resume_analyses
       └──────── (N) job_applications

jobs (1) ────── (N) job_applications
    └──────────── (N) saved_jobs

job_applications (M) ─── (N) resumes
```

---

## 🚀 Implementation Priority

### Phase 1 (Complete - Auth)
- ✅ User registration & login
- ✅ JWT authentication
- ✅ User profiles

### Phase 2 (In Progress - Core Features)
- ⬜ Resume upload & parsing
- ⬜ Resume builder
- ⬜ Resume optimization (Gemini integration)
- ⬜ ATS score calculation

### Phase 3 (Next)
- ⬜ Job database population
- ⬜ Job search & filtering
- ⬜ Job recommendations (embeddings)
- ⬜ Application tracking

### Phase 4 (Future)
- ⬜ Email notifications
- ⬜ File storage (Cloud Storage)
- ⬜ Resume export (PDF generation)
- ⬜ Analytics dashboard

---

## 📝 Notes

- All timestamps are in UTC with timezone awareness
- Use PostgreSQL JSON for flexible data structures
- Implement vector embeddings for semantic search
- Cache job recommendations for performance
- Implement soft deletes where appropriate
- Add comprehensive audit logging
- Regular backups of production database

---

**Document Status:** Ready for Backend Development  
**Last Updated:** March 5, 2026
