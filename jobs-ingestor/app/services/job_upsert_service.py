"""Idempotent upsert logic for jobs."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Job


class JobUpsertService:
    async def upsert_job(self, db: AsyncSession, data: dict) -> tuple[str, Job]:
        source = data.get("source")
        external_job_id = data.get("external_job_id")
        external_url = data.get("external_url")
        job = None
        if source and external_job_id:
            job = (await db.execute(select(Job).where(Job.source == source, Job.external_job_id == external_job_id))).scalar_one_or_none()
        if job is None and external_url:
            job = (await db.execute(select(Job).where(Job.external_url == external_url))).scalar_one_or_none()
        if job is None:
            job = Job(**data)
            db.add(job)
            await db.flush()
            return "inserted", job
        for key, value in data.items():
            setattr(job, key, value)
        job.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return "updated", job


job_upsert_service = JobUpsertService()
