-- Migration: Add plan fields to colleges table
-- Run this on existing databases to add college plan management

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'none';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMPTZ;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMPTZ;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_set_by INTEGER REFERENCES admins(id) ON DELETE SET NULL;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_set_at TIMESTAMPTZ;

-- Index for quick plan expiry checks
CREATE INDEX IF NOT EXISTS idx_colleges_plan_status ON colleges(plan_status) WHERE plan_status = 'active';
CREATE INDEX IF NOT EXISTS idx_colleges_plan_end_date ON colleges(plan_end_date) WHERE plan_end_date IS NOT NULL;
