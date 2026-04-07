CREATE TABLE IF NOT EXISTS job_sources (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  country VARCHAR(10) NOT NULL DEFAULT 'IN',
  base_url VARCHAR(500) NOT NULL,
  ats_type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  is_hiring BOOLEAN NOT NULL DEFAULT TRUE,
  crawl_interval_minutes INTEGER NOT NULL DEFAULT 360,
  careers_site_status VARCHAR(30) NOT NULL DEFAULT 'unknown',
  is_careers_site_correct BOOLEAN,
  careers_site_checked_at TIMESTAMPTZ,
  careers_site_http_status INTEGER,
  canonical_careers_url VARCHAR(500),
  canonical_careers_source VARCHAR(50),
  canonical_careers_confidence INTEGER,
  canonical_careers_checked_at TIMESTAMPTZ,
  last_crawled_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT uq_job_source_name_url UNIQUE (source_name, base_url),
  CONSTRAINT ck_job_source_status CHECK (status IN ('active','paused','blocked')),
  CONSTRAINT ck_job_source_careers_site_status CHECK (careers_site_status IN ('unknown','correct','incorrect'))
);

CREATE INDEX IF NOT EXISTS idx_job_sources_status_last_crawled ON job_sources(status, last_crawled_at);
CREATE INDEX IF NOT EXISTS idx_job_sources_canonical_careers_url ON job_sources(canonical_careers_url);
CREATE INDEX IF NOT EXISTS idx_job_sources_canonical_careers_checked_at ON job_sources(canonical_careers_checked_at DESC);

CREATE TABLE IF NOT EXISTS job_raw_ingest (
  id SERIAL PRIMARY KEY,
  job_source_id INTEGER NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
  external_job_id VARCHAR(255),
  external_url VARCHAR(1000),
  raw_payload JSONB NOT NULL,
  payload_hash VARCHAR(64),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  http_status INTEGER,
  parser_version VARCHAR(50) DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS idx_job_raw_ingest_source_fetched ON job_raw_ingest(job_source_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_raw_ingest_hash ON job_raw_ingest(payload_hash);

CREATE TABLE IF NOT EXISTS job_ingest_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'running',
  sources_attempted INTEGER DEFAULT 0,
  sources_succeeded INTEGER DEFAULT 0,
  raw_records INTEGER DEFAULT 0,
  normalized_records INTEGER DEFAULT 0,
  inserted_jobs INTEGER DEFAULT 0,
  updated_jobs INTEGER DEFAULT 0,
  deactivated_jobs INTEGER DEFAULT 0,
  error_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT ck_job_ingest_run_status CHECK (status IN ('running','success','failed'))
);

CREATE INDEX IF NOT EXISTS idx_job_ingest_runs_started_at ON job_ingest_runs(started_at DESC);
