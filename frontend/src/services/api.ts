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

  // ===== USER PROFILE API METHODS =====

  /**
   * Get full user profile (including skills, preferred locations)
   */
  async getProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profile = await response.json();
      return { success: true, profile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch profile' };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    full_name?: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    target_role?: string;
    experience_level?: string;
    work_mode?: string;
    preferred_locations?: string[];
    skills?: Array<{ name: string; years: number }>;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
      }

      const profile = await response.json();
      return { success: true, profile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
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

  // ===== COLLEGE API METHODS =====

  private collegeToken: string | null = localStorage.getItem('college_token');
  private adminToken: string | null = localStorage.getItem('admin_token');

  setCollegeToken(token: string) {
    this.collegeToken = token;
    localStorage.setItem('college_token', token);
  }
  getCollegeToken(): string | null { return this.collegeToken; }
  clearCollegeToken() {
    this.collegeToken = null;
    localStorage.removeItem('college_token');
    localStorage.removeItem('college_session');
  }
  isCollegeAuthenticated(): boolean { return !!this.collegeToken; }

  setAdminToken(token: string) {
    this.adminToken = token;
    localStorage.setItem('admin_token', token);
  }
  getAdminToken(): string | null { return this.adminToken; }
  clearAdminToken() {
    this.adminToken = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_session');
  }
  isAdminAuthenticated(): boolean { return !!this.adminToken; }

  /**
   * College registration
   */
  async collegeRegister(data: {
    institution_name: string;
    official_email: string;
    password: string;
    contact_person_name: string;
    designation?: string;
    phone_number?: string;
    city?: string;
    state?: string;
    institution_type?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/college/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }

  /**
   * College login
   */
  async collegeLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/college/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
      const data = await response.json();
      this.setCollegeToken(data.access_token);
      // Store session info for quick UI access
      localStorage.setItem('college_session', JSON.stringify({
        college_id: data.college_id,
        email: data.email,
        institution_name: data.institution_name,
        status: data.status,
        onboarding_completed: data.onboarding_completed,
      }));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  /**
   * Get college profile
   */
  async getCollegeProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/college/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch college profile');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch profile' };
    }
  }

  /**
   * Update college profile
   */
  async updateCollegeProfile(data: Record<string, any>) {
    try {
      const response = await fetch(`${this.baseUrl}/college/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.collegeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
  }

  /**
   * Complete college onboarding
   */
  async completeCollegeOnboarding() {
    try {
      const response = await fetch(`${this.baseUrl}/college/onboarding/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) throw new Error('Failed to complete onboarding');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete onboarding' };
    }
  }

  /**
   * Upload students via file (CSV/Excel) or text (email list)
   */
  async uploadStudents(payload: { file?: File; text?: string }) {
    try {
      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      }
      if (payload.text) {
        formData.append('text', payload.text);
      }
      const response = await fetch(`${this.baseUrl}/college/students/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  /**
   * Send invitation emails to invited students
   */
  async inviteStudents() {
    try {
      const response = await fetch(`${this.baseUrl}/college/students/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invitation failed');
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Invitation failed' };
    }
  }

  /**
   * Get list of students for this college
   */
  async getCollegeStudents() {
    try {
      const response = await fetch(`${this.baseUrl}/college/students`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch students' };
    }
  }

  /**
   * Get student statistics
   */
  async getCollegeStudentStats() {
    try {
      const response = await fetch(`${this.baseUrl}/college/students/stats`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
  }

  /**
   * Share student profiles with recruiter
   */
  async shareStudentProfiles(data: {
    recruiter_email: string;
    message?: string;
    student_ids: number[];
    expires_in_days?: number;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/college/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.collegeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to share profiles');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to share profiles' };
    }
  }

  /**
   * Get detailed resumes for a specific student
   */
  async getStudentResumes(studentId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/college/students/${studentId}/resumes`, {
        headers: { 'Authorization': `Bearer ${this.collegeToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch student resumes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching student resumes:', error);
      return [];
    }
  }

  // ===== ADMIN API METHODS =====

  /**
   * Admin login
   */
  async adminLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invalid admin credentials');
      }
      const data = await response.json();
      this.setAdminToken(data.access_token);
      localStorage.setItem('admin_session', JSON.stringify({
        admin_id: data.admin_id,
        email: data.email,
        name: data.name,
      }));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Admin login failed' };
    }
  }

  /**
   * Get all colleges (admin)
   */
  async getAdminColleges(statusFilter?: string) {
    try {
      const url = statusFilter
        ? `${this.baseUrl}/admin/colleges?status_filter=${statusFilter}`
        : `${this.baseUrl}/admin/colleges`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch colleges');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch colleges' };
    }
  }

  /**
   * Approve a college (admin)
   */
  async approveCollege(collegeId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/admin/colleges/${collegeId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
      });
      if (!response.ok) throw new Error('Failed to approve college');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to approve college' };
    }
  }

  /**
   * Reject a college (admin)
   */
  async rejectCollege(collegeId: number, reason: string) {
    try {
      const response = await fetch(`${this.baseUrl}/admin/colleges/${collegeId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject college');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to reject college' };
    }
  }

  /**
   * Get admin dashboard stats
   */
  async getAdminStats() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch admin stats');
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch admin stats' };
    }
  }
}

export const apiService = new ApiService();
export default ApiService;
