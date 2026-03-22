/**
 * LinkedIn OAuth Service for Frontend
 * Handles LinkedIn authentication via OpenID Connect
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
const LINKEDIN_REDIRECT_URI =
  import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
  `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;

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
      redirect_uri: LINKEDIN_REDIRECT_URI,
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
      const url = `${API_URL}/auth/linkedin/token?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}`;
      console.log('Calling backend LinkedIn token exchange:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('LinkedIn backend error response:', errorBody);
        throw new Error(
          `LinkedIn token exchange failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('LinkedIn token exchange successful:', data);
      return data;
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
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

    // Verify state for CSRF protection
    const savedState = sessionStorage.getItem('oauth_state');
    if (state && savedState && state !== savedState) {
      console.warn('LinkedIn state mismatch - CSRF check warning (non-blocking)');
    }

    if (!code) {
      throw new Error('Authorization code not found in LinkedIn callback URL');
    }

    try {
      console.log('Exchanging LinkedIn code for token...');
      const response = await this.exchangeCodeForToken(code);
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      return response;
    } catch (error) {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      console.error('LinkedIn token exchange error:', error);
      throw error;
    }
  },

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
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
