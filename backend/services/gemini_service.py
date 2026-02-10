"""Gemini AI service for resume analysis and optimization."""
import google.generativeai as genai
from config import settings
from typing import Dict, List, Optional

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
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
            response = await self.model.generate_content_async(prompt)
            # Parse JSON response
            import json
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
            response = await self.model.generate_content_async(prompt)
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
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
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
            response = await self.model.generate_content_async(prompt)
            skills_text = response.text.strip()
            skills = [skill.strip() for skill in skills_text.split(',')]
            return skills
        except Exception as e:
            return []
    
    async def identify_skill_gaps(
        self, 
        user_skills: List[str], 
        job_requirements: List[str]
    ) -> Dict:
        """Identify skill gaps and provide learning recommendations.
        
        Args:
            user_skills: List of user's current skills
            job_requirements: List of required skills for target jobs
            
        Returns:
            Dictionary with skill gap analysis
        """
        prompt = f"""
        Analyze the skill gap between current skills and job market requirements.
        
        Current Skills: {', '.join(user_skills)}
        Required Skills: {', '.join(job_requirements)}
        
        Provide analysis in JSON format:
        {{
            "missing_skills": ["skill1", "skill2", ...],
            "recommended_skills": ["skill1", "skill2", ...],
            "learning_paths": ["path1", "path2", ...],
            "estimated_time": "<time estimate>"
        }}
        
        Focus on the top 3 most important missing skills and provide 
        high-authority learning paths (courses, certifications).
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            import json
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
            return {
                "missing_skills": [],
                "error": str(e)
            }


gemini_service = GeminiService()
