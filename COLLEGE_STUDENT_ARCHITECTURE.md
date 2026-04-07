# College/Institution & Student Management Architecture

## 1. COLLEGE MODEL
**File:** [backend/models/__init__.py](backend/models/__init__.py#L390)

```python
class College(Base):
    """College/institution model."""
    __tablename__ = "colleges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String(500), nullable=False)
    official_email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    contact_person_name = Column(String(255), nullable=False)
    designation = Column(String(255))
    phone_number = Column(String(20))
    city = Column(String(255))
    state = Column(String(255))
    institution_type = Column(String(50))  # engineering, university, medical, arts, other
    
    # Approval & Status
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected
    rejection_reason = Column(Text)
    onboarding_completed = Column(Boolean, default=False)
    
    # Profile
    logo_url = Column(String(500))
    website = Column(String(500))
    address = Column(Text)
    naac_grade = Column(String(10))
    total_students = Column(Integer, default=0)
    
    # Phase 1: Enhanced college fields
    subscription_tier = Column(String(50), default="free")  # free, basic, premium, enterprise
    max_students = Column(Integer, default=500)
    academic_year = Column(String(20))  # "2025-26"
    placement_season_start = Column(Date)
    placement_season_end = Column(Date)
    autonomy_status = Column(String(50))  # autonomous, affiliated, deemed
    affiliated_university = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"))
    
    # Relationships
    students = relationship("CollegeStudent", back_populates="college", cascade="all, delete-orphan")
    shared_profiles = relationship("SharedProfile", back_populates="college", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="college", cascade="all, delete-orphan")
    coe_groups = relationship("COEGroup", back_populates="college", cascade="all, delete-orphan")
    alerts = relationship("CollegeAlert", back_populates="college", cascade="all, delete-orphan")
```

### Key Features:
- **Authentication**: Password hash for college login
- **Status Flow**: pending → approved → rejected
- **Subscription Tiers**: free, basic, premium, enterprise (Phase 1)
- **Placements**: Season-based tracking with start/end dates
- **Relationships**: Owns students, departments, COE groups, and alerts

---

## 2. COLLEGE-STUDENT MODEL & RELATIONSHIPS
**File:** [backend/models/__init__.py](backend/models/__init__.py#L440)

```python
class CollegeStudent(Base):
    """Student linked to a college — tracks onboarding status."""
    __tablename__ = "college_students"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    name = Column(String(255))
    branch = Column(String(255))
    graduation_year = Column(Integer)
    
    # Link to actual User account
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    
    # Onboarding Status: invited → registered → ready
    status = Column(String(20), default="invited", index=True)
    invitation_token = Column(String(255))
    
    # Phase 1: Enhanced student profile
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), index=True)
    roll_number = Column(String(50))
    degree_type = Column(String(100))  # B.Tech, M.Tech, BCA, MBA
    current_semester = Column(Integer, default=1)
    cgpa = Column(Float)
    admission_year = Column(Integer)
    
    # Contact & external profiles
    phone = Column(String(20))
    linkedin_url = Column(String(500))
    github_url = Column(String(500))
    portfolio_url = Column(String(500))
    
    # Resume & readiness tracking (denormalized for fast queries at scale)
    resume_score = Column(Float)  # Latest ATS score
    resume_status = Column(String(30), default="none")  # none, uploaded, optimized
    interview_readiness_score = Column(Float, default=0)
    
    # Placement tracking
    placement_status = Column(String(30), default="not_started", index=True)
    # not_started, preparing, applying, interviewing, placed, opted_out
    placed_company = Column(String(255))
    placed_role = Column(String(255))
    placed_salary_lpa = Column(Float)
    placed_at = Column(DateTime(timezone=True))
    
    # Timestamps
    invited_at = Column(DateTime(timezone=True))
    registered_at = Column(DateTime(timezone=True))
    ready_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Composite indexes for scale
    __table_args__ = (
        Index('idx_cs_college_dept', 'college_id', 'department_id'),
        Index('idx_cs_college_year', 'college_id', 'graduation_year'),
        Index('idx_cs_college_roll', 'college_id', 'roll_number'),
    )
    
    # Relationships
    college = relationship("College", back_populates="students")
    user = relationship("User")  # Links to User account when registered
    department = relationship("Department", back_populates="students")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    coe_memberships = relationship("COEMembership", back_populates="student", cascade="all, delete-orphan")
```

### Student Status Lifecycle:
1. **invited** - College adds student, invitation email sent
2. **registered** - Student registers with email matching invitation
3. **ready** - Student uploads their first resume

### Key Relationships:
| Relationship | Model | Purpose |
|---|---|---|
| `college` | College | Back-reference to owning college |
| `user` | User | Links to actual account when student registers |
| `department` | Department | Student's academic department |
| `skills` | StudentSkill | Skills extracted from resume, curriculum, etc. |
| `coe_memberships` | COEMembership | Center of Excellence group memberships |

---

## 3. COLLEGE SERVICE
**File:** [backend/services/college_service.py](backend/services/college_service.py)

```python
class CollegeService:
    """Business logic for college student management."""
    
    async def process_student_emails(
        db: AsyncSession,
        college_id: int,
        students_data: List[dict],
    ) -> dict:
        """
        Process uploaded student emails:
        1. Check each email against users table
        2. If user exists + has resume → status = 'ready'
        3. If user exists + no resume → status = 'registered'
        4. If user doesn't exist → status = 'invited'
        
        Returns summary of processed students.
        """
        # Returns: {
        #     "total": count,
        #     "invited": count,
        #     "registered": count,
        #     "ready": count,
        #     "already_exists": count,
        #     "students": [CollegeStudent instances],
        # }
```

### Key Methods:

#### `process_student_emails(db, college_id, students_data)`
- **Input**: List of student data dicts with email, name, branch, etc.
- **Logic**: 
  - ✅ Checks if email already linked to college
  - ✅ Checks if user exists in system
  - ✅ If user has resume → `ready`
  - ✅ If user registered but no resume → `registered`
  - ✅ If new user → `invited` with token
- **Output**: Summary with counts and CollegeStudent instances

#### `send_invitations(db, college_id, college_name, frontend_url)`
- Sends invitation emails to all 'invited' students
- Updates `invited_at` timestamp when sent
- Returns: `{"sent": count, "failed": count, "total": count}`

#### `update_student_status_on_register(db, user_id, user_email)`
- Called when a user registers (auth event)
- Finds all college_students with matching email + status='invited'
- Updates: `user_id`, `status='registered'`, `registered_at=now`
- Links student account to user account

#### `update_student_status_on_resume_upload(db, user_id)`
- Called when user uploads first resume
- Finds all college_students linked to user with status='registered'
- Updates: `status='ready'`, `ready_at=now`

---

## 4. COLLEGE ROUTES & DASHBOARDS
**File:** [backend/routes/college.py](backend/routes/college.py)

### Authentication Routes

#### `POST /college/register`
- Registers new college/institution
- Input: `CollegeRegisterRequest` (institution_name, official_email, password, etc.)
- Creates College record with `status='pending'` (awaiting admin approval)
- Sends confirmation + admin alert emails

#### `POST /college/login`
- Login for college users
- Returns JWT token + college status
- Used to check if college is approved/rejected before dashboard access

#### `GET /college/profile`
- Get current college profile
- Returns: `CollegeResponse`

#### `PUT /college/profile`
- Update college profile (onboarding, settings)
- Updates logo, website, address, NAAC grade, etc.

#### `POST /college/onboarding/complete`
- Mark college onboarding as complete
- Sets `onboarding_completed=True`

### Student Management Routes

#### `POST /college/students/upload`
- Bulk upload students via:
  - Excel (.xlsx) file
  - CSV file
  - Plain text email list
- Calls `college_service.process_student_emails()`
- Returns: `StudentUploadResponse` with breakdown and student list

#### `POST /college/students/add`
- Manual student entry via JSON form
- Each item: `StudentUploadItem` (email, name, branch, CGPA, etc.)
- Same processing as upload
- Returns: `StudentUploadResponse`

#### `GET /college/students/template`
- Download CSV template for bulk upload
- Headers: email, name, roll_number, branch, degree_type, graduation_year, admission_year, current_semester, cgpa, phone

#### `GET /college/students`
- **List all students for college with filtering & pagination**
- Query Parameters:
  - `department_id` - Filter by department
  - `graduation_year` - Filter by graduation year
  - `status` - Filter by (invited, registered, ready)
  - `placement_status` - Filter by placement progress
  - `page` - Pagination (default 1)
  - `page_size` - Page size (default 50, max 200)
- **Enriches response with**:
  - User profile data (if linked)
  - Resume information
  - Skills from StudentSkill table
  - COE group memberships
  - Department name lookup
- Returns: `List[CollegeStudentResponse]`

#### `GET /college/students/{student_id}/resumes`
- Get detailed resume data for specific student
- Includes: title, ATS score, optimization status, raw text, sections
- Only accessible if college owns the student

#### `GET /college/students/stats`
- **Aggregated dashboard statistics**
- Returns: `CollegeStatsResponse`
  - Total students, by status (invited/registered/ready)
  - Average CGPA
  - Placement readiness percentage
  - Top skills distribution
  - Department breakdown
  - Placement statistics
  - Resume statistics

#### `POST /college/students/invite`
- Send invitation emails to all 'invited' students
- Requires college to be 'approved' status
- Returns: `{"sent": count, "failed": count, "total": count}`

#### Other Student Routes
- `DELETE /college/students/{student_id}` - Remove student
- `PUT /college/students/{student_id}` - Update student fields
- `POST /college/students/bulk-update` - Bulk status updates

### Profile Sharing Routes

#### `POST /college/students/share`
- Share student profiles with recruiter
- Input: `ShareProfilesRequest` (student_ids, recruiter_email, expires_in_days, filter_criteria)
- Creates `SharedProfile` with unique share token
- Returns: `ShareProfilesResponse` with share URL + expiry

#### `GET /college/share/{share_token}` (public)
- Recruiter views shared student profiles
- Increments view_count
- Updates last_viewed_at

---

## 5. RESPONSE SCHEMAS

### `CollegeResponse` (College Profile)
```python
{
    "id": int,
    "institution_name": str,
    "official_email": str,
    "contact_person_name": str,
    "status": str,  # pending, approved, rejected
    "logo_url": Optional[str],
    "website": Optional[str],
    "address": Optional[str],
    "total_students": Optional[int],
    "onboarding_completed": bool,
    # Phase 1 fields
    "subscription_tier": str,  # free, basic, premium, enterprise
    "max_students": int,
    "academic_year": Optional[str],
    "autonomy_status": Optional[str],
    "affiliated_university": Optional[str],
}
```

### `CollegeStudentResponse` (Student Profile)
```python
{
    "id": int,
    "email": str,
    "name": Optional[str],
    "status": str,  # invited, registered, ready
    "user_id": Optional[int],  # Links to User.id when registered
    
    # User-linked data (enriched)
    "full_name": Optional[str],
    "phone": Optional[str],
    "linkedin_url": Optional[str],
    "profile_picture_url": Optional[str],
    "has_resume": bool,
    "resume_count": int,
    "resumes": List[StudentResumeInfo],
    "skills": List[str],  # Skill names
    "skill_details": List[{skill_name, proficiency, source}],
    
    # Phase 1: Enhanced student fields
    "department_id": Optional[int],
    "department_name": Optional[str],
    "roll_number": Optional[str],
    "degree_type": Optional[str],  # B.Tech, M.Tech, etc.
    "current_semester": Optional[int],
    "admission_year": Optional[int],
    "cgpa": Optional[float],
    "github_url": Optional[str],
    "portfolio_url": Optional[str],
    
    # Resume & readiness
    "resume_score": Optional[float],  # ATS score
    "resume_status": str,  # none, uploaded, optimized
    "interview_readiness_score": Optional[float],
    
    # Placement tracking
    "placement_status": str,
    "placed_company": Optional[str],
    "placed_role": Optional[str],
    "placed_salary_lpa": Optional[float],
    
    # COE involvement
    "coe_groups": List[{coe_name, coe_code, role}],
    
    # Timestamps
    "created_at": datetime,
    "invited_at": Optional[datetime],
    "registered_at": Optional[datetime],
    "ready_at": Optional[datetime],
}
```

### `CollegeStatsResponse` (Dashboard Stats)
```python
{
    "total_students": int,
    "invited": int,
    "registered": int,
    "ready": int,
    "avg_cgpa": Optional[float],
    "placement_ready_percent": float,
    "top_skills": List[dict],  # [{skill, count}]
    
    # Phase 1 enhanced
    "department_breakdown": List[{dept, count, avg_cgpa}],
    "placement_stats": {placed, preparing, opted_out, avg_salary},
    "resume_stats": {none, uploaded, optimized, avg_score},
}
```

### `StudentUploadResponse` (Bulk Upload Result)
```python
{
    "total": int,           # Total processed
    "invited": int,         # New users
    "registered": int,      # Existing users no resume
    "ready": int,           # Existing users with resume
    "already_exists": int,  # Already linked to college
    "students": List[CollegeStudentResponse],
}
```

---

## 6. PHASE 1: RELATED MODELS

### Department
```python
class Department(Base):
    college_id: ForeignKey to College
    name: str           # "Computer Science and Engineering"
    code: str           # "CSE", "ECE"
    degree_type: str    # "B.Tech", "M.Tech"
    students: relationship to CollegeStudent
    courses: relationship to CurriculumCourse
```

### StudentSkill
```python
class StudentSkill(Base):
    student_id: ForeignKey to CollegeStudent
    skill_id: ForeignKey to SkillTaxonomy
    proficiency: str    # beginner, intermediate, advanced, expert
    source: str         # resume, curriculum, self, certification, project
    verified: bool
```

### COEGroup (Center of Excellence)
```python
class COEGroup(Base):
    college_id: ForeignKey to College
    name: str           # "AI/ML Center of Excellence"
    code: str           # "AI_ML"
    focus_skills: List[int]  # SkillTaxonomy IDs
```

### SharedProfile (Recruiter Profile Sharing)
```python
class SharedProfile(Base):
    college_id: ForeignKey to College
    share_token: str
    recruiter_email: str
    student_ids: List[int]
    expires_at: DateTime
    view_count: int
    filter_criteria: JSON  # {skills: [...], min_cgpa: 7.0, coe: "AI_ML"}
```

---

## 7. DATA FLOW: STUDENT TRACKING

### Flow 1: Bulk Upload → Invitation
```
College uploads CSV/Excel
    ↓
college_service.process_student_emails()
    ↓
For each email:
  - Check if already linked to college (skip if yes)
  - Check if email in users table
    - If user + has resume → CollegeStudent(status='ready', user_id=X)
    - If user + no resume → CollegeStudent(status='registered', user_id=X)
    - If new user → CollegeStudent(status='invited', invitation_token=X)
    ↓
college_service.send_invitations()
    ↓
Email sent to all 'invited' students with invitation link
```

### Flow 2: User Registration → Auto-Link
```
User registers via sign-up form (email)
    ↓
auth_service triggers: college_service.update_student_status_on_register()
    ↓
Query: Find CollegeStudent records with email + status='invited'
    ↓
Update: user_id=X, status='registered', registered_at=now
    ↓
Student now appears in college dashboard under 'registered'
```

### Flow 3: Resume Upload → Ready State
```
User uploads resume
    ↓
resume_processor triggers: college_service.update_student_status_on_resume_upload()
    ↓
Query: Find CollegeStudent records linked to user with status='registered'
    ↓
Update: status='ready', ready_at=now
Update: resume_score (denormalized ATS score)
Update: resume_status = 'uploaded' or 'optimized'
    ↓
Student now appears in college dashboard under 'ready'
College can share student with recruiters
```

### Flow 4: College Dashboard View
```
College requests: GET /college/students?status=ready
    ↓
Backend queries CollegeStudent table (filtered, paginated)
    ↓
For each student:
  - Lookup linked User if user_id set
  - Fetch User's Resumes
  - Fetch StudentSkill records
  - Lookup Department name
  - Fetch COEMembership records
    ↓
Build enriched CollegeStudentResponse with:
  - Resume data
  - Skills + proficiency
  - COE memberships
  - Department assignment
  - Placement status
    ↓
Return paginated, enriched list to dashboard
```

---

## 8. KEY INDEXES FOR PERFORMANCE
```python
# CollegeStudent table indexes
Index('idx_cs_college_dept', 'college_id', 'department_id')
Index('idx_cs_college_year', 'college_id', 'graduation_year')
Index('idx_cs_college_roll', 'college_id', 'roll_number')

# Single column indexes
college_id (foreign key, cascade delete)
email
status
placement_status
```

---

## 9. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **College Registration** | Email → Password auth, Status: pending/approved/rejected |
| **Student Addition** | Bulk upload (CSV/Excel) or manual JSON entry |
| **Student Status** | invited → registered → ready (state machine) |
| **User Linking** | CollegeStudent.user_id links to User.id on registration |
| **Resume Tracking** | Denormalized: resume_score, resume_status, interview_readiness_score |
| **Placement Tracking** | not_started → preparing → applying → interviewing → placed/opted_out |
| **Scale Features** | Phase 1: Departments, Skills, COE groups, Shared profiles |
| **Dashboard Queries** | Supports filtering by dept, year, status, placement with pagination |
| **Skill Tracking** | StudentSkill table: source (resume, curriculum, self, certification) |
| **Audit Trail** | CollegeAuditLog tracks college-level actions for compliance |
