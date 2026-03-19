-- ============================================================
-- PickCV Phase 1: College Dashboard — Full Migration
-- Designed for 5M+ students, multi-university, production-grade
-- ============================================================
-- Run AFTER the base init_db.sql (which creates users, resumes, etc.)
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================

-- ─── 0. Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fast text search / fuzzy matching


-- ─── 1. SKILL TAXONOMY (master list) ────────────────────────
-- Normalized skill catalog. Every skill reference points here.
-- Prevents "Python" vs "python" vs "PYTHON" fragmentation at 5M scale.
CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,               -- Display name: "Python"
    name_lower  VARCHAR(255) NOT NULL UNIQUE,         -- Lookup key: "python"
    category    VARCHAR(100),                         -- "Programming Language", "Framework", "Soft Skill", "Tool", "Domain"
    subcategory VARCHAR(100),                         -- "Backend", "Frontend", "Data Science", "DevOps"
    is_verified BOOLEAN DEFAULT TRUE,                 -- Admin-vetted vs auto-extracted
    aliases     TEXT[],                               -- ["py", "python3", "python 3.x"]
    demand_score FLOAT DEFAULT 0,                     -- 0-100, updated periodically from job data
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_name_lower ON skill_taxonomy(name_lower);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_category ON skill_taxonomy(category);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_name_trgm ON skill_taxonomy USING gin(name_lower gin_trgm_ops);


-- ─── 2. DEPARTMENTS ─────────────────────────────────────────
-- Shared across colleges. "Computer Science", "Mechanical Engineering", etc.
CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    college_id  INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,                -- "Computer Science and Engineering"
    code        VARCHAR(20),                          -- "CSE", "ECE", "ME"
    degree_type VARCHAR(100),                         -- "B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc"
    duration_semesters INTEGER DEFAULT 8,             -- 8 for B.Tech, 4 for M.Tech, etc.
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id, code, degree_type)
);
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id);


-- ─── 3. SEMESTER CURRICULUM ─────────────────────────────────
-- Maps courses to semesters + skills taught.
-- "Semester 3, CSE: Data Structures → teaches Python, Algorithms, Problem Solving"
CREATE TABLE IF NOT EXISTS curriculum_courses (
    id              SERIAL PRIMARY KEY,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
    course_name     VARCHAR(500) NOT NULL,            -- "Data Structures and Algorithms"
    course_code     VARCHAR(50),                      -- "CS301"
    credits         INTEGER DEFAULT 3,
    course_type     VARCHAR(50) DEFAULT 'core',       -- "core", "elective", "lab", "project", "internship"
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, course_code)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_dept ON curriculum_courses(department_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_sem ON curriculum_courses(department_id, semester_number);


-- ─── 4. COURSE → SKILL MAPPING ─────────────────────────────
-- "Data Structures" teaches "Python" (intermediate) + "Algorithms" (intermediate)
CREATE TABLE IF NOT EXISTS course_skill_mapping (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER NOT NULL REFERENCES curriculum_courses(id) ON DELETE CASCADE,
    skill_id        INTEGER NOT NULL REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    expected_level  VARCHAR(50) DEFAULT 'intermediate', -- "beginner", "intermediate", "advanced"
    UNIQUE(course_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_course_skill_course ON course_skill_mapping(course_id);
CREATE INDEX IF NOT EXISTS idx_course_skill_skill ON course_skill_mapping(skill_id);


-- ─── 5. ENHANCE college_students TABLE ──────────────────────
-- Add real-world columns to existing college_students table
-- These columns are needed for proper student profiling

-- Academic details
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100);   -- "B.Tech", "M.Tech", etc.
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS cgpa FLOAT;
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS admission_year INTEGER;

-- Contact & external profiles
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500);

-- Resume & readiness tracking
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_score FLOAT;          -- Latest ATS score (denormalized for fast queries)
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_status VARCHAR(30) DEFAULT 'none'; -- "none", "uploaded", "optimized"
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS interview_readiness_score FLOAT DEFAULT 0; -- 0-100 computed score

-- Placement tracking
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placement_status VARCHAR(30) DEFAULT 'not_started';  -- "not_started", "preparing", "applying", "interviewing", "placed", "opted_out"
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_company VARCHAR(255);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_role VARCHAR(255);
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_salary_lpa FLOAT;     -- Lakhs per annum
ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for fast filtering at scale
CREATE INDEX IF NOT EXISTS idx_cs_department ON college_students(department_id);
CREATE INDEX IF NOT EXISTS idx_cs_semester ON college_students(current_semester);
CREATE INDEX IF NOT EXISTS idx_cs_cgpa ON college_students(cgpa);
CREATE INDEX IF NOT EXISTS idx_cs_resume_score ON college_students(resume_score);
CREATE INDEX IF NOT EXISTS idx_cs_placement_status ON college_students(placement_status);
CREATE INDEX IF NOT EXISTS idx_cs_admission_year ON college_students(admission_year);
CREATE INDEX IF NOT EXISTS idx_cs_college_dept ON college_students(college_id, department_id);
CREATE INDEX IF NOT EXISTS idx_cs_college_year ON college_students(college_id, graduation_year);
CREATE INDEX IF NOT EXISTS idx_cs_roll_number ON college_students(college_id, roll_number);


-- ─── 6. STUDENT SKILLS (per-student proficiency) ────────────
-- Individual skill records for each college student.
-- Source can be: resume (AI-extracted), curriculum (course mapping), self-declared, certification
CREATE TABLE IF NOT EXISTS student_skills (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES college_students(id) ON DELETE CASCADE,
    skill_id        INTEGER NOT NULL REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    proficiency     VARCHAR(50) DEFAULT 'beginner',   -- "beginner", "intermediate", "advanced", "expert"
    source          VARCHAR(50) DEFAULT 'self',       -- "resume", "curriculum", "self", "certification", "project"
    verified        BOOLEAN DEFAULT FALSE,            -- Verified by project/cert
    last_assessed   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, skill_id, source)
);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_proficiency ON student_skills(proficiency);


