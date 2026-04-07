/**
 * Google OAuth Service for Frontend
 * Handles Google authentication and token exchange
 */

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Always use the current origin so the user stays on pickcv.com (or whatever domain they're on) */
function getRedirectUri(): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
}

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
      const response = await fetch(`${API_URL}/auth/google/token`, {
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
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Redirect to Google OAuth login
   */
  redirectToGoogleLogin(): void {
    const state = `google_${this.generateState()}`;
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'google');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: getRedirectUri(),
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

    // Verify state for CSRF protection — MUST match to prevent login-CSRF
    const savedState = sessionStorage.getItem('oauth_state');
    if (!state || !savedState || state !== savedState) {
      sessionStorage.removeItem('oauth_state');
      throw new Error('OAuth state mismatch — possible CSRF attack. Please try again.');
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    try {
      const response = await this.exchangeCodeForToken(code);
      sessionStorage.removeItem('oauth_state');
      return response;
    } catch (error) {
      sessionStorage.removeItem('oauth_state');
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
