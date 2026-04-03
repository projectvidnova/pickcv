"""Greenhouse jobs parser."""
from __future__ import annotations

from urllib.parse import urlparse

import requests

from app.services.job_parsers.base_parser import BaseJobParser, ParsedJob


class GreenhouseParser(BaseJobParser):
    def fetch_jobs(self, source_url: str, company_name: str) -> list[ParsedJob]:
        parsed = urlparse(source_url)
        path_parts = [p for p in parsed.path.split('/') if p]
        company_slug = path_parts[-1] if path_parts else parsed.netloc.split('.')[0]
        response = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{company_slug}/jobs", timeout=20)
        response.raise_for_status()
        payload = response.json() or {}
        items = payload.get("jobs", [])
        results: list[ParsedJob] = []
        for item in items:
            title = (item.get("title") or "").strip()
            description = (item.get("content") or "").strip()
            if not title or not description:
                continue
            results.append(ParsedJob(
                source="greenhouse",
                company_name=company_name,
                external_job_id=str(item.get("id")) if item.get("id") is not None else None,
                external_url=item.get("absolute_url") or source_url,
                title=title,
                description=description,
                location=(item.get("location") or {}).get("name"),
                raw_payload=item,
            ))
        return results
