"""Gemini AI service for resume analysis and optimization."""
import google.genai as genai
from google.genai import types
from config import settings
from typing import Dict, List, Optional
import json
import re
import logging

logger = logging.getLogger(__name__)

# Configure Gemini with API key
client = genai.Client(api_key=settings.gemini_api_key)

# Reusable config that forces Gemini to return valid JSON
JSON_CONFIG = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.7,
)


def _robust_parse_json(text: str) -> Dict:
    """Parse JSON from Gemini output with multiple fallback strategies.
    
    Handles: markdown code blocks, BOM chars, trailing commas,
    control characters inside strings, etc.
    """
    raw = text.strip()

    # 1. Strip markdown code fences if present
    if '```' in raw:
        m = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
        if m:
            raw = m.group(1).strip()
        else:
            raw = raw.replace('```json', '').replace('```', '').strip()

    # 2. Try direct parse first (fast path)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # 3. Light cleanup: trailing commas before } or ]
    cleaned = re.sub(r',\s*([}\]])', r'\1', raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 4. Extract the outermost JSON object with brace matching
    start = cleaned.find('{')
    if start != -1:
        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(cleaned)):
            c = cleaned[i]
            if escape:
                escape = False
                continue
            if c == '\\':
                escape = True
                continue
            if c == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    candidate = cleaned[start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    # 5. Nothing worked
    raise ValueError(f"Could not parse JSON from Gemini response (length={len(text)}): {text[:300]}...")


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self):
        self.model_name = 'models/gemini-2.5-flash'
        self.client = client
    
    async def analyze_resume(self, resume_text: str) -> Dict:
        """Analyze resume for ATS compatibility and provide feedback.
        
        Args:
            resume_text: Raw text extracted from resume
            
        Returns:
            Dictionary containing analysis results
        """
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume 
        and provide detailed feedback according to 2026 ATS standards.
        
        Resume:
        {resume_text}
        
        Provide your analysis in the following JSON format:
        {{
            "ats_score": <float between 0-100>,
            "readability_score": <float between 0-100>,
            "keyword_match_score": <float between 0-100>,
            "strengths": "<list of strengths>",
            "weaknesses": "<list of weaknesses>",
            "suggestions": "<actionable suggestions>",
            "missing_keywords": "<important keywords missing>"
        }}
        
        Focus on:
        - Single-column layout compliance
        - Standard section headings
        - Date format consistency (MM/YYYY)
        - No tables, graphics, or complex formatting
        - Industry-relevant keywords
        - Quantifiable achievements
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=JSON_CONFIG,
            )
            result = _robust_parse_json(response.text)
            return result
        except Exception as e:
            logger.error(f"Resume analysis failed: {e}")
            return {
                "ats_score": 0,
                "error": str(e)
            }
    
    async def optimize_resume(self, resume_text: str, target_role: Optional[str] = None) -> str:
        """Optimize resume for ATS compatibility.
        
        Args:
            resume_text: Raw text from resume
            target_role: Optional target role for optimization
            
        Returns:
            Optimized resume text
        """
        role_context = f" for a {target_role} position" if target_role else ""
        
        prompt = f"""
        You are an expert resume writer. Transform the following resume into an 
        ATS-friendly format{role_context} following 2026 standards.
        
        Original Resume:
        {resume_text}
        
        Requirements:
        - Use single-column layout ONLY
        - Use standard headings: "Professional Summary", "Work Experience", "Skills", "Education"
        - Format dates as MM/YYYY or Month YYYY consistently
        - No tables, graphics, images, or complex headers/footers
        - Focus on impact-first descriptions (achieved X by doing Y)
        - Use industry-relevant keywords
        - Include quantifiable achievements
        - NEVER fabricate or invent personal information (name, email, phone, LinkedIn, etc.)
        - Keep ALL personal details exactly as they appear in the original resume
        - If a detail is missing from the original, leave it out — do NOT make it up
        
        Return the optimized resume in clean, structured text format.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"Error optimizing resume: {str(e)}"
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate vector embedding for semantic search.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            List of floats representing the embedding
        """
        try:
            result = self.client.models.embed_content(
                model="models/embedding-001",
                content=text
            )
            return result.embedding
        except Exception as e:
            # Return zero vector on error
            return [0.0] * 768
    
    async def extract_skills(self, resume_text: str) -> List[str]:
        """Extract skills from resume text.
        
        Args:
            resume_text: Resume text to extract skills from
            
        Returns:
            List of identified skills
        """
        prompt = f"""
        Extract all technical and professional skills from the following resume.
        Return ONLY a comma-separated list of skills, nothing else.
        
        Resume:
        {resume_text}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            skills_text = response.text.strip()
            skills = [skill.strip() for skill in skills_text.split(',')]
            return skills
        except Exception as e:
            return []

    async def classify_role_dna(self, job_description: str, job_title: Optional[str] = None) -> Dict:
        """Classify target role into Resume OS Role DNA dimensions.

        Returns function, level, environment, cluster mapping, KPIs and confidence.
        """
        title_context = f"\nJob Title: {job_title}" if job_title else ""
        prompt = f"""You are a role intelligence classifier for Resume OS.
