"""
Migration script to create the payments table.
Run: python add_payments_table.py
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine


CREATE_PAYMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    zoho_session_id VARCHAR(255) UNIQUE,
    zoho_payment_id VARCHAR(255) UNIQUE,
    amount FLOAT NOT NULL DEFAULT 49.0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description TEXT,
    reference_number VARCHAR(255),
    product_type VARCHAR(100) NOT NULL DEFAULT 'resume_download',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
"""

CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id);",
    "CREATE INDEX IF NOT EXISTS ix_payments_resume_id ON payments(resume_id);",
    "CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status);",
    "CREATE INDEX IF NOT EXISTS ix_payments_zoho_session_id ON payments(zoho_session_id);",
    "CREATE INDEX IF NOT EXISTS ix_payments_zoho_payment_id ON payments(zoho_payment_id);",
    "CREATE INDEX IF NOT EXISTS ix_payments_user_resume ON payments(user_id, resume_id);",
]


async def run_migration():
    print("Starting payments table migration...")
    
    async with engine.begin() as conn:
        # Check if table already exists
        result = await conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments')"
        ))
        exists = result.scalar()
        
        if exists:
            print("✅ payments table already exists - skipping creation")
        else:
            print("Creating payments table...")
            await conn.execute(text(CREATE_PAYMENTS_TABLE))
            print("✅ payments table created")
        
        # Create indexes (IF NOT EXISTS is idempotent)
        print("Creating indexes...")
        for idx_sql in CREATE_INDEXES:
            await conn.execute(text(idx_sql))
        print("✅ Indexes created/verified")
    
    print("\n✅ Migration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
