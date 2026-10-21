/**
 * Canonical URL Configuration for Aanya Fashions
 * Enforces canonical production domain policy and prevents noncanonical redirects.
 */

export const CANONICAL_SITE_URL = 'https://www.aanyafashions.com';

/**
 * Returns the authoritative site URL.
 * - Localhost / 127.0.0.1: uses window.location.origin for local development.
 * - Production / Deployed: uses VITE_SITE_URL if configured, otherwise canonical 'https://www.aanyafashions.com'.
 * Never constructs a production redirect using window.location.origin if it could resolve to a noncanonical hostname.
 */
export const getSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin;
    }
  }
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return CANONICAL_SITE_URL;
};

/**
 * Constructs an absolute canonical URL for a given route/path.
 */
export const getCanonicalUrl = (path: string = ''): string => {
  const base = getSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
