"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime, timezone
import secrets
import logging

from database import get_db, async_session_maker
from models import User, UserProfile, UserSkill, Recruiter
from schemas import UserCreate, UserResponse, Token, UserProfileFullResponse, UserProfileUpdateRequest, SkillItem
from services.auth_service import auth_service
from services.email_service import email_service
from services.google_oauth_service import google_oauth_service
from services.linkedin_oauth_service import linkedin_oauth_service
from services.college_service import college_service
from config import settings, get_frontend_origin

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
async def register(user_data: UserCreate, request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
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
    
    # Send verification email in the background (non-blocking)
    background_tasks.add_task(
        email_service.send_verification_email, new_user.email, verification_token, get_frontend_origin(request)
    )
    
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
        # Check if this email belongs to a recruiter account
        rec_result = await db.execute(select(Recruiter).where(Recruiter.email == form_data.username))
        if rec_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This email is registered as a recruiter. Please login at the Recruiter Portal (/recruiter/login).",
                headers={"WWW-Authenticate": "Bearer"},
            )
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
async def verify_email(token: str, request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
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
    
    # Send welcome email in background (non-blocking)
    background_tasks.add_task(email_service.send_welcome_email, user.email, user.full_name, get_frontend_origin(request))
    
    return {"message": "Email verified successfully. You can now login."}


@router.post("/resend-verification")
async def resend_verification(email: str, request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
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
    
    # Send verification email in background (non-blocking)
    background_tasks.add_task(
        email_service.send_verification_email, user.email, verification_token, get_frontend_origin(request)
    )
    
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
async def google_callback(code: str, state: str, request: Request, db: AsyncSession = Depends(get_db)):
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
    
    # Redirect to frontend using URL fragment (hash) instead of query params.
    # Fragments are NOT sent to the server in subsequent requests and don't
    # leak via the Referer header, making them safer for token transport.
    frontend_url = get_frontend_origin(request)
    from urllib.parse import urlencode, quote
    params = urlencode({
        "access_token": access_token_jwt,
        "refresh_token": refresh_token,
        "user_id": user.id,
        "email": user.email,
        "name": user.full_name or "",
    })
    redirect_url = f"{frontend_url}/auth/callback#{params}"
    
    return RedirectResponse(url=redirect_url)


@router.post("/google/token")
async def google_token(request: Request, db: AsyncSession = Depends(get_db)):
    """Exchange Google authorization code for JWT tokens (mobile/SPA friendly)."""
    try:
        # Accept code from JSON body or query params for backward compatibility
        code = None
        redirect_uri = None
        try:
            body = await request.json()
            code = body.get("code")
            redirect_uri = body.get("redirect_uri")
        except Exception:
            pass
        if not code:
            params = request.query_params
            code = params.get("code")
            redirect_uri = redirect_uri or params.get("redirect_uri")
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


# ─────────────────────────────────────────────────────
# LinkedIn OAuth routes
# ─────────────────────────────────────────────────────

@router.get("/linkedin/login")
async def linkedin_login():
    """Return LinkedIn OAuth authorization URL."""
    if not settings.linkedin_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.",
        )
    state = secrets.token_urlsafe(32)
    auth_url = linkedin_oauth_service.get_authorization_url(state)
    return {"auth_url": auth_url, "state": state}


@router.post("/linkedin/token")
async def linkedin_token(request: Request, db: AsyncSession = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    """Exchange LinkedIn authorization code for JWT tokens (SPA flow)."""
    try:
        # Accept code from JSON body or query params for backward compatibility
        code = None
        redirect_uri = None
        try:
            body = await request.json()
            code = body.get("code")
            redirect_uri = body.get("redirect_uri")
        except Exception:
            pass
        if not code:
            params = request.query_params
            code = params.get("code")
            redirect_uri = redirect_uri or params.get("redirect_uri")
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code missing",
            )

        # Exchange code for LinkedIn access token
        token_response = await linkedin_oauth_service.exchange_code_for_token(
            code, redirect_uri=redirect_uri
        )
        if not token_response or "access_token" not in token_response:
            logger.error(f"LinkedIn token exchange failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get LinkedIn access token",
            )

        access_token = token_response.get("access_token")

        # Get user info from LinkedIn (OpenID Connect userinfo)
        user_info = await linkedin_oauth_service.get_user_info(access_token)
        if not user_info or "email" not in user_info:
            logger.error("Failed to get LinkedIn user info")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from LinkedIn",
            )

        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        linkedin_sub = user_info.get("sub", "")
        linkedin_access_token_raw = access_token  # The LinkedIn API access token

        # Build LinkedIn profile snapshot to store
        linkedin_profile_snapshot = {
            "sub": linkedin_sub,
            "name": name,
            "given_name": user_info.get("given_name", ""),
            "family_name": user_info.get("family_name", ""),
            "email": email,
            "email_verified": user_info.get("email_verified", False),
            "picture": picture,
            "locale": user_info.get("locale", ""),
        }

        # Try to fetch LinkedIn posts (w_member_social data)
        linkedin_posts_data = []
        try:
            posts = await linkedin_oauth_service.get_member_posts(
                linkedin_access_token_raw, linkedin_sub, count=100
            )
            if posts:
                linkedin_posts_data = [
                    linkedin_oauth_service._extract_post_data(p) for p in posts
                ]
                logger.info(f"Fetched {len(linkedin_posts_data)} LinkedIn posts for {email}")
        except Exception as posts_err:
            logger.warning(f"Could not fetch LinkedIn posts for {email}: {posts_err}")

        # Full LinkedIn data blob
        full_linkedin_data = {
            "profile": linkedin_profile_snapshot,
            "posts": linkedin_posts_data,
            "posts_count": len(linkedin_posts_data),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

        # Find or create user
        try:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            is_new_user = user is None

            if is_new_user:
                user = User(
                    email=email,
                    full_name=name,
                    hashed_password="",  # OAuth users don't need passwords
                    is_verified=True,  # Trust LinkedIn's email verification
                    profile_picture_url=picture,
                    oauth_provider="linkedin",
                    linkedin_sub=linkedin_sub,
                    linkedin_access_token=linkedin_access_token_raw,
                    linkedin_profile_data=full_linkedin_data,
                    linkedin_data_fetched_at=datetime.now(timezone.utc),
                    linkedin_url=f"https://www.linkedin.com/in/{linkedin_sub}",
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                logger.info(f"New user created via LinkedIn OAuth: {email}")

                # Auto-create UserProfile for new LinkedIn users
                try:
                    profile = UserProfile(
                        user_id=user.id,
                        bio=f"LinkedIn user — {name}",
                        onboarding_completed=False,
                    )
                    db.add(profile)
                    await db.commit()
                    logger.info(f"Auto-created UserProfile for LinkedIn user {email}")
                except Exception as profile_err:
                    logger.warning(f"UserProfile creation failed for {email}: {profile_err}")

                # Update college student status if invited
                try:
                    await college_service.update_student_status_on_register(
                        db, user.id, user.email
                    )
                except Exception as e:
                    logger.warning(
                        f"College student status update failed for {email}: {e}"
                    )
            else:
                # Always refresh LinkedIn token, sub, and data on every login
                user.linkedin_sub = linkedin_sub
                user.linkedin_access_token = linkedin_access_token_raw
                user.linkedin_profile_data = full_linkedin_data
                user.linkedin_data_fetched_at = datetime.now(timezone.utc)
                if not user.oauth_provider:
                    user.oauth_provider = "linkedin"
                if not user.linkedin_url:
                    user.linkedin_url = f"https://www.linkedin.com/in/{linkedin_sub}"
                # Update profile picture if available and not already set
                if picture and not user.profile_picture_url:
                    user.profile_picture_url = picture
                await db.commit()

            # Generate JWT tokens
            access_token_jwt = auth_service.create_access_token(user.id)
            refresh_token = auth_service.create_refresh_token(user.id)
            user_id = user.id
        except Exception as db_error:
            logger.error(f"Database error during LinkedIn OAuth for {email}: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process authentication: {str(db_error)}",
            )

        return {
            "access_token": access_token_jwt,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_new_user": is_new_user,
            "has_linkedin_data": bool(linkedin_posts_data),
            "linkedin_posts_count": len(linkedin_posts_data),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LinkedIn OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LinkedIn OAuth failed: {str(e)}",
        )


# ─────────────────────────────────────────────────────
# LinkedIn Data API routes (requires w_member_social)
# ─────────────────────────────────────────────────────

@router.get("/linkedin/profile")
async def get_linkedin_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's LinkedIn profile data (OpenID Connect info)."""
    if not current_user.linkedin_access_token or not current_user.linkedin_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn account linked. Please sign in with LinkedIn first.",
        )

    user_info = await linkedin_oauth_service.get_user_info(
        current_user.linkedin_access_token
    )
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="LinkedIn access token expired. Please re-authenticate with LinkedIn.",
        )

    return {
        "linkedin_sub": user_info.get("sub"),
        "name": user_info.get("name"),
        "given_name": user_info.get("given_name"),
        "family_name": user_info.get("family_name"),
        "email": user_info.get("email"),
        "email_verified": user_info.get("email_verified"),
        "picture": user_info.get("picture"),
        "locale": user_info.get("locale"),
        "profile_url": f"https://www.linkedin.com/in/{user_info.get('sub', '')}",
    }


