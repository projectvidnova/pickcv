"""Payment routes for PickCV — subscriptions, per-resume purchase & free first download.

Pricing tiers:
  • 1st download FREE (per user, one-time coupon)
  • ₹49  per individual resume download
  • ₹149 monthly  — unlimited downloads for 30 days
  • ₹999 yearly   — unlimited downloads for 365 days

Endpoints:
  GET    /payments/config                — Client-side config (account_id, api_key, prices)
  GET    /payments/plans                 — Available pricing plans
  GET    /payments/check-access/{id}     — Comprehensive access check (free / subscription / paid)
  POST   /payments/use-free-download     — Claim the one-time free download
  POST   /payments/create-session        — Create Zoho payment session (per-resume or subscription)
  POST   /payments/verify                — Verify payment & activate subscription if applicable
  GET    /payments/history               — User's payment history
  GET    /payments/subscription          — User's active subscription details
  POST   /payments/webhook               — Zoho server callback
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from database import get_db
from models import User, Resume, Payment, Subscription
from routes.auth import get_current_user
from services.zoho_payment_service import zoho_payment_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Constants ────────────────────────────────────────────────

PLAN_MAP = {
    "per_resume": {
        "product_type": "resume_download",
        "label": "Per Resume",
        "description": "Download this optimized resume",
        "period": None,
    },
    "monthly": {
        "product_type": "subscription_monthly",
        "label": "Monthly Plan",
        "description": "Unlimited resume downloads for 30 days",
        "period": "30 days",
    },
    "yearly": {
        "product_type": "subscription_yearly",
        "label": "Annual Plan",
        "description": "Unlimited resume downloads for 1 year",
        "period": "365 days",
    },
}


def _price_for_plan(plan_type: str) -> float:
    if plan_type == "per_resume":
        return settings.resume_download_price
    elif plan_type == "monthly":
        return settings.subscription_monthly_price
    elif plan_type == "yearly":
        return settings.subscription_yearly_price
    raise ValueError(f"Unknown plan type: {plan_type}")


# ─── Request / Response Schemas ───────────────────────────────

class CreateSessionRequest(BaseModel):
    resume_id: Optional[int] = None        # required for per_resume, optional for subscriptions
    plan_type: str = "per_resume"           # per_resume, monthly, yearly


class CreateSessionResponse(BaseModel):
    payments_session_id: str
    amount: float
    currency: str
    reference_number: str
    description: str


class VerifyPaymentRequest(BaseModel):
    payment_id: str
    payments_session_id: str
    signature: Optional[str] = None


class VerifyPaymentResponse(BaseModel):
    status: str
    payment_id: str
    download_allowed: bool
    message: str
    subscription_activated: bool = False


class PlanInfo(BaseModel):
    plan_type: str
    price: float
    currency: str
    label: str
    description: str
    period: Optional[str] = None
    badge: Optional[str] = None


class SubscriptionInfo(BaseModel):
    id: int
    plan_type: str
    status: str
    starts_at: str
    expires_at: str
    days_remaining: int


class CheckAccessResponse(BaseModel):
    has_access: bool
    access_type: Optional[str] = None      # "free", "subscription", "per_resume", None
    payment_required: bool
    free_downloads_remaining: int
    active_subscription: Optional[SubscriptionInfo] = None
    plans: List[PlanInfo]


class FreeDownloadRequest(BaseModel):
    resume_id: int


class PaymentConfigResponse(BaseModel):
    account_id: str
    api_key: str
    domain: str
    currency: str
    resume_download_price: float
    subscription_monthly_price: float
    subscription_yearly_price: float
    free_downloads_limit: int
    is_configured: bool


class PaymentHistoryItem(BaseModel):
    id: int
    resume_id: Optional[int]
    amount: float
    currency: str
    status: str
    product_type: str
    description: Optional[str]
    created_at: str
    paid_at: Optional[str]


# ─── Helpers ──────────────────────────────────────────────────

def _build_plans() -> List[PlanInfo]:
    """Return the three pricing tiers."""
    return [
        PlanInfo(
            plan_type="per_resume",
            price=settings.resume_download_price,
            currency="INR",
            label="Per Resume",
            description="Download this optimized resume",
            period=None,
            badge=None,
        ),
        PlanInfo(
            plan_type="monthly",
            price=settings.subscription_monthly_price,
            currency="INR",
            label="Monthly Plan",
            description="Unlimited resume downloads for 30 days",
            period="30 days",
            badge="POPULAR",
        ),
        PlanInfo(
            plan_type="yearly",
            price=settings.subscription_yearly_price,
            currency="INR",
            label="Annual Plan",
            description="Unlimited resume downloads for 1 year",
            period="1 year",
            badge="BEST VALUE",
        ),
    ]


async def _get_active_subscription(user_id: int, db: AsyncSession) -> Optional[Subscription]:
    """Return the user's active subscription, or None."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Subscription).where(
            and_(
                Subscription.user_id == user_id,
                Subscription.status == "active",
                Subscription.expires_at > now,
            )
        ).order_by(Subscription.expires_at.desc())
    )
    return result.scalar_one_or_none()


