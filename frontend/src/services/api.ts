/**
 * API Service for PickCV
 * Handles all backend API communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

class ApiService {
  private baseUrl = API_BASE_URL;
  private token: string | null = localStorage.getItem('access_token');

  /**
   * Register a new user
   */
  async register(email: string, password: string, full_name: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const user: UserResponse = await response.json();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    try {
      const formData = new FormData();
      formData.append('username', email); // OAuth2PasswordRequestForm uses 'username'
      formData.append('password', password);

      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('access_token', data.access_token);
      this.token = data.access_token;

      return { success: true, token: data.access_token };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-email?token=${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Email verification failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Email verification failed' };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to resend verification email');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to resend verification email' };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user: UserResponse = await response.json();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch user' };
    }
  }

  /**
   * Logout user (client-side only)
   */
  logout() {
    localStorage.removeItem('access_token');
    this.token = null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set token (useful when logging in)
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  // ===== RESUME API METHODS =====

  /**
   * Upload a resume file
   */
  async uploadResume(title: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Resume upload failed');
      }

      const data = await response.json();
      return { success: true, resume: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Resume upload failed' };
    }
  }

  /**
   * List user's resumes
   */
  async listResumes() {
    try {
      const response = await fetch(`${this.baseUrl}/resume/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const resumes = await response.json();
      return { success: true, resumes };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch resumes' };
    }
  }

  /**
   * Get resume details
   */
  async getResume(resumeId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/resume/${resumeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Resume not found');
      }

      const resume = await response.json();
      return { success: true, resume };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch resume' };
    }
  }

  /**
   * Create a new resume
   */
  async createResume(title: string, template: string, resumeData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/resume/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          template_name: template,
          ...resumeData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create resume');
      }

      const resume = await response.json();
      return { success: true, resume };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create resume' };
    }
  }

  /**
   * Optimize resume
   */
  async optimizeResume(resumeId: number, targetRole?: string) {
    try {
      const url = targetRole 
        ? `${this.baseUrl}/resume/${resumeId}/optimize?target_role=${encodeURIComponent(targetRole)}`
        : `${this.baseUrl}/resume/${resumeId}/optimize`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Resume optimization failed');
      }

      const resume = await response.json();
      return { success: true, resume };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Resume optimization failed' };
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/resume/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete resume' };
    }
  }

  // ===== JOBS API METHODS =====

  /**
   * List all jobs
   */
  async listJobs(skip: number = 0, limit: number = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const jobs = await response.json();
      return { success: true, jobs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch jobs' };
    }
  }

  /**
   * Get job details
   */
  async getJob(jobId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Job not found');
      }

      const job = await response.json();
      return { success: true, job };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch job' };
    }
  }

  /**
   * Search jobs with filters
   */
  async searchJobs(query: string, filters: any = {}) {
    try {
      const params = new URLSearchParams({
        keyword: query,
        ...filters,
      });

      const response = await fetch(`${this.baseUrl}/jobs/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Job search failed');
      }

      const results = await response.json();
      return { success: true, jobs: results.jobs || results };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Job search failed' };
    }
  }

  /**
   * Apply for a job
   */
  async applyForJob(jobId: number, resumeId: number, coverLetter?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          resume_id: resumeId,
          custom_cover_letter: coverLetter || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to apply for job');
      }

      const application = await response.json();
      return { success: true, application };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to apply for job' };
    }
  }

  /**
   * Get job recommendations
   */
  async getJobRecommendations(limit: number = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/recommendations?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      return { success: true, recommendations: data.recommendations || data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch recommendations' };
    }
  }

  /**
   * Save a job
   */
  async saveJob(jobId: number, notes?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notes || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save job' };
    }
  }

  /**
   * Unsave a job
   */
  async unsaveJob(jobId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/unsave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unsave job');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to unsave job' };
    }
  }

  // ===== APPLICATION TRACKING API METHODS =====

  /**
   * List user's job applications
   */
  async listApplications(status?: string) {
    try {
      const url = status 
        ? `${this.baseUrl}/applications?status=${status}`
        : `${this.baseUrl}/applications`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      return { success: true, applications: data.applications || data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch applications' };
    }
  }

  /**
   * Update application status
   */
  async updateApplication(applicationId: number, status: string, notes?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes: notes || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const application = await response.json();
      return { success: true, application };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update application' };
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats() {
    try {
      const response = await fetch(`${this.baseUrl}/applications/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const stats = await response.json();
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
  }

  // ===== ANALYSIS API METHODS =====

  /**
   * Analyze resume
   */
  async analyzeResume(resumeId: number, jobId?: number) {
    try {
      const url = jobId
        ? `${this.baseUrl}/analysis/analyze?resume_id=${resumeId}&job_id=${jobId}`
        : `${this.baseUrl}/analysis/analyze?resume_id=${resumeId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis = await response.json();
      return { success: true, analysis };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Analysis failed' };
    }
  }

  /**
   * Get analysis results
   */
  async getAnalysis(resumeId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/${resumeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const analysis = await response.json();
      return { success: true, analysis };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch analysis' };
    }
  }
}

export const apiService = new ApiService();
export default ApiService;