@router.get("/linkedin/posts")
async def get_linkedin_posts(
    count: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch the current user's own LinkedIn posts/shares (requires w_member_social)."""
    if not current_user.linkedin_access_token or not current_user.linkedin_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn account linked. Please sign in with LinkedIn first.",
        )

    posts = await linkedin_oauth_service.get_member_posts(
        current_user.linkedin_access_token,
        current_user.linkedin_sub,
        count=min(count, 100),
    )

    if posts is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch LinkedIn posts. Token may have expired — please re-authenticate.",
        )

    # Transform raw posts into cleaner format
    cleaned_posts = [
        linkedin_oauth_service._extract_post_data(p) for p in posts
    ]

    return {
        "total": len(cleaned_posts),
        "posts": cleaned_posts,
    }


@router.get("/linkedin/activity-summary")
async def get_linkedin_activity_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a comprehensive summary of the user's LinkedIn activity.
    
    Includes total posts, engagement metrics, content themes, etc.
    """
    if not current_user.linkedin_access_token or not current_user.linkedin_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn account linked. Please sign in with LinkedIn first.",
        )

    summary = await linkedin_oauth_service.get_member_activity_summary(
        current_user.linkedin_access_token,
        current_user.linkedin_sub,
    )

    return {
        "linkedin_sub": current_user.linkedin_sub,
        "name": current_user.full_name,
        "email": current_user.email,
        **summary,
    }


@router.get("/linkedin/posts/{post_urn:path}/comments")
async def get_linkedin_post_comments(
    post_urn: str,
    count: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get comments on a specific LinkedIn post."""
    if not current_user.linkedin_access_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn account linked.",
        )

    comments = await linkedin_oauth_service.get_post_comments(
        current_user.linkedin_access_token,
        post_urn,
        count=min(count, 100),
    )

    if comments is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch comments from LinkedIn.",
        )

    return {"total": len(comments), "comments": comments}


@router.get("/linkedin/status")
async def get_linkedin_connection_status(
    current_user: User = Depends(get_current_user),
):
    """Check if the current user has an active LinkedIn connection."""
    has_linkedin = bool(
        current_user.linkedin_access_token and current_user.linkedin_sub
    )
    return {
        "connected": has_linkedin,
        "linkedin_sub": current_user.linkedin_sub if has_linkedin else None,
        "oauth_provider": current_user.oauth_provider,
    }

