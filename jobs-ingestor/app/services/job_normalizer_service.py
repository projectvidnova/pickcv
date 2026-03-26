"""Normalize parsed jobs into the serving schema."""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from app.services.job_parsers.base_parser import ParsedJob


class JobNormalizerService:
    _whitespace_re = re.compile(r"\s+")

    def normalize(self, item: ParsedJob) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "job_title": self._clean_text(item.title),
            "company_name": self._clean_text(item.company_name),
            "description": self._clean_text(item.description),
            "location": self._clean_text(item.location or "") or None,
            "job_type": self._clean_text(item.job_type or "") or None,
            "experience_level": self._clean_text(item.experience_level or "") or None,
            "source": item.source,
            "external_job_id": item.external_job_id,
            "external_url": item.external_url,
            "is_active": True,
        }
        if item.posted_date:
            try:
                payload["posted_date"] = datetime.fromisoformat(item.posted_date.replace("Z", "+00:00"))
            except Exception:
                pass
        return payload

    def _clean_text(self, text: str) -> str:
        text = text.replace("\u00a0", " ").strip()
        return self._whitespace_re.sub(" ", text)


job_normalizer_service = JobNormalizerService()
