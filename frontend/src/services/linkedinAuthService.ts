/**
 * LinkedIn OAuth Service for Frontend
 * Handles LinkedIn authentication via OpenID Connect
 */

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';

/** Always use the current origin so the user stays on pickcv.com (or whatever domain they're on) */
function getRedirectUri(): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
}

interface LinkedInAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  email: string;
  name?: string;
  picture?: string;
  is_new_user?: boolean;
  has_linkedin_data?: boolean;
  linkedin_posts_count?: number;
}

export const linkedinAuthService = {
  /**
   * Redirect to LinkedIn OAuth login
   */
  redirectToLinkedInLogin(): void {
    const state = `linkedin_${this.generateState()}`;
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'linkedin');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      state: state,
      scope: 'openid profile email w_member_social',
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  },

  /**
   * Exchange authorization code for JWT tokens via our backend
   */
  async exchangeCodeForToken(code: string): Promise<LinkedInAuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/linkedin/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: getRedirectUri(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `LinkedIn token exchange failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to exchange LinkedIn code for token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Handle OAuth callback (called from /auth/callback route)
   */
  async handleCallback(): Promise<LinkedInAuthResponse | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Verify state for CSRF protection — MUST match to prevent login-CSRF
    const savedState = sessionStorage.getItem('oauth_state');
    if (!state || !savedState || state !== savedState) {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      throw new Error('LinkedIn OAuth state mismatch — possible CSRF attack. Please try again.');
    }

    if (!code) {
      throw new Error('Authorization code not found in LinkedIn callback URL');
    }

    try {
      const response = await this.exchangeCodeForToken(code);
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      return response;
    } catch (error) {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      throw error;
    }
  },

  /**
   * Generate cryptographically secure random state for CSRF protection
   */
  generateState(): string {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Store authentication tokens (same format as Google)
   */
  storeTokens(tokens: LinkedInAuthResponse): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user_id', tokens.user_id.toString());
    localStorage.setItem('user_email', tokens.email);
    localStorage.setItem('oauth_provider', 'linkedin');
    if (tokens.has_linkedin_data) {
      localStorage.setItem('has_linkedin_data', 'true');
    }
    if (tokens.linkedin_posts_count) {
      localStorage.setItem('linkedin_posts_count', tokens.linkedin_posts_count.toString());
    }
  },

  /**
   * Store user profile information
   */
  storeUserInfo(name: string, email: string, picture?: string): void {
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_email', email);
    if (picture) {
      localStorage.setItem('user_picture', picture);
    }
  },

  // ─── LinkedIn Data API Methods ──────────────────────────

  /**
   * Get auth headers for API calls
   */
  _getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  },

  /**
   * Check if the user has a linked LinkedIn account
   */
  async getLinkedInStatus(): Promise<{
    connected: boolean;
    linkedin_sub: string | null;
    oauth_provider: string | null;
  }> {
    const response = await fetch(`${API_URL}/auth/linkedin/status`, {
      headers: this._getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to check LinkedIn status');
    return response.json();
  },

  /**
   * Get the user's LinkedIn profile info
   */
  async getLinkedInProfile(): Promise<{
    linkedin_sub: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    picture: string;
    locale: string;
    profile_url: string;
  }> {
    const response = await fetch(`${API_URL}/auth/linkedin/profile`, {
      headers: this._getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch LinkedIn profile');
    }
    return response.json();
  },

  /**
   * Get the user's own LinkedIn posts/shares
   */
  async getLinkedInPosts(
    count: number = 50
  ): Promise<{
    total: number;
    posts: Array<{
      post_urn: string;
      text: string;
      full_text: string;
      media: Array<{ title: string; description: string; url: string }>;
      created_at: number;
      last_modified: number;
      likes: number;
      comments: number;
      shares: number;
      visibility: string;
    }>;
  }> {
    const response = await fetch(
      `${API_URL}/auth/linkedin/posts?count=${count}`,
      { headers: this._getAuthHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch LinkedIn posts');
    }
    return response.json();
  },

  /**
   * Get a comprehensive activity summary from LinkedIn
   */
  async getLinkedInActivitySummary(): Promise<{
    linkedin_sub: string;
    name: string;
    email: string;
    total_posts: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    posts: Array<{
      post_urn: string;
      text: string;
      likes: number;
      comments: number;
      shares: number;
      created_at: number;
    }>;
    engagement_rate: number;
  }> {
    const response = await fetch(
      `${API_URL}/auth/linkedin/activity-summary`,
      { headers: this._getAuthHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch LinkedIn activity');
    }
    return response.json();
  },

  /**
   * Get comments on a specific LinkedIn post
   */
  async getPostComments(
    postUrn: string,
    count: number = 20
  ): Promise<{ total: number; comments: Array<Record<string, unknown>> }> {
    const response = await fetch(
      `${API_URL}/auth/linkedin/posts/${encodeURIComponent(postUrn)}/comments?count=${count}`,
      { headers: this._getAuthHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch post comments');
    }
    return response.json();
  },
};
