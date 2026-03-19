# PickCV College Dashboard — Feature Roadmap

**Document Date:** March 17, 2026  
**Purpose:** College placement director + university head perspective on college dashboard features  
**Context:** PickCV enables colleges to onboard students, track placement readiness, and manage recruiter engagement

---

## Quick Start: What to Build?

**Choose one path:**

### 🚀 FASTEST PATH (Get to market in 8 weeks)
Build **Phase 1 MUST HAVEs only** (6 features):
- Student onboarding + curriculum mapping
- Skill analytics + heat maps
- Resume readiness tracking
- COE groups
- Recruiter batch sharing
- Admin governance

**Result:** MVP that solves core placement problem. Ready for one placement season.

---

### 💪 COMPLETE PATH (Get to full product in 16 weeks)
Build **Phase 1 MUST HAVEs + Phase 2 MUST HAVEs + Phase 2 SHOULD HAVEs** (9 features):
- Everything above, PLUS:
- Recruiter feedback loop
- Communication hub
- Enhanced COE groups
- Enhanced alerts
- Faculty dashboard

**Result:** Production-grade platform. Ready for scale.

---

### 🎯 STRATEGIC PATH (Enterprise-ready in 24 weeks)
Build all **MUST + SHOULD** features, defer **GOOD** (16 features):
- Everything above, PLUS:
- Curriculum alignment (industry gap analysis)
- Alumni success tracking
- Full governance + compliance
- Institutional benchmarking

**Result:** University-wide strategic tool. Drives decision-making at all levels.

---

## Key Legend

🔴 **MUST HAVE** = Critical for this phase. Don't skip.  
🟡 **SHOULD HAVE** = Important but can defer if timeline tight.  
🟢 **GOOD TO HAVE** = Nice-to-have. Build if capacity + budget allows.

---

---

## Executive Summary

The PickCV College Dashboard transforms placement chaos into actionable intelligence. It centralizes student profiles, skill tracking, recruiter relationships, and placement analytics — enabling placement directors to answer critical questions in 30 seconds.

**North Star Metric:** *"Can I instantly provide 10 job-ready students in [specific skill] to [recruiter] by [date]?"*

---

## Feature Categories

### 1. STUDENT ONBOARDING & PROFILING

**Core Capabilities:**
- **Batch intake form** — Upload CSV (name, roll number, email, branch, graduation year, CGPA)
- **Link to PickCV accounts** — Auto-invite or match existing users
- **Curriculum mapping per semester** — Each semester defines courses → skills learned
  - Example: "Data Structures" course → maps to Python, Algorithms, Problem-Solving
  - This becomes the **skill baseline** for each student
- **Personal detail tracking**
  - Internships taken, projects completed, certifications earned
  - Link to external profiles (GitHub, LinkedIn)
  - Integration points: email, phone, alternate contact

**Why It Matters:**  
You need a 360° view of what each student knows + *when* they learned it. This is the foundation for all other features.

**Data Points to Capture:**
```
Student Profile:
- Academic: Roll#, Branch, Semester, CGPA, Graduation Year
- Contact: Email, Phone, LinkedIn, GitHub
- Curriculum History: Courses per semester + dates
- Achievements: Internships, Projects, Certifications
- Status: Invited → Registered → Profile Complete → Ready for Placement
```

---

### 2. SKILL INTELLIGENCE & ANALYTICS

**Core Capabilities:**
- **Per-student skill profile**
  - What they've learned (from curriculum) vs. what's on their resume
  - Gap analysis: "Missing skills relative to peers in same branch"
  - Skill proficiency levels (Basic, Intermediate, Advanced, Expert)

- **University-wide skill heat map**
  - "Web Development: 45 students proficient, 12 advanced"
  - "Blockchain: 3 students, 0 advanced"
  - "Data Science: 78 students, 8 advanced"
  - Trend analysis: skills gaining traction vs. declining

- **Branch-wise skill distribution**
  - CSE: Strong in Web, Cloud, AI/ML. Weak in Embedded Systems, Hardware.
  - ECE: Strong in Signal Processing, Embedded. Weak in Web, Cloud.
  - Mech: Strong in CAD, Simulation. Weak in Software.

- **Skill gap analysis**
  - "Top 10 skills recruiters want" overlay on your student base
  - Gap report: "Industry wants Cloud (85%), you have 20% → 65% gap"
  - Recommendations: "Add DevOps module to 2nd semester lab"

**Visualizations:**
- Skill distribution bar charts (total students per skill)
- Trend lines (skills growing/shrinking over years)
- Heatmap: Branch × Skill (colored by proficiency %)
- Radar chart: Your students vs. industry demand

**Why It Matters:**  
Placement directors live by "can we place these students?" This tells you exactly where talent is + where upskilling is needed.

