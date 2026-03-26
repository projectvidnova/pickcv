"""Helpers for recording ingestion metrics."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import JobIngestRun


class JobMetricsService:
    async def start_run(self, db: AsyncSession) -> JobIngestRun:
        run = JobIngestRun(status="running")
        db.add(run)
        await db.commit()
        await db.refresh(run)
        return run

    async def finish_run(self, db: AsyncSession, run: JobIngestRun, *, success: bool, updates: dict) -> JobIngestRun:
        for key, value in updates.items():
            setattr(run, key, value)
        run.status = "success" if success else "failed"
        run.ended_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(run)
        return run


job_metrics_service = JobMetricsService()