async def _count_free_downloads(user_id: int, db: AsyncSession) -> int:
    """Count how many free downloads the user has used."""
    result = await db.execute(
        select(func.count(Payment.id)).where(
            and_(
                Payment.user_id == user_id,
                Payment.product_type == "free_download",
                Payment.status == "succeeded",
            )
        )
    )
    return result.scalar() or 0


async def _has_resume_payment(user_id: int, resume_id: int, db: AsyncSession) -> bool:
    """Check if the user has a successful per-resume or free-download payment for this resume."""
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == user_id,
                Payment.resume_id == resume_id,
                Payment.status == "succeeded",
                Payment.product_type.in_(["resume_download", "free_download"]),
            )
        )
    )
    return result.scalar_one_or_none() is not None


# ─── Client Config ────────────────────────────────────────────

@router.get("/config", response_model=PaymentConfigResponse)
async def get_payment_config():
    """Return client-side config needed to initialise the Zoho checkout widget."""
    return PaymentConfigResponse(
        account_id=settings.zoho_payments_account_id,
        api_key=settings.zoho_payments_api_key,
        domain="IN",
        currency="INR",
        resume_download_price=settings.resume_download_price,
        subscription_monthly_price=settings.subscription_monthly_price,
        subscription_yearly_price=settings.subscription_yearly_price,
        free_downloads_limit=settings.free_downloads_limit,
        is_configured=zoho_payment_service.is_configured,
    )


# ─── Available Plans ──────────────────────────────────────────

@router.get("/plans", response_model=List[PlanInfo])
async def get_plans():
    """Return available pricing plans."""
    return _build_plans()


# ─── Comprehensive Access Check ───────────────────────────────

