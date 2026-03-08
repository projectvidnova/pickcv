"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import secrets
import logging

from database import get_db
from models import User
from schemas import UserCreate, UserResponse, Token
from services.auth_service import auth_service
from services.email_service import email_service
from services.google_oauth_service import google_oauth_service
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = auth_service.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user and send verification email."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = auth_service.get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_verified=False  # Not verified yet
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate verification token
    verification_token = auth_service.create_verification_token(new_user.id)
    
    # Send verification email (in dev: prints to console, in prod: sends via SMTP)
    email_service.send_verification_email(new_user.email, verification_token)
    
    return new_user


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token."""
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for verification link."
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Verify user email with token."""
    # Decode verification token
    user_id = auth_service.decode_verification_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Find user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Mark email as verified
    from datetime import datetime
    user.is_verified = True
    user.email_verified_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Email verified successfully. You can now login."}


@router.post("/resend-verification")
async def resend_verification(email: str, db: AsyncSession = Depends(get_db)):
    """Resend verification email."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Generate new verification token
    verification_token = auth_service.create_verification_token(user.id)
    
    # Send verification email (in dev: prints to console, in prod: sends via SMTP)
    email_service.send_verification_email(user.email, verification_token)
    
    return {"message": "Verification email sent. Check your inbox."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth login."""
    state = secrets.token_urlsafe(32)
    # In production, store state in session/cache for CSRF validation
    auth_url = google_oauth_service.get_authorization_url(state)
    return {"auth_url": auth_url, "state": state}


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code missing"
        )
    
    # Exchange code for token
    token_response = await google_oauth_service.exchange_code_for_token(code)
    if not token_response or "access_token" not in token_response:
        logger.error(f"Token exchange failed for code: {code}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get access token"
        )
    
    access_token = token_response.get("access_token")
    
    # Get user info from Google
    user_info = await google_oauth_service.get_user_info(access_token)
    if not user_info or "email" not in user_info:
        logger.error(f"Failed to get user info")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user information"
        )
    
    email = user_info.get("email")
    name = user_info.get("name", "")
    picture = user_info.get("picture", "")
    
    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        # Create new user from Google info
        user = User(
            email=email,
            full_name=name,
            hashed_password="",  # OAuth users don't need passwords
            is_verified=True,  # Trust Google's verification
            profile_picture_url=picture
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"New user created via Google OAuth: {email}")
    else:
        # Update profile picture if available
        if picture and not user.profile_picture_url:
            user.profile_picture_url = picture
            await db.commit()
    
    # Generate JWT tokens
    access_token_jwt = auth_service.create_access_token(user.id)
    refresh_token = auth_service.create_refresh_token(user.id)
    
    # Redirect to frontend with tokens and user info
    frontend_url = settings.frontend_url
    redirect_url = f"{frontend_url}/auth/callback?access_token={access_token_jwt}&refresh_token={refresh_token}&user_id={user.id}&email={user.email}&name={user.full_name}"
    
    return RedirectResponse(url=redirect_url)


@router.post("/google/token")
async def google_token(code: str, db: AsyncSession = Depends(get_db)):
    """Exchange Google authorization code for JWT tokens (mobile/SPA friendly)."""
    try:
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code missing"
            )
        
        # Exchange code for token
        token_response = await google_oauth_service.exchange_code_for_token(code)
        if not token_response or "access_token" not in token_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token"
            )
        
        access_token = token_response.get("access_token")
        
        # Get user info from Google
        user_info = await google_oauth_service.get_user_info(access_token)
        if not user_info or "email" not in user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        
        # Try to find or create user (with error handling for DB connection issues)
        try:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if user is None:
                user = User(
                    email=email,
                    full_name=name,
                    hashed_password="",
                    is_verified=True,
                    profile_picture_url=picture
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                logger.info(f"New user created via Google OAuth: {email}")
            
            # Generate JWT tokens using real database user ID
            access_token_jwt = auth_service.create_access_token(user.id)
            refresh_token = auth_service.create_refresh_token(user.id)
            user_id = user.id
        except Exception as db_error:
            # Log the error for debugging
            logger.error(f"Database error during OAuth for {email}: {db_error}")
            # Raise as HTTPException instead of falling back
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process authentication: {str(db_error)}"
            )
        
        return {
            "access_token": access_token_jwt,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth token exchange error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth failed: {str(e)}"
        )

