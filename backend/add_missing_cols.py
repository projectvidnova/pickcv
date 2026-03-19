"""Add ALL missing Phase 1 columns to existing tables."""
import asyncio
from database import async_session_maker
from sqlalchemy import text


async def migrate():
    async with async_session_maker() as session:
        stmts = [
            # --- college_students: enhanced profile columns ---
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS cgpa FLOAT",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS admission_year INTEGER",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_score FLOAT",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS resume_status VARCHAR(30) DEFAULT 'none'",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS interview_readiness_score FLOAT DEFAULT 0",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placement_status VARCHAR(30) DEFAULT 'not_started'",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_company VARCHAR(255)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_role VARCHAR(255)",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_salary_lpa FLOAT",
            "ALTER TABLE college_students ADD COLUMN IF NOT EXISTS placed_at TIMESTAMPTZ",
            # --- shared_profiles: enhanced columns ---
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255)",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS employer_email VARCHAR(255)",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS role_title VARCHAR(255)",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS message TEXT",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE",
            "ALTER TABLE shared_profiles ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ",
            # --- indexes ---
            "CREATE INDEX IF NOT EXISTS idx_cs_department ON college_students(department_id)",
            "CREATE INDEX IF NOT EXISTS idx_cs_placement ON college_students(placement_status)",
            "CREATE INDEX IF NOT EXISTS idx_cs_college_status ON college_students(college_id, status)",
            "CREATE INDEX IF NOT EXISTS idx_cs_college_placement ON college_students(college_id, placement_status)",
        ]
        for stmt in stmts:
            try:
                await session.execute(text(stmt))
                if "ADD COLUMN" in stmt:
                    label = stmt.split("IF NOT EXISTS ")[1].split(" ")[0]
                elif "CREATE INDEX" in stmt:
                    label = stmt.split("IF NOT EXISTS ")[1].split(" ")[0]
                else:
                    label = stmt[:60]
                print(f"OK: {label}")
            except Exception as e:
                print(f"SKIP: {e}")
        await session.commit()
        print("\nAll Phase 1 column migrations complete!")


asyncio.run(migrate())
