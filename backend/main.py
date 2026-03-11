"""Main FastAPI application entry point - Production Ready."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes import resume, jobs, auth, analysis
from security import get_security_headers

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
# In production on Cloud Run, use wildcard since Cloud Run handles ingress security
if settings.is_production:
    allowed_hosts = ["*"]
else:
    allowed_hosts = settings.origins_list + ["localhost", "127.0.0.1"]
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


# ============= ERROR HANDLERS =============
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.is_production:
        # Don't expose internal details in production
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        # Show error details in development
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )


# ============= ROUTERS =============
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])


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
    
    # Auto-create database tables
    from database import engine, Base
    from models import User  # noqa: F401 - Import to register models
    from sqlalchemy import text
    
    try:
        async with engine.begin() as conn:
            # Enable pgvector extension if available
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                logger.info("pgvector extension enabled")
            except Exception as e:
                logger.warning(f"pgvector extension not available: {e}")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("PickCV API shutting down")


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
