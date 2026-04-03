/**
 * Subdomain detection utility for PickCV
 * 
 * admin.pickcv.com        → "admin"
 * institution.pickcv.com  → "institution"
 * recruiters.pickcv.com   → "recruiter"
 * pickcv.com / anything else → "main"
 * 
 * Local dev: use ?portal=admin | ?portal=institution | ?portal=recruiter
 */

export type SubdomainType = 'admin' | 'institution' | 'recruiter' | 'main';

export function getSubdomain(): SubdomainType {
  const hostname = window.location.hostname;

  // Local development support: check query param ?portal=admin | institution | recruiter
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');
  if (portalParam === 'admin') return 'admin';
  if (portalParam === 'institution') return 'institution';
  if (portalParam === 'recruiter') return 'recruiter';

  // Production subdomain detection
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('institution.')) return 'institution';
  if (hostname.startsWith('recruiters.')) return 'recruiter';

  return 'main';
}

/**
 * Check if the current page is on a subdomain portal
 */
export function isSubdomainPortal(): boolean {
  return getSubdomain() !== 'main';
}

/**
 * Get the full URL for a specific portal.
 * Works for both production (subdomains) and local dev (?portal= query param).
 * 
 * Usage:
 *   getPortalUrl('recruiter')     → "https://recruiters.pickcv.com" or "http://localhost:3000?portal=recruiter"
 *   getPortalUrl('institution')   → "https://institution.pickcv.com" or "http://localhost:3000?portal=institution"
 *   getPortalUrl('recruiter', '/register') → appends path
 */
export function getPortalUrl(portal: 'recruiter' | 'institution' | 'admin', path: string = '/'): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocal) {
    // Local dev: same origin + ?portal= query param
    const base = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    const cleanPath = path === '/' ? '' : path;
    return `${base}${cleanPath}?portal=${portal}`;
  }
  
  // Production: use real subdomains
  const subdomainMap: Record<string, string> = {
    recruiter: 'recruiters',
    institution: 'institution',
    admin: 'admin',
  };
  
  // Extract the base domain (e.g. pickcv.com from studio-xxx.web.app or pickcv.com)
  // For Firebase hosting: studio-1324640898-76b00.web.app → use as-is with subdomain prefix won't work
  // So we need to handle Firebase URLs differently
  const subdomain = subdomainMap[portal];
  
  // If it's a custom domain like pickcv.com, admin.pickcv.com, etc.
  const baseDomain = hostname
    .replace(/^www\./, '')
    .replace(/^admin\./, '')
    .replace(/^institution\./, '')
    .replace(/^recruiters\./, '');
  
  const cleanPath = path === '/' ? '' : path;
  return `${protocol}//${subdomain}.${baseDomain}${cleanPath}`;
}

/**
 * Path mapping from main-site paths to subdomain short paths.
 * Used so navigate() calls work correctly on both main site and subdomains.
 */
const adminPathMap: Record<string, string> = {
  '/admin/login': '/login',
  '/admin/colleges': '/colleges',
  '/admin/recruiters': '/recruiters',
  '/admin/payments': '/payments',
};

const institutionPathMap: Record<string, string> = {
  '/college/login': '/login',
  '/college/register': '/register',
  '/college/onboarding': '/onboarding',
  '/college/pending-approval': '/pending-approval',
  '/college-dashboard': '/dashboard',
};

const recruiterPathMap: Record<string, string> = {
  '/recruiter/login': '/login',
  '/recruiter/register': '/register',
  '/recruiter/verify-email': '/verify-email',
  '/recruiter/verify-email-sent': '/verify-email-sent',
  '/recruiter/pending-approval': '/pending-approval',
  '/recruiter/dashboard': '/dashboard',
  '/recruiter/jobs': '/jobs',
  '/recruiter/jobs/new': '/jobs/new',
  '/recruiter/interviewers': '/interviewers',
  '/recruiter/offer-templates': '/offer-templates',
  '/recruiter/offers': '/offers',
  '/recruiter/accept-invite': '/accept-invite',
};

/**
 * Resolve a navigation path for the current subdomain.
 * On the main site, paths are returned as-is.
 * On subdomains, long paths are shortened (e.g. /recruiter/login → /login).
 */
export function resolvePath(path: string): string {
  const sub = getSubdomain();
  let resolved = path;

  if (sub === 'admin') resolved = adminPathMap[path] ?? path;
  else if (sub === 'institution') resolved = institutionPathMap[path] ?? path;
  else if (sub === 'recruiter') {
    if (recruiterPathMap[path]) resolved = recruiterPathMap[path];
    else if (path.startsWith('/recruiter/')) resolved = path.replace('/recruiter', '');
    else resolved = path;
  }

  // In local dev, preserve ?portal= param so subdomain context is retained
  const portalParam = new URLSearchParams(window.location.search).get('portal');
  if (portalParam && sub !== 'main') {
    resolved += (resolved.includes('?') ? '&' : '?') + `portal=${portalParam}`;
  }

  return resolved;
}
