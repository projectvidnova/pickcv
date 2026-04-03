"""Validate source URLs and hiring signal."""
from __future__ import annotations

from datetime import datetime, timezone

import requests

from app.models import JobSource


class JobSourceValidationService:
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )

    def validate(self, source: JobSource) -> dict:
        url = source.canonical_careers_url or source.base_url
        ats = (source.ats_type or "custom").lower()
        headers = {"User-Agent": self.USER_AGENT}
        result = {"is_correct": False, "is_hiring": False, "careers_site_status": "incorrect", "http_status": None, "error": None}
        try:
            if ats == "greenhouse":
                slug = url.rstrip("/").split("/")[-1]
                r = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", timeout=20, headers=headers)
                result["http_status"] = r.status_code
                if r.status_code == 200:
                    jobs = (r.json() or {}).get("jobs", [])
                    result["is_correct"] = True
                    result["is_hiring"] = len(jobs) > 0
                    result["careers_site_status"] = "correct"
                else:
                    result["error"] = f"Greenhouse API status {r.status_code}"
                return result
            if ats == "lever":
                slug = url.rstrip("/").split("/")[-1]
                r = requests.get(f"https://api.lever.co/v0/postings/{slug}?mode=json", timeout=20, headers=headers)
                result["http_status"] = r.status_code
                if r.status_code == 200:
                    payload = r.json() or []
                    result["is_correct"] = True
                    result["is_hiring"] = len(payload) > 0
                    result["careers_site_status"] = "correct"
                else:
                    result["error"] = f"Lever API status {r.status_code}"
                return result
            r = requests.get(url, timeout=20, allow_redirects=True, headers=headers)
            result["http_status"] = r.status_code
            if r.status_code in (200, 301, 302):
                html = (r.text or "").lower()
                hiring_keywords = ["job", "career", "opening", "hiring", "vacancy", "positions"]
                has_signal = any(k in html for k in hiring_keywords)
                result["is_correct"] = has_signal
                result["is_hiring"] = has_signal
                result["careers_site_status"] = "correct" if has_signal else "incorrect"
                if not has_signal:
                    result["error"] = "No clear hiring keywords found"
            else:
                result["error"] = f"HTTP status {r.status_code}"
        except Exception as exc:
            result["error"] = str(exc)
        return result

    def apply_validation_to_source(self, source: JobSource) -> None:
        verdict = self.validate(source)
        source.is_careers_site_correct = verdict["is_correct"]
        source.is_hiring = verdict["is_hiring"]
        source.careers_site_status = verdict["careers_site_status"]
        source.careers_site_http_status = verdict["http_status"]
        source.careers_site_checked_at = datetime.now(timezone.utc)
        source.last_error = verdict["error"]


job_source_validation_service = JobSourceValidationService()
