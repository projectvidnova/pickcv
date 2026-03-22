# Job Scraper Quick Start Guide

## 1. Installation

### Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Apply database migration
psql $DATABASE_URL < backend/migrations/job_scraper.sql
```

### Frontend Setup (Optional)

Add this to your job listings page:

```tsx
import { useEffect, useState } from 'react';

export function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const response = await fetch('/api/scraper/jobs?per_page=50');
    const data = await response.json();
    setJobs(data.jobs);
    setLoading(false);
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div className="jobs-grid">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="job-card">
      <h3>{job.job_title}</h3>
      <p className="company">{job.company_name}</p>
      <p className="location">📍 {job.location} • {job.remote_policy}</p>
      {job.salary_min && (
        <p className="salary">
          💰 ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
        </p>
      )}
      <p className="description">{job.description.substring(0, 100)}...</p>
      <a href={job.external_url} target="_blank" className="btn-apply">
        Apply on {job.source}
      </a>
    </div>
  );
}
```

## 2. Start the Application

```bash
# Backend
cd backend
python -m uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
npm run dev
```

The scheduler **automatically starts** when the backend boots.

## 3. API Usage Examples

### Get First 20 Jobs

```bash
curl "http://localhost:8000/api/scraper/jobs?page=1&per_page=20"
```

### Search for "Python Engineer" in San Francisco

```bash
curl -X POST "http://localhost:8000/api/scraper/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python Engineer",
    "location": "San Francisco",
    "page": 1,
    "per_page": 20
  }'
```

### Get Jobs by Source (Indeed)

```bash
curl "http://localhost:8000/api/scraper/by-source/indeed?page=1&per_page=20"
```

### Check Scraper Status

```bash
curl "http://localhost:8000/api/scraper/status"
```

## 4. Customize Keywords

Edit `backend/services/job_scheduler_service.py`:

```python
async def run_scraper(self):
    keywords = [
        "Software Engineer",
        "Data Scientist",
        "Product Manager",
        # ADD YOUR KEYWORDS HERE
        "Python Developer",
        "Cloud Architect",
    ]
    
    jobs = await job_scraper_service.scrape_all_sources(
        keywords=keywords,
        limit_per_source=25  # Jobs per keyword
    )
```

## 5. Change Schedule Time

Edit `backend/services/job_scheduler_service.py`:

```python
def start(self):
    # Schedule daily scrape at CUSTOM TIME UTC
    self.scheduler.add_job(
        self.run_scraper,
        CronTrigger(hour=14, minute=30),  # 2:30 PM UTC
        id="daily_job_scraper",
        # ...
    )
```

**Common timezones (in UTC):**
- 2 AM UTC = 9 PM EST / 6 PM PST
- 8 AM UTC = 3 AM EST / 12 AM PST

## 6. Disable LinkedIn (For Now)

LinkedIn scraping requires official API approval. Currently disabled.

To remove from keywords, edit the list in `run_scraper()`.

## 7. View Jobs in Database

```sql
-- All jobs
SELECT job_title, company_name, location, salary_min, salary_max 
FROM scraped_jobs 
WHERE is_active = TRUE 
ORDER BY posted_date DESC 
LIMIT 20;

-- Job statistics
SELECT source, COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active
FROM scraped_jobs 
GROUP BY source;

-- Duplicate detection
SELECT job_hash, COUNT(*) as count, job_title, company_name
FROM scraped_jobs 
GROUP BY job_hash, job_title, company_name
HAVING COUNT(*) > 1;
```

## 8. Add to Frontend Navigation

```tsx
// src/router/index.tsx
import JobListings from '../pages/jobs/JobListings';

export const routes = [
  {
    path: "/jobs",
    label: "Find Jobs",
    component: JobListings,
  },
  // ... other routes
];
```

## 9. Troubleshooting

### Jobs not scraping

```bash
# Check backend logs
docker logs <backend-container> | grep "scraper"

# Or test manually
curl "http://localhost:8000/api/scraper/status"
```

### Jobs not appearing on frontend

1. Check API endpoint: `curl http://localhost:8000/api/scraper/jobs`
2. Verify CORS is enabled (it is by default)
3. Check browser console for errors

### Database connection error

```bash
# Verify database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## 10. Next Steps

- [ ] Add Indeed to your public job page
- [ ] Customize search filters
- [ ] Add AI-powered job recommendations
- [ ] Integrate with user profiles for job matching
- [ ] Add email notifications for new jobs
- [ ] Deploy to production

## Files Modified

- `backend/services/job_scraper_service.py` - Indeed/LinkedIn scrapers
- `backend/services/scraped_job_service.py` - Database operations
- `backend/services/job_scheduler_service.py` - Background scheduler
- `backend/routes/scraped_jobs.py` - API endpoints
- `backend/schemas/scraped_jobs.py` - Data schemas
- `backend/models/__init__.py` - ScrapedJob database model
- `backend/main.py` - Scheduler initialization
- `backend/requirements.txt` - Dependencies (apscheduler, lxml)
- `backend/migrations/job_scraper.sql` - Database schema

## Support

For issues or questions, check:
1. Application logs
2. Database connectivity
3. Indeed HTML structure (may change)
4. API documentation: [JOB_SCRAPER.md](./JOB_SCRAPER.md)
