"""Lever jobs parser."""
from __future__ import annotations

from urllib.parse import urlparse

import requests

from app.services.job_parsers.base_parser import BaseJobParser, ParsedJob


class LeverParser(BaseJobParser):
    def fetch_jobs(self, source_url: str, company_name: str) -> list[ParsedJob]:
        parsed = urlparse(source_url)
        path_parts = [p for p in parsed.path.split('/') if p]
        company_slug = path_parts[-1] if path_parts else parsed.netloc.split('.')[0]
        response = requests.get(f"https://api.lever.co/v0/postings/{company_slug}?mode=json", timeout=20)
        response.raise_for_status()
        items = response.json() or []
        results: list[ParsedJob] = []
        for item in items:
            title = (item.get("text") or "").strip()
            description = (item.get("descriptionPlain") or item.get("description") or "").strip()
            if not title or not description:
                continue
            categories = item.get("categories") or {}
            results.append(ParsedJob(
                source="lever",
                company_name=company_name,
                external_job_id=item.get("id"),
                external_url=item.get("hostedUrl") or source_url,
                title=title,
                description=description,
                location=categories.get("location"),
                job_type=categories.get("commitment"),
                raw_payload=item,
            ))
        return results
