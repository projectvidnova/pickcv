"""College module business logic service."""
import secrets
import csv
import io
import logging
from datetime import datetime, timezone
from typing import List, Tuple, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models import User, Resume, CollegeStudent, College

logger = logging.getLogger(__name__)


class CollegeService:
    """Business logic for college student management."""

    async def process_student_emails(
        self,
        db: AsyncSession,
        college_id: int,
        students_data: List[dict],
    ) -> dict:
        """
        Process uploaded student emails:
        1. Check each email against the users table
        2. If user exists + has resume → status = 'ready'
        3. If user exists + no resume → status = 'registered'
        4. If user doesn't exist → status = 'invited'

        Returns summary of processed students.
        """
        results = {
            "total": 0,
            "invited": 0,
            "registered": 0,
            "ready": 0,
            "already_exists": 0,
            "students": [],
        }

        for student_data in students_data:
            email = student_data.get("email", "").strip().lower()
            if not email:
                continue

            results["total"] += 1

            # Check if this student is already linked to this college
            existing = await db.execute(
                select(CollegeStudent).where(
                    CollegeStudent.college_id == college_id,
                    CollegeStudent.email == email,
                )
            )
            existing_record = existing.scalar_one_or_none()

            if existing_record:
                results["already_exists"] += 1
                results["students"].append(existing_record)
                continue

            # Check if user exists in our system
            user_result = await db.execute(
                select(User).where(User.email == email)
            )
            user = user_result.scalar_one_or_none()

            now = datetime.now(timezone.utc)

            # Common extra fields from upload
            extra_fields = {
                "cgpa": student_data.get("cgpa"),
                "current_semester": student_data.get("current_semester"),
            }

            if user:
                # Check if user has at least one resume
                resume_result = await db.execute(
                    select(func.count(Resume.id)).where(Resume.user_id == user.id)
                )
                resume_count = resume_result.scalar() or 0

                if resume_count > 0:
                    status = "ready"
                    results["ready"] += 1
                    student = CollegeStudent(
                        college_id=college_id,
                        email=email,
                        name=student_data.get("name") or user.full_name,
                        branch=student_data.get("branch"),
                        graduation_year=student_data.get("graduation_year"),
                        user_id=user.id,
                        status="ready",
                        registered_at=user.created_at,
                        ready_at=now,
                        created_at=now,
                        **extra_fields,
                    )
                else:
                    status = "registered"
                    results["registered"] += 1
                    student = CollegeStudent(
                        college_id=college_id,
                        email=email,
                        name=student_data.get("name") or user.full_name,
                        branch=student_data.get("branch"),
                        graduation_year=student_data.get("graduation_year"),
                        user_id=user.id,
                        status="registered",
                        registered_at=user.created_at,
                        created_at=now,
                        **extra_fields,
                    )
            else:
                # User not in system — will need invitation
                results["invited"] += 1
                invitation_token = secrets.token_urlsafe(32)
                student = CollegeStudent(
                    college_id=college_id,
                    email=email,
                    name=student_data.get("name"),
                    branch=student_data.get("branch"),
                    graduation_year=student_data.get("graduation_year"),
                    status="invited",
                    invitation_token=invitation_token,
                    created_at=now,
                    **extra_fields,
                )

            db.add(student)
            results["students"].append(student)

        await db.commit()

        # Refresh all students to get IDs
        for student in results["students"]:
            await db.refresh(student)

        return results

    async def send_invitations(
        self,
        db: AsyncSession,
        college_id: int,
        college_name: str,
        frontend_url: str,
    ) -> dict:
        """Send invitation emails to all 'invited' students for this college."""
        from services.email_service import email_service

        result = await db.execute(
            select(CollegeStudent).where(
                CollegeStudent.college_id == college_id,
                CollegeStudent.status == "invited",
                CollegeStudent.invited_at.is_(None),
            )
        )
        students = result.scalars().all()

        sent = 0
        failed = 0
        now = datetime.now(timezone.utc)

        for student in students:
            success = email_service.send_student_invitation_email(
                recipient_email=student.email,
                student_name=student.name or "Student",
                college_name=college_name,
                invitation_token=student.invitation_token or "",
                frontend_url=frontend_url,
            )
            if success:
                student.invited_at = now
                sent += 1
            else:
                failed += 1

        await db.commit()
        return {"sent": sent, "failed": failed, "total": len(students)}

    async def notify_existing_students(
        self,
        db: AsyncSession,
        college_id: int,
        college_name: str,
        frontend_url: str,
    ) -> dict:
        """Send notification emails to registered/ready students just linked to this college."""
        from services.email_service import email_service

        result = await db.execute(
            select(CollegeStudent).where(
                CollegeStudent.college_id == college_id,
                CollegeStudent.status.in_(["registered", "ready"]),
                CollegeStudent.invited_at.is_(None),
            )
        )
        students = result.scalars().all()

        sent = 0
        failed = 0
        now = datetime.now(timezone.utc)

        for student in students:
            success = email_service.send_student_college_linked_email(
                recipient_email=student.email,
                student_name=student.name or "Student",
                college_name=college_name,
                frontend_url=frontend_url,
            )
            if success:
                student.invited_at = now
                sent += 1
            else:
                failed += 1

        await db.commit()
        return {"sent": sent, "failed": failed, "total": len(students)}

    async def update_student_status_on_register(
        self, db: AsyncSession, user_id: int, user_email: str
    ):
        """Called when a new user registers — check if they're a college student."""
        result = await db.execute(
            select(CollegeStudent).where(
                CollegeStudent.email == user_email.lower(),
                CollegeStudent.status == "invited",
            )
        )
        students = result.scalars().all()

        now = datetime.now(timezone.utc)
        for student in students:
            student.user_id = user_id
            student.status = "registered"
            student.registered_at = now
            logger.info(
                f"Student {user_email} registered — linked to college {student.college_id}"
            )

        if students:
            await db.commit()

    async def update_student_status_on_resume_upload(
        self, db: AsyncSession, user_id: int, raw_text: str = ""
    ):
        """Called on every resume upload — update status and extract skills + CGPA."""
        # Find ALL college students for this user (registered or ready)
        result = await db.execute(
            select(CollegeStudent).where(
                CollegeStudent.user_id == user_id,
                CollegeStudent.status.in_(["registered", "ready"]),
            )
        )
        students = result.scalars().all()

        now = datetime.now(timezone.utc)
        for student in students:
            # Transition registered → ready on first upload
            if student.status == "registered":
                student.status = "ready"
                student.ready_at = now
                logger.info(
                    f"Student user_id={user_id} uploaded resume — status → ready "
                    f"(college {student.college_id})"
                )

            # Extract skills and CGPA from resume text
            if raw_text:
                try:
                    from services.gemini_service import gemini_service
                    from services.skill_analytics_service import extract_and_store_student_skills

                    skills_list = await gemini_service.extract_skills(raw_text)
                    if skills_list:
                        count = await extract_and_store_student_skills(
                            db, student.id, skills_list, source="resume"
                        )
                        logger.info(
                            f"Extracted {count} skills for student {student.id} from resume"
                        )
                except Exception as e:
                    logger.warning(f"Skill extraction failed for student {student.id}: {e}")

                try:
                    from services.gemini_service import gemini_service as gs
                    cgpa = await gs.extract_cgpa(raw_text)
                    if cgpa is not None:
                        student.cgpa = cgpa
                        logger.info(
                            f"Extracted CGPA {cgpa} for student {student.id} from resume"
                        )
                except Exception as e:
                    logger.warning(f"CGPA extraction failed for student {student.id}: {e}")

        if students:
            await db.commit()

    @staticmethod
    def _get_field(row: dict, *keys: str) -> Optional[str]:
        """Get a field value trying multiple key variants."""
        for key in keys:
            val = row.get(key, "")
            if val and str(val).strip():
                return str(val).strip()
        return None

    def _extract_student_dict(self, row: dict) -> Optional[dict]:
        """Extract a student dict from a row using flexible column names."""
        email = self._get_field(row, "email", "Email", "EMAIL", "email_id", "Email ID")
        if not email:
            return None
        student: dict = {"email": email}
        student["name"] = self._get_field(row, "name", "Name", "NAME", "student_name", "Student Name")
        student["branch"] = self._get_field(row, "branch", "Branch", "BRANCH", "department", "Department")
        student["graduation_year"] = self._parse_year(
            self._get_field(row, "graduation_year", "Graduation Year", "graduation year", "GRADUATION_YEAR", "year", "Year", "YEAR") or ""
        )
        # Numeric fields
        cgpa_val = self._get_field(row, "cgpa", "CGPA", "Cgpa", "gpa", "GPA")
        student["cgpa"] = float(cgpa_val) if cgpa_val else None
        sem_val = self._get_field(row, "current_semester", "Current Semester", "semester", "Semester", "SEMESTER", "sem", "Sem", "SEM")
        student["current_semester"] = int(sem_val) if sem_val and str(sem_val).strip().isdigit() else None
        return student

    def parse_csv_content(self, content: str) -> List[dict]:
        """Parse CSV content into list of student dicts."""
        students = []
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            student = self._extract_student_dict(row)
            if student:
                students.append(student)
        return students

    def parse_excel_content(self, file_data: bytes) -> List[dict]:
        """Parse Excel (.xlsx) file into list of student dicts."""
        import openpyxl

        wb = openpyxl.load_workbook(io.BytesIO(file_data), read_only=True)
        ws = wb.active
        if ws is None:
            return []

        students = []
        headers = []

        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                headers = [str(cell or "").strip() for cell in row]
                continue

            row_dict = {}
            for j, cell in enumerate(row):
                if j < len(headers):
                    row_dict[headers[j]] = str(cell or "").strip() if cell else ""

            student = self._extract_student_dict(row_dict)
            if student:
                students.append(student)

        wb.close()
        return students

    def parse_email_list(self, text: str) -> List[dict]:
        """Parse plain text email list (one per line)."""
        students = []
        for line in text.strip().split("\n"):
            email = line.strip()
            if email and "@" in email:
                students.append({"email": email})
        return students

    @staticmethod
    def _parse_year(val: str) -> Optional[int]:
        try:
            year = int(str(val).strip())
            return year if 2000 <= year <= 2050 else None
        except (ValueError, TypeError):
            return None


college_service = CollegeService()
