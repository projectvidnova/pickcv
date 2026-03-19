-- PickCV Database Initialization Script - Complete Schema
-- Run this to create all tables with indexes and vector support

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- ============= 1. USERS TABLE =============
CREATE TABLE IF NOT EXISTS users (
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============= 2. USER PROFILES TABLE =============
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    preferred_locations TEXT[],
    preferred_job_types TEXT[],
    career_stage VARCHAR(50),
    industry_focus VARCHAR(255),
    notification_preferences JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============= 3. RESUMES TABLE =============
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    template_name VARCHAR(50),
    original_filename VARCHAR(500),
    raw_text TEXT,
    optimized_text TEXT,
    contact_info JSONB,
    professional_summary TEXT,
    sections JSONB,
    is_optimized BOOLEAN DEFAULT FALSE,
    optimization_target_job_id INTEGER,
    ats_score FLOAT,
    keyword_density FLOAT,
    embedding vector(768),
    file_path VARCHAR(500),
    file_format VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);

-- ============= 4. USER SKILLS TABLE =============
CREATE TABLE IF NOT EXISTS user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50),
    years_of_experience FLOAT,
    endorsement_count INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON user_skills(skill_name);

-- ============= 5. WORK EXPERIENCES TABLE =============
CREATE TABLE IF NOT EXISTS work_experiences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_experiences_user_id ON work_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experiences_resume_id ON work_experiences(resume_id);

-- ============= 6. EDUCATION TABLE =============
CREATE TABLE IF NOT EXISTS education (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    degree_type VARCHAR(100),
    field_of_study VARCHAR(255),
    school_name VARCHAR(255) NOT NULL,
    graduation_date DATE,
    gpa FLOAT,
    activities TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);

-- ============= 7. JOBS TABLE =============
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url VARCHAR(500),
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    industry VARCHAR(255),
    location VARCHAR(255),
    remote_policy VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'USD',
    source VARCHAR(100),
    external_job_id VARCHAR(255),
    external_url VARCHAR(500),
    keywords TEXT[],
    embedding vector(768),
    posted_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, external_job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_job_title ON jobs(job_title);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);

-- ============= 8. JOB APPLICATIONS TABLE =============
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    status VARCHAR(50),
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_response_date TIMESTAMP WITH TIME ZONE,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    match_score FLOAT,
    custom_cover_letter TEXT,
    notes TEXT,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id, resume_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date);

-- ============= 9. SAVED JOBS TABLE =============
CREATE TABLE IF NOT EXISTS saved_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs(saved_at);

-- ============= 10. RESUME ANALYSES TABLE =============
CREATE TABLE IF NOT EXISTS resume_analyses (
    id SERIAL PRIMARY KEY,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    ats_score FLOAT,
    ats_score_breakdown JSONB,
    matched_keywords TEXT[],
    missing_keywords TEXT[],
    keyword_frequency JSONB,
    suggestions JSONB,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_job_id ON resume_analyses(job_id);

-- ============= 11. AUDIT LOGS TABLE =============
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============= 12. ADMINS TABLE =============
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ============= 13. COLLEGES TABLE =============
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    institution_name VARCHAR(500) NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    contact_person_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    phone_number VARCHAR(20),
    city VARCHAR(255),
    state VARCHAR(255),
    institution_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    address TEXT,
    naac_grade VARCHAR(10),
    total_students INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_colleges_email ON colleges(official_email);
CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status);

-- ============= 14. COLLEGE STUDENTS TABLE =============
CREATE TABLE IF NOT EXISTS college_students (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    branch VARCHAR(255),
    graduation_year INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'invited',
    invitation_token VARCHAR(255),
    invited_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, email)
);

CREATE INDEX IF NOT EXISTS idx_college_students_college_id ON college_students(college_id);
CREATE INDEX IF NOT EXISTS idx_college_students_email ON college_students(email);
CREATE INDEX IF NOT EXISTS idx_college_students_user_id ON college_students(user_id);
CREATE INDEX IF NOT EXISTS idx_college_students_status ON college_students(status);

-- ============= 15. SHARED PROFILES TABLE =============
CREATE TABLE IF NOT EXISTS shared_profiles (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    recruiter_email VARCHAR(255) NOT NULL,
    message TEXT,
    student_ids INTEGER[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_profiles_token ON shared_profiles(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_profiles_college_id ON shared_profiles(college_id);

-- ============= SEED DEFAULT ADMIN =============
-- Only insert if no admin exists
INSERT INTO admins (email, password_hash, name, role)
SELECT 'admin@pickcv.com', '$2b$12$W7Bl8Usjaa5aFBnBRbQXve8LsYHfyzAkcGwHwGcU7JLqO1Jzyiuye', 'PickCV Admin', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@pickcv.com');

-- ============= 16. SUBSCRIPTIONS TABLE =============
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,            -- monthly, yearly
    status VARCHAR(50) DEFAULT 'active',       -- active, expired, cancelled
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id);
