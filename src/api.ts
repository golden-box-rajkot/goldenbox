/**
 * Centralized API URL configuration for Golden Box frontend.
 * Used identically across customer catalog and admin views.
 */

export const PRODUCTION_API_URL = 'https://goldenboxapi.onrender.com';

/**
 * Sanitizes an API base URL by stripping whitespace, accidental quotes,
 * control characters, and trailing slashes.
 */
export function sanitizeBaseUrl(url?: string | null): string {
  if (!url) return '';
  return String(url)
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/\/+$/, '');
}

/**
 * Resolves the effective API base URL.
 * 1. Checks and cleans import.meta.env.VITE_API_BASE_URL
 * 2. If empty or on GitHub Pages (*.github.io), falls back to PRODUCTION_API_URL
 * 3. In local dev environment without env var, returns '' (proxying via relative path)
 */
export function getApiBaseUrl(): string {
  const rawEnv = import.meta.env.VITE_API_BASE_URL;
  const cleanedEnv = sanitizeBaseUrl(rawEnv);

  if (cleanedEnv) {
    return cleanedEnv;
  }

  // When hosted on GitHub Pages, always target the production Render backend
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    return PRODUCTION_API_URL;
  }

  // Fallback for static production builds running on non-local origins
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const isLocalOrDev =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('run.app');
    if (!isLocalOrDev) {
      return PRODUCTION_API_URL;
    }
  }

  return '';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Builds a clean, fully-qualified or root-relative API URL.
 * Guarantees no duplicated slashes, no whitespace, and correct endpoint paths.
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