---

### 3. CENTER OF EXCELLENCE (COE) GROUPS

**Core Capabilities:**
- **Auto-suggest COE groups** based on:
  - Resume skills (what students claim)
  - Curriculum (what they studied)
  - Projects/certifications (proof of skill)
  - Optional: Self-selected interest tags
  
- **Manual COE creation & management**
  - Create groups: "Web Development CoE", "Blockchain CoE", "AI/ML CoE", "Cloud Native CoE"
  - Auto-assign students meeting skill thresholds
  - Allow student opt-in for interest-based groups
  - Assign faculty as **COE leads** (mentors)

- **COE dashboard per group**
  - Group strength: "8 students, 2 advanced, 6 intermediate"
  - Skill proficiency trend over time (improving/stagnating)
  - Recommended upskilling paths (certifications, projects, internships)
  - Job market demand tracker: "5 recruiters hiring for Blockchain skills this season"

- **Recruiter visibility**
  - Show COE strength to recruiters
  - Tag recruiter job specs to relevant COEs
  - One-click bulk outreach to COE groups

**COE Metrics:**
```
For each COE:
- Total students (and proficiency distribution)
- Certifications completed by group
- Project portfolio quality score
- Interview success rate (from previous batches)
- Recruiter demand (open positions matching COE skills)
- Placement rate + avg salary (alumni data)
```

**Why It Matters:**  
Recruiters want **depth, not breadth**. "Give me 5 solid blockchain engineers" beats "give me 50 generalists." COEs let you bundle talent + credibly communicate strength to hiring teams.

---

### 4. PLACEMENT READINESS PIPELINE

**Core Capabilities:**
- **Resume maturity score** (per student)
  - ATS match %, skill keywords present, project showcase depth
  - Traffic light system: Red (needs work) → Yellow (decent) → Green (ready)
  - Auto-recommendations: "Add 3 more projects to reach Green"

- **Interview readiness score**
  - Based on: projects (count + quality), internships, certifications, GitHub activity, mock interview scores
  - Breakdown: Technical strength, soft skills, communication
  - Growth path: "Complete 1 more project + 2 mock interviews to reach Green"

- **Batch readiness dashboard**
  - Total: "200 students, 120 ready for placement, 50 need upskilling, 30 not interested"
  - Filter by: Branch, COE, semester, CGPA range
  - Timeline: "Batch 2025 will be 80% ready by Aug 1"

- **Phased placement tracking**
  - Pre-placement prep: Aptitude training, soft skills, resume building (track %)
  - Resume submission + feedback: Who's submitted, who needs help
  - Mock interviews: Completion %, performance scores, retry tracking
  - Company season: Track applications, interviews, offers by student

- **Bottleneck identification**
  - Red flags: "12 students in CSE haven't submitted resumes (3 days left)"
  - Interventions: Auto-email reminders, flag to faculty advisors
  - Support routing: "7 students need mock interview prep → schedule sessions"

**Status Tracking:**
```
Per Student:
- Academic Status: Current semester, CGPA, branch
- Profile Completion: 60% (missing projects section)
- Resume Status: Not submitted → Drafted → Ready → Shared with recruiters
- Interview Readiness: 45/100 → Interventions: "Complete 1 project"
- Application Activity: 5 applications, 2 interviews, 0 offers
```

**Why It Matters:**  
Placement season is chaos. You need to know exactly where each batch stands + identify blockers (missing resumes, weak profiles, unprepared students) early enough to fix them.

---

### 5. RECRUITER ENGAGEMENT & OUTREACH

**Core Capabilities:**
- **Create filtered student groups for recruiters**
  - Example: "Top 20 Web Development students, ready to hire"
  - Example: "Batch 2025, CGPA > 7.5, AI/ML specialization"
  - Example: "First-year internship pool (summer 2026)"
  - Filterable by: Skill, COE, CGPA, semester, batch, availability

- **Shareable recruiter dashboards** (secure links)
  - Recruiter views anonymized student profiles
  - Can filter by skill, CGPA, COE
  - Click profile to see: resume, projects, certifications, GitHub
  - Download resumes (optimized via PickCV)

- **Bulk resume export**
  - Selected student group → optimized resumes as PDF batch
  - Ready for recruiter ATS
  - Metadata: ATS scores, key skills, contact info

- **Recruiter feedback loop**
  - Track: Which students got interviews, offers, rejections
  - Auto-flag: Skills/profiles that converted (e.g., "Blockchain students: 2 offers from startups")
  - Update metrics: "Web CoE: 15 companies interested, 5 offers last year"
  - Insights: Which COE skills are most marketable

