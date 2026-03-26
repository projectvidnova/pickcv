"""Base contracts for ATS parsers."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class ParsedJob:
    source: str
    company_name: str
    external_job_id: str | None
    external_url: str
    title: str
    description: str
    location: str | None = None
    job_type: str | None = None
    experience_level: str | None = None
    posted_date: str | None = None
    raw_payload: dict[str, Any] | None = None


class BaseJobParser(ABC):
    @abstractmethod
    def fetch_jobs(self, source_url: str, company_name: str) -> list[ParsedJob]:
        raise NotImplementedError
