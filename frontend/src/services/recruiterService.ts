/**
 * Recruiter API Service
 * Handles all recruiter portal API communication
 */

import { API_BASE_URL } from '../config/api';

/* ─── Auth helpers ─────────────────────────────── */

function getRecruiterToken(): string | null {
  return localStorage.getItem('recruiter_token');
}

function setRecruiterToken(token: string) {
  localStorage.setItem('recruiter_token', token);
}

function clearRecruiterToken() {
  localStorage.removeItem('recruiter_token');
  localStorage.removeItem('recruiter_data');
}

function getRecruiterData() {
  const raw = localStorage.getItem('recruiter_data');
  return raw ? JSON.parse(raw) : null;
}

function setRecruiterData(data: any) {
  localStorage.setItem('recruiter_data', JSON.stringify(data));
}

function authHeaders(): Record<string, string> {
  const token = getRecruiterToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    let message = `Request failed (${res.status})`;
    if (body?.detail) {
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ');
      }
    }
    throw new Error(message);
  }
  return res.json();
}

/* ─── Recruiter Types ──────────────────────────── */

export interface Recruiter {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  company_name: string;
  company_website?: string;
  company_logo_url?: string;
  company_size?: string;
  industry?: string;
  designation?: string;
  is_email_verified: boolean;
  is_approved: boolean;
  status: string;
  created_at: string;
}

export interface RecruiterJob {
  id: number;
  recruiter_id: number;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  job_type: string;
  experience_level: string;
  location: string;
  remote_policy?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  required_skills: string[];
  preferred_skills: string[];
  status: string;
  pause_date?: string;
  application_count: number;
  view_count: number;
  company_name?: string;
  company_logo_url?: string;
  created_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  resume_id?: number;
  status: string;
  cover_letter?: string;
  match_score?: number;
  recruiter_notes?: string;
  applied_at: string;
  reviewed_at?: string;
  shortlisted_at?: string;
  offered_at?: string;
  offer_response?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  resume_title?: string;
  resume_ats_score?: number;
  total_rounds: number;
  completed_rounds: number;
  created_at: string;
}

export interface Interview {
  id: number;
  application_id: number;
  interviewer_id?: number;
  round_number: number;
  round_title?: string;
  interview_type: string;
  scheduled_at?: string;
  duration_minutes: number;
  google_meet_link?: string;
  status: string;
  feedback?: string;
  rating?: number;
  is_qualified?: boolean;
  invite_sent: boolean;
  invite_sent_at?: string;
  interviewer_name?: string;
  interviewer_email?: string;
  candidate_name?: string;
  candidate_email?: string;
  created_at: string;
}

export interface InterviewerMember {
  id: number;
  recruiter_id: number;
  email: string;
  full_name: string;
  designation?: string;
  phone?: string;
  status: string;
  is_active: boolean;
  accepted_at?: string;
  interview_count?: number;
  created_at: string;
}

export interface OfferTemplate {
  id: number;
  recruiter_id: number;
  name: string;
  content: string;
  variables: string[];
  is_default: boolean;
  created_at: string;
}

export interface Offer {
  id: number;
  application_id: number;
  template_id: number;
  rendered_content: string;
  variables_used: Record<string, string>;
  pdf_url?: string;
  status: string;
  released_at?: string;
  responded_at?: string;
  response_note?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  created_at: string;
}

export interface RecruiterStats {
  total_jobs: number;
  open_jobs: number;
  paused_jobs: number;
  closed_jobs: number;
  total_applications: number;
  shortlisted: number;
  interviewing: number;
  offered: number;
  hired: number;
  rejected: number;
  total_interviewers: number;
  pending_interviews: number;
}

/* ─── API Methods ──────────────────────────────── */

class RecruiterApiService {
  private base = `${API_BASE_URL}/recruiter`;

