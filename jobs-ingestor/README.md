# Jobs Ingestor

Standalone daily ingestion app for discovering company careers pages, validating them, and ingesting jobs into the shared PickCV database.

## Why separate
- Keeps crawling and retry logic out of the product backend
- Runs on a schedule like a batch worker
- Can scale and fail independently

## What it does
- Seeds and discovers company job sources
- Backfills `canonical_careers_url` from trusted duplicate sources
- Resolves likely official careers URLs using company-domain lookup + deterministic probing
- Validates sources
- Ingests jobs from supported ATS sources (`greenhouse`, `lever`)

## Setup
1. Create a virtualenv
2. Install requirements
3. Copy `.env.example` to `.env`
4. Run migrations

## Commands
- `python -m app.cli migrate`
- `python -m app.cli discover-india`
- `python -m app.cli discover-internet --limit 5000 --max-sitemaps 10`
- `python -m app.cli backfill-canonical`
- `python -m app.cli enrich-canonical --limit 500 --only-missing`
- `python -m app.cli validate-sources --only-active`
- `python -m app.cli ingest`
- `python -m app.cli daily-run --discover-limit 5000 --enrich-limit 1000`

## Scheduling
Run `python -m app.cli daily-run` once per day using Cloud Run Jobs, cron, or GitHub Actions.
