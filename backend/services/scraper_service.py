"""Web scraping service for job descriptions — production-grade."""
import requests
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import urlparse, quote_plus
import logging
import re
import random

logger = logging.getLogger(__name__)


class ScraperService:
    """Service for scraping job descriptions from URLs."""

    # Rotate through realistic browser UA strings
    USER_AGENTS = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    ]

    def __init__(self):
        self.timeout = 15
        self.session = requests.Session()

    def _get_headers(self, referer: Optional[str] = None) -> dict:
        """Generate realistic browser headers."""
        headers = {
            "User-Agent": random.choice(self.USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        }
        if referer:
            headers["Referer"] = referer
        return headers

    # ────────────────────────────────────────────────────────
    #  Public API
    # ────────────────────────────────────────────────────────
    def scrape_job_description(self, url: str) -> Optional[str]:
        """Scrape job description from a URL.
        
        Tries site-specific strategies first, then generic extraction,
        then Google cache as a last resort.
        """
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        domain = urlparse(url).netloc.lower().replace("www.", "")
        logger.info(f"Scraping job from {domain}: {url}")

        # ── Site-specific strategies ──
        extractors = {
            "linkedin.com": self._scrape_linkedin,
            "indeed.com": self._scrape_indeed,
            "in.indeed.com": self._scrape_indeed,
            "glassdoor.com": self._scrape_glassdoor,
            "glassdoor.co.in": self._scrape_glassdoor,
            "naukri.com": self._scrape_naukri,
            "lever.co": self._scrape_lever,
            "greenhouse.io": self._scrape_greenhouse,
            "boards.greenhouse.io": self._scrape_greenhouse,
            "jobs.lever.co": self._scrape_lever,
        }

        for site_domain, extractor in extractors.items():
            if site_domain in domain:
                result = extractor(url)
                if result and len(result) > 150:
                    logger.info(f"Site-specific scrape succeeded for {site_domain}: {len(result)} chars")
                    return result
                logger.warning(f"Site-specific scrape for {site_domain} returned insufficient content")
                break

        # ── Generic extraction ──
        result = self._scrape_generic(url)
        if result and len(result) > 150:
            logger.info(f"Generic scrape succeeded: {len(result)} chars")
            return result

        # ── Google cache fallback ──
        result = self._scrape_google_cache(url)
        if result and len(result) > 150:
            logger.info(f"Google cache scrape succeeded: {len(result)} chars")
            return result

        logger.error(f"All scraping strategies failed for {url}")
        return None

    # ────────────────────────────────────────────────────────
    #  Site-specific extractors
    # ────────────────────────────────────────────────────────
    def _scrape_linkedin(self, url: str) -> Optional[str]:
        """LinkedIn job posts — many are visible without login."""
        try:
            headers = self._get_headers(referer="https://www.google.com/")
            response = self.session.get(url, headers=headers, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div.show-more-less-html__markup",
                "div.description__text",
                "section.show-more-less-html",
                "div[class*='description']",
                "article.jobs-description",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"LinkedIn scrape error: {e}")
            return None

    def _scrape_indeed(self, url: str) -> Optional[str]:
        try:
            headers = self._get_headers(referer="https://www.google.com/")
            response = self.session.get(url, headers=headers, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div#jobDescriptionText",
                "div.jobsearch-jobDescriptionText",
                "div[class*='jobDescription']",
                "div.job-description",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"Indeed scrape error: {e}")
            return None

    def _scrape_glassdoor(self, url: str) -> Optional[str]:
        try:
            headers = self._get_headers(referer="https://www.google.com/")
            response = self.session.get(url, headers=headers, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div.jobDescriptionContent",
                "div[class*='JobDescription']",
                "div[class*='jobDescription']",
                "div.desc",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"Glassdoor scrape error: {e}")
            return None

    def _scrape_naukri(self, url: str) -> Optional[str]:
        try:
            headers = self._get_headers(referer="https://www.google.com/")
            response = self.session.get(url, headers=headers, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div.job-desc",
                "div[class*='job-desc']",
                "div.dang-inner-html",
                "section.job-desc",
                "div[class*='JobDescription']",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"Naukri scrape error: {e}")
            return None

    def _scrape_lever(self, url: str) -> Optional[str]:
        try:
            headers = self._get_headers()
            response = self.session.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div.section-wrapper.page-full-width",
                "div[class*='section-wrapper']",
                "div.content",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"Lever scrape error: {e}")
            return None

    def _scrape_greenhouse(self, url: str) -> Optional[str]:
        try:
            headers = self._get_headers()
            response = self.session.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            selectors = [
                "div#content",
                "div.job-post",
                "div[class*='job']",
                "section.job-description",
            ]
            text = self._extract_by_selectors(soup, selectors)
            return self._clean_text(text) if text else self._extract_body_text(soup)
        except Exception as e:
            logger.error(f"Greenhouse scrape error: {e}")
            return None

    # ────────────────────────────────────────────────────────
    #  Generic & fallback extractors
    # ────────────────────────────────────────────────────────
    def _scrape_generic(self, url: str) -> Optional[str]:
        """Generic scraper — works for most company career pages."""
        try:
            headers = self._get_headers(referer="https://www.google.com/")
            response = self.session.get(url, headers=headers, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            selectors = [
                "div[class*='job-description']",
                "div[class*='jobDescription']",
                "div[class*='job_description']",
                "div[class*='job-detail']",
                "div[class*='jobDetail']",
                "div[class*='posting-description']",
                "div[class*='description-content']",
                "div#job-description",
                "div#jobDescription",
                "div#job-details",
                "article",
                "main",
                "[role='main']",
            ]
            text = self._extract_by_selectors(soup, selectors)
            if text and len(text) > 150:
                return self._clean_text(text)
            return self._extract_body_text(soup)
        except requests.Timeout:
            logger.error(f"Timeout scraping {url}")
            return None
        except requests.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Generic scrape error for {url}: {e}")
            return None

    def _scrape_google_cache(self, url: str) -> Optional[str]:
        """Try Google's web cache as a fallback."""
        try:
            cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{quote_plus(url)}"
            headers = self._get_headers()
            response = self.session.get(cache_url, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                return self._extract_body_text(soup)
        except Exception as e:
            logger.debug(f"Google cache fallback failed: {e}")
        return None

    # ────────────────────────────────────────────────────────
    #  Helpers
    # ────────────────────────────────────────────────────────
    def _extract_by_selectors(self, soup: BeautifulSoup, selectors: list) -> Optional[str]:
        """Try a list of CSS selectors and return the first that yields meaningful text."""
        for selector in selectors:
            try:
                elements = soup.select(selector)
                for el in elements:
                    text = el.get_text(separator="\n", strip=True)
                    if len(text) > 150:
                        return text
            except Exception:
                continue
        return None

    def _extract_body_text(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract text from body after removing boilerplate elements."""
        for tag in soup(["script", "style", "nav", "header", "footer", "aside",
                         "noscript", "iframe", "svg", "form"]):
            tag.decompose()
        for hidden in soup.select("[style*='display:none'], [style*='display: none'], [hidden], .hidden"):
            hidden.decompose()
        text = soup.get_text(separator="\n", strip=True)
        if not text:
            return None
        text = self._clean_text(text)
        return text if len(text) > 100 else None

    def _clean_text(self, text: str) -> str:
        """Clean up scraped text: remove excessive whitespace, limit length."""
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        lines = [line.strip() for line in text.splitlines()]
        text = "\n".join(line for line in lines if line)
        return text[:8000]

    def extract_job_info_from_text(self, text: str) -> dict:
        """Extract structured job info from job description text."""
        info = {
            "description": text,
            "keywords": [],
            "job_type": None,
            "experience_level": None,
        }
        keywords_phrases = [
            "python", "javascript", "typescript", "java", "sql", "react", "angular", "vue",
            "node.js", "aws", "gcp", "azure", "docker", "kubernetes", "git",
            "agile", "scrum", "project management", "leadership", "machine learning",
            "data science", "ai", "deep learning", "nlp", "etl", "ci/cd",
            "communication", "problem solving", "rest api", "graphql", "microservices",
        ]
        text_lower = text.lower()
        for keyword in keywords_phrases:
            if keyword in text_lower:
                info["keywords"].append(keyword)
        if any(word in text_lower for word in ["entry", "junior", "fresher", "0-2 years", "0-1 years"]):
            info["experience_level"] = "entry"
        elif any(word in text_lower for word in ["mid", "mid-level", "intermediate", "3-5 years", "2-5 years"]):
            info["experience_level"] = "mid"
        elif any(word in text_lower for word in ["senior", "lead", "principal", "staff", "5+ years", "8+ years"]):
            info["experience_level"] = "senior"
        return info


scraper_service = ScraperService()
