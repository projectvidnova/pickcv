"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import secrets
import logging

from database import get_db
from models import User, UserProfile, UserSkill
from schemas import UserCreate, UserResponse, Token, UserProfileFullResponse, UserProfileUpdateRequest, SkillItem
from services.auth_service import auth_service
from services.email_service import email_service
from services.google_oauth_service import google_oauth_service
from services.college_service import college_service
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
    
    # Update college student status if this email was invited by a college
    try:
        await college_service.update_student_status_on_register(db, new_user.id, new_user.email)
    except Exception as e:
        logger.warning(f"College student status update failed for {new_user.email}: {e}")
    
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


@router.post("/refresh")
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    """Refresh an expired access token using a valid refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    body = await request.json()
    refresh_tok = body.get("refresh_token")
    if not refresh_tok:
        raise credentials_exception
    
    payload = auth_service.decode_access_token(refresh_tok)
    if payload is None or payload.get("type") != "refresh":
        raise credentials_exception
    
    user_id_str = payload.get("sub")
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
    
    # Issue new access token and refresh token
    new_access_token = auth_service.create_access_token(user.id)
    new_refresh_token = auth_service.create_refresh_token(user.id)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


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


@router.get("/profile", response_model=UserProfileFullResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full user profile including preferences and skills."""
    # Get user profile (preferred_locations)
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    user_profile = result.scalar_one_or_none()
    preferred_locations = user_profile.preferred_locations or [] if user_profile else []

    # Get skills
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()
    skills = [
        SkillItem(name=s.skill_name, years=int(s.years_of_experience or 0))
        for s in user_skills
    ]

    return UserProfileFullResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        location=current_user.location,
        linkedin_url=current_user.linkedin_url,
        profile_picture_url=current_user.profile_picture_url,
        target_role=current_user.target_role,
        experience_level=current_user.experience_level,
        work_mode=current_user.work_mode,
        preferred_locations=preferred_locations,
        skills=skills,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.put("/profile", response_model=UserProfileFullResponse)
async def update_profile(
    data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile, preferences, and skills."""
    # Update direct user fields
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.location is not None:
        current_user.location = data.location
    if data.linkedin_url is not None:
        current_user.linkedin_url = data.linkedin_url
    if data.target_role is not None:
        current_user.target_role = data.target_role
    if data.experience_level is not None:
        current_user.experience_level = data.experience_level
    if data.work_mode is not None:
        current_user.work_mode = data.work_mode

    # Update preferred_locations in UserProfile
    if data.preferred_locations is not None:
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        user_profile = result.scalar_one_or_none()
        if user_profile:
            user_profile.preferred_locations = data.preferred_locations
        else:
            user_profile = UserProfile(
                user_id=current_user.id,
                preferred_locations=data.preferred_locations,
            )
            db.add(user_profile)

    # Sync skills: delete existing, insert new
    if data.skills is not None:
        from sqlalchemy import delete
        await db.execute(
            delete(UserSkill).where(UserSkill.user_id == current_user.id)
        )
        for skill in data.skills:
            db.add(UserSkill(
                user_id=current_user.id,
                skill_name=skill.name,
                years_of_experience=float(skill.years),
            ))

    await db.commit()
    await db.refresh(current_user)

    # Re-fetch for response
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    user_profile = result.scalar_one_or_none()
    preferred_locations = user_profile.preferred_locations or [] if user_profile else []

    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()
    skills = [
        SkillItem(name=s.skill_name, years=int(s.years_of_experience or 0))
        for s in user_skills
    ]

    return UserProfileFullResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        location=current_user.location,
        linkedin_url=current_user.linkedin_url,
        profile_picture_url=current_user.profile_picture_url,
        target_role=current_user.target_role,
        experience_level=current_user.experience_level,
        work_mode=current_user.work_mode,
        preferred_locations=preferred_locations,
        skills=skills,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


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
        # Update college student status if this email was invited
        try:
            await college_service.update_student_status_on_register(db, user.id, user.email)
        except Exception as e:
            logger.warning(f"College student status update failed for {email}: {e}")
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
async def google_token(code: str, redirect_uri: str = None, db: AsyncSession = Depends(get_db)):
    """Exchange Google authorization code for JWT tokens (mobile/SPA friendly)."""
    try:
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code missing"
            )
        
        # Exchange code for token (use frontend's redirect_uri if provided to avoid mismatch)
        token_response = await google_oauth_service.exchange_code_for_token(code, redirect_uri=redirect_uri)
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
                # Update college student status if invited
                try:
                    await college_service.update_student_status_on_register(db, user.id, user.email)
                except Exception as e:
                    logger.warning(f"College student status update failed for {email}: {e}")
            
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

