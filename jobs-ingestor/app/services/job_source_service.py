"""CRUD operations and batch helpers for job sources."""
from __future__ import annotations

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import JobSource


class JobSourceService:
    async def list_sources(self, db: AsyncSession) -> list[JobSource]:
        result = await db.execute(select(JobSource).order_by(JobSource.created_at.desc()))
        return list(result.scalars().all())

    async def list_active_sources(self, db: AsyncSession) -> list[JobSource]:
        result = await db.execute(
            select(JobSource)
            .where(JobSource.status == "active")
            .order_by(JobSource.last_crawled_at.asc().nullsfirst(), JobSource.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_summary(self, db: AsyncSession) -> dict:
        total = (await db.execute(select(func.count(JobSource.id)))).scalar() or 0
        canonical = (await db.execute(select(func.count(JobSource.id)).where(JobSource.canonical_careers_url.is_not(None)))).scalar() or 0
        correct = (await db.execute(select(func.count(JobSource.id)).where(JobSource.careers_site_status == "correct"))).scalar() or 0
        hiring = (await db.execute(select(func.count(JobSource.id)).where(JobSource.is_hiring == True))).scalar() or 0
        return {
            "total_sources": total,
            "with_canonical_careers_url": canonical,
            "correct_careers_sites": correct,
            "companies_currently_hiring": hiring,
        }

    async def upsert_source(
        self,
        db: AsyncSession,
        *,
        source_name: str,
        company_name: str,
        base_url: str,
        ats_type: str,
        country: str = "IN",
        crawl_interval_minutes: int = 360,
        status: str = "active",
        is_hiring: bool = True,
        careers_site_status: str = "unknown",
    ) -> JobSource:
        query = select(JobSource).where(JobSource.source_name == source_name, JobSource.base_url == base_url)
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            existing.company_name = company_name
            existing.ats_type = ats_type
            existing.country = country
            existing.crawl_interval_minutes = crawl_interval_minutes
            existing.status = status
            existing.is_hiring = is_hiring
            existing.careers_site_status = careers_site_status
            await db.commit()
            await db.refresh(existing)
            return existing

        source = JobSource(
            source_name=source_name,
            company_name=company_name,
            base_url=base_url,
            ats_type=ats_type,
            country=country,
            crawl_interval_minutes=crawl_interval_minutes,
            status=status,
            is_hiring=is_hiring,
            careers_site_status=careers_site_status,
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)
        return source

    async def bulk_upsert_sources(self, db: AsyncSession, rows: list[dict]) -> int:
        if not rows:
            return 0
        stmt = insert(JobSource).values(rows)
        excluded = stmt.excluded
        stmt = stmt.on_conflict_do_update(
            index_elements=[JobSource.source_name, JobSource.base_url],
            set_={
                "company_name": excluded.company_name,
                "ats_type": excluded.ats_type,
                "country": excluded.country,
                "crawl_interval_minutes": excluded.crawl_interval_minutes,
                "status": excluded.status,
                "is_hiring": excluded.is_hiring,
                "careers_site_status": excluded.careers_site_status,
                "updated_at": func.now(),
            },
        )
        await db.execute(stmt)
        await db.commit()
        return len(rows)

    async def backfill_canonical_from_internal_duplicates(self, db: AsyncSession) -> int:
        result = await db.execute(text(
            """
            WITH normalized AS (
              SELECT
                id,
                lower(regexp_replace(company_name, '[^a-z0-9]+', '', 'g')) AS norm_name,
                base_url,
                lower(base_url) AS lower_url
              FROM job_sources
            ),
            official_candidates AS (
              SELECT
                norm_name,
                base_url,
                row_number() OVER (
                  PARTITION BY norm_name
                  ORDER BY
                    CASE WHEN lower_url ~ '(careers|career|jobs)' THEN 1 ELSE 0 END DESC,
                    length(base_url) ASC,
                    base_url ASC
                ) AS rn
              FROM normalized
              WHERE
                lower_url NOT LIKE '%naukri.%'
                AND lower_url NOT LIKE '%linkedin.%'
                AND lower_url NOT LIKE '%indeed.%'
                AND lower_url NOT LIKE '%glassdoor.%'
                AND lower_url NOT LIKE '%foundit.%'
                AND lower_url NOT LIKE '%monsterindia.%'
                AND lower_url NOT LIKE '%timesjobs.%'
                AND lower_url NOT LIKE '%wellfound.%'
                AND lower_url NOT LIKE '%ambitionbox.%'
                AND lower_url NOT LIKE '%simplyhired.%'
                AND lower_url NOT LIKE '%jobsora.%'
                AND lower_url NOT LIKE '%instahyre.%'
            ),
            chosen_official AS (
              SELECT norm_name, base_url
              FROM official_candidates
              WHERE rn = 1
            )
            UPDATE job_sources js
            SET canonical_careers_url = co.base_url,
                canonical_careers_source = 'internal_duplicate',
                canonical_careers_confidence = 95,
                canonical_careers_checked_at = NOW()
            FROM normalized n
            JOIN chosen_official co ON co.norm_name = n.norm_name
            WHERE js.id = n.id
              AND js.canonical_careers_url IS NULL
            """
        ))
        await db.commit()
        return int(result.rowcount or 0)


job_source_service = JobSourceService()