  /* ── Phase 1: Auth ─────────────────────────── */

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name: string;
    company_website?: string;
    company_size?: string;
    industry?: string;
    designation?: string;
  }) {
    const res = await fetch(`${this.base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async verifyEmail(token: string) {
    const res = await fetch(`${this.base}/verify-email?token=${token}`, {
      method: 'POST',
    });
    return handleResponse(res);
  }

  async login(email: string, password: string) {
    const res = await fetch(`${this.base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    setRecruiterToken(data.access_token);
    setRecruiterData(data.recruiter);
    return data;
  }

  logout() {
    clearRecruiterToken();
  }

  isLoggedIn(): boolean {
    return !!getRecruiterToken();
  }

  getProfile(): Recruiter | null {
    return getRecruiterData();
  }

  async fetchProfile(): Promise<Recruiter> {
    const res = await fetch(`${this.base}/me`, { headers: authHeaders() });
    const data = await handleResponse(res);
    setRecruiterData(data);
    return data;
  }

  async updateProfile(data: Partial<Recruiter>) {
    const res = await fetch(`${this.base}/me`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const updated = await handleResponse(res);
    setRecruiterData(updated);
    return updated;
  }

  async getStats(): Promise<RecruiterStats> {
    const res = await fetch(`${this.base}/stats`, { headers: authHeaders() });
    return handleResponse(res);
  }

  /* ── Phase 2: Jobs ─────────────────────────── */

  async createJob(data: Partial<RecruiterJob>): Promise<RecruiterJob> {
    const res = await fetch(`${this.base}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async listJobs(statusFilter?: string): Promise<RecruiterJob[]> {
    const url = statusFilter ? `${this.base}/jobs?status=${statusFilter}` : `${this.base}/jobs`;
    const res = await fetch(url, { headers: authHeaders() });
    return handleResponse(res);
  }

  async getJob(jobId: number): Promise<RecruiterJob> {
    const res = await fetch(`${this.base}/jobs/${jobId}`, { headers: authHeaders() });
    return handleResponse(res);
  }

  async updateJob(jobId: number, data: Partial<RecruiterJob>): Promise<RecruiterJob> {
    const res = await fetch(`${this.base}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async updateJobStatus(jobId: number, status: string): Promise<RecruiterJob> {
    const res = await fetch(`${this.base}/jobs/${jobId}/status`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  }

  async deleteJob(jobId: number) {
    const res = await fetch(`${this.base}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete job');
  }

  /* ── Public jobs ───────────────────────────── */

  async listPublicJobs(params?: Record<string, string>): Promise<RecruiterJob[]> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${this.base}/public/jobs${qs}`);
    return handleResponse(res);
  }

  async getPublicJob(jobId: number): Promise<RecruiterJob> {
    const res = await fetch(`${this.base}/public/jobs/${jobId}`);
    return handleResponse(res);
  }

  /* ── Phase 3: Applications & Interviews ───── */

  async listApplications(jobId: number, statusFilter?: string): Promise<Application[]> {
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`${this.base}/jobs/${jobId}/applications${qs}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  }

  async updateApplicationStatus(appId: number, status: string, notes?: string): Promise<Application> {
    const res = await fetch(`${this.base}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, recruiter_notes: notes }),
    });
    return handleResponse(res);
  }

  async planInterviews(appId: number, rounds: any[], schedulingMode: string = 'sequential'): Promise<Interview[]> {
    const res = await fetch(`${this.base}/applications/${appId}/interviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ rounds, scheduling_mode: schedulingMode }),
    });
    return handleResponse(res);
  }

  async listInterviews(appId: number): Promise<Interview[]> {
    const res = await fetch(`${this.base}/applications/${appId}/interviews`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  }

  async updateInterview(interviewId: number, data: Partial<Interview>): Promise<Interview> {
    const res = await fetch(`${this.base}/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async submitFeedback(interviewId: number, feedback: string, rating: number, isQualified: boolean): Promise<Interview> {
    const res = await fetch(`${this.base}/interviews/${interviewId}/feedback`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ feedback, rating, is_qualified: isQualified }),
    });
    return handleResponse(res);
  }

  /* ── Phase 4: Interviewers ─────────────────── */

  async inviteInterviewer(data: { email: string; full_name: string; designation?: string; phone?: string }): Promise<InterviewerMember> {
    const res = await fetch(`${this.base}/interviewers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async listInterviewers(): Promise<InterviewerMember[]> {
    const res = await fetch(`${this.base}/interviewers`, { headers: authHeaders() });
    return handleResponse(res);
  }

  async updateInterviewer(ivId: number, data: Partial<InterviewerMember>): Promise<InterviewerMember> {
    const res = await fetch(`${this.base}/interviewers/${ivId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async removeInterviewer(ivId: number) {
    const res = await fetch(`${this.base}/interviewers/${ivId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove interviewer');
  }

  async acceptInterviewerInvite(token: string) {
    const res = await fetch(`${this.base}/interviewers/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  }

  /* ── Phase 5: Offer Templates & Offers ─────── */

  async createOfferTemplate(data: { name: string; content: string; variables: string[]; is_default?: boolean }): Promise<OfferTemplate> {
    const res = await fetch(`${this.base}/offer-templates`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async listOfferTemplates(): Promise<OfferTemplate[]> {
    const res = await fetch(`${this.base}/offer-templates`, { headers: authHeaders() });
    return handleResponse(res);
  }

  async updateOfferTemplate(tplId: number, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
    const res = await fetch(`${this.base}/offer-templates/${tplId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  async deleteOfferTemplate(tplId: number) {
    const res = await fetch(`${this.base}/offer-templates/${tplId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete template');
  }

  async releaseOffer(applicationId: number, templateId: number, variables: Record<string, string>): Promise<Offer> {
    const res = await fetch(`${this.base}/offers/release`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ application_id: applicationId, template_id: templateId, variables }),
    });
    return handleResponse(res);
  }

  async listOffers(): Promise<Offer[]> {
    const res = await fetch(`${this.base}/offers`, { headers: authHeaders() });
    return handleResponse(res);
  }

  async viewOffer(offerId: number): Promise<Offer> {
    const res = await fetch(`${this.base}/offers/${offerId}/view`);
    return handleResponse(res);
  }

  async respondToOffer(offerId: number, response: 'accepted' | 'declined', note?: string) {
    const res = await fetch(`${this.base}/offers/${offerId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, note }),
    });
    return handleResponse(res);
  }
}

export const recruiterApi = new RecruiterApiService();
export default recruiterApi;
