/**
 * Authenticated Fetch Wrapper with Auto Token Refresh
 * 
 * Wraps the native fetch() to automatically:
 * 1. Attach the Authorization header
 * 2. Retry with a refreshed token on 401 responses
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token or null on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Deduplicated refresh — prevents multiple concurrent refresh calls.
 */
function doRefresh(): Promise<string | null> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise!;
}

/**
 * Fetch wrapper that automatically adds auth and retries on 401.
 * 
 * Usage: `const res = await authFetch('/payments/check-access/1');`
 *        `const res = await authFetch('http://localhost:8000/api/resume/upload', { method: 'POST', body: formData });`
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem('access_token');

  // Build headers — merge any provided headers with Authorization
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  // If not 401, return as-is
  if (response.status !== 401) return response;

  // Try to refresh and retry once
  const newToken = await doRefresh();
  if (!newToken) return response; // refresh failed, return original 401

  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set('Authorization', `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
}

export default authFetch;