- **Outreach campaigns**
  - Bulk email: "New batch available" with filtered student link
  - Targeted: "3 startups hiring Cloud → outreach to Cloud CoE"
  - Timing: Auto-notify recruiters 2 weeks before placement season

**Recruiter Portal Features:**
```
- Search/filter students by skill, CGPA, graduation date
- View anonymized profiles (no personal contact until match)
- Bulk download resumes
- Schedule interviews (integrated calendar)
- Post job openings (visible to matching COE groups)
- Leave feedback (helps improve recommendations)
```

**Why It Matters:**  
Placement director's life is 70% "calling companies + sending student profiles." This automates that workflow + provides data on what actually works.

---

### 6. CURRICULUM ↔ INDUSTRY ALIGNMENT

**Core Capabilities:**
- **Map curriculum to industry standards**
  - "Semester 3: Database, SQL" → Links to actual job requirement databases
  - "4th semester internship typically covers: Full-stack, DevOps, Agile"
  - "Semester 5 electives: Blockchain, ML, IoT" → Tie to industry demand

- **Skills audit vs. industry demand**
  - Gap report: "Industry wants X, your curriculum covers Y%"
  - Example: "Cloud skills: You teach 30%, industry demands 80%"
  - Example: "DevOps: You teach 10%, trending upward (+15% year-over-year)"
  - Trending: Which skills are becoming critical

- **Curriculum update recommendations**
  - "Add blockchain module to 3rd semester electives (5 recruiters hiring)"
  - "Make Git/GitHub mandatory in 2nd semester lab"
  - "Expand AI/ML from 1 course to 2 (40 students interested, high recruiter demand)"
  - Prioritized by: recruiter demand + student interest + learning impact

- **Faculty alignment**
  - Show faculty: "Your students (30 in Data Structures): 45% have Python on resume"
  - Highlight: "Your course outputs job-ready engineers in X"
  - Suggest: Faculty upskilling opportunities (new tools, frameworks)

**Audit Report Example:**
```
Skill Gap Analysis (Batch 2025):

✓ Strong Areas (>80% coverage):
  - Core CS fundamentals (Data Structures, Algorithms)
  - Web development (45 students proficient)
  - Database design (SQL mastery)

⚠ Moderate Areas (50-80% coverage):
  - Cloud platforms (AWS, GCP) — 58% coverage, industry wants 85%
  - DevOps (Docker, Kubernetes) — 30% coverage, +20% YoY demand

✗ Weak Areas (<50% coverage):
  - Blockchain — 5% coverage, but 3 startups hiring
  - System design — 20% coverage, critical for senior roles
  - Mobile development — 10% coverage, internship demand high

Recommendations:
1. Mandatory cloud module in Semester 4 (implement by 2026-07-01)
2. System design in Semester 5 electives (high ROI for salaries)
3. Blockchain optional in Semester 6 (interest-driven, captures 8-10 students)
```

**Why It Matters:**  
Curriculum stagnates. This data forces continuous alignment with industry. Proves to trustees + students that education is relevant.

---

### 7. ALUMNI SUCCESS TRACKING

**Core Capabilities:**
- **Post-placement analytics**
  - Where did last year's batch get placed? (companies, roles, locations)
  - Salary distribution: median, range, outliers
  - Which COE groups placed best?
  - Which skills actually mattered for job outcomes?

- **Outcome correlation**
  - Which certifications correlate to higher salaries?
  - Which projects lead to better roles?
  - GitHub activity → job quality correlation
  - GPA vs. placement success (is it actually predictive?)

- **Feedback loop integration**
  - "Graduates say we should teach X" → Incorporate into curriculum
  - "Most useful skill: System Design" → Prioritize in next batch
  - "Gap: Leadership/communication" → Add to soft skills track

- **Success stories dashboard**
  - Showcase: "Batch 2024: 92% placed, median ₹7.5L, 3 got FAANG offers"
  - Visualize: Career trajectories (Tier-2 startup → Tier-1 → startup founder)
  - Build reputation: Stories drive future student/recruiter interest

**Alumni Report Card:**
```
Batch 2024 (300 students):

Placement:
- Placed: 276 (92%)
- Pursuing higher ed: 18 (6%)
- Not yet placed: 6 (2%)

Outcomes:
- Avg salary: ₹6.8L (median)
- Salary range: ₹4.5L - ₹45L (outlier: startup founder)
- Top companies: TCS (45), Infosys (32), Google (8), Amazon (6), Startups (85)
- Job roles: Backend Dev (68), Frontend Dev (42), Full-Stack (35), DevOps (18), ML Eng (12)

Success Factors:
- Projects completed: 2.1 avg (placed students)
- GitHub activity: 65% (placed) vs. 12% (not placed)
- Certifications: AWS (35), GCP (12), Azure (8), Blockchain (2)
- CoE participation: 82% (placed) vs. 30% (not placed)

Top Performers:
- CoE: AI/ML (avg ₹8.2L), Cloud Native (₹7.9L), Web Dev (₹7.1L)
- Least placed: Generic profile (45% placement)

Lessons:
- "System Design learning → +₹1.5L salary premium"
- "GitHub portfolio → 3× interview callback rate"
- "CoE participation → 97% placement vs. 85% non-CoE"
```

