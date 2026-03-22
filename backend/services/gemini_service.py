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
        job_title: Optional[str] = None
    ) -> Dict:
        """Optimize resume for a specific job using Gemini Flash.
        
        Args:
            resume_text: Original resume text
            job_description: Job description or scraped job content
            job_title: Optional job title for context
            
        Returns:
            Dictionary with optimized resume and comparison
        """
        context = f" for a {job_title} position" if job_title else ""
        
        prompt = f"""
        You are an expert resume writer and ATS specialist. Your task is to optimize 
        a resume for a specific job posting{context}.
        
        ORIGINAL RESUME:
        {resume_text}
        
        JOB DESCRIPTION:
        {job_description}
        
        ⚠️ CRITICAL RULES — PERSONAL INFORMATION:
        - NEVER invent, fabricate, or hallucinate ANY personal information.
        - For name, email, phone, linkedin, location: extract ONLY what is explicitly 
          present in the ORIGINAL RESUME above. If a field is not found, return an empty string "".
        - Do NOT guess or generate phone numbers, email addresses, LinkedIn URLs, 
          GitHub profiles, portfolio links, or any contact details.
        - Do NOT change the candidate's name, email, phone, or location.
        - For experience: keep the SAME companies, roles, and dates from the original resume.
          Do NOT invent companies, job titles, or employment periods.
        - For education: keep the SAME schools, degrees, and years. Do NOT fabricate degrees.
        - You MAY improve bullet points, add relevant keywords, rewrite the summary, 
          and reorder/enhance skills — but ONLY using truthful information from the original resume.
        
        Please provide a response in the following JSON format with BOTH the optimized resume
        AND a comparison analysis (so we can show before/after to the user):
        {{
            "optimized_resume": "<complete optimized resume text following ATS best practices>",
            "name": "<candidate full name — EXTRACT from original resume, or empty string>",
            "title": "<professional title — can be tailored to match the target job>",
            "email": "<EXTRACT from original resume ONLY, or empty string if not found>",
            "phone": "<EXTRACT from original resume ONLY, or empty string if not found>",
            "linkedin": "<EXTRACT from original resume ONLY, or empty string if not found>",
            "location": "<EXTRACT from original resume ONLY, or empty string if not found>",
            "professional_summary": "<2-3 sentence summary tailored to the job>",
            "experience": [
                {{
                    "role": "<job title from original resume>",
                    "company": "<company name from original resume>",
                    "location": "<location from original resume or empty string>",
                    "period": "<start - end date from original resume>",
                    "bullets": ["<improved achievement 1>", "<improved achievement 2>", ...]
                }}
            ],
            "skills": ["<skill1>", "<skill2>", ...],
            "education": [
                {{
                    "degree": "<degree name from original resume>",
                    "school": "<institution name from original resume>",
                    "period": "<year or date range from original resume>"
                }}
            ],
            "changes_made": [
                {{
                    "section": "<section name>",
                    "what_changed": "<description of what changed>",
                    "why": "<explanation of why this change improves the match>"
                }}
            ],
            "key_improvements": [
                "<improvement 1>",
                "<improvement 2>"
            ],
            "keywords_added": ["keyword1", "keyword2"],
            "match_score": <0-100>,
            "ats_optimized": true,
            "comparison": {{
                "summary": "<brief summary of all changes made>",
                "detailed_changes": [
                    {{
                        "before": "<original text snippet>",
                        "after": "<optimized text snippet>",
                        "reason": "<why this is better>",
                        "impact": "<how this improves job matching>"
                    }}
                ],
                "improvement_areas": [
                    {{
                        "area": "<section or aspect>",
                        "improvements": "<list of improvements>"
                    }}
                ],
                "ats_improvements": [
                    "<improvement 1>",
                    "<improvement 2>"
                ],
                "overall_improvement": "<percentage or assessment>"
            }}
        }}
        
        Requirements:
        - Use single-column layout ONLY
        - Format dates as MM/YYYY consistently
        - No tables, graphics, or complex formatting
        - Focus on quantifiable achievements
        - Match key terms from the job description
        - Improve readability while maintaining professionalism
        - Include action verbs and impact metrics
        - NEVER fabricate personal details — only extract from the original resume
        - For comparison.detailed_changes, include at most 5-7 key changes with specific before/after examples
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