Analyze the job description and classify it precisely using this schema.

JOB DESCRIPTION:
{job_description}
{title_context}

FUNCTION AXIS — classify the primary function:
- Tech: Engineering, Data, DevOps, ML, Security, QA
- GTM: Sales, Marketing, Growth, Partnerships, Customer Success
- Business: Finance, Legal, Strategy, HR, Operations, Consulting
- Support: Admin, Coordination, Facilities
- Unknown: Cannot determine

LEVEL AXIS — infer seniority from scope, autonomy language, years required:
- L1: Intern/Trainee — Learning, no autonomous delivery. 0-1 year.
- L2: Junior/Associate — Executes defined tasks. 1-3 years.
- L3: Mid-level/Senior — Owns projects, mentors juniors. 3-7 years.
- L4: Lead/Manager — Owns team/program, defines strategy. 7-12 years.
- L5+: Director/VP/C-level — Multi-team, org-level impact. 12+ years.

ENVIRONMENT AXIS — infer from company size, culture signals:
- Startup (0-200 employees): Ambiguity tolerance, speed, zero-to-one language
- SME (200-2000 employees): Cross-functional versatility, pragmatic solutions
- MNC (2000+ employees): Process compliance, regional scale, structured delivery
- Unknown: Cannot determine

KPI AXIS — extract or infer from role x level:
- Sales: quota%, ARR, ACV, deal size, pipeline coverage, CAC
- Engineering: uptime%, latency, throughput, deployment frequency, MTTR
- Product: DAU/MAU, NPS, ARR, feature adoption, TTM
- Marketing: ROAS, CAC, conversion rate, MQL, pipeline sourced
- HR/TA: TTF, offer acceptance rate, hiring volume, attrition
- Data/ML: model accuracy vs baseline, data quality score, query performance
- Ops/Consulting: cost reduction%, efficiency gain%, process cycle time

CLUSTER ASSIGNMENT — map to one of 10 clusters:
C1: SWE / Full-Stack Engineering
C2: Data / Business Analysis
C3: Data Science / ML
C4: Product Management
C5: DevOps / SRE / Infrastructure
C6: Sales / Business Development
C7: Marketing / Growth
C8: HR / Talent Acquisition
C9: Operations / Consulting
C10: UX / UI Design
C0: General / Unclassified

Return VALID JSON:
{{
  "function": "Tech|GTM|Business|Support|Unknown",
  "level": "L1|L2|L3|L4|L5+",
  "environment": "Startup|SME|MNC|Unknown",
  "cluster_id": "C1|C2|C3|C4|C5|C6|C7|C8|C9|C10|C0",
  "cluster_name": "<short cluster name matching the cluster>",
  "kpis": ["<kpi1>", "<kpi2>", "<kpi3>"],
  "target_title": "<best inferred target title>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<brief 1-2 sentence reasoning>"
}}

