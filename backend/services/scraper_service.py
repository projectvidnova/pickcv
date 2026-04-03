"""Web scraping service for job descriptions — production-grade."""
import ipaddress
import socket
import requests
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import urlparse, quote_plus
import logging
import re
import random
import base64

logger = logging.getLogger(__name__)


def _is_safe_url(url: str) -> bool:
    """Validate that a URL does not point to an internal/private network (SSRF protection)."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False
        # Block common internal hostnames
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"):
            return False
        # Resolve the hostname and check if any resolved IP is private/reserved
        for info in socket.getaddrinfo(hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                return False
        return True
    except Exception:
        return False


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

        # SSRF protection: block requests to private/internal networks
        if not _is_safe_url(url):
            logger.warning(f"Blocked SSRF attempt to internal URL: {url}")
            return None

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

    def extract_github_profile_url(self, text: str) -> Optional[str]:
        """Extract GitHub profile URL from free-form text.

        Accepts common forms like:
        - https://github.com/username
        - github.com/username
        - https://www.github.com/username/
        """
        if not text:
            return None

        pattern = re.compile(
            r"(?:(?:https?://)?(?:www\.)?github\.com/)([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)(?:/)?(?:\s|$)",
            re.IGNORECASE,
        )
        match = pattern.search(text)
        if not match:
            return None

        username = match.group(1)
        return f"https://github.com/{username}"

    def build_github_resume_context(self, github_url: str) -> Optional[str]:
        """Build resume-safe enrichment context from a public GitHub profile.

        Returns a compact text block containing verified profile and repository
        evidence that can be fed into resume optimization prompts.
        """
        try:
            username = self._extract_github_username(github_url)
            if not username:
                return None

            headers = {
                "Accept": "application/vnd.github+json",
                "User-Agent": random.choice(self.USER_AGENTS),
            }

            profile_resp = self.session.get(
                f"https://api.github.com/users/{username}",
                headers=headers,
                timeout=self.timeout,
            )
            if profile_resp.status_code != 200:
                logger.warning(f"GitHub profile fetch failed for {username}: {profile_resp.status_code}")
                return None
            profile = profile_resp.json()

            repos_resp = self.session.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"sort": "pushed", "per_page": 10, "type": "owner"},
                timeout=self.timeout,
            )
            repos = repos_resp.json() if repos_resp.status_code == 200 else []
            if not isinstance(repos, list):
                repos = []

            non_fork_repos = [r for r in repos if isinstance(r, dict) and not r.get("fork")]
            top_repos = non_fork_repos[:6]

            lines = []
            lines.append("GITHUB PROFILE EVIDENCE (VERIFIED FROM PUBLIC DATA)")
            lines.append(f"Profile URL: https://github.com/{username}")
            lines.append(f"GitHub Name: {profile.get('name') or ''}")
            lines.append(f"Bio: {profile.get('bio') or ''}")
            lines.append(
                "Stats: "
                f"Public Repos={profile.get('public_repos', 0)}, "
                f"Followers={profile.get('followers', 0)}, "
                f"Following={profile.get('following', 0)}"
            )

            if top_repos:
                lines.append("Top Recent Repositories:")
                for repo in top_repos:
                    name = repo.get("name", "")
                    description = repo.get("description") or ""
                    language = repo.get("language") or ""
                    stars = repo.get("stargazers_count", 0)
                    updated = repo.get("pushed_at", "")
                    html_url = repo.get("html_url", "")
                    topics = repo.get("topics") or []
                    topics_str = ", ".join(topics[:6]) if isinstance(topics, list) else ""

                    lines.append(
                        f"- {name} ({html_url}) | lang={language} | stars={stars} | updated={updated}"
                    )
                    if description:
                        lines.append(f"  Description: {description}")
                    if topics_str:
                        lines.append(f"  Topics: {topics_str}")

                    readme_excerpt = self._fetch_repo_readme_excerpt(username, name, headers)
                    if readme_excerpt:
                        lines.append(f"  README excerpt: {readme_excerpt}")

            context = "\n".join(line for line in lines if line is not None)
            return context[:9000]
        except Exception as e:
            logger.error(f"GitHub enrichment failed for {github_url}: {e}")
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

    def _extract_github_username(self, github_url: str) -> Optional[str]:
        """Extract username from GitHub profile URL."""
        if not github_url:
            return None

        candidate = github_url.strip()
        if not candidate.startswith(("http://", "https://")):
            candidate = "https://" + candidate

        parsed = urlparse(candidate)
        if "github.com" not in parsed.netloc.lower():
            return None

        path = (parsed.path or "").strip("/")
        if not path:
            return None

        username = path.split("/")[0]
        if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", username):
            return None
        return username

    def _fetch_repo_readme_excerpt(self, owner: str, repo: str, headers: dict) -> Optional[str]:
        """Fetch a short README excerpt for additional project evidence."""
        try:
            response = self.session.get(
                f"https://api.github.com/repos/{owner}/{repo}/readme",
                headers=headers,
                timeout=self.timeout,
            )
            if response.status_code != 200:
                return None

            payload = response.json()
            content = payload.get("content")
            encoding = payload.get("encoding")
            if not content or encoding != "base64":
                return None

            decoded = base64.b64decode(content).decode("utf-8", errors="ignore")
            cleaned = self._clean_text(decoded)
            return cleaned[:350] if cleaned else None
        except Exception:
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
