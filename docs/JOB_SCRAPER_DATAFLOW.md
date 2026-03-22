# Job Scraper - Data Flow & Integration Guide

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DAILY SCHEDULER (2 AM UTC)                        │
│              APScheduler → job_scheduler_service.py                  │
└───────────────┬─────────────────────────────────────────────────────┘
                │
                ├─ For each keyword:
                │  ├─ "Python Developer"
                │  ├─ "Data Scientist"
                │  ├─ "DevOps Engineer"
                │  └─ ... 150+ keywords
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  JOB SCRAPER SERVICE (Parallel)                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ IndeedScraper.scrape_jobs(query, location, limit)           │   │
│  │ ├─ HTTP GET to Indeed search page                           │   │
│  │ ├─ Parse HTML with BeautifulSoup                            │   │
│  │ ├─ Extract job cards: title, company, location, salary      │   │
│  │ └─ Return List[Dict] with ~25 jobs per keyword              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ LinkedInScraper.scrape_jobs(query) [placeholder]             │   │
│  │ └─ Currently disabled (requires official API)                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Returns: List[Dict] with structure:                                 │
│  {                                                                    │
│    "job_title": "Senior Engineer",                                   │
│    "company_name": "Google",                                         │
│    "location": "Mountain View, CA",                                  │
│    "salary_min": 150000,                                             │
│    "salary_max": 250000,                                             │
│    "description": "...",                                             │
│    "source": "indeed",                                               │
│    "external_url": "https://indeed.com/...",                         │
│    "posted_date": "2025-03-20T10:00:00Z"                             │
│  }                                                                    │
└─────────────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
                        ~3000 jobs aggregated
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SCRAPED JOB SERVICE                               │
│            scraped_job_service.save_jobs(db, jobs)                  │
│                                                                       │
│  For each job:                                                       │
│  1. Generate job_hash = SHA256(title.lower() + company.lower()      │
│                                + location.lower())                  │
│  2. Check if EXISTS in database WHERE job_hash = ???                │
│                                                                       │
│     ┌─ YES (DUPLICATE) ──┐                                          │
│     │  - Increment scrape_count                                     │
│     │  - Update last_verified = NOW()                               │
│     │  - Update updated_at = NOW()                                  │
│     │  Result: [stats.updated_jobs++]                               │
│     │                                                                 │
│     └─ NO (NEW JOB) ────┐                                           │
│        - Create new ScrapedJob record                               │
│        - Set scrape_count = 1                                       │
│        - Set is_active = TRUE                                       │
│        - Set last_verified = NOW()                                  │
│        Result: [stats.new_jobs++]                                   │
│                                                                       │
│  Commit to database                                                  │
│  stats = {                                                           │
│    "total_processed": 3000,                                          │
│    "new_jobs": 450,                                                  │
│    "updated_jobs": 2100,                                             │
│    "duplicates_skipped": 450,                                        │
│    "errors": 0                                                       │
│  }                                                                    │
└─────────────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                               │
│                                                                       │
│  scraped_jobs table:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id  │ job_title  │ company │ job_hash │ source │ is_active │   │
│  │─────┼────────────┼─────────┼──────────┼────────┼───────────│   │
│  │ 1   │ Sr Eng     │ Google  │ a3f2b... │ indeed │    1      │   │
│  │ 2   │ Data Sci   │ Meta    │ c8e1f... │ indeed │    1      │   │
│  │ 3   │ PM         │ Amazon  │ d9f3a... │ indeed │    1      │   │
│  │ ... │ ...        │ ...     │ ...      │ ...    │    ...    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Indexes:                                                            │
│  - idx_scraped_jobs_active (is_active)                              │
│  - idx_scraped_jobs_source (source)                                 │
│  - idx_scraped_jobs_location (location)                             │
│  - idx_scraped_jobs_job_title (job_title)                           │
│  - idx_scraped_jobs_company (company_name)                          │
│  - idx_scraped_jobs_job_hash (UNIQUE)                               │
└─────────────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
                          (3 AM UTC - Deactivation Task)
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│              OLD JOB DEACTIVATION SERVICE                            │
│        scraped_job_service.deactivate_old_jobs(db, days=30)         │
│                                                                       │
│  1. Find jobs with:                                                  │
│     - is_active = TRUE                                              │
│     - last_verified < NOW() - 30 days                               │
│                                                                       │
│  2. For each old job:                                               │
│     - Set is_active = FALSE                                         │
│     - Set updated_at = NOW()                                        │
│                                                                       │
│  Result: "Deactivated 23 old jobs"                                  │
└─────────────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
                        Updated database with
                        inactive jobs marked
