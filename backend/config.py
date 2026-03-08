"""Application configuration using Pydantic Settings - Production Ready."""
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Production-grade security configuration.
    """
    
    # ============= CORE =============
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = environment == "development"
    api_title: str = "PickCV API"
    api_version: str = "1.0.0"
    
    # ============= DATABASE =============
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/pickcv"
    )
    # Connection pool settings for scalability
    db_pool_size: int = 20  # Default pool connections
    db_max_overflow: int = 10  # Additional connections under load
    db_pool_recycle: int = 3600  # Recycle connections every hour
    db_pool_pre_ping: bool = True  # Test connections before using
    
    # ============= SECURITY =============
    # Secret key MUST be set in production
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    algorithm: str = "HS256"
    
    # Token expiration (access token: 24 hours, refresh: 7 days)
    access_token_expire_minutes: int = 1440  # 24 hours
    refresh_token_expire_days: int = 7
    
    # Password requirements
    password_min_length: int = 12
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digits: bool = True
    password_require_special: bool = True
    
    # ============= CORS =============
    allowed_origins: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000"
    )
    
    # ============= RATE LIMITING =============
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100  # requests per window
    rate_limit_window_seconds: int = 60
    
    # ============= EXTERNAL APIS =============
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "temp-dev-key")
    
    # ============= GOOGLE OAUTH =============
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    # ============= EMAIL CONFIGURATION =============
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    sender_email: str = os.getenv("SENDER_EMAIL", "noreply@pickcv.com")
    sender_password: str = os.getenv("SENDER_PASSWORD", "")
    
    # ============= FILE UPLOAD =============
    max_upload_size_mb: int = 50
    allowed_file_types: List[str] = ["pdf", "docx", "doc", "txt"]
    
    # ============= GOOGLE CLOUD STORAGE (GCS) =============
    gcs_bucket_name: str = os.getenv("GCS_BUCKET_NAME", "")
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "")
    storage_backend: str = os.getenv("STORAGE_BACKEND", "local")  # "gcs" or "local"
    
    # ============= FRONTEND CONFIG =============
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # ============= LOGGING =============
    log_level: str = "INFO" if environment == "production" else "DEBUG"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # ============= SECURITY HEADERS =============
    enable_https_only: bool = environment == "production"
    hsts_max_age: int = 31536000  # 1 year
    
    @property
    def origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
