'use client';

import { CMS_API } from '@/lib/cms-api';

import { useState } from 'react';
import { adminPath } from '@/lib/site-paths';

const contentTypes = [
  { value: 'page', label: 'Page', hint: 'Generic page with content blocks.' },
  { value: 'home_section', label: 'Home section', hint: 'One homepage section (hero, intro, continuity, sectors, contact).' },
  { value: 'page_section', label: 'Page section', hint: 'A structured section for an existing public page.' },
  { value: 'solution', label: 'Solution', hint: 'A solution card: description plus bullet items.' },
  { value: 'service', label: 'Service', hint: 'A single IVAS service row.' },
  { value: 'partner', label: 'Technology partner', hint: 'Partner name, focus area, and website.' },
  { value: 'client', label: 'Valued client', hint: 'Client name, logo, and website.' },
  { value: 'site_settings', label: 'Site settings', hint: 'Global contact, branding, and SEO values.' },
  { value: 'navigation', label: 'Navigation', hint: 'Menu item list with labels, links, and visibility.' },
];

const starterData: Record<string, Record<string, unknown>> = {
  page: { summary: '', seoTitle: '', seoDescription: '', enabled: true, blocks: [] },
  home_section: { eyebrow: '', heading: '', body: '', primaryLabel: '', primaryHref: '', secondaryLabel: '', secondaryHref: '', enabled: true },
  page_section: { eyebrow: '', heading: '', body: '', ctaLabel: '', ctaHref: '', enabled: true },
  solution: { description: '', items: [] },
  service: { description: '' },
  partner: { focus: '', website: '' },
  client: { logo: '', website: '' },
  site_settings: { siteName: 'INFOStorage' },
  navigation: { items: [] },
};

export function DocumentNewPage() {
  const [type, setType] = useState('page');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('cms_token');
      const finalSlug = slugify(slug || title);
      if (!finalSlug) throw new Error('Enter a title so a slug can be generated.');
      const res = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, title: title.trim(), slug: finalSlug, data: starterData[type] ?? {} }),
      });
      const data = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? 'Could not create the document.');
      window.location.href = adminPath(`/admin/documents/edit?id=${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="admin-btn admin-btn-ghost" type="button" onClick={() => { window.location.href = adminPath('/admin/documents'); }}>← Back</button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>New Document</h2>
      </div>
      {error && <div className="admin-card" style={{ marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>{error}</div>}
      <form className="admin-card" onSubmit={create}>
        <div className="admin-form-group">
          <label>Content type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {contentTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
            ))}
          </select>
        </div>
        <div className="admin-form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} required maxLength={160} placeholder="e.g. Homepage hero" />
        </div>
        <div className="admin-form-group">
          <label>Slug</label>
          <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required maxLength={120} placeholder="e.g. homepage-hero" />
        </div>
        <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create Draft'}
        </button>
      </form>
    </div>
  );
}
