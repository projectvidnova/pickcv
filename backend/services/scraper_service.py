"""Web scraping service for job descriptions."""
import requests
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ScraperService:
    """Service for scraping job descriptions from URLs."""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.timeout = 10
    
    def scrape_job_description(self, url: str) -> Optional[str]:
        """Scrape job description from a URL.
        
        Args:
            url: URL of the job posting
            
        Returns:
            Extracted job description text or None if scraping fails
        """
        try:
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text(separator=' ', strip=True)
            
            # Clean up excessive whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            if len(text) < 100:
                logger.warning(f"Scraped text too short for {url}: {len(text)} chars")
                return None
            
            return text[:5000]  # Limit to 5000 chars
            
        except requests.RequestException as e:
            logger.error(f"Failed to scrape {url}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error processing scraped content from {url}: {str(e)}")
            return None
    
    def extract_job_info_from_text(self, text: str) -> dict:
        """Extract structured job info from job description text.
        
        Args:
            text: Job description text
            
        Returns:
            Dictionary with extracted job information
        """
        # This is a simple extraction - in production, you could use NLP
        info = {
            "description": text,
            "keywords": [],
            "job_type": None,
            "experience_level": None
        }
        
        # Extract some keywords (simple approach)
        keywords_phrases = [
            "python", "javascript", "java", "sql", "react", "angular", "vue",
            "aws", "gcp", "azure", "docker", "kubernetes", "git",
            "agile", "scrum", "project management", "leadership",
            "communication", "problem solving"
        ]
        
        text_lower = text.lower()
        for keyword in keywords_phrases:
            if keyword in text_lower:
                info["keywords"].append(keyword)
        
        # Try to detect job type
        if any(word in text_lower for word in ["entry", "junior", "fresher"]):
            info["experience_level"] = "entry"
        elif any(word in text_lower for word in ["mid", "mid-level", "intermediate"]):
            info["experience_level"] = "mid"
        elif any(word in text_lower for word in ["senior", "lead", "principal", "staff"]):
            info["experience_level"] = "senior"
        
        return info


scraper_service = ScraperService()