**Why It Matters:**  
Proves ROI. Shows future batches the path to success. Data-driven feedback improves curriculum + placement strategy.

---

### 8. FACULTY & COE LEAD DASHBOARD

**Core Capabilities:**
- **Faculty metrics**
  - "Your students (30 in Data Structures): 45% have Python on resume"
  - Course impact: "Graduates from your course placed at: TCS (5), Google (2), Startups (3)"
  - Performance vs. peers: Highlight high-impact faculty
  - Suggest faculty upskilling opportunities

- **COE Lead tools**
  - Assign certifications/projects to group (e.g., "All Blockchain CoE: Take AWS cert by May")
  - Track progress dashboard: Who completed, who's struggling
  - Host group resources: Articles, projects, interview prep materials
  - Schedule mentoring sessions (sync + async)
  - Flag top performers for direct recruiter outreach

- **Mentoring workflows**
  - 1-on-1 tracking: Which students mentored, outcomes
  - Group workshops: Topic, attendance, feedback
  - Resource library: Curated for each CoE
  - Student progress tracking: Skill growth over time

**Faculty Dashboard Example:**
```
Faculty: Dr. Rajesh Kumar
Course: Data Structures (Sem 3)
Students: 30

Performance:
- Course avg: 7.8/10
- Placement rate (alumni): 92%
- Avg salary (alumni): ₹6.5L
- vs. other faculty: TOP 10%

Student Outcomes:
- Backend Dev: 8 students
- Full-Stack: 5 students
- ML Eng: 2 students
- Other: 15 students

Skills Taught → Utilized:
- Algorithms: 95% (on resumes)
- Python: 78%
- System Design thinking: 45% (could improve)

Recommendations:
- Add "System Design" project to increase salary outcomes
- Guest lecture: Industry engineer (System Design)
- Highlight: Your course → highest placement rate in CSE
```

**Why It Matters:**  
Faculty buy-in is critical. Show them their impact on placement. Recognize and reward high-impact teaching.

---

### 9. INSTITUTIONAL BENCHMARKING

**Core Capabilities:**
- **Peer comparison (optional, aggregate data)**
  - "Tier-1 colleges: 92% placement, avg ₹8L"
  - "Your college: 78% placement, avg ₹6.5L → growth area"
  - Compare: Placement rate, salary, top skills, recruiter diversity

- **Sector trends** (if PickCV aggregates across colleges)
  - "CSE branch: Avg 88% placement, trending +2% YoY"
  - "Blockchain skill: 40 colleges teaching, only 5% of students proficient"
  - "Startup placement: 15% of Tier-2 students vs. 8% Tier-3"

- **Competitive positioning**
  - "Your strengths: Web Dev, Data Science"
  - "Competitors: Stronger in Cloud, AI/ML"
  - "Opportunity: Differentiate in Blockchain + Startup ecosystem"

**Why It Matters:**  
Trustees want competitive context. Helps justify investments. Drives strategic planning.

---

### 10. GOVERNANCE & COMPLIANCE

**Core Capabilities:**
- **Role-based access control**
  - Principal/Director: Full dashboard + budget analytics
  - Placement Director: Student data + recruiter portals + placement tracking
  - Faculty: Only their branch/course data
  - Department Head: Department-wide analytics
  - COE Lead: Their CoE group data + student assignment
  - Student: Own profile + placement readiness

- **Data privacy & compliance**
  - DPDP (Digital Personal Data Protection) compliance checks
  - Student consent tracking: "Opt-in for recruiter visibility"
  - Data retention policies: Archive after X years
  - Audit logs: Who accessed what, when (compliance trail)

- **Batch cycle management**
  - Create new batch, close old batch, archive historical data
  - Bulk operations: Invite students, export data, set placement season
  - Calendar: Mark key dates (resume deadline, interview season, results)

- **Multi-stakeholder workflows**
  - Approvals: Placement director approves CoE creation
  - Notifications: Faculty notified of student gaps, recruiters of available batches
  - Escalations: Unplaced student flag → auto-notify support team

**Why It Matters:**  
Multi-stakeholder governance = messy. Clear roles prevent chaos. Compliance protection for college + students.

---

### 11. PROACTIVE ALERTS & INTERVENTIONS

