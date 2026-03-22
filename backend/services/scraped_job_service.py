"""Database service for managing scraped jobs."""
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.dialects.postgresql import insert

from models import ScrapedJob
from services.job_scraper_service import job_scraper_service

logger = logging.getLogger(__name__)


class ScrapedJobService:
    """Service for managing scraped jobs in database."""
    
    @staticmethod
    async def save_jobs(db: AsyncSession, jobs: List[Dict]) -> Dict:
        """
        Save scraped jobs to database, handling duplicates.
        
        Args:
            db: Database session
            jobs: List of job dictionaries from scrapers
        
        Returns:
            Dictionary with stats about saved jobs
        """
        stats = {
            "total_processed": len(jobs),
            "new_jobs": 0,
            "updated_jobs": 0,
            "duplicates_skipped": 0,
            "errors": 0
        }
        
        for job_data in jobs:
            try:
                # Generate unique hash
                job_hash = job_scraper_service.generate_job_hash(
                    job_data.get("job_title", ""),
                    job_data.get("company_name", ""),
                    job_data.get("location", "")
                )
                
                # Check if job already exists
                existing_result = await db.execute(
                    select(ScrapedJob).where(ScrapedJob.job_hash == job_hash)
                )
                existing_job = existing_result.scalar_one_or_none()
                
                if existing_job:
                    # Update scrape count and last verified
                    existing_job.scrape_count = existing_job.scrape_count + 1
                    existing_job.last_verified = datetime.utcnow()
                    existing_job.updated_at = datetime.utcnow()
                    stats["updated_jobs"] += 1
                    logger.info(f"Updated job: {job_data.get('job_title')} at {job_data.get('company_name')}")
                else:
                    # Create new job
                    new_job = ScrapedJob(
                        job_title=job_data.get("job_title"),
                        company_name=job_data.get("company_name"),
                        company_logo_url=job_data.get("company_logo_url"),
                        description=job_data.get("description", ""),
                        requirements=job_data.get("requirements"),
                        benefits=job_data.get("benefits"),
                        location=job_data.get("location"),
                        remote_policy=job_data.get("remote_policy"),
                        job_type=job_data.get("job_type"),
                        experience_level=job_data.get("experience_level"),
                        industry=job_data.get("industry"),
                        salary_min=job_data.get("salary_min"),
                        salary_max=job_data.get("salary_max"),
                        currency=job_data.get("currency", "USD"),
                        source=job_data.get("source"),
                        external_job_id=job_data.get("external_job_id"),
                        external_url=job_data.get("external_url"),
                        job_hash=job_hash,
                        posted_date=job_data.get("posted_date"),
                        keywords=job_data.get("keywords"),
                        is_active=True,
                        last_verified=datetime.utcnow()
                    )
                    db.add(new_job)
                    stats["new_jobs"] += 1
                    logger.info(f"New job added: {job_data.get('job_title')} at {job_data.get('company_name')}")
            
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"Error saving job {job_data.get('job_title')}: {e}")
                continue
        
        try:
            await db.commit()
            logger.info(f"Saved jobs - New: {stats['new_jobs']}, Updated: {stats['updated_jobs']}, Duplicates: {stats['duplicates_skipped']}")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error committing scraped jobs: {e}")
            stats["errors"] += len(jobs)
        
        return stats
    
    @staticmethod
    async def deactivate_old_jobs(db: AsyncSession, days: int = 30) -> int:
        """
        Deactivate jobs that haven't been verified in X days.
        
        Args:
            db: Database session
            days: Number of days
        
        Returns:
            Number of jobs deactivated
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(ScrapedJob).where(
                and_(
                    ScrapedJob.is_active == True,
                    ScrapedJob.last_verified < cutoff_date
                )
            )
        )
        jobs_to_deactivate = result.scalars().all()
        
        for job in jobs_to_deactivate:
            job.is_active = False
            job.updated_at = datetime.utcnow()
        
        await db.commit()
        logger.info(f"Deactivated {len(jobs_to_deactivate)} old jobs")
        return len(jobs_to_deactivate)
    
    @staticmethod
    async def get_statistics(db: AsyncSession) -> Dict:
        """
        Get scraper statistics.
        
        Returns:
            Statistics dictionary
        """
        # Total jobs
        total_result = await db.execute(select(func.count(ScrapedJob.id)))
        total = total_result.scalar() or 0
        
        # Active jobs
        active_result = await db.execute(
            select(func.count(ScrapedJob.id)).where(ScrapedJob.is_active == True)
        )
        active = active_result.scalar() or 0
        
        # Jobs by source
        sources_result = await db.execute(
            select(ScrapedJob.source, func.count(ScrapedJob.id))
            .group_by(ScrapedJob.source)
        )
        sources = dict(sources_result.all())
        
        # Last scraped
        last_result = await db.execute(
            select(ScrapedJob.scraped_date)
            .order_by(desc(ScrapedJob.scraped_date))
            .limit(1)
        )
        last_scraped = last_result.scalar_one_or_none()
        
        return {
            "total_jobs": total,
            "active_jobs": active,
            "inactive_jobs": total - active,
            "jobs_by_source": sources,
            "last_scraped": last_scraped
        }


from sqlalchemy import func
scraped_job_service = ScrapedJobService()
