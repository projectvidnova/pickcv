"""Main FastAPI application entry point - Production Ready."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes import resume, jobs, auth, analysis, college, admin, scraped_jobs
from routes import departments as departments_routes
from routes import coe as coe_routes
from routes import skills as skills_routes
from routes import payments as payments_routes
from routes import e2e as e2e_routes
from routes import recruiter as recruiter_routes
from services.job_scheduler_service import scheduler
from security import get_security_headers, rate_limiter

# Configure logging
logging.basicConfig(level=settings.log_level, format=settings.log_format)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.api_title,
    description="AI-powered resume optimization and job matching platform",
    version=settings.api_version,
    docs_url="/api/docs" if settings.is_development else None,  # Hide docs in production
    redoc_url="/api/redoc" if settings.is_development else None,
)

# ============= SECURITY MIDDLEWARE =============

# 1. Trusted Host Middleware - Only accept requests from allowed hosts
# In non-development Cloud Run environments, use wildcard since Cloud Run handles ingress security
if settings.environment in {"production", "staging"}:
    allowed_hosts = ["*"]
else:
    allowed_hosts = ["*"]  # In development, allow all hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts
)

# 2. GZIP Compression - Reduce response size
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. CORS Middleware - Handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Count"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# ============= SECURITY HEADERS MIDDLEWARE =============
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Add security headers
    for header_name, header_value in get_security_headers().items():
        response.headers[header_name] = header_value
    
    # Remove vulnerable headers
    if "Server" in response.headers:
        del response.headers["Server"]  # Don't expose server info
    if "X-Powered-By" in response.headers:
        del response.headers["X-Powered-By"]
    
    return response


# ============= RATE LIMITING MIDDLEWARE =============
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Enforce per-IP rate limiting."""
    # Skip rate limiting for health checks and CORS preflight requests
    if request.url.path in ("/", "/health", "/api/health") or request.method == "OPTIONS":
        return await call_next(request)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    # Use the first IP if X-Forwarded-For contains a chain
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
        )

    return await call_next(request)


# ============= ERROR HANDLERS =============
def _add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """Ensure CORS headers are present on error responses.
    
    Exception handlers bypass CORSMiddleware, so the browser sees
    a missing Access-Control-Allow-Origin and reports a CORS error
    instead of the real 500.
    """
    origin = request.headers.get("origin", "")
    if origin and origin in settings.origins_list:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.is_production:
        # Don't expose internal details in production
        resp = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        # Show error details in development/staging
        resp = JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )
    return _add_cors_headers(resp, request)