Rules:
- Use conservative inference — do not inflate level or fabricate facts.
- If years not stated, infer from responsibility scope.
- Keep kpis concise (max 6).
- Role DNA Format: [Function] | [Level] | [Environment] | [KPIs: comma-separated]
"""

        role_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=role_config,
            )
            result = _robust_parse_json(response.text)
            return {
                "function": result.get("function", "Unknown"),
                "level": result.get("level", "L3"),
                "environment": result.get("environment", "Unknown"),
                "cluster_id": result.get("cluster_id", "C0"),
                "cluster_name": result.get("cluster_name", "General"),
                "kpis": result.get("kpis", []) if isinstance(result.get("kpis", []), list) else [],
                "target_title": result.get("target_title", job_title or ""),
                "confidence": result.get("confidence", 0.0),
                "reasoning": result.get("reasoning", ""),
            }
        except Exception as e:
            logger.warning(f"Role DNA classification failed: {e}")
            return {
                "function": "Unknown",
                "level": "L3",
                "environment": "Unknown",
                "cluster_id": "C0",
                "cluster_name": "General",
                "kpis": [],
                "target_title": job_title or "",
                "confidence": 0.0,
                "reasoning": f"Fallback used: {str(e)}",
            }
    
    async def generate_job_description_from_title(self, job_title: str) -> Optional[str]:
        """Generate a realistic, comprehensive job description from just a job title.
        
        Used when the user only provides a job title (no JD or link).
        Gemini creates an industry-standard JD so the optimizer has real
        keywords and requirements to work with.
        """
        prompt = f"""You are an expert technical recruiter. Generate a realistic, detailed job description
for the following role:

Job Title: {job_title}

Create a comprehensive job posting that includes:
1. **Job Title** (use the exact title given)
2. **About the Role** (2-3 sentences)
3. **Responsibilities** (6-8 bullet points)
4. **Required Qualifications** (5-7 bullet points with specific skills, tools, years of experience)
5. **Preferred Qualifications** (3-5 bullet points)
6. **Key Skills & Technologies** (list the most important technical and soft skills)

Make it realistic — use industry-standard terminology, specific technology names,
and concrete experience requirements. The description should look like a real
job posting from a top company in 2026.

