"""
E2E Test Support Routes — STAGING ONLY.

Provides cleanup endpoints for automated end-to-end tests.
All test data uses the prefix 'e2e_test_' in emails so it can be
safely identified and purged without touching real data.

This router is ONLY registered when ENVIRONMENT=staging.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, delete, select
from database import get_db
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# A simple shared secret to prevent random callers from wiping data.
# In CI this is injected via E2E_CLEANUP_SECRET env-var / GitHub secret.
E2E_SECRET = settings.secret_key  # reuse app secret; only staging has this route


async def _verify_e2e_secret(x_e2e_secret: str = Header(...)):
    """Verify the caller knows the staging secret."""
    if x_e2e_secret != E2E_SECRET:
        raise HTTPException(status_code=403, detail="Invalid E2E secret")


# ── Prefix used by all E2E test accounts ──────────────────────────
TEST_EMAIL_PREFIX = "e2e_test_"
TEST_COLLEGE_PREFIX = "e2e_college_"


@router.post("/cleanup", dependencies=[Depends(_verify_e2e_secret)])
async def cleanup_test_data(db: AsyncSession = Depends(get_db)):
    """
    Delete ALL rows created by E2E tests (identified by email prefix).

    Deletion order respects foreign-key constraints:
      1. payments / subscriptions  (user_id FK)
      2. resumes                   (user_id FK)
      3. user_profiles             (user_id FK)
      4. user_skills               (user_id FK)
      5. work_experiences          (user_id FK)
      6. education                 (user_id FK)
      7. job_applications          (user_id FK)
      8. saved_jobs                (user_id FK)
      9. users                     (root)
     10. college child tables      (college_id FK)
     11. colleges                  (root)
    """
    deleted = {}

    try:
        # ── Get test user IDs ────────────────────────────
        user_rows = await db.execute(
            text("SELECT id FROM users WHERE email LIKE :prefix"),
            {"prefix": f"{TEST_EMAIL_PREFIX}%"},
        )
        user_ids = [r[0] for r in user_rows.fetchall()]

        if user_ids:
            id_list = ",".join(str(uid) for uid in user_ids)

            # Delete child tables first (order matters for FK)
            for table in [
                "payments", "subscriptions",
                "resumes",
                "user_profiles", "user_skills",
                "work_experiences", "education",
                "job_applications", "saved_jobs",
            ]:
                try:
                    result = await db.execute(
                        text(f"DELETE FROM {table} WHERE user_id IN ({id_list})")
                    )
                    deleted[table] = result.rowcount
                except Exception as e:
                    # Table may not exist — that's fine
                    logger.debug(f"Skipping {table}: {e}")
                    deleted[table] = 0

            # Delete users
            result = await db.execute(
                text(f"DELETE FROM users WHERE id IN ({id_list})")
            )
            deleted["users"] = result.rowcount

        # ── Get test college IDs ─────────────────────────
        college_rows = await db.execute(
            text("SELECT id FROM colleges WHERE email LIKE :prefix OR official_email LIKE :prefix"),
            {"prefix": f"{TEST_COLLEGE_PREFIX}%"},
        )
        college_ids = [r[0] for r in college_rows.fetchall()]

        if college_ids:
            cid_list = ",".join(str(cid) for cid in college_ids)

            for table in [
                "college_audit_log", "college_alerts",
                "shared_profiles", "college_students",
                "coe_memberships", "coe_groups",
                "course_skill_mapping", "curriculum_courses",
                "departments",
            ]:
                try:
                    result = await db.execute(
                        text(f"DELETE FROM {table} WHERE college_id IN ({cid_list})")
                    )
                    deleted[table] = result.rowcount
                except Exception as e:
                    logger.debug(f"Skipping {table}: {e}")
                    deleted[table] = 0

            result = await db.execute(
                text(f"DELETE FROM colleges WHERE id IN ({cid_list})")
            )
            deleted["colleges"] = result.rowcount

        await db.commit()

        total = sum(deleted.values())
        logger.info(f"E2E cleanup: removed {total} rows across {len(deleted)} tables")
        return {"status": "ok", "deleted": deleted, "total_rows": total}

    except Exception as e:
        await db.rollback()
        logger.error(f"E2E cleanup failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", dependencies=[Depends(_verify_e2e_secret)])
async def e2e_health():
    """Quick check that the E2E routes are active (staging only)."""
    return {"status": "ok", "environment": settings.environment}


@router.post("/verify-user", dependencies=[Depends(_verify_e2e_secret)])
async def verify_test_user(email: str, db: AsyncSession = Depends(get_db)):
    """
    Auto-verify a test user's email so E2E tests can log in
    without clicking an email link.

    Only works for emails with the E2E test prefix.
    """
    if not email.startswith(TEST_EMAIL_PREFIX):
        raise HTTPException(
            status_code=400,
            detail=f"Only test accounts (prefix '{TEST_EMAIL_PREFIX}') can be auto-verified",
        )

    result = await db.execute(
        text("UPDATE users SET is_verified = TRUE WHERE email = :email RETURNING id, email"),
        {"email": email},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    await db.commit()
    logger.info(f"E2E auto-verified user: {email}")
    return {"status": "ok", "user_id": row[0], "email": row[1], "is_verified": True}


@router.post("/approve-college", dependencies=[Depends(_verify_e2e_secret)])
async def approve_test_college(email: str, db: AsyncSession = Depends(get_db)):
    """
    Auto-approve a test college so E2E tests can proceed
    without admin approval.

    Only works for emails with the E2E college test prefix.
    """
    if not email.startswith(TEST_COLLEGE_PREFIX):
        raise HTTPException(
            status_code=400,
            detail=f"Only test colleges (prefix '{TEST_COLLEGE_PREFIX}') can be auto-approved",
        )

    result = await db.execute(
        text(
            "UPDATE colleges SET status = 'approved' "
            "WHERE official_email = :email RETURNING id, official_email"
        ),
        {"email": email},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="College not found")

    await db.commit()
    logger.info(f"E2E auto-approved college: {email}")
    return {"status": "ok", "college_id": row[0], "email": row[1], "status_val": "approved"}
