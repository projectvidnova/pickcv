"""Migration: Add ScrapedJob table for job scraping feature."""
-- This migration creates the scraped_jobs table for storing jobs scraped from Indeed, LinkedIn, and other sources


CREATE TABLE IF NOT EXISTS scraped_jobs (
    id SERIAL PRIMARY KEY,
    
    -- Job details
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url VARCHAR(500),
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    
    -- Job attributes
    location VARCHAR(255),
    remote_policy VARCHAR(50),
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    industry VARCHAR(255),
    
    -- Compensation
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Source tracking
    source VARCHAR(100) NOT NULL,
    external_job_id VARCHAR(255),
    external_url VARCHAR(500) NOT NULL UNIQUE,
    
    -- Deduplication
    job_hash VARCHAR(64) UNIQUE,
    
    -- Keywords and embeddings
    keywords TEXT[],
    embedding vector(768),
    
    -- Metadata
    posted_date TIMESTAMP WITH TIME ZONE,
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    last_verified TIMESTAMP WITH TIME ZONE,
    scrape_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT scraped_jobs_pk PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_active ON scraped_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_source ON scraped_jobs(source);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_location ON scraped_jobs(location);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_job_title ON scraped_jobs(job_title);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company ON scraped_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_posted_date ON scraped_jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_scraped_date ON scraped_jobs(scraped_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_source_active ON scraped_jobs(source, is_active);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_location_active ON scraped_jobs(location, is_active);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_title_active ON scraped_jobs(job_title, is_active);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_job_hash ON scraped_jobs(job_hash);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_external_id ON scraped_jobs(external_job_id);