**Core Capabilities:**
- **Red flag alerts**
  - "Raj Kumar (2025, CSE): Resume score 32/100 + no projects → Flag for support"
  - "Blockchain CoE: 0 recruiters interested → Consider rebranding + upskilling"
  - "Batch 2025: Only 45% submitted resumes (2 weeks before season) → Campaign launch"
  - "Faculty: "Data Structures prof has 0 students in CoE → Discuss alignment"

- **Opportunity alerts**
  - "Google posted 5 cloud roles → 8 students in Cloud CoE match criteria → Suggest applications"
  - "Your top 5 AI/ML students → 3 startups actively hiring → Outreach campaign"
  - "Batch 2024 alumni: 2 now hiring at their companies → Referral program opportunity"

- **Milestone tracking**
  - "50 days until placement season: 60% batch ready (target: 85%)"
  - "CoE formation deadline: 8/12 CoEs created"
  - "Resume optimization: 45% students used PickCV (encourage adoption)"

- **Intervention automation**
  - Auto-email: "Resume deadline tomorrow"
  - Auto-escalation: "Student unplaced after 3 months → Notify advisor"
  - Auto-grouping: "5 students interested in DevOps → Create mini-group"

**Alert Types:**
```
Critical (red):
- Student with 0 projects + placement season in 2 weeks
- CoE with 0 recruiter interest + upcoming season
- Batch placement rate dropping below target

Urgent (yellow):
- Resume submission deadline approaching
- Faculty absent from CoE leadership
- Salary outliers (investigate why some students got 3x more)

Informational (green):
- New recruiter interest in your batch
- Alumni milestone (someone got promoted)
- Trending skill (80 students interested in X)
```

**Why It Matters:**  
Proactive > reactive. Catch placement issues before they become crises. Automate routine notifications.

---

### 12. COMMUNICATION HUB

**Core Capabilities:**
- **Unified internal messaging**
  - Placement director → Students: "Resume deadline extended to Friday"
  - Faculty → CoE leads: "New project assigned to AI/ML group"
  - Admin → Recruiters: "New batch cohort ready; see link"
  - Bulk email/SMS campaigns with segmentation

- **Announcement board** (per stakeholder)
  - For students: Placement timeline, recruiter visits, CoE updates
  - For recruiters: Batch availability, skill announcements, events
  - For faculty: Teaching resources, curriculum updates

- **Integration points**
  - Calendar sync: Placement dates, interview slots, training sessions
  - Email → PickCV: Forward recruiter requests
  - SMS alerts: Critical updates (placement deadlines, offer notifications)

- **Message templates**
  - Recruiter outreach: "Here are X students ready for Y roles"
  - Student reminder: "Upload resume by Friday to get placed"
  - Faculty briefing: "Your course outcomes vs. college avg"

**Why It Matters:**  
Right now you probably use email chaos. Centralize communication → fewer missed messages + better coordination.

---

## Implementation Roadmap (MoSCoW Prioritization)

### PHASE 1: MVP Foundation (Months 1-2)
**Launch the core platform to solve immediate placement challenges**

#### MUST HAVE 🔴 (Critical for MVP)