@router.get("/check-access/{resume_id}", response_model=CheckAccessResponse)
async def check_download_access(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if the user can download a specific resume.

    Priority order:
      1. Payment gateway not configured → free access
      2. Active subscription → access granted
      3. Per-resume payment exists → access granted
      4. Free download available → access granted (needs claim)
      5. Otherwise → payment required, return plans
    """
    plans = _build_plans()

    # 1. If payments not configured → free
    if not zoho_payment_service.is_configured:
        return CheckAccessResponse(
            has_access=True,
            access_type="free",
            payment_required=False,
            free_downloads_remaining=0,
            active_subscription=None,
            plans=plans,
        )

    # 2. Check active subscription
    sub = await _get_active_subscription(current_user.id, db)
    if sub:
        now = datetime.now(timezone.utc)
        days_remaining = max(0, (sub.expires_at - now).days)
        return CheckAccessResponse(
            has_access=True,
            access_type="subscription",
            payment_required=False,
            free_downloads_remaining=0,
            active_subscription=SubscriptionInfo(
                id=sub.id,
                plan_type=sub.plan_type,
                status=sub.status,
                starts_at=sub.starts_at.isoformat() if sub.starts_at else "",
                expires_at=sub.expires_at.isoformat() if sub.expires_at else "",
                days_remaining=days_remaining,
            ),
            plans=plans,
        )

    # 3. Check per-resume payment
    if await _has_resume_payment(current_user.id, resume_id, db):
        return CheckAccessResponse(
            has_access=True,
            access_type="per_resume",
            payment_required=False,
            free_downloads_remaining=0,
            active_subscription=None,
            plans=plans,
        )

    # 4. Check free downloads
    used = await _count_free_downloads(current_user.id, db)
    remaining = max(0, settings.free_downloads_limit - used)

    if remaining > 0:
        return CheckAccessResponse(
            has_access=True,
            access_type="free",
            payment_required=False,
            free_downloads_remaining=remaining,
            active_subscription=None,
            plans=plans,
        )

    # 5. Payment required
    return CheckAccessResponse(
        has_access=False,
        access_type=None,
        payment_required=True,
        free_downloads_remaining=0,
        active_subscription=None,
        plans=plans,
    )


# ─── Claim Free Download ─────────────────────────────────────

@router.post("/use-free-download")
async def use_free_download(
    data: FreeDownloadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Claim the one-time free resume download.

    Records a zero-amount payment so the download is tracked.
    """
    # Verify free downloads not exhausted
    used = await _count_free_downloads(current_user.id, db)
    if used >= settings.free_downloads_limit:
        raise HTTPException(
            status_code=403,
            detail="Free download already used. Please purchase a plan to continue.",
        )

    # Verify resume belongs to user
    result = await db.execute(
        select(Resume).where(Resume.id == data.resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Record as a zero-amount payment
    ref = f"PCV-FREE-{current_user.id}-{data.resume_id}-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        user_id=current_user.id,
        resume_id=data.resume_id,
        amount=0,
        currency="INR",
        status="succeeded",
        description=f"Free Download – {resume.title or 'Resume'}",
        reference_number=ref,
        product_type="free_download",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.commit()

    logger.info("Free download claimed: user=%s resume=%s", current_user.id, data.resume_id)

    return {
        "success": True,
        "message": "Free download activated! You can now download this resume.",
        "free_downloads_remaining": max(0, settings.free_downloads_limit - used - 1),
    }


# ─── Create Payment Session ──────────────────────────────────

@router.post("/create-session", response_model=CreateSessionResponse)
async def create_payment_session(
    data: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Zoho Payments session for the checkout widget.

    Supports three plan types:
      - per_resume: ₹49 for one specific resume (requires resume_id)
      - monthly:    ₹149 for 30-day unlimited subscription
      - yearly:     ₹999 for 365-day unlimited subscription
    """
    if not zoho_payment_service.is_configured:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    if data.plan_type not in PLAN_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid plan type: {data.plan_type}")

    plan = PLAN_MAP[data.plan_type]
    amount = _price_for_plan(data.plan_type)

    # Validate per-resume requires resume_id
    if data.plan_type == "per_resume":
        if not data.resume_id:
            raise HTTPException(status_code=400, detail="resume_id is required for per_resume plan")
        result = await db.execute(
            select(Resume).where(Resume.id == data.resume_id, Resume.user_id == current_user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        if await _has_resume_payment(current_user.id, data.resume_id, db):
            raise HTTPException(status_code=409, detail="Already paid for this resume.")

        description = f"Resume Download – {resume.title or 'Resume'}"
    else:
        # Subscription — check for existing active subscription
        existing_sub = await _get_active_subscription(current_user.id, db)
        if existing_sub:
            raise HTTPException(
                status_code=409,
                detail=f"You already have an active {existing_sub.plan_type} subscription until {existing_sub.expires_at.strftime('%d %b %Y')}.",
            )
        description = f"PickCV {plan['label']} – {plan['description']}"

    # Generate internal reference
    ref = f"PCV-{data.plan_type.upper()}-{current_user.id}-{uuid.uuid4().hex[:8].upper()}"

    # Create Zoho payment session
    try:
        meta = [
            {"key": "user_id", "value": str(current_user.id)},
            {"key": "plan_type", "value": data.plan_type},
        ]
        if data.resume_id:
            meta.append({"key": "resume_id", "value": str(data.resume_id)})

        session_data = await zoho_payment_service.create_payment_session(
            amount=amount,
            currency="INR",
            description=description[:500],
            reference_number=ref[:50],
            meta_data=meta,
        )
    except Exception as e:
        logger.error("Zoho create session failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to create payment session")

    session_id = session_data.get("payments_session_id")
    if not session_id:
        logger.error("Zoho returned no session ID: %s", session_data)
        raise HTTPException(status_code=502, detail="Invalid response from payment gateway")

    # Store pending payment record
    payment = Payment(
        user_id=current_user.id,
        resume_id=data.resume_id,
        zoho_session_id=session_id,
        amount=amount,
        currency="INR",
        status="pending",
        description=description,
        reference_number=ref,
        product_type=plan["product_type"],
    )
    db.add(payment)
    await db.commit()

    return CreateSessionResponse(
        payments_session_id=session_id,
        amount=amount,
        currency="INR",
        reference_number=ref,
        description=description,
    )


# ─── Verify Payment ──────────────────────────────────────────

@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    data: VerifyPaymentRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify payment after the Zoho checkout widget completes.

    For subscription payments, also creates an active Subscription record.
    """
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.zoho_session_id == data.payments_session_id,
                Payment.user_id == current_user.id,
            )
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment session not found")

    if payment.status == "succeeded":
        return VerifyPaymentResponse(
            status="succeeded",
            payment_id=payment.zoho_payment_id or data.payment_id,
            download_allowed=True,
            message="Payment already verified",
            subscription_activated=payment.product_type in ("subscription_monthly", "subscription_yearly"),
        )

    # Verify signature
    if data.signature and settings.zoho_payments_signing_key:
        if not zoho_payment_service.verify_signature(data.payment_id, data.signature):
            logger.warning("Signature mismatch for payment %s", data.payment_id)
            raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Verify with Zoho API
    try:
        zoho_payment = await zoho_payment_service.retrieve_payment(data.payment_id)
        zoho_status = zoho_payment.get("status", "unknown")
    except Exception as e:
        logger.error("Zoho verify payment failed: %s", e)
        try:
            session_data = await zoho_payment_service.retrieve_payment_session(
                data.payments_session_id
            )
            payments_list = session_data.get("payments", [])
            zoho_status = "unknown"
            for p in payments_list:
                if p.get("payment_id") == data.payment_id:
                    zoho_status = p.get("status", "unknown")
                    break
        except Exception:
            raise HTTPException(status_code=502, detail="Unable to verify payment status")

    # Update payment record
    payment.zoho_payment_id = data.payment_id
    subscription_activated = False

    if zoho_status == "succeeded":
        payment.status = "succeeded"
        payment.paid_at = datetime.now(timezone.utc)

        # If subscription, create Subscription record
        if payment.product_type in ("subscription_monthly", "subscription_yearly"):
            subscription_activated = True
            now = datetime.now(timezone.utc)
            if payment.product_type == "subscription_monthly":
                expires = now + timedelta(days=30)
                plan_type = "monthly"
            else:
                expires = now + timedelta(days=365)
                plan_type = "yearly"

            subscription = Subscription(
                user_id=current_user.id,
                plan_type=plan_type,
                status="active",
                payment_id=payment.id,
                starts_at=now,
                expires_at=expires,
            )
            db.add(subscription)
            logger.info(
                "Subscription activated: user=%s plan=%s expires=%s",
                current_user.id, plan_type, expires.isoformat(),
            )

        await db.commit()

        # Send payment confirmation email
        try:
            from services.email_service import email_service
            from config import get_frontend_origin
            email_service.send_payment_confirmation_email(
                recipient_email=current_user.email,
                full_name=current_user.full_name,
                amount=payment.amount,
                plan_type=payment.product_type,
                payment_id=data.payment_id,
                frontend_url=get_frontend_origin(request),
            )
        except Exception as e:
            logger.warning("Payment confirmation email failed for user %s: %s", current_user.id, e)

        return VerifyPaymentResponse(
            status="succeeded",
            payment_id=data.payment_id,
            download_allowed=True,
            message="Payment successful! You can now download your resume.",
            subscription_activated=subscription_activated,
        )
    elif zoho_status in ("failed", "canceled", "blocked"):
        payment.status = "failed"
        await db.commit()
        return VerifyPaymentResponse(
            status="failed",
            payment_id=data.payment_id,
            download_allowed=False,
            message=f"Payment {zoho_status}. Please try again.",
        )
    else:
        payment.status = zoho_status
        await db.commit()
        return VerifyPaymentResponse(
            status=zoho_status,
            payment_id=data.payment_id,
            download_allowed=False,
            message="Payment is still being processed. Please wait.",
        )


# ─── User's Active Subscription ──────────────────────────────

@router.get("/subscription")
async def get_user_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's current active subscription, if any."""
    sub = await _get_active_subscription(current_user.id, db)
    if not sub:
        return {"has_subscription": False, "subscription": None}

    now = datetime.now(timezone.utc)
    days_remaining = max(0, (sub.expires_at - now).days)

    return {
        "has_subscription": True,
        "subscription": {
            "id": sub.id,
            "plan_type": sub.plan_type,
            "status": sub.status,
            "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "days_remaining": days_remaining,
        },
    }


# ─── Payment History ─────────────────────────────────────────

@router.get("/history", response_model=list[PaymentHistoryItem])
async def payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all payments for the current user."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    return [
        PaymentHistoryItem(
            id=p.id,
            resume_id=p.resume_id,
            amount=p.amount,
            currency=p.currency,
            status=p.status,
            product_type=p.product_type or "resume_download",
            description=p.description,
            created_at=p.created_at.isoformat() if p.created_at else "",
            paid_at=p.paid_at.isoformat() if p.paid_at else None,
        )
        for p in payments
    ]


# ─── Zoho Webhook (server-to-server callback) ────────────────

@router.post("/webhook")
async def zoho_payment_webhook(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Handle Zoho Payments webhook events.

    Also activates subscriptions when payment.success is received
    for subscription product types.
    """
    event = payload.get("event_type", "")
    payment_data = payload.get("payment", payload.get("data", {}))
    session_id = payment_data.get("payments_session_id")
    payment_id = payment_data.get("payment_id")
    status = payment_data.get("status")

    logger.info("Zoho webhook: event=%s payment_id=%s status=%s", event, payment_id, status)

    if not session_id:
        return {"status": "ignored", "reason": "no session_id"}

    result = await db.execute(
        select(Payment).where(Payment.zoho_session_id == session_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        logger.warning("Webhook: no payment record for session %s", session_id)
        return {"status": "ignored", "reason": "session not found"}

    if payment_id:
        payment.zoho_payment_id = payment_id

    if status == "succeeded" and payment.status != "succeeded":
        payment.status = "succeeded"
        payment.paid_at = datetime.now(timezone.utc)

        # Activate subscription if applicable
        if payment.product_type in ("subscription_monthly", "subscription_yearly"):
            existing_sub = await db.execute(
                select(Subscription).where(Subscription.payment_id == payment.id)
            )
            if not existing_sub.scalar_one_or_none():
                now = datetime.now(timezone.utc)
                if payment.product_type == "subscription_monthly":
                    expires = now + timedelta(days=30)
                    plan_type = "monthly"
                else:
                    expires = now + timedelta(days=365)
                    plan_type = "yearly"

                subscription = Subscription(
                    user_id=payment.user_id,
                    plan_type=plan_type,
                    status="active",
                    payment_id=payment.id,
                    starts_at=now,
                    expires_at=expires,
                )
                db.add(subscription)
                logger.info("Webhook: subscription activated for user %s", payment.user_id)

        logger.info("Webhook: payment %s marked succeeded", payment_id)
    elif status in ("failed", "canceled", "blocked"):
        payment.status = "failed"
        logger.info("Webhook: payment %s marked failed (%s)", payment_id, status)

    await db.commit()
    return {"status": "ok"}