```

## API Request/Response Flow

```
┌─────────────────┐
│  Browser/Frontend
│  Client App
└────────┬────────┘
         │
         │ HTTP GET /api/scraper/jobs?page=1&per_page=20
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI Router                          │
│         routes/scraped_jobs.py                       │
│                                                       │
│  @router.get("/jobs")                                │
│  async def list_scraped_jobs(                        │
│    page, per_page, db                               │
│  )                                                    │
└────┬────────────────────────────────────────────────┘
     │
     ├─ Query 1: Count active jobs
     │  SELECT COUNT(*) FROM scraped_jobs WHERE is_active=TRUE
     │  Result: total = 1250
     │
     ├─ Query 2: Fetch paginated results
     │  SELECT * FROM scraped_jobs 
     │  WHERE is_active=TRUE 
     │  ORDER BY posted_date DESC
     │  OFFSET 0 LIMIT 20
     │  Result: 20 job rows
     │
     └─ Format response:
        {
          "jobs": [
            {
              "id": 1,
              "job_title": "Senior Software Engineer",
              "company_name": "Google",
              "location": "Mountain View, CA",
              "remote_policy": "Hybrid",
              "salary_min": 150000,
              "salary_max": 250000,
              "source": "indeed",
              "external_url": "https://indeed.com/...",
              "is_active": true,
              "created_at": "2025-03-21T02:15:00Z"
            },
            ...
          ],
          "total": 1250,
          "page": 1,
          "per_page": 20,
          "total_pages": 63
        }
        │
        ▼
   HTTP 200 OK
        │
        ▼
   Browser receives JSON
        │
        ▼
   Frontend renders JobCard components
```

## Search Flow

```
Frontend Request:
{
  "query": "python developer",
  "location": "San Francisco",
  "job_type": "Full-time",
  "salary_min": 100000,
  "remote_policy": "Remote",
  "page": 1,
  "per_page": 20
}
        │
        ▼
Backend Processing (routes/scraped_jobs.py):
        │
        ├─ Build WHERE clauses:
        │  ├─ LOWER(job_title) LIKE '%python%' OR
        │  ├─ LOWER(company_name) LIKE '%developer%' OR
        │  ├─ LOWER(description) LIKE '%python developer%' OR
        │  ├─ LOWER(requirements) LIKE '%python developer%'
        │  ├─ AND (location LIKE '%San Francisco%' OR remote_policy LIKE 'Remote')
        │  ├─ AND job_type LIKE '%Full-time%'
        │  ├─ AND (salary_min >= 100000 OR salary_max >= 100000)
        │  ├─ AND is_active = TRUE
        │
        ├─ Count matching jobs
        │  SELECT COUNT(*) FROM scraped_jobs WHERE (all conditions)
        │  Result: total = 47
        │
        ├─ Fetch paginated results
        │  SELECT * FROM scraped_jobs 
        │  WHERE (all conditions)
        │  ORDER BY posted_date DESC
        │  OFFSET 0 LIMIT 20
        │  Result: 20 matching jobs
        │
        └─ Return JobSearchResponse
           {
             "jobs": [...20 jobs...],
             "total": 47,
             "page": 1,
             "per_page": 20,
             "total_pages": 3,
             "filters_applied": {
               "query": "python developer",
               "location": "San Francisco",
               "job_type": "Full-time",
               ...
             }
           }
```

## Deduplication Example

```
Scrape Run #1 (March 21, 2 AM):
┌─────────────────────────────────────────┐
│ Found Job:                              │
│ title: "Senior Software Engineer"       │
│ company: "Google"                       │
│ location: "Mountain View, CA"           │
│                                          │
│ → SHA256 hash generated:                │
│   a3f2b89c1e4d7a6b2c8f9e1d3a5b7c9e      │
│                                          │
│ → Query DB: SELECT * WHERE               │
│   job_hash = 'a3f2b89c...'              │
│ → Result: NOT FOUND (new job!)          │
│                                          │
│ → INSERT scraped_jobs:                   │
│   job_title: "Senior Software Engineer" │
│   company_name: "Google"                │
│   job_hash: "a3f2b89c1e..."            │
│   scrape_count: 1                       │
│   is_active: TRUE                       │
└─────────────────────────────────────────┘

