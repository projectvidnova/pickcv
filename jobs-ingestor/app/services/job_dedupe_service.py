"""Deduplication fingerprint helpers."""
from __future__ import annotations

import hashlib


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


class JobDedupeService:
    def fingerprint(self, *, company_name: str, job_title: str, location: str | None) -> str:
        raw = f"{_norm(company_name)}|{_norm(job_title)}|{_norm(location)}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


job_dedupe_service = JobDedupeService()
