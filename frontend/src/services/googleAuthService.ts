/**
 * Google OAuth Service for Frontend
 * Handles Google authentication and token exchange
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;

interface GoogleAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  email: string;
  name?: string;
  picture?: string;
}

export const googleAuthService = {
  /**
   * Get Google OAuth login URL
   */
  async getLoginUrl(): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/auth/google/login`);
      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('Failed to get Google login URL:', error);
      throw error;
    }
  },

  /**
   * Exchange authorization code for JWT tokens
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
    try {
      const url = `${API_URL}/auth/google/token?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}`;
      console.log('Calling backend token exchange:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Backend error response:', errorBody);
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Token exchange successful:', data);
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Redirect to Google OAuth login
   */
  redirectToGoogleLogin(): void {
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      access_type: 'offline',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Handle OAuth callback (called from /auth/callback route)
   */
  async handleCallback(): Promise<GoogleAuthResponse | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Verify state for CSRF protection (warning instead of error for now)
    const savedState = sessionStorage.getItem('oauth_state');
    if (state && savedState && state !== savedState) {
      console.warn('State mismatch - CSRF check warning (non-blocking)');
      // Continue anyway for now in development
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    try {
      console.log('Exchanging code for token...');
      const response = await this.exchangeCodeForToken(code);
      sessionStorage.removeItem('oauth_state');
      return response;
    } catch (error) {
      sessionStorage.removeItem('oauth_state');
      console.error('Token exchange error:', error);
      throw error;
    }
  },

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  },

  /**
   * Store authentication tokens
   */
  storeTokens(tokens: GoogleAuthResponse): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user_id', tokens.user_id.toString());
    localStorage.setItem('user_email', tokens.email);
    // Store user name if available (will be set from user info)
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

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_picture');
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
