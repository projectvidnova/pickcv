-- Migration: Add college_admins table for multi-admin support
-- Each college can have multiple placement officers who can manage students

CREATE TABLE IF NOT EXISTS college_admins (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',  -- 'owner' or 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, email)
);

CREATE INDEX IF NOT EXISTS idx_college_admins_college_id ON college_admins(college_id);
CREATE INDEX IF NOT EXISTS idx_college_admins_email ON college_admins(email);
