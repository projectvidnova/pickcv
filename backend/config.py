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
        "http://localhost:3000;http://localhost:5173"
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
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    sendgrid_api_key: str = os.getenv("SENDGRID_API_KEY", "")
    
    # ============= FILE UPLOAD =============
    max_upload_size_mb: int = 50
    allowed_file_types: List[str] = ["pdf", "docx", "doc", "txt"]
    
    # ============= GOOGLE CLOUD STORAGE (GCS) =============
    gcs_bucket_name: str = os.getenv("GCS_BUCKET_NAME", "")
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "")
    storage_backend: str = os.getenv("STORAGE_BACKEND", "local")  # "gcs" or "local"
    
    # ============= FRONTEND CONFIG =============
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # ============= ZOHO PAYMENTS =============
    zoho_payments_account_id: str = os.getenv("ZOHO_PAYMENTS_ACCOUNT_ID", "")
    zoho_payments_api_key: str = os.getenv("ZOHO_PAYMENTS_API_KEY", "")        # for checkout widget (frontend)
    zoho_payments_oauth_token: str = os.getenv("ZOHO_PAYMENTS_OAUTH_TOKEN", "")  # server-side OAuth token
    zoho_payments_client_id: str = os.getenv("ZOHO_PAYMENTS_CLIENT_ID", "")
    zoho_payments_client_secret: str = os.getenv("ZOHO_PAYMENTS_CLIENT_SECRET", "")
    zoho_payments_refresh_token: str = os.getenv("ZOHO_PAYMENTS_REFRESH_TOKEN", "")
    zoho_payments_base_url: str = os.getenv("ZOHO_PAYMENTS_BASE_URL", "https://payments.zoho.in/api/v1")
    zoho_payments_signing_key: str = os.getenv("ZOHO_PAYMENTS_SIGNING_KEY", "")  # for signature verification
    resume_download_price: float = float(os.getenv("RESUME_DOWNLOAD_PRICE", "49"))  # INR
    subscription_monthly_price: float = float(os.getenv("SUBSCRIPTION_MONTHLY_PRICE", "149"))  # INR
    subscription_yearly_price: float = float(os.getenv("SUBSCRIPTION_YEARLY_PRICE", "999"))  # INR
    free_downloads_limit: int = int(os.getenv("FREE_DOWNLOADS_LIMIT", "1"))
    
    # ============= LOGGING =============
    log_level: str = "INFO" if environment == "production" else "DEBUG"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # ============= SECURITY HEADERS =============
    enable_https_only: bool = environment == "production"
    hsts_max_age: int = 31536000  # 1 year
    
    @property
    def origins_list(self) -> List[str]:
        """Parse origins separated by comma or semicolon into a list.
        Automatically includes admin. and institution. subdomain variants."""
        import re
        origins = [origin.strip() for origin in re.split(r'[,;]', self.allowed_origins) if origin.strip()]
        # Auto-add subdomain origins for any pickcv.com domain
        extra = []
        for origin in origins:
            if 'pickcv.com' in origin and not origin.startswith('https://admin.') and not origin.startswith('https://institution.'):
                # Extract scheme
                scheme = origin.split('://')[0] if '://' in origin else 'https'
                extra.append(f"{scheme}://admin.pickcv.com")
                extra.append(f"{scheme}://institution.pickcv.com")
        origins.extend([e for e in extra if e not in origins])
        return origins
    
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


def get_frontend_origin(request) -> str:
    """Extract the frontend origin from the incoming request.

    Checks the Origin header first, then falls back to the Referer header,
    and finally to settings.frontend_url.  This ensures email verification
    links always point back to wherever the user actually came from.
    """
    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")

    referer = request.headers.get("referer")
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")

    return settings.frontend_url
