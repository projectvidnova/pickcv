/**
 * Subdomain detection utility for PickCV
 * 
 * admin.pickcv.com    → "admin"
 * institution.pickcv.com → "institution"
 * pickcv.com / anything else → "main"
 */

export type SubdomainType = 'admin' | 'institution' | 'main';

export function getSubdomain(): SubdomainType {
  const hostname = window.location.hostname;

  // Local development support: check query param ?portal=admin or ?portal=institution
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');
  if (portalParam === 'admin') return 'admin';
  if (portalParam === 'institution') return 'institution';

  // Production subdomain detection
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('institution.')) return 'institution';

  return 'main';
}

/**
 * Check if the current page is on a subdomain portal
 */
export function isSubdomainPortal(): boolean {
  return getSubdomain() !== 'main';
}

/**
 * Path mapping from main-site paths to subdomain short paths.
 * Used so navigate() calls work correctly on both main site and subdomains.
 */
const adminPathMap: Record<string, string> = {
  '/admin/login': '/login',
  '/admin/colleges': '/colleges',
};

const institutionPathMap: Record<string, string> = {
  '/college/login': '/login',
  '/college/register': '/register',
  '/college/onboarding': '/onboarding',
  '/college/pending-approval': '/pending-approval',
  '/college-dashboard': '/dashboard',
};

/**
 * Resolve a navigation path for the current subdomain.
 * On the main site, paths are returned as-is.
 * On subdomains, long paths are shortened (e.g. /admin/login → /login).
 */
export function resolvePath(path: string): string {
  const sub = getSubdomain();
  if (sub === 'admin') return adminPathMap[path] ?? path;
  if (sub === 'institution') return institutionPathMap[path] ?? path;
  return path;
}
