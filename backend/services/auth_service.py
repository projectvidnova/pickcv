"""Authentication service for JWT tokens and password hashing."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from config import settings


class AuthService:
    """Service for authentication operations."""
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def create_access_token(self, data, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token.
        
        Args:
            data: Data to encode in the token (can be dict or int user_id)
            expires_delta: Optional expiration time delta
            
        Returns:
            Encoded JWT token
        """
        # Handle both dict and integer user_id inputs
        if isinstance(data, int):
            to_encode = {"sub": str(data)}
        else:
            to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    def decode_access_token(self, token: str) -> Optional[dict]:
        """Decode and verify a JWT token.
        
        Args:
            token: JWT token to decode
            
        Returns:
            Decoded token data or None if invalid
        """
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            return payload
        except JWTError:
            return None
    
    def create_verification_token(self, user_id: int) -> str:
        """Create a verification token for email confirmation.
        
        Args:
            user_id: User ID to encode in token
            
        Returns:
            Encoded verification token (24 hour expiration)
        """
        to_encode = {"sub": str(user_id), "type": "email_verification"}
        expire = datetime.utcnow() + timedelta(hours=24)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    def decode_verification_token(self, token: str) -> Optional[int]:
        """Decode and verify an email verification token.
        
        Args:
            token: Verification token to decode
            
        Returns:
            User ID if valid, None if invalid/expired
        """
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            
            # Verify token type
            if payload.get("type") != "email_verification":
                return None
            
            user_id = payload.get("sub")
            if user_id is None:
                return None
            
            return int(user_id)
        except JWTError:
            return None
    
    def create_refresh_token(self, user_id: int) -> str:
        """Create a JWT refresh token for token refresh operations.
        
        Args:
            user_id: User ID to encode in token
            
        Returns:
            Encoded refresh token (7 day expiration)
        """
        to_encode = {"sub": str(user_id), "type": "refresh"}
        expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt


auth_service = AuthService()