-- ─── 7. CENTER OF EXCELLENCE (COE) GROUPS ───────────────────
CREATE TABLE IF NOT EXISTS coe_groups (
    id              SERIAL PRIMARY KEY,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,            -- "AI/ML Center of Excellence"
    code            VARCHAR(50),                      -- "AI_ML", "WEB_DEV", "BLOCKCHAIN"
    description     TEXT,
    focus_skills    INTEGER[],                        -- skill_taxonomy IDs this COE focuses on
    faculty_lead_name VARCHAR(255),
    faculty_lead_email VARCHAR(255),
    max_capacity    INTEGER,                          -- Optional cap
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id, code)
);
CREATE INDEX IF NOT EXISTS idx_coe_college ON coe_groups(college_id);


-- ─── 8. COE MEMBERSHIP ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS coe_memberships (
    id              SERIAL PRIMARY KEY,
    coe_id          INTEGER NOT NULL REFERENCES coe_groups(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES college_students(id) ON DELETE CASCADE,
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role            VARCHAR(50) DEFAULT 'member',     -- "member", "lead", "mentor"
    status          VARCHAR(50) DEFAULT 'active',     -- "active", "inactive", "graduated"
    UNIQUE(coe_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_coe_membership_coe ON coe_memberships(coe_id);
CREATE INDEX IF NOT EXISTS idx_coe_membership_student ON coe_memberships(student_id);


-- ─── 9. RECRUITER BATCH SHARES (enhanced) ───────────────────
-- Already have shared_profiles table. Add tracking columns.
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255);
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS recruiter_company VARCHAR(255);
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS filter_criteria JSONB;  -- Store the filter used: {"skills": [...], "min_cgpa": 7.0, "coe": "AI_ML"}


-- ─── 10. COLLEGE ALERTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS college_alerts (
    id              SERIAL PRIMARY KEY,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    alert_type      VARCHAR(50) NOT NULL,             -- "red_flag", "opportunity", "milestone", "deadline"
    severity        VARCHAR(20) DEFAULT 'info',       -- "critical", "warning", "info"
    title           VARCHAR(500) NOT NULL,
    message         TEXT NOT NULL,
    entity_type     VARCHAR(50),                      -- "student", "coe", "batch", "recruiter"
    entity_id       INTEGER,                          -- Reference to related entity
    is_read         BOOLEAN DEFAULT FALSE,
    is_dismissed    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at         TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_alerts_college ON college_alerts(college_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON college_alerts(college_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_alerts_type ON college_alerts(college_id, alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON college_alerts(created_at DESC);


-- ─── 11. COLLEGE AUDIT LOG ──────────────────────────────────
-- Security: track who did what in the college dashboard
CREATE TABLE IF NOT EXISTS college_audit_log (
    id              SERIAL PRIMARY KEY,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    actor_type      VARCHAR(50) NOT NULL,             -- "college_admin", "faculty", "system"
    actor_id        INTEGER,                          -- college_id or faculty user_id
    action          VARCHAR(100) NOT NULL,            -- "student_uploaded", "coe_created", "share_sent", "student_removed"
    entity_type     VARCHAR(50),                      -- "student", "coe", "share", "department"
    entity_id       INTEGER,
    details         JSONB,                            -- Additional context
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_caudit_college ON college_audit_log(college_id);
CREATE INDEX IF NOT EXISTS idx_caudit_created ON college_audit_log(created_at DESC);
-- Partition by college_id for scale (manual partitioning hint — implement when > 1M rows)


-- ─── 12. ENHANCE colleges TABLE ─────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';  -- "free", "basic", "premium", "enterprise"
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 500;              -- Tier-based limit
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);                     -- "2025-26"
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_season_start DATE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_season_end DATE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS autonomy_status VARCHAR(50);                   -- "autonomous", "affiliated", "deemed"
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS affiliated_university VARCHAR(500);


-- ─── 13. SEED: Common Skill Taxonomy ────────────────────────
-- Only insert if table is empty (first-time seed)
INSERT INTO skill_taxonomy (name, name_lower, category, subcategory, aliases)
SELECT * FROM (VALUES
    -- Programming Languages
    ('Python', 'python', 'Programming Language', 'General', ARRAY['py', 'python3']),
    ('JavaScript', 'javascript', 'Programming Language', 'Web', ARRAY['js', 'ecmascript']),
    ('TypeScript', 'typescript', 'Programming Language', 'Web', ARRAY['ts']),
    ('Java', 'java', 'Programming Language', 'Enterprise', ARRAY['java se', 'java ee']),
    ('C', 'c', 'Programming Language', 'Systems', ARRAY['c language']),
    ('C++', 'c++', 'Programming Language', 'Systems', ARRAY['cpp', 'cplusplus']),
    ('C#', 'c#', 'Programming Language', 'Enterprise', ARRAY['csharp', 'c sharp']),
    ('Go', 'go', 'Programming Language', 'Systems', ARRAY['golang']),
    ('Rust', 'rust', 'Programming Language', 'Systems', ARRAY[]::text[]),
    ('Ruby', 'ruby', 'Programming Language', 'Web', ARRAY['rb']),
    ('PHP', 'php', 'Programming Language', 'Web', ARRAY[]::text[]),
    ('Swift', 'swift', 'Programming Language', 'Mobile', ARRAY[]::text[]),
    ('Kotlin', 'kotlin', 'Programming Language', 'Mobile', ARRAY['kt']),
    ('R', 'r', 'Programming Language', 'Data Science', ARRAY['r language']),
    ('SQL', 'sql', 'Programming Language', 'Data', ARRAY['structured query language']),
    ('Dart', 'dart', 'Programming Language', 'Mobile', ARRAY[]::text[]),
    ('Scala', 'scala', 'Programming Language', 'Data', ARRAY[]::text[]),
    ('MATLAB', 'matlab', 'Programming Language', 'Scientific', ARRAY[]::text[]),

    -- Frontend Frameworks
    ('React', 'react', 'Framework', 'Frontend', ARRAY['reactjs', 'react.js']),
    ('Angular', 'angular', 'Framework', 'Frontend', ARRAY['angularjs']),
    ('Vue.js', 'vue.js', 'Framework', 'Frontend', ARRAY['vue', 'vuejs']),
    ('Next.js', 'next.js', 'Framework', 'Frontend', ARRAY['nextjs']),
    ('Svelte', 'svelte', 'Framework', 'Frontend', ARRAY['sveltekit']),
    ('HTML', 'html', 'Technology', 'Frontend', ARRAY['html5']),
    ('CSS', 'css', 'Technology', 'Frontend', ARRAY['css3']),
    ('Tailwind CSS', 'tailwind css', 'Framework', 'Frontend', ARRAY['tailwindcss', 'tailwind']),
    ('Bootstrap', 'bootstrap', 'Framework', 'Frontend', ARRAY[]::text[]),

    -- Backend Frameworks
    ('Node.js', 'node.js', 'Framework', 'Backend', ARRAY['nodejs', 'node']),
    ('Express.js', 'express.js', 'Framework', 'Backend', ARRAY['express', 'expressjs']),
    ('Django', 'django', 'Framework', 'Backend', ARRAY[]::text[]),
    ('Flask', 'flask', 'Framework', 'Backend', ARRAY[]::text[]),
    ('FastAPI', 'fastapi', 'Framework', 'Backend', ARRAY['fast api']),
    ('Spring Boot', 'spring boot', 'Framework', 'Backend', ARRAY['spring', 'springboot']),
    ('Ruby on Rails', 'ruby on rails', 'Framework', 'Backend', ARRAY['rails', 'ror']),
    ('.NET', '.net', 'Framework', 'Backend', ARRAY['dotnet', 'asp.net']),

    -- Databases
    ('PostgreSQL', 'postgresql', 'Database', 'Relational', ARRAY['postgres', 'psql']),
    ('MySQL', 'mysql', 'Database', 'Relational', ARRAY[]::text[]),
    ('MongoDB', 'mongodb', 'Database', 'NoSQL', ARRAY['mongo']),
    ('Redis', 'redis', 'Database', 'Cache', ARRAY[]::text[]),
    ('Firebase', 'firebase', 'Platform', 'Backend', ARRAY['firestore']),
    ('SQLite', 'sqlite', 'Database', 'Relational', ARRAY[]::text[]),
    ('Oracle', 'oracle', 'Database', 'Relational', ARRAY['oracle db']),
    ('Elasticsearch', 'elasticsearch', 'Database', 'Search', ARRAY['elastic']),

    -- Cloud & DevOps
    ('AWS', 'aws', 'Cloud', 'Infrastructure', ARRAY['amazon web services']),
    ('Google Cloud', 'google cloud', 'Cloud', 'Infrastructure', ARRAY['gcp', 'google cloud platform']),
    ('Azure', 'azure', 'Cloud', 'Infrastructure', ARRAY['microsoft azure']),
    ('Docker', 'docker', 'Tool', 'DevOps', ARRAY['containers']),
    ('Kubernetes', 'kubernetes', 'Tool', 'DevOps', ARRAY['k8s']),
    ('CI/CD', 'ci/cd', 'Practice', 'DevOps', ARRAY['continuous integration', 'continuous deployment']),
    ('Terraform', 'terraform', 'Tool', 'DevOps', ARRAY['tf']),
    ('Linux', 'linux', 'Technology', 'Systems', ARRAY['unix']),
    ('Git', 'git', 'Tool', 'DevOps', ARRAY['github', 'gitlab', 'version control']),
    ('Jenkins', 'jenkins', 'Tool', 'DevOps', ARRAY[]::text[]),
    ('Nginx', 'nginx', 'Tool', 'DevOps', ARRAY[]::text[]),

    -- AI/ML/Data
    ('Machine Learning', 'machine learning', 'Domain', 'AI/ML', ARRAY['ml']),
    ('Deep Learning', 'deep learning', 'Domain', 'AI/ML', ARRAY['dl', 'neural networks']),
    ('TensorFlow', 'tensorflow', 'Framework', 'AI/ML', ARRAY['tf']),
    ('PyTorch', 'pytorch', 'Framework', 'AI/ML', ARRAY['torch']),
    ('Pandas', 'pandas', 'Library', 'Data Science', ARRAY[]::text[]),
    ('NumPy', 'numpy', 'Library', 'Data Science', ARRAY[]::text[]),
    ('scikit-learn', 'scikit-learn', 'Library', 'AI/ML', ARRAY['sklearn']),
    ('NLP', 'nlp', 'Domain', 'AI/ML', ARRAY['natural language processing']),
    ('Computer Vision', 'computer vision', 'Domain', 'AI/ML', ARRAY['cv', 'image processing']),
    ('Data Analysis', 'data analysis', 'Domain', 'Data Science', ARRAY['data analytics']),
    ('Power BI', 'power bi', 'Tool', 'Data Science', ARRAY['powerbi']),
    ('Tableau', 'tableau', 'Tool', 'Data Science', ARRAY[]::text[]),

    -- Mobile
    ('React Native', 'react native', 'Framework', 'Mobile', ARRAY['rn']),
    ('Flutter', 'flutter', 'Framework', 'Mobile', ARRAY[]::text[]),
    ('Android', 'android', 'Platform', 'Mobile', ARRAY['android dev']),
    ('iOS', 'ios', 'Platform', 'Mobile', ARRAY['ios dev']),

    -- Blockchain / Emerging
    ('Blockchain', 'blockchain', 'Domain', 'Emerging', ARRAY['distributed ledger']),
    ('Solidity', 'solidity', 'Programming Language', 'Blockchain', ARRAY[]::text[]),
    ('Web3', 'web3', 'Domain', 'Blockchain', ARRAY['web 3.0']),
    ('IoT', 'iot', 'Domain', 'Emerging', ARRAY['internet of things']),
    ('Cybersecurity', 'cybersecurity', 'Domain', 'Security', ARRAY['cyber security', 'infosec']),

    -- Soft Skills (important for placement readiness)
    ('Communication', 'communication', 'Soft Skill', 'General', ARRAY['verbal communication', 'written communication']),
    ('Leadership', 'leadership', 'Soft Skill', 'General', ARRAY['team leadership']),
    ('Problem Solving', 'problem solving', 'Soft Skill', 'General', ARRAY['analytical thinking']),
    ('Teamwork', 'teamwork', 'Soft Skill', 'General', ARRAY['collaboration', 'team player']),
    ('Project Management', 'project management', 'Soft Skill', 'Management', ARRAY['pm']),
    ('Agile', 'agile', 'Practice', 'Management', ARRAY['scrum', 'kanban']),
    ('Time Management', 'time management', 'Soft Skill', 'General', ARRAY[]::text[]),
    ('Critical Thinking', 'critical thinking', 'Soft Skill', 'General', ARRAY[]::text[]),

    -- Core CS
    ('Data Structures', 'data structures', 'Domain', 'CS Fundamentals', ARRAY['dsa']),
    ('Algorithms', 'algorithms', 'Domain', 'CS Fundamentals', ARRAY['algo']),
    ('System Design', 'system design', 'Domain', 'CS Fundamentals', ARRAY['system architecture']),
    ('OOP', 'oop', 'Domain', 'CS Fundamentals', ARRAY['object oriented programming']),
    ('Operating Systems', 'operating systems', 'Domain', 'CS Fundamentals', ARRAY['os']),
    ('Computer Networks', 'computer networks', 'Domain', 'CS Fundamentals', ARRAY['networking', 'cn']),
    ('DBMS', 'dbms', 'Domain', 'CS Fundamentals', ARRAY['database management']),

    -- Testing & QA
    ('Unit Testing', 'unit testing', 'Practice', 'Testing', ARRAY['tdd']),
    ('Selenium', 'selenium', 'Tool', 'Testing', ARRAY[]::text[]),
    ('Jest', 'jest', 'Tool', 'Testing', ARRAY[]::text[]),
    ('Postman', 'postman', 'Tool', 'Testing', ARRAY['api testing']),

    -- Design
    ('Figma', 'figma', 'Tool', 'Design', ARRAY[]::text[]),
    ('UI/UX', 'ui/ux', 'Domain', 'Design', ARRAY['user interface', 'user experience']),
    ('Adobe XD', 'adobe xd', 'Tool', 'Design', ARRAY['xd']),

    -- Non-CSE domains
    ('AutoCAD', 'autocad', 'Tool', 'Engineering', ARRAY['cad']),
    ('ANSYS', 'ansys', 'Tool', 'Engineering', ARRAY['simulation']),
    ('SolidWorks', 'solidworks', 'Tool', 'Engineering', ARRAY['solid works']),
    ('VLSI', 'vlsi', 'Domain', 'Electronics', ARRAY['very large scale integration']),
    ('Embedded Systems', 'embedded systems', 'Domain', 'Electronics', ARRAY['embedded']),
    ('PCB Design', 'pcb design', 'Domain', 'Electronics', ARRAY['pcb']),
    ('Signal Processing', 'signal processing', 'Domain', 'Electronics', ARRAY['dsp']),
    ('PLC Programming', 'plc programming', 'Domain', 'Automation', ARRAY['plc']),
    ('SCADA', 'scada', 'Tool', 'Automation', ARRAY[]::text[]),
    ('Robotics', 'robotics', 'Domain', 'Emerging', ARRAY[]::text[]),

    -- Business / Management
    ('Excel', 'excel', 'Tool', 'Business', ARRAY['microsoft excel', 'ms excel']),
    ('SAP', 'sap', 'Tool', 'Enterprise', ARRAY[]::text[]),
    ('Financial Analysis', 'financial analysis', 'Domain', 'Finance', ARRAY['financial modeling']),
    ('Marketing', 'marketing', 'Domain', 'Business', ARRAY['digital marketing']),
    ('Business Analytics', 'business analytics', 'Domain', 'Business', ARRAY['ba'])
) AS v(name, name_lower, category, subcategory, aliases)
WHERE NOT EXISTS (SELECT 1 FROM skill_taxonomy LIMIT 1);


-- ─── 14. VIEWS for fast analytics ───────────────────────────

-- College-wide skill distribution (materialized for performance at 5M scale)
-- Use: SELECT * FROM college_skill_summary WHERE college_id = 42;
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY college_skill_summary;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'college_skill_summary') THEN
        EXECUTE '
        CREATE MATERIALIZED VIEW college_skill_summary AS
        SELECT
            cs.college_id,
            st.id AS skill_id,
            st.name AS skill_name,
            st.category,
            st.subcategory,
            COUNT(DISTINCT ss.student_id) AS student_count,
            COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.proficiency = ''beginner'') AS beginner_count,
            COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.proficiency = ''intermediate'') AS intermediate_count,
            COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.proficiency = ''advanced'') AS advanced_count,
            COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.proficiency = ''expert'') AS expert_count
        FROM student_skills ss
        JOIN college_students cs ON cs.id = ss.student_id
        JOIN skill_taxonomy st ON st.id = ss.skill_id
        GROUP BY cs.college_id, st.id, st.name, st.category, st.subcategory
        ';
        CREATE UNIQUE INDEX IF NOT EXISTS idx_css_college_skill ON college_skill_summary(college_id, skill_id);
    END IF;
END $$;

-- COE summary view
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'coe_summary') THEN
        EXECUTE '
        CREATE MATERIALIZED VIEW coe_summary AS
        SELECT
            cg.id AS coe_id,
            cg.college_id,
            cg.name AS coe_name,
            cg.code AS coe_code,
            COUNT(cm.id) AS member_count,
            COUNT(cm.id) FILTER (WHERE cm.status = ''active'') AS active_count,
            AVG(cs.resume_score) FILTER (WHERE cs.resume_score IS NOT NULL) AS avg_resume_score,
            AVG(cs.cgpa) FILTER (WHERE cs.cgpa IS NOT NULL) AS avg_cgpa
        FROM coe_groups cg
        LEFT JOIN coe_memberships cm ON cm.coe_id = cg.id
        LEFT JOIN college_students cs ON cs.id = cm.student_id
        GROUP BY cg.id, cg.college_id, cg.name, cg.code
        ';
        CREATE UNIQUE INDEX IF NOT EXISTS idx_coe_summary_id ON coe_summary(coe_id);
    END IF;
END $$;


-- ─── Done ───────────────────────────────────────────────────
-- To apply:
--   psql -h <host> -U postgres -d pickcv -f backend/migrations/phase1_college_dashboard.sql
-- To refresh materialized views (run periodically or after bulk operations):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY college_skill_summary;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY coe_summary;
