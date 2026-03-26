"""CLI entrypoint for the standalone jobs ingestor."""
from __future__ import annotations

import argparse
import asyncio
import logging
from pathlib import Path

from sqlalchemy import select, text

from app.config import settings
from app.database import async_session_maker, engine
from app.models import JobSource
from app.services.company_careers_enrichment_service import company_careers_enrichment_service
from app.services.job_discovery_service import job_discovery_service
from app.services.job_ingest_service import job_ingest_service
from app.services.job_source_service import job_source_service
from app.services.job_source_validation_service import job_source_validation_service

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)
SUPPORTED_INGEST_ATS_TYPES = {"greenhouse", "lever"}


def _status_for_discovered_source(ats_type: str) -> str:
    return "active" if (ats_type or "").lower() in SUPPORTED_INGEST_ATS_TYPES else "paused"


def _chunk(items: list[dict], size: int):
    for index in range(0, len(items), size):
        yield items[index:index + size]


async def migrate() -> None:
    migration_path = Path(__file__).resolve().parent / "migrations" / "001_job_ingest_tables.sql"
    sql = migration_path.read_text()
    async with engine.begin() as conn:
        for statement in [part.strip() for part in sql.split(";") if part.strip()]:
            await conn.execute(text(statement))


async def discover_india() -> None:
    candidates = job_discovery_service.get_india_hiring_company_candidates()
    async with async_session_maker() as db:
        for candidate in candidates:
            await job_source_service.upsert_source(
                db,
                source_name=candidate["source_name"],
                company_name=candidate["company_name"],
                base_url=candidate["base_url"],
                ats_type=candidate["ats_type"],
                country=candidate["country"],
                status=_status_for_discovered_source(candidate["ats_type"]),
                is_hiring=True,
                careers_site_status="unknown",
            )
        print(await job_source_service.get_summary(db))


async def discover_internet(limit: int, max_sitemaps: int) -> None:
    candidates = job_discovery_service.get_naukri_company_page_candidates(limit=limit, max_sitemap_files=max_sitemaps)
    rows = []
    for candidate in candidates:
        rows.append({
            "source_name": candidate["source_name"],
            "company_name": candidate["company_name"],
            "base_url": candidate["base_url"],
            "ats_type": candidate["ats_type"],
            "country": candidate["country"],
            "status": _status_for_discovered_source(candidate["ats_type"]),
            "is_hiring": True,
            "careers_site_status": "unknown",
            "crawl_interval_minutes": 360,
        })
    async with async_session_maker() as db:
        processed = 0
        for batch in _chunk(rows, 1000):
            processed += await job_source_service.bulk_upsert_sources(db, batch)
        print({"processed": processed, **(await job_source_service.get_summary(db))})


async def backfill_canonical() -> None:
    async with async_session_maker() as db:
        count = await job_source_service.backfill_canonical_from_internal_duplicates(db)
        print({"backfilled": count, **(await job_source_service.get_summary(db))})


async def enrich_canonical(limit: int, offset: int, only_missing: bool) -> None:
    async with async_session_maker() as db:
        query = select(JobSource).order_by(JobSource.id.asc()).offset(max(0, offset)).limit(max(1, limit))
        if only_missing:
            query = select(JobSource).where(JobSource.canonical_careers_url.is_(None)).order_by(JobSource.id.asc()).offset(max(0, offset)).limit(max(1, limit))
        sources = list((await db.execute(query)).scalars().all())
        matched = 0
        for source in sources:
            candidate = company_careers_enrichment_service.find_best_careers_site(source.company_name)
            if candidate is None:
                continue
            source.canonical_careers_url = candidate.url
            source.canonical_careers_source = (candidate.source or "careers_enrichment")[:50]
            source.canonical_careers_confidence = candidate.score
            matched += 1
        await db.commit()
        print({"checked": len(sources), "matched": matched, **(await job_source_service.get_summary(db))})


async def validate_sources(only_active: bool) -> None:
    async with async_session_maker() as db:
        sources = await job_source_service.list_active_sources(db) if only_active else await job_source_service.list_sources(db)
        for source in sources:
            job_source_validation_service.apply_validation_to_source(source)
        await db.commit()
        print({"validated": len(sources), **(await job_source_service.get_summary(db))})


async def ingest() -> None:
    async with async_session_maker() as db:
        print(await job_ingest_service.run_once(db))


async def daily_run(discover_limit: int, enrich_limit: int) -> None:
    await migrate()
    await backfill_canonical()
    await enrich_canonical(limit=enrich_limit, offset=0, only_missing=True)
    await validate_sources(only_active=False)
    if discover_limit > 0:
        await discover_internet(limit=discover_limit, max_sitemaps=8)
    await ingest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Standalone jobs ingestor")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate")
    subparsers.add_parser("discover-india")
    internet = subparsers.add_parser("discover-internet")
    internet.add_argument("--limit", type=int, default=3000)
    internet.add_argument("--max-sitemaps", type=int, default=8)
    subparsers.add_parser("backfill-canonical")
    enrich = subparsers.add_parser("enrich-canonical")
    enrich.add_argument("--limit", type=int, default=500)
    enrich.add_argument("--offset", type=int, default=0)
    enrich.add_argument("--only-missing", action="store_true")
    validate = subparsers.add_parser("validate-sources")
    validate.add_argument("--only-active", action="store_true")
    subparsers.add_parser("ingest")
    daily = subparsers.add_parser("daily-run")
    daily.add_argument("--discover-limit", type=int, default=3000)
    daily.add_argument("--enrich-limit", type=int, default=1000)

    args = parser.parse_args()
    if args.command == "migrate":
        asyncio.run(migrate())
    elif args.command == "discover-india":
        asyncio.run(discover_india())
    elif args.command == "discover-internet":
        asyncio.run(discover_internet(limit=max(1, args.limit), max_sitemaps=max(1, args.max_sitemaps)))
    elif args.command == "backfill-canonical":
        asyncio.run(backfill_canonical())
    elif args.command == "enrich-canonical":
        asyncio.run(enrich_canonical(limit=max(1, args.limit), offset=max(0, args.offset), only_missing=args.only_missing))
    elif args.command == "validate-sources":
        asyncio.run(validate_sources(only_active=args.only_active))
    elif args.command == "ingest":
        asyncio.run(ingest())
    elif args.command == "daily-run":
        asyncio.run(daily_run(discover_limit=max(0, args.discover_limit), enrich_limit=max(1, args.enrich_limit)))


if __name__ == "__main__":
    main()