# ============= ROUTERS =============
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(scraped_jobs.router, tags=["Scraped Jobs"])
app.include_router(college.router, prefix="/api/college", tags=["College"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Phase 1: New college dashboard routers
app.include_router(departments_routes.router, prefix="/api", tags=["College - Departments"])
app.include_router(coe_routes.router, prefix="/api", tags=["College - COE Groups"])
app.include_router(skills_routes.public_router, prefix="/api", tags=["Skills - Taxonomy"])
app.include_router(skills_routes.college_router, prefix="/api", tags=["College - Skill Analytics"])

# Payments
app.include_router(payments_routes.router, prefix="/api/payments", tags=["Payments"])

# Recruiter Portal (Phases 1-5)
app.include_router(recruiter_routes.router, prefix="/api/recruiter", tags=["Recruiter"])

# E2E test routes — staging only
if settings.environment == "staging":
    app.include_router(e2e_routes.router, prefix="/api/e2e", tags=["E2E Testing"])
    logger.info("E2E test routes enabled (staging environment)")


# ============= HEALTH CHECKS =============
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "PickCV API - Resume Optimization & Job Matching",
        "version": settings.api_version,
        "status": "active",
        "environment": settings.environment
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.environment}


@app.get("/api/health")
async def api_health_check():
    """API health check endpoint."""
    return {"status": "healthy", "api_version": settings.api_version}


# ============= STARTUP/SHUTDOWN =============
@app.on_event("startup")
async def startup_event():
    """Initialize database and log application startup."""
    logger.info(f"PickCV API starting up in {settings.environment} mode")
    logger.info(f"CORS enabled for: {settings.origins_list}")
    
    # Start job scraper scheduler
    try:
        scheduler.start()
        logger.info("Job scraper scheduler started successfully")
    except Exception as e:
        logger.warning(f"Failed to start job scraper scheduler: {e}")
    
    # Auto-create database tables
    from database import engine, Base
    from models import User, Admin, College, CollegeStudent, CollegeAdmin, SharedProfile, Payment, Coupon, CouponRedemption  # noqa: F401 - Import to register models
    from models import (  # noqa: F401 - Phase 1 models
        SkillTaxonomy, Department, CurriculumCourse, CourseSkillMapping,
        StudentSkill, COEGroup, COEMembership, CollegeAlert, CollegeAuditLog
    )
    from models import (  # noqa: F401 - Recruiter models
        Recruiter, RecruiterJob, CandidateApplication, Interview,
        Interviewer, OfferTemplate, Offer
    )
    from models import ScrapedJob  # noqa: F401 - Scraper models
    from sqlalchemy import text
    
    try:
        # Try pgvector in its own transaction so failure doesn't poison later queries
        try:
            async with engine.begin() as pgv_conn:
                await pgv_conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                logger.info("pgvector extension enabled")
        except Exception as e:
            logger.warning(f"pgvector extension not available: {e}")

        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified successfully")

            # Auto-add missing columns (create_all only creates tables, not columns)
            _migrations = [
                # users table
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_semester INTEGER",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS target_role VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_sub VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_access_token TEXT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_profile_data TEXT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_data_fetched_at TIMESTAMP WITH TIME ZONE",
                # college_students table
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS department_id INTEGER",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS cgpa FLOAT",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS admission_year INTEGER",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_score FLOAT",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_status VARCHAR(30) DEFAULT 'none'",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS interview_readiness_score FLOAT DEFAULT 0",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placement_status VARCHAR(30) DEFAULT 'not_started'",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_company VARCHAR(255)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_role VARCHAR(255)",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_salary_lpa FLOAT",
                "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_at TIMESTAMP WITH TIME ZONE",
                # shared_profiles table
                "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0",
                # colleges table – plan management
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'none'",
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE",
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE",
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'none'",
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_set_by INTEGER REFERENCES admins(id) ON DELETE SET NULL",
                "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS plan_set_at TIMESTAMP WITH TIME ZONE",
            ]
            try:
                for stmt in _migrations:
                    await conn.execute(text(stmt))
                logger.info("Column migrations applied successfully")
            except Exception as e:
                logger.warning(f"Column migration warning: {e}")

            # Seed default admin if not exists
            try:
                from services.auth_service import auth_service as _auth
                result = await conn.execute(text("SELECT 1 FROM admins WHERE email = :email"), {"email": "admin@pickcv.com"})
                if not result.fetchone():
                    admin_hash = _auth.get_password_hash("admin123")
                    await conn.execute(
                        text("INSERT INTO admins (email, password_hash, name, role, is_active) VALUES (:email, :hash, :name, :role, :active)"),
                        {"email": "admin@pickcv.com", "hash": admin_hash, "name": "PickCV Admin", "role": "admin", "active": True}
                    )
                    logger.info("Default admin seeded: admin@pickcv.com")
                else:
                    logger.info("Default admin already exists")
            except Exception as e:
                logger.warning(f"Admin seeding skipped: {e}")

            # Seed default coupons if table is empty
            try:
                result = await conn.execute(text("SELECT COUNT(*) FROM coupons"))
                count = result.scalar()
                if count == 0:
                    await conn.execute(text("""
                        INSERT INTO coupons (code, max_uses, times_used, expires_at, is_active, description) VALUES
                        ('PICKCV100', 100, 0, '2026-12-31 23:59:59+00', TRUE, 'Launch promo – 100 free downloads'),
                        ('EARLYBETA', 50, 0, '2026-06-30 23:59:59+00', TRUE, 'Early beta testers – 50 uses'),
                        ('FRIEND10', 10, 0, '2026-12-31 23:59:59+00', TRUE, 'Friends & family – 10 uses'),
                        ('DEMOFREE', 5, 0, '2026-12-31 23:59:59+00', TRUE, 'Demo coupon – 5 uses')
                    """))
                    logger.info("Default coupons seeded: PICKCV100, EARLYBETA, FRIEND10, DEMOFREE")
                else:
                    logger.info(f"Coupons table already has {count} entries")
            except Exception as e:
                logger.warning(f"Coupon seeding skipped: {e}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Stop scheduler and log application shutdown."""
    logger.info("PickCV API shutting down")
    
    # Stop job scraper scheduler
    try:
        scheduler.stop()
        logger.info("Job scraper scheduler stopped successfully")
    except Exception as e:
        logger.warning(f"Failed to stop job scraper scheduler: {e}")


if __name__ == "__main__":
    import uvicorn
    
    # Production: Use Gunicorn with Uvicorn workers
    # Development: Use Uvicorn directly
    if settings.is_production:
        logger.warning("Running in production mode. Use Gunicorn in production!")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
        access_log=True,
    )