Return ONLY the job description text, no extra commentary."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            result = response.text.strip()
            if len(result) > 100:
                logger.info(f"Generated JD from title '{job_title}': {len(result)} chars")
                return result
            logger.warning(f"Generated JD too short for '{job_title}': {len(result)} chars")
            return None
        except Exception as e:
            logger.error(f"Failed to generate JD from title '{job_title}': {e}")
            return None

    async def optimize_resume_for_job(
        self, 
        resume_text: str, 
        job_description: str,
        job_title: Optional[str] = None,
        github_context: Optional[str] = None,
        resume_os_context: Optional[str] = None,
    ) -> Dict:
        """Optimize resume for a specific job using Resume OS 9-engine pipeline via Gemini.

        Args:
            resume_text: Original resume text
            job_description: Job description or scraped job content
            job_title: Optional job title for context
            github_context: Optional GitHub evidence block
            resume_os_context: Optional Resume OS agent context (role DNA, ATS, gap data)

        Returns:
            Dictionary with optimized resume and comparison
        """
        context = f" for a {job_title} position" if job_title else ""
        github_section = f"""
GITHUB EVIDENCE (OPTIONAL VERIFIED DATA):
{github_context}
""" if github_context else ""

        agent_context_section = f"""
RESUME OS AGENT CONTEXT (use this to calibrate your optimization):
{resume_os_context}
""" if resume_os_context else ""

        prompt = f"""You are Resume OS — an expert resume optimization agent. Your task is to optimize
a resume for a specific job posting{context} using the 9-engine pipeline below.

ORIGINAL RESUME (MASTER — source of truth for ALL claims):
{resume_text}

JOB DESCRIPTION:
{job_description}
{github_section}
{agent_context_section}

━━━ CRITICAL CONSTRAINTS ━━━
FABRICATION BLOCK: NEVER invent, fabricate, or hallucinate ANY personal information, metrics,
companies, roles, dates, degrees, or credentials not present in the ORIGINAL RESUME.
- For name, email, phone, linkedin, location: extract ONLY from original. Empty string if absent.
- Keep SAME companies, roles, dates from original. Do NOT invent employment history.
- You MAY improve bullet wording, reorder skills, rewrite summary — using ONLY original resume evidence.
- If GITHUB EVIDENCE is provided, use it to strengthen bullets and tech accuracy. Do NOT invent repos.

LEVEL MISREPRESENTATION BLOCK: Do NOT inflate language beyond what evidence supports.
- "Helped build" can become "Contributed to building" but NOT "Architected" unless evidence exists.

━━━ 9-ENGINE OPTIMIZATION PIPELINE (execute in order) ━━━

ENGINE 1 — POSITIONING ENGINE (Summary):
- Rewrite professional summary answering: (1) Who you are (function + years + specialization),
  (2) For whom + what outcome you drive (reference a real achievement), (3) Level-appropriate direction.
- L1-L2: 3 lines. L3: 3-4 lines. L4: 4-5 lines. L5+: 5-6 lines.
- MUST contain a Hard Signal (metric) or Trust Signal (company name) in lines 1-2.
- NEVER use: "Results-driven", "motivated", "passionate", "dynamic", "seasoned", "team player", "proven track record".

ENGINE 2 — KEYWORD ENGINE (ATS Coverage):
- Extract required + preferred keywords from JD. Distribute: Summary (2-4 core), Experience (with evidence), Skills (full list).
- Orphaned keyword rule: any skill in Skills with ZERO evidence in Experience = flagged.
- If keyword coverage < 70%: flag as blocking gap.

ENGINE 3 — BULLET ENGINE (Experience):
- Formula: [Action Verb (ownership-matched)] + [Scope: what/who/scale] + [Impact: business outcome] + [Metric: quantified result]
- Impact before task. Outcome before method.
- Verb hierarchy: Architected > Designed > Led > Built > Shipped > Delivered > Managed > Contributed
- NEVER open bullets with: "Responsible for", "Worked on", "Helped", "Participated in", "Assisted"
- Minimum 1 metric per 2 bullets. Use numerals always ("34%" not "thirty-four percent").
- Bullet #1 = strongest Hard Signal (primacy). Bullet #last = second strongest (recency).
- Max 1-2 lines per bullet. Max 30 words.

ENGINE 4 — ROLE-SHIFT ENGINE (Level Calibration):
- If evidence supports ownership (designed, defined, led, owned) but language is passive → shift language up.
- If evidence only shows participation → DO NOT shift. Flag as STRUCTURAL_LEVEL_GAP.
- Do NOT inflate. If evidence is L2, do not apply L4 language even if targeting L4.

ENGINE 5 — ENVIRONMENT ADAPTATION ENGINE:
- Startup: amplify "built from scratch", "owned end-to-end", "zero to one", "shipped in X weeks"
- SME: amplify "cross-functional", "wore multiple hats", "pragmatic solutions"
- MNC: amplify "managed across N regions", "compliant with X framework", "stakeholder alignment"
- Apply to Summary first, then Experience. Do NOT force environment language artificially.

ENGINE 6 — SIGNAL AMPLIFICATION ENGINE:
- Surface highest-priority signals into triage zone (Summary + first 2 bullets of most recent role).
- Add scope proxies where no metric exists: team size, user count, budget managed, geographic scope.
- Bold enforcement: max 3 bold elements per bullet. Priority: metric > Trust Signal name > outcome.

ENGINE 7 — RECENCY WEIGHTING ENGINE:
- Current role: 4-5 bullets (full detail). 1 prior: 3-4 bullets. 2nd prior: 2-3 bullets. 3+ prior: 1-2 bullets or title+company+dates only.
- At 7+ years experience: education = 2 lines only (degree + institution + year).

ENGINE 8 — STRUCTURE ENGINE:
- Standard section headers ONLY: Professional Summary, Work Experience, Skills, Education, Projects, Certifications.
- Contact block in document body. Single-column. No tables/graphics/icons/rating bars.
- Skills: plain comma-separated list.
- Font: Calibri/Arial. Max one accent color.

ENGINE 9 — BIAS MITIGATION ENGINE:
- Gender-neutral language. No gendered pronouns/adjectives.
- Assessment-forward placement for freshers.

━━━ AUTHENTICITY RULES ━━━
- Cap any action verb to max 2 occurrences across entire resume.
- Vary sentence structure — no more than 3 bullets with identical syntax in sequence.
- Mix short (10-15 word) and medium (20-30 word) bullets.
- Allow one context/scope bullet per role (no metric) to prevent formulaic feel.
- Use implicit first-person (action verb opener, no pronoun).

━━━ OUTPUT FORMAT ━━━
Return VALID JSON:
{{
    "optimized_resume": "<complete optimized resume text>",
    "name": "<EXTRACT from original resume or empty string>",
    "title": "<professional title tailored to target job>",
    "email": "<EXTRACT from original resume or empty string>",
    "phone": "<EXTRACT from original resume or empty string>",
    "linkedin": "<EXTRACT from original resume or empty string>",
    "location": "<EXTRACT from original resume or empty string>",
    "professional_summary": "<optimized summary per Engine 1>",
    "experience": [
        {{
            "role": "<title from original resume>",
            "company": "<company from original resume>",
            "location": "<location from original resume or empty string>",
            "period": "<dates from original resume>",
            "bullets": ["<optimized bullet 1>", "<optimized bullet 2>"]
        }}
    ],
    "skills": ["<skill1>", "<skill2>"],
    "education": [
        {{
            "degree": "<from original resume>",
            "school": "<from original resume>",
            "period": "<from original resume>"
        }}
    ],
    "signal_classification": {{
        "hard_signals": ["<metric-containing elements>"],
        "cognitive_signals": ["<problem-diagnosis-action-outcome elements>"],
        "trust_signals": ["<third-party credibility markers>"],
        "structural_signals": ["<architecture/layout signals>"]
    }},
    "engines_applied": [
        {{
            "engine": "<engine name>",
            "changes_count": <int>,
            "summary": "<what this engine did>"
        }}
    ],
    "changes_made": [
        {{
            "section": "<section>",
            "what_changed": "<description>",
            "why": "<reason>",
            "engine": "<which engine>"
        }}
    ],
    "key_improvements": ["<improvement 1>", "<improvement 2>"],
    "keywords_added": ["<keyword1>", "<keyword2>"],
    "keyword_coverage_pct": <0-100>,
    "orphaned_keywords": ["<skills with no experience evidence>"],
    "match_score": <0-100>,
    "ats_optimized": true,
    "level_gaps_flagged": ["<any STRUCTURAL_LEVEL_GAP flags>"],
    "comparison": {{
        "summary": "<brief summary of all changes>",
        "detailed_changes": [
            {{
                "before": "<original text>",
                "after": "<optimized text>",
                "reason": "<why better>",
                "impact": "<matching improvement>"
            }}
        ],
        "improvement_areas": [
            {{
                "area": "<section>",
                "improvements": "<list>"
            }}
        ],
        "ats_improvements": ["<imp 1>", "<imp 2>"],
        "overall_improvement": "<assessment>"
    }}
}}

Requirements:
- Single-column layout ONLY. One-page fit at normal font size.
- Max 3 most relevant roles (4 only if necessary). 2-3 bullets per role, each <= 25 words.
- Max 12 core skills. Max 2 education entries.
- NEVER fabricate personal details.
- For comparison.detailed_changes, include at most 5-7 key changes.
"""
        
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=JSON_CONFIG,
                )
                result = _robust_parse_json(response.text)
                return result
            except (ValueError, json.JSONDecodeError) as e:
                last_error = e
                logger.warning(f"Optimization JSON parse attempt {attempt + 1}/{max_retries + 1} failed: {e}")
                if attempt < max_retries:
                    continue  # retry — Gemini may produce valid JSON on next attempt
            except Exception as e:
                last_error = e
                logger.error(f"Optimization failed (attempt {attempt + 1}): {e}")
                break  # non-parse errors are not retryable

        logger.error(f"Optimization failed after {max_retries + 1} attempts: {last_error}")
        return {
                "error": str(last_error),
                "optimized_resume": resume_text,
                "changes_made": [],
                "name": "",
                "title": "",
                "email": "",
                "phone": "",
                "linkedin": "",
                "location": "",
                "professional_summary": "",
                "experience": [],
                "skills": [],
                "education": []
            }
    
    async def generate_comparison_analysis(
        self,
        original_resume: str,
        optimized_resume: str,
        job_description: str
    ) -> Dict:
        """Generate detailed comparison between original and optimized resume.
        
        Args:
            original_resume: Original resume text
            optimized_resume: Optimized resume text
            job_description: Job description for context
            
        Returns:
            Comparison analysis with specific changes highlighted
        """
        prompt = f"""
        Compare the original and optimized resume below, and provide a detailed analysis.
        
        ORIGINAL RESUME:
        {original_resume}
        
        OPTIMIZED RESUME:
        {optimized_resume}
        
        JOB DESCRIPTION:
        {job_description}
        
        Provide analysis in JSON format:
        {{
            "summary": "<brief summary of changes>",
            "detailed_changes": [
                {{
                    "before": "<original text>",
                    "after": "<optimized text>",
                    "reason": "<why this is better>",
                    "impact": "<how this improves job matching>"
                }},
                ...
            ],
            "improvement_areas": [
                {{
                    "area": "<section or aspect>",
                    "improvements": "<list of improvements>"
                }},
                ...
            ],
            "ats_improvements": [
                "<improvement 1>",
                "<improvement 2>",
                ...
            ],
            "overall_improvement": "<percentage or assessment>"
        }}
        
        Focus on at most 5-7 key changes. Be specific with examples.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=JSON_CONFIG,
            )
            result = _robust_parse_json(response.text)
            return result
        except Exception as e:
            logger.error(f"Comparison analysis failed: {e}")
            return {
                "error": str(e),
                "detailed_changes": []
            }


    async def generate_resume_from_linkedin(
        self,
        linkedin_data: Dict,
        target_role: Optional[str] = None,
    ) -> Dict:
        """Generate a structured resume from LinkedIn profile + posts data.
        
        Uses Gemini to intelligently convert LinkedIn activity into
        professional resume content.
        
        Args:
            linkedin_data: Full LinkedIn snapshot with profile and posts
            target_role: Optional target role for tailoring
            
        Returns:
            Structured resume dict matching the resume builder format
        """
        profile = linkedin_data.get("profile", {})
        posts = linkedin_data.get("posts", [])
        
        # Build a text representation of the LinkedIn data
        linkedin_text_parts = []
        linkedin_text_parts.append(f"Name: {profile.get('name', '')}")
        linkedin_text_parts.append(f"Email: {profile.get('email', '')}")
        linkedin_text_parts.append(f"Location/Locale: {profile.get('locale', '')}")
        linkedin_text_parts.append(f"LinkedIn Profile Picture: {profile.get('picture', '')}")
        
        if posts:
            linkedin_text_parts.append(f"\n--- LinkedIn Posts ({len(posts)} total) ---")
            for i, post in enumerate(posts[:30]):  # Limit to 30 posts for context window
                text = post.get("full_text", post.get("text", ""))
                if text:
                    likes = post.get("likes", 0)
                    comments = post.get("comments", 0)
                    linkedin_text_parts.append(
                        f"\nPost {i+1} (Likes: {likes}, Comments: {comments}):\n{text[:800]}"
                    )
                    # Include shared media/articles
                    for media in post.get("media", []):
                        if media.get("title"):
                            linkedin_text_parts.append(f"  Shared: {media['title']} — {media.get('url', '')}")
        
        linkedin_text = "\n".join(linkedin_text_parts)
        
        role_context = f"\nTarget Role: {target_role}" if target_role else ""
        
        prompt = f"""You are an expert resume writer. A user has signed up using LinkedIn OAuth.
