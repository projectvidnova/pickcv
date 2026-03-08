"""Gemini AI service for resume analysis and optimization."""
import google.genai as genai
from config import settings
from typing import Dict, List, Optional
import json

# Configure Gemini with API key
client = genai.Client(api_key=settings.gemini_api_key)


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self):
        self.model_name = 'gemini-1.5-flash'
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
                contents=prompt
            )
            # Parse JSON response
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
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
        
        Please provide a response in the following JSON format:
        {{
            "optimized_resume": "<complete optimized resume text following ATS best practices>",
            "changes_made": [
                {{
                    "section": "<section name>",
                    "what_changed": "<description of what changed>",
                    "why": "<explanation of why this change improves the match>"
                }},
                ...
            ],
            "key_improvements": [
                "<improvement 1>",
                "<improvement 2>",
                ...
            ],
            "keywords_added": ["keyword1", "keyword2", ...],
            "match_score": <0-100>,
            "ats_optimized": true/false
        }}
        
        Requirements:
        - Use single-column layout ONLY
        - Format dates as MM/YYYY consistently
        - No tables, graphics, or complex formatting
        - Focus on quantifiable achievements
        - Match key terms from the job description
        - Improve readability while maintaining professionalism
        - Include action verbs and impact metrics
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
            return {
                "error": str(e),
                "optimized_resume": resume_text,
                "changes_made": []
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
                contents=prompt
            )
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
            return {
                "error": str(e),
                "detailed_changes": []
            }


gemini_service = GeminiService()
