-- Add graduation_year and current_semester to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_semester INTEGER;