Scrape Run #2 (March 22, 2 AM):
┌─────────────────────────────────────────┐
│ Found Job (same one, still open):       │
│ title: "Senior Software Engineer"       │
│ company: "Google"                       │
│ location: "Mountain View, CA"           │
│                                          │
│ → SHA256 hash generated:                │
│   a3f2b89c1e4d7a6b2c8f9e1d3a5b7c9e      │
│   (SAME HASH!)                          │
│                                          │
│ → Query DB: SELECT * WHERE               │
│   job_hash = 'a3f2b89c...'              │
│ → Result: FOUND! (id = 1)               │
│                                          │
│ → UPDATE scraped_jobs (id=1):           │
│   scrape_count: 2                       │
│   last_verified: NOW()                  │
│   updated_at: NOW()                     │
│   (DON'T CREATE DUPLICATE)              │
└─────────────────────────────────────────┘

Scrape Run #50 (April 20, 2 AM):
┌─────────────────────────────────────────┐
│ Same job still appearing...              │
│ scrape_count has incremented to 50      │
│ Shows job is regularly scraped/active   │
│                                          │
│ If job hash NOT FOUND for 30+ days:     │
│ → Set is_active = FALSE                 │
│ → Keep in database (history)            │
│ → Won't appear in job listings          │
└─────────────────────────────────────────┘
```

## Integration with Frontend

### Step 1: Fetch Jobs from API

```tsx
// pages/jobs/JobListings.tsx
import { useEffect, useState } from 'react';
import type { ScrapedJobResponse } from '@/types/api';

export default function JobListings() {
  const [jobs, setJobs] = useState<ScrapedJobResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    job_type: '',
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      const response = await fetch(`/api/scraper/jobs?${query}`);
      const data = await response.json();
      
      setJobs(data.jobs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  return (
    <div className="jobs-container">
      <JobFilters onChange={setFilters} />
      {loading ? <Spinner /> : <JobGrid jobs={jobs} />}
      <Pagination total={total} page={page} onChange={setPage} />
    </div>
  );
}
```

### Step 2: Create Job Card Component

```tsx
// components/JobCard.tsx
import { ScrapedJobResponse } from '@/types/api';
import { ExternalLink, MapPin, DollarSign } from 'lucide-react';

export function JobCard({ job }: { job: ScrapedJobResponse }) {
  return (
    <div className="job-card border rounded-lg p-6 hover:shadow-lg transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {job.job_title}
          </h3>
          <p className="text-gray-600">
            {job.company_name}
            {job.company_logo_url && (
              <img src={job.company_logo_url} alt={job.company_name} 
                   className="w-6 h-6 inline ml-2 rounded" />
            )}
          </p>
        </div>
        <span className="badge badge-{job.source}">
          {job.source}
        </span>
      </div>

      {/* Location & Type */}
      <div className="flex gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPin size={16} />
          {job.location || 'Remote'}
        </div>
        <div className="badge">
          {job.remote_policy}
        </div>
        <div className="badge">
          {job.job_type}
        </div>
      </div>

      {/* Salary */}
      {job.salary_min && (
        <div className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-4">
          <DollarSign size={16} />
          ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString() || 'Contact'}
        </div>
      )}

      {/* Description */}
      <p className="text-gray-700 text-sm line-clamp-3 mb-4">
        {job.description}
      </p>

      {/* CTA */}
      <a href={job.external_url} target="_blank" 
         className="btn btn-primary btn-sm w-full">
        <ExternalLink size={16} />
        Apply on {job.source}
      </a>

      {/* Meta */}
      <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
        Posted {formatDate(job.posted_date)} • 
        Scraped {formatDate(job.scraped_date)}
      </div>
    </div>
  );
}
```

### Step 3: Add Search Interface

```tsx
// components/JobFilters.tsx
export function JobFilters({ onChange }) {
  const handleSearch = async (query, location, jobType) => {
    const response = await fetch('/api/scraper/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        location,
        job_type: jobType,
        page: 1,
        per_page: 20,
      }),
    });
    const data = await response.json();
    onChange(data);
  };

  return (
    <div className="filters-form">
      <input 
        placeholder="Search by title, company..." 
        onChange={(e) => handleSearch(e.target.value, '', '')}
      />
      <input 
        placeholder="Location (or 'Remote')" 
      />
      <select>
        <option>Job Type</option>
        <option>Full-time</option>
        <option>Part-time</option>
        <option>Contract</option>
      </select>
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

## Database Operations

```sql
-- View all active jobs
SELECT job_title, company_name, location, salary_min, salary_max, source
FROM scraped_jobs 
WHERE is_active = TRUE 
ORDER BY posted_date DESC 
LIMIT 50;

-- View jobs by source
SELECT source, COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active
FROM scraped_jobs 
GROUP BY source;

-- Find duplicate jobs (if any)
SELECT job_hash, COUNT(*) as count FROM scraped_jobs 
GROUP BY job_hash 
HAVING COUNT(*) > 1;

-- Jobs added in last 24 hours
SELECT COUNT(*) FROM scraped_jobs 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Jobs scraped most frequently
SELECT job_title, company_name, scrape_count, last_verified
FROM scraped_jobs 
WHERE scrape_count > 5 
ORDER BY scrape_count DESC
LIMIT 20;

-- Deactivate old jobs manually
UPDATE scraped_jobs 
SET is_active = FALSE, updated_at = NOW()
WHERE is_active = TRUE 
AND last_verified < NOW() - INTERVAL '30 days';
```

---

This architecture ensures:
- ✅ **No duplicate jobs** in the system
- ✅ **Fast queries** with proper indexing
- ✅ **Automatic cleanup** of old listings
- ✅ **Easy integration** with frontend
- ✅ **Scalable design** for multiple sources
