"""Advanced job scraper service for LinkedIn and Indeed."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import aiohttp
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import hashlib

logger = logging.getLogger(__name__)


class IndeedScraper:
    """Scrape jobs from Indeed.com"""
    
    BASE_URL = "https://www.indeed.com"
    
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=20)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    async def scrape_jobs(
        self, 
        query: str = "software engineer",
        location: str = "United States",
        limit: int = 50
    ) -> List[Dict]:
        """
        Scrape jobs from Indeed.
        
        Args:
            query: Job title/keywords to search
            location: Location to search
            limit: Maximum number of jobs to scrape
        
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        try:
            search_url = f"{self.BASE_URL}/jobs?q={query}&l={location}"
            
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(search_url, headers=self.headers) as response:
                    if response.status != 200:
                        logger.warning(f"Indeed API returned status {response.status}")
                        return jobs
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    # Find job listings
                    job_cards = soup.find_all("div", {"data-jobsearch": "job-cardSuspended"})
                    
                    for card in job_cards[:limit]:
                        try:
                            job_data = self._parse_indeed_job(card, search_url)
                            if job_data:
                                jobs.append(job_data)
                        except Exception as e:
                            logger.error(f"Error parsing Indeed job card: {e}")
                            continue
        
        except Exception as e:
            logger.error(f"Error scraping Indeed: {e}")
        
        return jobs
    
    def _parse_indeed_job(self, card, base_url: str) -> Optional[Dict]:
        """Parse a single job card from Indeed."""
        try:
            # Extract title
            title_elem = card.find("h2", {"class": "jobTitle"})
            job_title = title_elem.get_text(strip=True) if title_elem else None
            
            # Extract company
            company_elem = card.find("span", {"class": "companyName"})
            company_name = company_elem.get_text(strip=True) if company_elem else None
            
            # Extract location
            location_elem = card.find("div", {"class": "companyLocation"})
            location = location_elem.get_text(strip=True) if location_elem else None
            
            # Extract job URL
            link_elem = card.find("a", {"class": "jcs-JobTitle"})
            job_url = urljoin(self.BASE_URL, link_elem.get("href")) if link_elem else None
            
            # Extract external job ID from URL
            external_job_id = self._extract_indeed_job_id(job_url) if job_url else None
            
            # Extract salary (if available)
            salary_elem = card.find("span", {"class": "salary-snippet"})
            salary_text = salary_elem.get_text(strip=True) if salary_elem else None
            salary_min, salary_max = self._parse_salary(salary_text)
            
            # Extract snippet/description
            snippet_elem = card.find("div", {"class": "job-snippet"})
            description = snippet_elem.get_text(strip=True) if snippet_elem else None
            
            if not (job_title and company_name):
                return None
            
            return {
                "job_title": job_title,
                "company_name": company_name,
                "location": location,
                "description": description,
                "salary_min": salary_min,
                "salary_max": salary_max,
                "external_url": job_url,
                "external_job_id": external_job_id,
                "source": "indeed",
                "posted_date": datetime.utcnow(),
                "remote_policy": "Unknown",
                "job_type": "Full-time"
            }
        
        except Exception as e:
            logger.error(f"Error parsing Indeed job: {e}")
            return None
    
    @staticmethod
    def _extract_indeed_job_id(url: str) -> Optional[str]:
        """Extract job ID from Indeed URL."""
        try:
            match = re.search(r"jk=([a-f0-9]+)", url)
            return match.group(1) if match else url[-20:]
        except:
            return None
    
    @staticmethod
    def _parse_salary(salary_text: Optional[str]) -> tuple:
        """Parse salary range from text."""
        if not salary_text:
            return None, None
        
        try:
            numbers = re.findall(r"\d+(?:,\d+)*", salary_text)
            if len(numbers) >= 2:
                return int(numbers[0].replace(",", "")), int(numbers[1].replace(",", ""))
            elif len(numbers) == 1:
                return int(numbers[0].replace(",", "")), None
        except:
            pass
        
        return None, None


class LinkedInScraper:
    """Scrape jobs from LinkedIn.com"""
    
    BASE_URL = "https://www.linkedin.com"
    
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=20)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    
    async def scrape_jobs(
        self,
        query: str = "software engineer",
        limit: int = 50
    ) -> List[Dict]:
        """
        Scrape jobs from LinkedIn.
        
        Note: Direct scraping is limited due to LinkedIn's anti-bot measures.
        This provides fallback data structure.
        
        Args:
            query: Job title/keywords
            limit: Maximum jobs
        
        Returns:
            List of job dictionaries
        """
        # LinkedIn strongly blocks automated scraping
        # This returns empty in production, recommend using LinkedIn API instead
        logger.info("LinkedIn scraping requires official API. Use Recruiter API for production.")
        return []
    
    @staticmethod
    async def get_jobs_from_api(access_token: str, keywords: str) -> List[Dict]:
        """
        Fetch jobs using LinkedIn API (requires app approval).
        
        Args:
            access_token: LinkedIn OAuth token with r_liteprofile scope
            keywords: Search keywords
        
        Returns:
            List of job dictionaries
        """
        # This would use official LinkedIn API
        # Requires LinkedIn app approval
        logger.info("LinkedIn API integration requires approved app and access token")
        return []


class JobScraperService:
    """Unified job scraper service."""
    
    def __init__(self):
        self.indeed_scraper = IndeedScraper()
        self.linkedin_scraper = LinkedInScraper()
    
    async def scrape_all_sources(
        self,
        keywords: List[str] = None,
        limit_per_source: int = 25
    ) -> List[Dict]:
        """
        Scrape jobs from all configured sources in parallel.
        
        Args:
            keywords: List of job keywords to search
            limit_per_source: Max jobs per source
        
        Returns:
            Combined list of all jobs
        """
        if keywords is None:
            keywords = [
                "Software Engineer",
                "Data Scientist",
                "Product Manager",
                "DevOps Engineer",
                "Full Stack Developer"
            ]
        
        all_jobs = []
        
        # Scrape Indeed for each keyword in parallel
        indeed_tasks = [
            self.indeed_scraper.scrape_jobs(
                query=keyword,
                location="United States",
                limit=limit_per_source
            )
            for keyword in keywords
        ]
        
        try:
            indeed_results = await asyncio.gather(*indeed_tasks, return_exceptions=True)
            for result in indeed_results:
                if isinstance(result, list):
                    all_jobs.extend(result)
                elif isinstance(result, Exception):
                    logger.error(f"Error in Indeed scraping: {result}")
        except Exception as e:
            logger.error(f"Error gathering Indeed jobs: {e}")
        
        # LinkedIn API would be called here
        # linkedin_jobs = await self.linkedin_scraper.get_jobs_from_api(token, keywords)
        # all_jobs.extend(linkedin_jobs)
        
        logger.info(f"Scraped {len(all_jobs)} total jobs from all sources")
        return all_jobs
    
    @staticmethod
    def generate_job_hash(job_title: str, company: str, location: str) -> str:
        """
        Generate unique hash for duplicate detection.
        
        Args:
            job_title: Job title
            company: Company name
            location: Job location
        
        Returns:
            SHA256 hash
        """
        unique_str = f"{job_title.lower()}{company.lower()}{location.lower()}".strip()
        return hashlib.sha256(unique_str.encode()).hexdigest()


# Singleton instance
job_scraper_service = JobScraperService()
