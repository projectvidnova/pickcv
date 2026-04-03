"""
Security utilities for PickCV backend.
Handles authentication, password hashing, token generation, and validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import secrets
import re

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, field_validator

from config import settings


# ============= PASSWORD HASHING =============
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordValidator:
    """Validate password strength."""
    
    @staticmethod
    def validate(password: str) -> tuple[bool, str]:
        """
        Validate password meets security requirements.
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if len(password) < settings.password_min_length:
            return False, f"Password must be at least {settings.password_min_length} characters"
        
        if settings.password_require_uppercase and not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"
        
        if settings.password_require_lowercase and not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"
        
        if settings.password_require_digits and not re.search(r"\d", password):
            return False, "Password must contain at least one digit"
        
        if settings.password_require_special and not re.search(r"[!@#$%^&*()_+=\-\[\]{};:,.<>?]", password):
            return False, "Password must contain at least one special character"
        
        return True, ""


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        bool: True if password matches
    """
    return pwd_context.verify(plain_password, hashed_password)


# ============= JWT TOKENS =============
class TokenData(BaseModel):
    """JWT token payload."""
    sub: int  # user_id
    email: str
    exp: datetime
    iat: datetime
    token_type: str


def create_access_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.
    
    Args:
        user_id: User ID
        email: User email
        expires_delta: Custom expiration delta
        
    Returns:
        str: JWT token
    """
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": now,
        "token_type": "access"
    }
    
    encoded_jwt = jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def create_refresh_token(user_id: int, email: str) -> str:
    """
    Create JWT refresh token.
    
    Args:
        user_id: User ID
        email: User email
        
    Returns:
        str: JWT refresh token
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.refresh_token_expire_days)
    
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": now,
        "token_type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData: Decoded token data
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        token_type: str = payload.get("token_type")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return TokenData(
            sub=user_id,
            email=email,
            exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
            iat=datetime.fromtimestamp(payload.get("iat"), tz=timezone.utc),
            token_type=token_type
        )
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============= AUTHENTICATION SCHEMES =============
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """
    Get current user from JWT token.
    Dependency for protected routes.
    
    Args:
        credentials: HTTP bearer credentials
        
    Returns:
        TokenData: Current user token data
        
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    return decode_token(token)


async def get_current_user_id(current_user: TokenData = Depends(get_current_user)) -> int:
    """
    Get current user ID from token.
    
    Args:
        current_user: Current user data
        
    Returns:
        int: User ID
    """
    return current_user.sub


# ============= SECURITY HEADERS =============
def get_security_headers() -> Dict[str, str]:
    """
    Get security headers for all responses.
    
    Returns:
        dict: Security headers
    """
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": f"max-age={settings.hsts_max_age}; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
    }
    
    return headers


# ============= VALIDATION MODELS =============
class UserRegisterRequest(BaseModel):
    """User registration request model."""
    email: EmailStr
    password: str
    full_name: str
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength."""
        is_valid, error_msg = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v


class UserLoginRequest(BaseModel):
    """User login request model."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request model."""
    refresh_token: str


# ============= RATE LIMITING (Basic) =============
class RateLimiter:
    """Simple in-memory rate limiter for development."""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed."""
        if not settings.rate_limit_enabled:
            return True
        
        now = datetime.now(timezone.utc)
        
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Remove old requests outside the window
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if (now - req_time).total_seconds() < settings.rate_limit_window_seconds
        ]
        
        if len(self.requests[client_id]) >= settings.rate_limit_requests:
            return False
        
        self.requests[client_id].append(now)
        return True


rate_limiter = RateLimiter()


# ============= INPUT SANITIZATION =============
def sanitize_input(input_str: str, max_length: int = 1000) -> str:
    """
    Sanitize user input.
    
    Args:
        input_str: Input string to sanitize
        max_length: Maximum allowed length
        
    Returns:
        str: Sanitized input
    """
    if len(input_str) > max_length:
        input_str = input_str[:max_length]
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';']
    for char in dangerous_chars:
        input_str = input_str.replace(char, '')
    
    return input_str.strip()


# ============= SECURE RANDOM GENERATION =============
def generate_secure_token(length: int = 32) -> str:
    """
    Generate cryptographically secure random token.
    
    Args:
        length: Token length
        
    Returns:
        str: Secure random token
    """
    return secrets.token_urlsafe(length)
