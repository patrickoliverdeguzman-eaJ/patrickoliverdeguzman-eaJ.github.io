// Seeds the CMS with the site content extracted from the static pages.
// Usage:
//   CMS_API_URL=https://<worker>.workers.dev CMS_EMAIL=admin@example.com CMS_PASSWORD=... npm run cms:seed
// Existing type+slug entries are updated in place (draft) and then published,
// so re-running the script is safe.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const api = (process.env.CMS_API_URL ?? 'http://127.0.0.1:8787').replace(/\/+$/, '');
const email = process.env.CMS_EMAIL ?? '';
const password = process.env.CMS_PASSWORD ?? '';

if (!email || !password) {
  console.error('Set CMS_EMAIL and CMS_PASSWORD (and optionally CMS_API_URL).');
  process.exit(1);
}

async function apiJson(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${api}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? `Request failed: ${method} ${pathname}`);
    err.code = data.code;
    throw err;
  }
  return data;
}

const seedPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site-content.json');
const seed = JSON.parse(await readFile(seedPath, 'utf8'));

const { token } = await apiJson('/v1/admin/login', { method: 'POST', body: { email, password } });
console.log(`Signed in as ${email}`);

let created = 0;
let updated = 0;
let published = 0;
for (const entry of seed.documents) {
  let id = null;
  try {
    const out = await apiJson('/v1/admin/documents', {
      method: 'POST',
      token,
      body: { type: entry.type, title: entry.title, slug: entry.slug, data: entry.data, note: 'Seeded from static site' },
    });
    id = out.document.id;
    created += 1;
    console.log(`created ${entry.type}/${entry.slug}`);
  } catch (err) {
    if (err.code !== 'slug_in_use') throw err;
    const list = await apiJson(`/v1/admin/documents?type=${encodeURIComponent(entry.type)}&limit=100`, { token });
    const existing = list.documents.find((d) => d.slug === entry.slug);
    if (!existing) throw err;
    await apiJson(`/v1/admin/documents/${existing.id}`, {
      method: 'PATCH',
      token,
      body: { title: entry.title, data: entry.data, note: 'Seeded from static site' },
    });
    id = existing.id;
    updated += 1;
    console.log(`updated ${entry.type}/${entry.slug}`);
  }
  try {
    await apiJson(`/v1/admin/documents/${id}/publish`, { method: 'POST', token });
    published += 1;
  } catch (err) {
    console.warn(`publish skipped for ${entry.type}/${entry.slug}: ${err.message}`);
  }
}

console.log(`Done. created=${created} updated=${updated} published=${published}`);
