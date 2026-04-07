const rawApiBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim();

// Use an explicit env URL when provided; otherwise rely on Vite dev proxy at /api.
export const API_BASE_URL = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, '')
  : '/api';

export function toApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
