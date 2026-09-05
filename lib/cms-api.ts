const rawApiUrl =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? 'https://infostorage-cms.patrickoliverdeguzman.workers.dev';

// Trimmed so a stray space in the environment can never produce an
// unparseable fetch URL, and without a trailing slash so callers can safely
// append paths like `/v1/admin/login`.
export const CMS_API = rawApiUrl.trim().replace(/\/+$/, '');
