-- Migration: Add LinkedIn OAuth data fields to users table
-- Run this on both local and production databases

-- LinkedIn person ID from OpenID Connect (the 'sub' claim)
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_sub VARCHAR(255);

-- LinkedIn API access token (for fetching posts, sharing, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_access_token TEXT;

-- OAuth provider used for account creation (google, linkedin, email)
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);

-- Full LinkedIn snapshot: profile + posts + activity (JSONB)
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_profile_data JSONB;

-- Timestamp for when LinkedIn data was last synced
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_data_fetched_at TIMESTAMP WITH TIME ZONE;

-- Index for faster LinkedIn sub lookups
CREATE INDEX IF NOT EXISTS idx_users_linkedin_sub ON users(linkedin_sub);
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
