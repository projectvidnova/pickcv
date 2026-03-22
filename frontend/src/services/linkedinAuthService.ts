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
}

export const linkedinAuthService = {
  /**
   * Redirect to LinkedIn OAuth login
   */
  redirectToLinkedInLogin(): void {
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'linkedin');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT_URI,
      state: state,
      scope: 'openid profile email',
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
};