From their LinkedIn data (profile info + their own posts/shares), create a PROFESSIONAL RESUME.

LINKEDIN DATA:
{linkedin_text}
{role_context}

IMPORTANT RULES:
- Extract REAL information from the LinkedIn data. Do NOT fabricate companies, roles, or education.
- From the user's LinkedIn POSTS, infer: their expertise areas, industry knowledge, thought leadership topics, 
  technical skills they discuss, projects they mention, achievements they share.
- If posts mention specific technologies, frameworks, tools — include those as skills.
- If posts discuss work at specific companies or roles — include that as experience.
- Professional summary should reflect their LinkedIn voice and expertise from their posts.
- If you cannot determine specific work history, create a summary-focused resume 
  emphasizing their demonstrated expertise from their content.
- Keep education blank if not evident from posts.
- DO NOT make up dates, company names, or details that aren't supported by the data.

Return a JSON object with this EXACT structure:
{{
    "name": "{profile.get('name', '')}",
    "email": "{profile.get('email', '')}",
    "phone": "",
    "linkedin": "https://www.linkedin.com/in/{profile.get('sub', '')}",
    "location": "",
    "professional_summary": "<2-4 sentence professional summary derived from their LinkedIn content and expertise>",
    "experience": [
        {{
            "title": "<role/position inferred from posts>",
            "company": "<company if mentioned in posts>",
            "dates": "<approximate dates if mentioned>",
            "bullets": [
                "<achievement or responsibility derived from their LinkedIn posts>",
                "<another achievement>"
            ]
        }}
    ],
    "skills": ["<skill1 from posts>", "<skill2>", "<skill3>"],
    "education": [
        {{
            "degree": "<degree if mentioned>",
            "school": "<school if mentioned>",
            "year": "<year if mentioned>"
        }}
    ],
    "certifications": ["<cert if mentioned in posts>"],
    "inferred_expertise": ["<topic1 they write about>", "<topic2>"],
    "linkedin_insights": {{
        "content_themes": ["<theme1>", "<theme2>"],
        "industry_focus": "<primary industry from their content>",
        "thought_leadership_topics": ["<topic1>", "<topic2>"],
        "engagement_highlights": "<summary of their post engagement>"
    }}
}}

Even if posts are empty, return a basic structure with the name and email filled in.
Ensure the JSON is valid."""

        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=JSON_CONFIG,
                )
                result = _robust_parse_json(response.text)
                logger.info(f"Generated resume from LinkedIn data for {profile.get('email', 'unknown')}")
                return result
            except (ValueError, json.JSONDecodeError) as e:
                last_error = e
                logger.warning(f"LinkedIn resume generation JSON parse attempt {attempt + 1}: {e}")
                if attempt < max_retries:
                    continue
            except Exception as e:
                last_error = e
                logger.error(f"LinkedIn resume generation failed (attempt {attempt + 1}): {e}")
                break

        # Fallback: return basic structure from profile data
        logger.error(f"LinkedIn resume generation failed after retries: {last_error}")
        return {
            "name": profile.get("name", ""),
            "email": profile.get("email", ""),
            "phone": "",
            "linkedin": f"https://www.linkedin.com/in/{profile.get('sub', '')}",
            "location": "",
            "professional_summary": "",
            "experience": [],
            "skills": [],
            "education": [],
            "certifications": [],
            "inferred_expertise": [],
            "linkedin_insights": {},
            "error": str(last_error),
        }


gemini_service = GeminiService()
