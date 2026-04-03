"""Resolve likely official careers URLs with domain lookup + deterministic probing."""
from __future__ import annotations

from dataclasses import dataclass
import re
from urllib.parse import urlparse

import requests


EXCLUDED_RESULT_DOMAINS = {
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
    "naukri.com",
    "foundit.in",
    "monsterindia.com",
    "jobsora.com",
    "simplyhired.co.in",
    "simplyhired.com",
    "wellfound.com",
    "builtin.com",
    "ambitionbox.com",
    "instahyre.com",
    "timesjobs.com",
}

CAREERS_KEYWORDS = ("careers", "career", "jobs", "job", "join-us", "work-with-us")
ATS_HOST_KEYWORDS = ("lever.co", "greenhouse.io", "myworkdayjobs.com", "smartrecruiters.com", "icims.com", "ashbyhq.com")


@dataclass
class CareersSiteCandidate:
    url: str
    title: str
    score: int
    reason: str
    source: str


class CompanyCareersEnrichmentService:
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )
    REQUEST_TIMEOUT = 20

    def _company_tokens(self, company_name: str) -> list[str]:
        tokens = re.findall(r"[a-z0-9]+", (company_name or "").lower())
        stop_words = {"india", "limited", "ltd", "private", "pvt", "inc", "llp", "corp", "company", "co"}
        return [token for token in tokens if len(token) > 2 and token not in stop_words]

    def _is_excluded_domain(self, host: str) -> bool:
        host = (host or "").lower()
        return any(host == domain or host.endswith(f".{domain}") for domain in EXCLUDED_RESULT_DOMAINS)

    def _score_candidate(self, company_name: str, title: str, url: str, *, source: str) -> CareersSiteCandidate | None:
        parsed = urlparse(url)
        host = (parsed.netloc or "").lower()
        path = (parsed.path or "").lower()
        title_l = (title or "").lower()
        if not host or self._is_excluded_domain(host):
            return None
        company_tokens = self._company_tokens(company_name)
        if not company_tokens:
            return None
        score = 0
        reasons: list[str] = []
        token_hits = sum(1 for token in company_tokens if token in host or token in path or token in title_l)
        if token_hits:
            score += token_hits * 3
            reasons.append(f"token_hits={token_hits}")
        if any(keyword in path for keyword in CAREERS_KEYWORDS):
            score += 8
            reasons.append("careers_path")
        if any(keyword in title_l for keyword in CAREERS_KEYWORDS):
            score += 5
            reasons.append("careers_title")
        if any(keyword in host for keyword in ATS_HOST_KEYWORDS):
            score += 7
            reasons.append("ats_host")
        if host.startswith("careers.") or host.startswith("jobs."):
            score += 4
            reasons.append("careers_subdomain")
        if token_hits == 0 and not any(keyword in path for keyword in CAREERS_KEYWORDS):
            return None
        return CareersSiteCandidate(url=url, title=title, score=score, reason=",".join(reasons), source=source)

    def _normalize_company_name_for_url(self, company_name: str) -> str:
        return "-".join(self._company_tokens(company_name)[:4])

    def _normalized_name(self, value: str) -> str:
        return "".join(re.findall(r"[a-z0-9]+", (value or "").lower()))

    def _get_candidate_domains(self, company_name: str) -> list[str]:
        if not company_name.strip():
            return []
        try:
            response = requests.get(
                "https://autocomplete.clearbit.com/v1/companies/suggest",
                params={"query": company_name.strip()},
                headers={"User-Agent": self.USER_AGENT, "Accept": "application/json"},
                timeout=self.REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception:
            return []

        domains: list[tuple[str, int]] = []
        seen: set[str] = set()
        base_tokens = self._company_tokens(company_name)
        company_tokens = set(base_tokens)
        normalized_query = self._normalized_name(company_name)
        primary_token = base_tokens[0] if base_tokens else ""

        for item in payload[:10]:
            domain = str(item.get("domain") or "").strip().lower()
            name = str(item.get("name") or "").strip().lower()
            if not domain or domain in seen:
                continue
            host = domain.replace("www.", "")
            if self._is_excluded_domain(host):
                continue
            if company_tokens:
                host_tokens = set(re.findall(r"[a-z0-9]+", host))
                name_tokens = set(re.findall(r"[a-z0-9]+", name))
                if not (company_tokens & host_tokens or company_tokens & name_tokens):
                    continue
            score = 0
            normalized_name = self._normalized_name(name)
            if normalized_name == normalized_query:
                score += 12
            elif normalized_query and (normalized_query in normalized_name or normalized_name in normalized_query):
                score += 6
            host_token_blob = "".join(re.findall(r"[a-z0-9]+", host))
            if normalized_query and (normalized_query in host_token_blob or host_token_blob in normalized_query):
                score += 8
            if primary_token and primary_token in host:
                score += 3
            seen.add(host)
            domains.append((host, score))

        domains.sort(key=lambda item: item[1], reverse=True)
        return [domain for domain, _ in domains]

    def _probe_urls_for_domain(self, company_name: str, domain: str) -> list[CareersSiteCandidate]:
        slug = self._normalize_company_name_for_url(company_name)
        probe_urls = [
            f"https://{domain}/careers",
            f"https://{domain}/jobs",
            f"https://career.{domain}",
            f"https://careers.{domain}",
            f"https://jobs.{domain}",
            f"https://{domain}/careers/jobs",
        ]
        if slug:
            probe_urls.extend([f"https://boards.greenhouse.io/{slug}", f"https://jobs.lever.co/{slug}"])

        candidates: list[CareersSiteCandidate] = []
        seen: set[str] = set()
        for url in probe_urls:
            if url in seen:
                continue
            seen.add(url)
            try:
                response = requests.get(url, headers={"User-Agent": self.USER_AGENT}, timeout=self.REQUEST_TIMEOUT, allow_redirects=True)
            except Exception:
                continue
            final_url = response.url or url
            if not (200 <= response.status_code < 400):
                continue
            content_type = (response.headers.get("Content-Type") or "").lower()
            if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                continue
            html = response.text or ""
            text_sample = html[:8000].lower()
            title = f"{company_name} careers"
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = " ".join(title_match.group(1).split())
            candidate = self._score_candidate(company_name, title, final_url, source="clearbit_domain_probe")
            if candidate is None:
                continue
            if any(keyword in text_sample for keyword in CAREERS_KEYWORDS):
                candidate.score += 6
                candidate.reason = f"{candidate.reason},html_careers_signal"
            candidates.append(candidate)
        return candidates

    def search_candidates(self, company_name: str, *, limit: int = 5) -> list[CareersSiteCandidate]:
        candidates: list[CareersSiteCandidate] = []
        seen_urls: set[str] = set()
        for domain in self._get_candidate_domains(company_name):
            for candidate in self._probe_urls_for_domain(company_name, domain):
                if candidate.url in seen_urls:
                    continue
                seen_urls.add(candidate.url)
                candidates.append(candidate)
        candidates.sort(key=lambda item: item.score, reverse=True)
        return candidates[:limit]

    def find_best_careers_site(self, company_name: str) -> CareersSiteCandidate | None:
        candidates = self.search_candidates(company_name, limit=5)
        return candidates[0] if candidates else None


company_careers_enrichment_service = CompanyCareersEnrichmentService()