**1. Student Onboarding & Profiling** (Weeks 1-3)
- CSV batch upload (name, roll#, email, branch, year, CGPA)
- Link to existing PickCV accounts or auto-invite
- Semester → skills curriculum mapping
- Basic profile management (contact, internships, projects)
- **Why:** Foundation for all other features. Can't proceed without student data.
- **Effort:** Medium | **Impact:** Critical

**2. Skill Analytics & Heat Maps** (Weeks 2-4)
- Per-student skill profile (learned vs. resume)
- University-wide skill distribution dashboard
- Branch-wise skill comparison (CSE vs. ECE vs. Mech)
- Basic skill gap vs. industry demand
- **Why:** Tells placement director what talent exists; drives all decisions.
- **Effort:** Medium | **Impact:** Critical

**3. Resume Readiness Tracking** (Weeks 3-5)
- Resume score per student (ATS %, keywords, project depth)
- Interview readiness estimate (based on projects, internships, certs)
- Traffic light system (Red/Yellow/Green status)
- Batch readiness dashboard (% ready breakdown)
- **Why:** Removes biggest placement bottleneck; identifies who needs help.
- **Effort:** Medium-High | **Impact:** Critical

**4. COE Groups (Basic)** (Weeks 4-6)
- Manual COE creation (Web Dev, AI/ML, Cloud, Blockchain, etc.)
- Auto-assign students based on resume skills + curriculum
- Per-COE strength dashboard (count by proficiency level)
- Student view of assigned COE
- **Why:** Enables targeted recruiter outreach; bundles talent.
- **Effort:** Medium | **Impact:** High

**5. Recruiter Batch Sharing (MVP)** (Weeks 5-7)
- Create filtered student groups by skill, COE, CGPA, branch
- Shareable secure links (no authentication needed)
- View: Student names, skills, resume, projects (anonymized)
- Bulk download resumes as PDF
- **Why:** Activates recruiter pipeline; automates manual outreach.
- **Effort:** Medium | **Impact:** High

**6. Admin Governance (Basic)** (Weeks 6-7)
- Role-based access (Placement Director, Admin, Faculty, CoE Lead)
- Student data privacy (basic DPDP compliance)
- Batch creation/management
- **Why:** Ensures data security + multi-stakeholder control.
- **Effort:** Low-Medium | **Impact:** High (security)

#### SHOULD HAVE 🟡 (Important for Month 2 if time allows)

**7. Alerts & Interventions (Basic)** (Weeks 7-8)
- Red flags: "Resume score < 40 AND placement season in 2 weeks"
- Batch alerts: "Only 60% submitted resumes (deadline tomorrow)"
- Auto-email campaigns: Resume reminders, deadlines
- **Why:** Catches placement issues early before crisis.
- **Effort:** Low-Medium | **Impact:** Medium

---

### PHASE 2: Placement Engine & Intelligence (Months 3-4)
**Scale placement success with data-driven actions**

#### MUST HAVE 🔴 (For production-grade placement season)

**8. Recruiter Feedback Loop** (Weeks 9-11)
- Track: Which students got interviews, offers, rejections
- Update COE metrics: "Blockchain CoE: 2 offers, 5 interviews, 8 views"
- Identify which skills/profiles converted
- Data: Interview-to-offer conversion rate per CoE
- **Why:** Closes feedback loop; proves recruiter interest.
- **Effort:** Medium | **Impact:** High

**9. Communication Hub** (Weeks 10-12)
- Bulk email to students (reminders, deadlines, opportunities)
- Bulk email to recruiters ("Batch ready" announcements)
- Message templates (customizable)
- Notification settings (per role)
- **Why:** Centralizes chaos; ensures no one misses critical messages.
- **Effort:** Medium | **Impact:** Medium-High

#### SHOULD HAVE 🟡 (Recommended for Month 4)

**10. COE Groups (Enhanced)** (Weeks 11-13)
- Auto-suggest COE based on projects + certifications + interests
- Student self-selection for interest-based groups
- Assign faculty as COE leads
- COE resource library (projects, articles, training)
- **Why:** Better-targeted upskilling; faculty engagement.
- **Effort:** Medium | **Impact:** Medium

**11. Proactive Alerts (Enhanced)** (Weeks 12-14)
- Opportunity alerts: "3 startups hiring in Cloud → email Cloud CoE"
- COE-specific warnings: "Blockchain CoE: 0 recruiter interest → flag for action"
- Milestone tracking: "50 days to season, 60% batch ready (target: 85%)"
- Escalation: "Unplaced student after 3 months → notify advisor"
- **Why:** Proactive > reactive. Catches opportunities + issues.
- **Effort:** Medium-High | **Impact:** Medium

**12. Faculty Dashboard (Basic)** (Weeks 13-14)
- Faculty view: "Your students (30 in Data Structures): placement rate 92%"
- Course impact: "Graduates from your course placed at: TCS (5), Google (2), startups (3)"
- Performance ranking: Highlight high-impact faculty
- **Why:** Faculty buy-in matters; shows teaching impact on outcomes.
- **Effort:** Low-Medium | **Impact:** Low-Medium (engagement)

#### GOOD TO HAVE 🟢 (Optional; defer if timeline tight)

**13. Curriculum Alignment (Basic)** (Weeks 14-16)
- Map curriculum to industry skill standards
- Gap report: "Cloud: You teach 30%, industry demands 80%"
- Trending skills: Show which skills are growing in demand
- **Why:** Drives long-term curriculum strategy.
- **Effort:** Medium | **Impact:** Low-Medium (strategic)

---

### PHASE 3: Advanced Analytics & Insights (Months 5-6)
**Data-driven university-level strategic decisions**

#### SHOULD HAVE 🟡 (Medium priority; can extend timeline)

**14. Curriculum Alignment (Full)** (Weeks 17-19)
- Map curriculum to industry standards + recruiter job specs
- Auto-recommendations: "Add Kubernetes to DevOps module"
- Faculty upskilling suggestions
- Compare teaching vs. what employers want
- **Why:** Keeps curriculum relevant; justifies investments.
- **Effort:** Medium-High | **Impact:** Medium (long-term)

**15. Alumni Success Tracking** (Weeks 18-20)
- Where did last batch get placed? (companies, roles, salaries)
- Salary distribution & trends by CoE
- Which skills/projects correlate to better outcomes
- Success stories showcase
- **Why:** Proves ROI; helps future students see pathways.
- **Effort:** Medium | **Impact:** Medium (reputation)

**16. Governance & Compliance (Full)** (Weeks 19-21)
- Fine-grained RBAC (Principal, Director, Faculty, CoE Lead, Student)
- Student consent tracking (DPDP compliance)
- Audit logs (who accessed what, when)
- Data retention policies
- **Why:** Legal protection + multi-stakeholder control.
- **Effort:** Low-Medium | **Impact:** Medium (security/compliance)

#### GOOD TO HAVE 🟢 (Nice-to-have; low priority)

**17. Institutional Benchmarking** (Weeks 20-22)
- Peer comparison: "Tier-1 colleges: 92% placement, ₹8L avg"
- Your performance: "78% placement, ₹6.5L avg"
- Sector trends (if PickCV aggregates across colleges)
- Competitive positioning analysis
- **Why:** Helps trustees understand competitiveness.
- **Effort:** Medium | **Impact:** Low (aspirational)

**18. Faculty Mentorship Workflows** (Weeks 21-23)
- Assign students to faculty mentors
- Track mentoring sessions (1-on-1, group)
- Resource library per CoE
- Progress tracking: Student skill growth over time
- **Why:** Enhances student support; faculty engagement.
- **Effort:** Medium-High | **Impact:** Low-Medium (engagement)

**19. Advanced Alerts & AI Insights** (Weeks 22-24)
- ML-based prediction: "This student unlikely to get placed without X"
- Recommendation engine: "Suggest 3 projects to improve salary potential"
- Salary prediction: "Your profile → median salary ₹X"
- Peer comparison: "You're weaker than 60% in your CoE → here's the gap"
- **Why:** Hyper-personalized student support.
- **Effort:** High | **Impact:** Low-Medium (premium feature)

---

## Priority Matrix by Feature

| Feature | Phase | Must/Should/Good | Timeline | Effort | Impact |
|---------|-------|------------------|----------|--------|--------|
| Student Onboarding | 1 | MUST | Wk 1-3 | Medium | Critical |
| Skill Analytics | 1 | MUST | Wk 2-4 | Medium | Critical |
| Resume Readiness | 1 | MUST | Wk 3-5 | M-H | Critical |
| COE Groups (Basic) | 1 | MUST | Wk 4-6 | Medium | High |
| Recruiter Sharing (MVP) | 1 | MUST | Wk 5-7 | Medium | High |
| Admin Governance (Basic) | 1 | MUST | Wk 6-7 | L-M | High |
| Alerts (Basic) | 1 | SHOULD | Wk 7-8 | L-M | Medium |
| Recruiter Feedback | 2 | MUST | Wk 9-11 | Medium | High |
| Communication Hub | 2 | MUST | Wk 10-12 | Medium | M-H |
| COE Groups (Enhanced) | 2 | SHOULD | Wk 11-13 | Medium | Medium |
| Alerts (Enhanced) | 2 | SHOULD | Wk 12-14 | M-H | Medium |
| Faculty Dashboard | 2 | SHOULD | Wk 13-14 | L-M | L-M |
| Curriculum Alignment (Basic) | 2 | GOOD | Wk 14-16 | Medium | L-M |
| Curriculum Alignment (Full) | 3 | SHOULD | Wk 17-19 | M-H | Medium |
| Alumni Tracking | 3 | SHOULD | Wk 18-20 | Medium | Medium |
| Governance (Full) | 3 | SHOULD | Wk 19-21 | L-M | Medium |
| Benchmarking | 3 | GOOD | Wk 20-22 | Medium | Low |
| Faculty Mentorship | 3 | GOOD | Wk 21-23 | M-H | L-M |
| Advanced AI Alerts | 3 | GOOD | Wk 22-24 | High | L-M |

---

## Decision Framework

### Which features to build NOW? (Phase 1)

**Pick all 6 MUST HAVEs in Phase 1.** They unlock everything else:
1. Student onboarding (foundation)
2. Skill analytics (intelligence)
3. Resume tracking (solves placement bottleneck)
4. COE groups (enables recruiter targeting)
5. Recruiter sharing (activates revenue)
6. Admin governance (security)

**Include Alerts (Basic) if you have extra capacity** — catches issues early.

---

### What about Phase 2?

**Prioritize by impact:**
1. **Recruiter Feedback** (MUST) — closes loop, proves ROI
2. **Communication Hub** (MUST) — prevents chaos during season
3. **COE Enhanced** (SHOULD) — better targeting
4. **Alerts Enhanced** (SHOULD) — more proactive
5. **Faculty Dashboard** (SHOULD) — faculty buy-in

**Skip "Curriculum Alignment (Basic)" in Phase 2** — defer to Phase 3.

---

### What about Phase 3?

**Only if business requires:**
- **Curriculum Alignment** (SHOULD) — strategic; helps justify investments
- **Alumni Tracking** (SHOULD) — reputation; helps recruiting
- **Everything else** (GOOD) — nice-to-have; can be added later

---

## Success Metrics by Phase

### Phase 1 (End of Month 2):
- ✅ 100% of batch onboarded
- ✅ Skill heat map shows distribution across college
- ✅ 80%+ students have resume score (>40)
- ✅ 5-8 COE groups created + students assigned
- ✅ 3+ recruiters using batch sharing portal
- ✅ 0 data breaches / DPDP violations

### Phase 2 (End of Month 4):
- ✅ 50%+ batch placed during season
- ✅ Recruiter feedback tracked (interviews → offers)
- ✅ 100% of recruiters can email students directly
- ✅ Faculty engagement: 80%+ accessed dashboard
- ✅ Placement rate up 10% vs. baseline

### Phase 3 (End of Month 6):
- ✅ Alumni data available (last 3 batches)
- ✅ Curriculum gaps identified + recommendations
- ✅ Benchmarking data available
- ✅ Placement rate stabilized at 85%+
- ✅ Avg salary improved by ₹0.5-1L

---

## Key Metrics to Track

**Placement Success:**
- Placement rate (%)
- Time to placement (days)
- Salary: median, distribution, by CoE
- Offer acceptance rate

**Platform Adoption:**
- Student profile completion (%)
- Recruiter portal usage (visits, downloads)
- Resume optimization adoption (% students using PickCV)
- CoE participation (% students in ≥1 CoE)

**Skill & Readiness:**
- Avg resume score (per batch, per CoE)
- Interview readiness (% Green status)
- Skill proficiency distribution
- Gap vs. industry (%)

**Faculty & Operations:**
- CoE formation rate (# CoEs as % of planned)
- Faculty engagement (# mentoring sessions)
- Recruiter satisfaction (feedback score)
- Intervention success (% bottleneck students → placed)

---

## Why This Matters (University Head Perspective)

**Today's problem:**
- 200+ student profiles scattered across sheets
- 50 recruiter relationships = email hell
- Curriculum misalignment = no data on what works
- Placement metrics = gut feel, not facts
- Crisis management: always reactive, never proactive

**With this dashboard:**
- **Centralized intelligence**: One source of truth for student readiness
- **Data-driven strategy**: Know exactly which skills to teach + where talent is
- **Recruiter confidence**: "I can reliably get 10 top engineers by [date]"
- **Student success**: Clear pathways (CoEs) + personalized support
- **Competitive edge**: Differentiate via quality + targeted outcomes

**North Star:** Answer in 30 seconds: *"Give me 10 job-ready students in [skill] by [date]"* → Get: vetted profiles, resumes, contacts, interview availability.

---

## Technical Considerations

**Data Architecture:**
- Student profiles tied to curriculum framework
- Skill taxonomy (standardized nomenclature)
- Job market data feeds (recruiter demand signals)
- Integration with PickCV resume optimization engine

**Security:**
- DPDP compliance (consent, data retention)
- Role-based access control (RBAC)
- Audit logging (who accessed what, when)
- Student data anonymization for recruiter dashboards

**Scalability:**
- Handle 500+ students per college
- 50+ recruiters per placement season
- Real-time analytics (skill heat maps, readiness scores)
- Bulk operations (CSV import, email campaigns)

---

## Success Criteria

**6-month goal:** 
- 90% of batch has profile complete + resume score > 60
- 5+ CoE groups formed + active
- 3+ recruiters actively using dashboards
- 15% improvement in placement rate vs. baseline

**12-month goal:**
- 95%+ profile completion
- Data-driven curriculum updates implemented
- 50%+ of batch placed before season ends
- Alumni success tracking shows clear ROI

---

## Open Questions / Future Exploration

1. **Job market data integration**: How to get live recruiter demand signals?
2. **Salary negotiation**: Should PickCV help students benchmark + negotiate?
3. **Internship management**: Should this also cover summer internship placements?
4. **Startup ecosystem**: How to highlight startup opportunities (vs. traditional jobs)?
5. **Global opportunities**: How to support overseas placements?
6. **Alumni mentorship**: Formal mentor-mentee matching?
7. **Multi-college aggregation**: Can PickCV show cross-college benchmarks (anonymized)?

---

**Document Version:** 1.0  
**Last Updated:** March 17, 2026  
**Next Review:** June 2026 (post Phase 1 implementation)
