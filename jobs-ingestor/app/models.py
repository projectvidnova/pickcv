"""Minimal DB models needed by the standalone ingestor."""
from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    job_type = Column(String(50), index=True)
    experience_level = Column(String(50), index=True)
    location = Column(String(255), index=True)
    source = Column(String(100))
    external_job_id = Column(String(255))
    external_url = Column(String(500))
    posted_date = Column(DateTime(timezone=True), index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class JobSource(Base):
    __tablename__ = "job_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    country = Column(String(10), nullable=False, default="IN", index=True)
    base_url = Column(String(500), nullable=False)
    ats_type = Column(String(50), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active", index=True)
    is_hiring = Column(Boolean, nullable=False, default=True, index=True)
    crawl_interval_minutes = Column(Integer, nullable=False, default=360)
    careers_site_status = Column(String(30), nullable=False, default="unknown", index=True)
    is_careers_site_correct = Column(Boolean, index=True)
    careers_site_checked_at = Column(DateTime(timezone=True), index=True)
    careers_site_http_status = Column(Integer)
    canonical_careers_url = Column(String(500), index=True)
    canonical_careers_source = Column(String(50))
    canonical_careers_confidence = Column(Integer)
    canonical_careers_checked_at = Column(DateTime(timezone=True), index=True)
    last_crawled_at = Column(DateTime(timezone=True), index=True)
    last_success_at = Column(DateTime(timezone=True), index=True)
    last_error = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("source_name", "base_url", name="uq_job_source_name_url"),
        CheckConstraint("status in ('active','paused','blocked')", name="ck_job_source_status"),
        CheckConstraint("careers_site_status in ('unknown','correct','incorrect')", name="ck_job_source_careers_site_status"),
    )

    raw_records = relationship("JobRawIngest", back_populates="source", cascade="all, delete-orphan")


class JobRawIngest(Base):
    __tablename__ = "job_raw_ingest"

    id = Column(Integer, primary_key=True, index=True)
    job_source_id = Column(Integer, ForeignKey("job_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    external_job_id = Column(String(255), index=True)
    external_url = Column(String(1000), index=True)
    raw_payload = Column(JSONB, nullable=False)
    payload_hash = Column(String(64), index=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    http_status = Column(Integer)
    parser_version = Column(String(50), default="v1")

    source = relationship("JobSource", back_populates="raw_records")


class JobIngestRun(Base):
    __tablename__ = "job_ingest_runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    ended_at = Column(DateTime(timezone=True), index=True)
    status = Column(String(30), nullable=False, default="running", index=True)
    sources_attempted = Column(Integer, default=0)
    sources_succeeded = Column(Integer, default=0)
    raw_records = Column(Integer, default=0)
    normalized_records = Column(Integer, default=0)
    inserted_jobs = Column(Integer, default=0)
    updated_jobs = Column(Integer, default=0)
    deactivated_jobs = Column(Integer, default=0)
    error_summary = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("status in ('running','success','failed')", name="ck_job_ingest_run_status"),
    )
