const SESSION_KEY = 'infostorage.cms.session-token';
const LEGACY_KEY = 'cms_token';

export function getCmsToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const current = sessionStorage.getItem(SESSION_KEY);
    if (current) return current;

    // Migrate an existing login once, then remove the long-lived copy. CMS
    // sessions now end with the browser tab instead of remaining on disk.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    sessionStorage.setItem(SESSION_KEY, legacy);
    localStorage.removeItem(LEGACY_KEY);
    return legacy;
  } catch {
    return null;
  }
}

export function setCmsToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
  localStorage.removeItem(LEGACY_KEY);
}

export function clearCmsToken(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Navigation still returns the user to sign-in when storage is blocked.
  }
}

export function cmsAuthHeaders(initial?: HeadersInit): Headers {
  const headers = new Headers(initial);
  const token = getCmsToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return headers;
}
