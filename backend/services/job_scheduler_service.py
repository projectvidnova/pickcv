"""Background task scheduler for job scraping."""
import asyncio
import logging
from datetime import datetime, time
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from services.job_scraper_service import job_scraper_service
from services.scraped_job_service import scraped_job_service

logger = logging.getLogger(__name__)


class JobScraperScheduler:
    """Background job scraper scheduler."""
    
    _instance: Optional['JobScraperScheduler'] = None
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.last_run: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.run_count = 0
    
    @classmethod
    def get_instance(cls) -> 'JobScraperScheduler':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def start(self):
        """Start the scheduler."""
        if not self.is_running:
            # Schedule daily scrape at 2 AM UTC
            self.scheduler.add_job(
                self.run_scraper,
                CronTrigger(hour=2, minute=0),
                id="daily_job_scraper",
                name="Daily Job Scraper",
                misfire_grace_time=3600,  # 1 hour grace period
                replace_existing=True
            )
            
            # Schedule job deactivation daily at 3 AM UTC
            self.scheduler.add_job(
                self.deactivate_old_jobs,
                CronTrigger(hour=3, minute=0),
                id="deactivate_old_jobs",
                name="Deactivate Old Jobs",
                misfire_grace_time=3600,
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("Job scraper scheduler started")
    
    def stop(self):
        """Stop the scheduler."""
        if self.is_running:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("Job scraper scheduler stopped")
    
    async def run_scraper(self):
        """Run the job scraper."""
        async with AsyncSessionLocal() as db:
            try:
                logger.info("Starting job scraping...")
                self.last_run = datetime.utcnow()
                self.run_count += 1
                
                # Scrape all sources
                keywords = [
                    "Software Engineer",
                    "Data Scientist",
                    "Product Manager",
                    "DevOps Engineer",
                    "Full Stack Developer",
                    "Machine Learning Engineer",
                    "Backend Engineer",
                    "Frontend Engineer",
                    "Cloud Architect"
                ]
                
                jobs = await job_scraper_service.scrape_all_sources(
                    keywords=keywords,
                    limit_per_source=25
                )
                
                logger.info(f"Scraped {len(jobs)} jobs from all sources")
                
                # Save to database
                stats = await scraped_job_service.save_jobs(db, jobs)
                
                logger.info(
                    f"Job scraping completed - New: {stats['new_jobs']}, "
                    f"Updated: {stats['updated_jobs']}, "
                    f"Duplicates: {stats['duplicates_skipped']}, "
                    f"Errors: {stats['errors']}"
                )
                
                self.last_error = None
            
            except Exception as e:
                error_msg = f"Error in job scraper: {str(e)}"
                logger.error(error_msg)
                self.last_error = error_msg
    
    async def deactivate_old_jobs(self):
        """Deactivate jobs older than 30 days."""
        async with AsyncSessionLocal() as db:
            try:
                logger.info("Starting job deactivation task...")
                count = await scraped_job_service.deactivate_old_jobs(db, days=30)
                logger.info(f"Deactivated {count} old jobs")
            except Exception as e:
                logger.error(f"Error deactivating old jobs: {e}")
    
    async def manual_scrape(self) -> Dict:
        """
        Manually trigger a scrape (admin/scheduler endpoint).
        
        Returns:
            Scraping statistics
        """
        async with AsyncSessionLocal() as db:
            try:
                jobs = await job_scraper_service.scrape_all_sources()
                stats = await scraped_job_service.save_jobs(db, jobs)
                return {
                    "success": True,
                    "stats": stats,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error in manual scrape: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    def get_status(self) -> Dict:
        """Get scheduler status."""
        return {
            "is_running": self.is_running,
            "last_run": self.last_run,
            "run_count": self.run_count,
            "last_error": self.last_error,
            "next_scheduled_run": self._get_next_run_time()
        }
    
    def _get_next_run_time(self) -> Optional[datetime]:
        """Get next scheduled run time."""
        if not self.is_running or not self.scheduler.running:
            return None
        
        job = self.scheduler.get_job("daily_job_scraper")
        if job and job.next_run_time:
            return job.next_run_time
        
        return None


from typing import Dict

# Get singleton instance
scheduler = JobScraperScheduler.get_instance()
