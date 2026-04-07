"""Orchestrates source ingestion into jobs."""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Job, JobRawIngest
from app.services.job_metrics_service import job_metrics_service
from app.services.job_normalizer_service import job_normalizer_service
from app.services.job_parsers.greenhouse_parser import GreenhouseParser
from app.services.job_parsers.lever_parser import LeverParser
from app.services.job_source_service import job_source_service
from app.services.job_upsert_service import job_upsert_service

logger = logging.getLogger(__name__)


class JobIngestService:
    def __init__(self) -> None:
        self.parsers = {"greenhouse": GreenhouseParser(), "lever": LeverParser()}

    async def run_once(self, db: AsyncSession) -> dict:
        run = await job_metrics_service.start_run(db)
        summary = {
            "sources_attempted": 0,
            "sources_succeeded": 0,
            "raw_records": 0,
            "normalized_records": 0,
            "inserted_jobs": 0,
            "updated_jobs": 0,
            "deactivated_jobs": 0,
            "error_summary": {},
        }
        sources = await job_source_service.list_active_sources(db)
        summary["sources_attempted"] = len(sources)
        for source in sources:
            parser = self.parsers.get((source.ats_type or "").lower())
            fetch_url = source.canonical_careers_url or source.base_url
            if parser is None:
                summary["error_summary"][str(source.id)] = f"Unsupported ats_type: {source.ats_type}"
                source.last_error = f"Unsupported ats_type: {source.ats_type}"
                source.last_crawled_at = datetime.now(timezone.utc)
                continue
            try:
                parsed_jobs = parser.fetch_jobs(fetch_url, source.company_name)
                summary["sources_succeeded"] += 1
                source.last_success_at = datetime.now(timezone.utc)
                source.last_error = None
                seen_urls: set[str] = set()
                for parsed in parsed_jobs:
                    seen_urls.add(parsed.external_url)
                    raw_payload = parsed.raw_payload or {}
                    raw_hash = hashlib.sha256(str(raw_payload).encode("utf-8")).hexdigest()
                    db.add(JobRawIngest(
                        job_source_id=source.id,
                        external_job_id=parsed.external_job_id,
                        external_url=parsed.external_url,
                        raw_payload=raw_payload,
                        payload_hash=raw_hash,
                        parser_version="v1",
                        http_status=200,
                    ))
                    summary["raw_records"] += 1
                    normalized = job_normalizer_service.normalize(parsed)
                    action, _ = await job_upsert_service.upsert_job(db, normalized)
                    summary["normalized_records"] += 1
                    if action == "inserted":
                        summary["inserted_jobs"] += 1
                    else:
                        summary["updated_jobs"] += 1
                if seen_urls:
                    stale_result = await db.execute(
                        update(Job)
                        .where(Job.source == (source.ats_type or "").lower(), Job.company_name == source.company_name, Job.is_active == True, Job.external_url.notin_(seen_urls))
                        .values(is_active=False)
                    )
                    summary["deactivated_jobs"] += int(stale_result.rowcount or 0)
            except Exception as exc:
                logger.exception("Ingest failed for source_id=%s", source.id)
                summary["error_summary"][str(source.id)] = str(exc)
                source.last_error = str(exc)
            source.last_crawled_at = datetime.now(timezone.utc)
        await db.commit()
        success = len(summary["error_summary"]) == 0
        await job_metrics_service.finish_run(db, run, success=success, updates=summary)
        return {"run_id": run.id, **summary, "status": "success" if success else "failed"}


job_ingest_service = JobIngestService()
