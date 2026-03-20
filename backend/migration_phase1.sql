-- =========================================================
-- PickCV Phase 1 Migration — idempotent (safe to re-run)
-- Adds all missing columns + tables that the SQLAlchemy
-- models expect but init_db.sql never created.
-- =========================================================

BEGIN;

-- ───────────────────────────────────────────
-- 1. users — add email-verification columns
-- ───────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- ───────────────────────────────────────────
-- 2. colleges — add Phase 1 enhanced fields
-- ───────────────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 500;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_season_start DATE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_season_end DATE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS autonomy_status VARCHAR(50);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS affiliated_university VARCHAR(500);

-- ───────────────────────────────────────────
-- 3. departments (NEW table — needed before college_students FK)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    degree_type VARCHAR(100),
    duration_semesters INTEGER DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, code, degree_type)
);
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id);

-- ───────────────────────────────────────────
-- 4. college_students — add Phase 1 enhanced fields
-- ───────────────────────────────────────────
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS cgpa FLOAT;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS admission_year INTEGER;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_score FLOAT;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_status VARCHAR(30) DEFAULT 'none';
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS interview_readiness_score FLOAT DEFAULT 0;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placement_status VARCHAR(30) DEFAULT 'not_started';
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_company VARCHAR(255);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_role VARCHAR(255);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_salary_lpa FLOAT;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_college_students_department_id ON college_students(department_id);
CREATE INDEX IF NOT EXISTS idx_college_students_placement ON college_students(placement_status);
CREATE INDEX IF NOT EXISTS idx_cs_college_dept ON college_students(college_id, department_id);
CREATE INDEX IF NOT EXISTS idx_cs_college_year ON college_students(college_id, graduation_year);
CREATE INDEX IF NOT EXISTS idx_cs_college_roll ON college_students(college_id, roll_number);

-- ───────────────────────────────────────────
-- 5. shared_profiles — add Phase 1 tracking columns
-- ───────────────────────────────────────────
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255);
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS recruiter_company VARCHAR(255);
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS filter_criteria JSONB;

-- ───────────────────────────────────────────
-- 6. skill_taxonomy (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_lower VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    is_verified BOOLEAN DEFAULT TRUE,
    aliases TEXT[],
    demand_score FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_name_lower ON skill_taxonomy(name_lower);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_category ON skill_taxonomy(category);

-- ───────────────────────────────────────────
-- 7. curriculum_courses (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curriculum_courses (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
    course_name VARCHAR(500) NOT NULL,
    course_code VARCHAR(50),
    credits INTEGER DEFAULT 3,
    course_type VARCHAR(50) DEFAULT 'core',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, course_code)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_dept ON curriculum_courses(department_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_sem ON curriculum_courses(department_id, semester_number);

-- ───────────────────────────────────────────
-- 8. course_skill_mapping (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_skill_mapping (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES curriculum_courses(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    expected_level VARCHAR(50) DEFAULT 'intermediate',
    UNIQUE(course_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_course_skill_course ON course_skill_mapping(course_id);
CREATE INDEX IF NOT EXISTS idx_course_skill_skill ON course_skill_mapping(skill_id);

-- ───────────────────────────────────────────
-- 9. student_skills (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_skills (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES college_students(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'beginner',
    source VARCHAR(50) DEFAULT 'self',
    verified BOOLEAN DEFAULT FALSE,
    last_assessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id, source)
);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);

-- ───────────────────────────────────────────
-- 10. coe_groups (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coe_groups (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    focus_skills INTEGER[],
    faculty_lead_name VARCHAR(255),
    faculty_lead_email VARCHAR(255),
    max_capacity INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, code)
);
CREATE INDEX IF NOT EXISTS idx_coe_groups_college ON coe_groups(college_id);

-- ───────────────────────────────────────────
-- 11. coe_memberships (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coe_memberships (
    id SERIAL PRIMARY KEY,
    coe_id INTEGER NOT NULL REFERENCES coe_groups(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES college_students(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(coe_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_coe_memberships_coe ON coe_memberships(coe_id);
CREATE INDEX IF NOT EXISTS idx_coe_memberships_student ON coe_memberships(student_id);

-- ───────────────────────────────────────────
-- 12. college_alerts (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS college_alerts (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_college_alerts_college ON college_alerts(college_id);
CREATE INDEX IF NOT EXISTS idx_college_alerts_type ON college_alerts(alert_type);

-- ───────────────────────────────────────────
-- 13. college_audit_log (NEW table)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS college_audit_log (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    actor_type VARCHAR(50) NOT NULL,
    actor_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_college_audit_college ON college_audit_log(college_id);
CREATE INDEX IF NOT EXISTS idx_college_audit_created ON college_audit_log(created_at);

-- ───────────────────────────────────────────
-- 14. payments (NEW table — may already exist from add_payments_table.py)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    zoho_session_id VARCHAR(100) UNIQUE,
    zoho_payment_id VARCHAR(100) UNIQUE,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending',
    description VARCHAR(500),
    reference_number VARCHAR(100),
    product_type VARCHAR(50) DEFAULT 'resume_download',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_resume ON payments(resume_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(zoho_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment ON payments(zoho_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- ───────────────────────────────────────────
-- 15. subscriptions (fix FK to payments — may already exist)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
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

COMMIT;

-- Done ✅
SELECT 'Migration completed successfully' AS status;
