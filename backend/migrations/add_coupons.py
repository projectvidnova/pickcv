"""
Migration script to create coupons + coupon_redemptions tables and seed dummy coupons.
Run: python migrations/add_coupons.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from sqlalchemy import text
from database import engine


CREATE_COUPONS_TABLE = """
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    max_uses INTEGER NOT NULL DEFAULT 10,
    times_used INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

CREATE_COUPON_REDEMPTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_coupons_code ON coupons(code);",
    "CREATE INDEX IF NOT EXISTS ix_coupons_is_active ON coupons(is_active);",
    "CREATE INDEX IF NOT EXISTS ix_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);",
    "CREATE INDEX IF NOT EXISTS ix_coupon_redemptions_user_id ON coupon_redemptions(user_id);",
    "CREATE INDEX IF NOT EXISTS ix_coupon_redemptions_resume_id ON coupon_redemptions(resume_id);",
]

SEED_COUPONS = """
INSERT INTO coupons (code, max_uses, times_used, expires_at, is_active, description)
VALUES
    ('PICKCV100', 100, 0, '2026-12-31 23:59:59+00', TRUE, 'Launch promo – 100 free downloads'),
    ('EARLYBETA', 50, 0, '2026-06-30 23:59:59+00', TRUE, 'Early beta testers – 50 uses'),
    ('FRIEND10', 10, 0, '2026-12-31 23:59:59+00', TRUE, 'Friends & family – 10 uses'),
    ('DEMOFREE', 5, 0, '2026-12-31 23:59:59+00', TRUE, 'Demo coupon – 5 uses')
ON CONFLICT (code) DO NOTHING;
"""


async def run_migration():
    print("Starting coupons migration...")

    async with engine.begin() as conn:
        # Create coupons table
        result = await conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coupons')"
        ))
        exists = result.scalar()
        if exists:
            print("✅ coupons table already exists")
        else:
            await conn.execute(text(CREATE_COUPONS_TABLE))
            print("✅ coupons table created")

        # Create coupon_redemptions table
        result = await conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coupon_redemptions')"
        ))
        exists = result.scalar()
        if exists:
            print("✅ coupon_redemptions table already exists")
        else:
            await conn.execute(text(CREATE_COUPON_REDEMPTIONS_TABLE))
            print("✅ coupon_redemptions table created")

        # Create indexes
        for idx_sql in CREATE_INDEXES:
            await conn.execute(text(idx_sql))
        print("✅ Indexes created")

        # Seed dummy coupons
        await conn.execute(text(SEED_COUPONS))
        print("✅ Dummy coupons seeded (PICKCV100, EARLYBETA, FRIEND10, DEMOFREE)")

    print("Done!")


if __name__ == "__main__":
    asyncio.run(run_migration())
