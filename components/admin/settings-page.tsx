'use client';

import { CMS_API } from '@/lib/cms-api';

import { useCallback, useEffect, useState } from 'react';
import { Save, Eye, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface CmsDoc {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: string;
  data: Record<string, unknown>;
}

interface DocListResponse {
  documents: CmsDoc[];
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

interface SocialLink {
  label: string;
  href: string;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export function SettingsPage() {
  const [tab, setTab] = useState<'site' | 'nav'>('site');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [navId, setNavId] = useState<string | null>(null);

  const [siteName, setSiteName] = useState('INFOStorage');
  const [companyName, setCompanyName] = useState('INFOStorage Corporation');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+63 2 8899 4878');
  const [phoneHref, setPhoneHref] = useState('tel:+63288994878');
  const [address, setAddress] = useState('1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City');
  const [addressUrl, setAddressUrl] = useState('https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City');
  const [logo, setLogo] = useState('/infostorage-logo.png');
  const [copyright, setCopyright] = useState('© 2025 INFOStorage Corporation');
  const [seoTitle, setSeoTitle] = useState('INFOStorage | Enterprise technology, thoughtfully connected');
  const [seoDescription, setSeoDescription] = useState('Enterprise technology solutions across systems, security, data protection, and professional services.');
  const [ogImage, setOgImage] = useState('/og.png');
  const [social, setSocial] = useState<SocialLink[]>([]);
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialHref, setNewSocialHref] = useState('');

  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [newNavLabel, setNewNavLabel] = useState('');
  const [newNavHref, setNewNavHref] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = { authorization: `Bearer ${token}` };
      const [settingsRes, navRes] = await Promise.all([
        fetch(`${CMS_API}/v1/admin/documents?type=site_settings&limit=100`, { headers }),
        fetch(`${CMS_API}/v1/admin/documents?type=navigation&limit=100`, { headers }),
      ]);
      const settingsData = (await settingsRes.json()) as DocListResponse;
      const navData = (await navRes.json()) as DocListResponse;
      const settingsDoc = settingsData.documents?.find((d) => d.slug === 'global') ?? null;
      const navDoc = navData.documents?.find((d) => d.slug === 'main') ?? null;
      if (settingsDoc) {
        setSettingsId(settingsDoc.id);
        const d = settingsDoc.data ?? {};
        setSiteName(text(d.siteName) || 'INFOStorage');
        setCompanyName(text(d.companyName) || 'INFOStorage Corporation');
        setEmail(text(d.email));
        setPhone(text(d.phone) || '+63 2 8899 4878');
        setPhoneHref(text(d.phoneHref) || 'tel:+63288994878');
        setAddress(text(d.address) || '1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City');
        setAddressUrl(text(d.addressUrl) || 'https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City');
        setLogo(text(d.logo) || '/infostorage-logo.png');
        setCopyright(text(d.copyright) || '© 2025 INFOStorage Corporation');
        setSeoTitle(text(d.defaultSeoTitle) || 'INFOStorage | Enterprise technology, thoughtfully connected');
        setSeoDescription(text(d.defaultSeoDescription) || 'Enterprise technology solutions across systems, security, data protection, and professional services.');
        setOgImage(text(d.ogImage) || '/og.png');
        setSocial(Array.isArray(d.social) ? (d.social as SocialLink[]) : []);
      }
      if (navDoc) {
        setNavId(navDoc.id);
        const items = Array.isArray((navDoc.data ?? {}).items) ? ((navDoc.data as { items: NavItem[] }).items) : [];
        setNavItems(items.map((item, i) => ({ id: item.id || `nav-${i}`, label: item.label, href: item.href, enabled: item.enabled !== false })));
      } else {
        setNavItems([
          { id: 'nav-solutions', label: 'Solutions', href: '#solutions', enabled: true },
          { id: 'nav-services', label: 'Services', href: '#services', enabled: true },
          { id: 'nav-approach', label: 'Why INFOStorage', href: '#approach', enabled: true },
          { id: 'nav-partners', label: 'Partners', href: '/partners', enabled: true },
          { id: 'nav-contact', label: 'Contact', href: '#contact', enabled: true },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveDoc = async (type: string, slug: string, title: string, data: Record<string, unknown>, existingId: string | null): Promise<string> => {
    const token = localStorage.getItem('cms_token');
    const headers = { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };
    if (existingId) {
      const res = await fetch(`${CMS_API}/v1/admin/documents/${existingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title, data }),
      });
      const out = (await res.json()) as { document?: CmsDoc; error?: string };
      if (!res.ok || !out.document) throw new Error(out.error ?? 'Save failed.');
      return out.document.id;
    }
    const res = await fetch(`${CMS_API}/v1/admin/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, title, slug, data }),
    });
    const out = (await res.json()) as { document?: CmsDoc; error?: string };
    if (!res.ok || !out.document) throw new Error(out.error ?? 'Save failed.');
    return out.document.id;
  };

  const publishDoc = async (id: string) => {
    const token = localStorage.getItem('cms_token');
    const res = await fetch(`${CMS_API}/v1/admin/documents/${id}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const out = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(out.error ?? 'Publish failed.');
    }
  };

  const saveSite = async (publish: boolean) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = { siteName, companyName, email, phone, phoneHref, address, addressUrl, logo, copyright, defaultSeoTitle: seoTitle, defaultSeoDescription: seoDescription, ogImage, social };
      const id = await saveDoc('site_settings', 'global', 'Global site settings', data, settingsId);
      setSettingsId(id);
      if (publish) await publishDoc(id);
      setMessage(publish ? 'Site settings saved and published.' : 'Site settings saved as draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const saveNav = async (publish: boolean) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const id = await saveDoc('navigation', 'main', 'Main navigation', { items: navItems }, navId);
      setNavId(id);
      if (publish) await publishDoc(id);
      setMessage(publish ? 'Navigation saved and published.' : 'Navigation saved as draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const moveNav = (index: number, direction: -1 | 1) => {
    const next = [...navItems];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setNavItems(next);
  };

  if (loading) return <div className="admin-empty"><p>Loading settings...</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Site Settings</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`admin-btn ${tab === 'site' ? 'admin-btn-primary' : 'admin-btn-secondary'}`} type="button" onClick={() => setTab('site')}>Site settings</button>
        <button className={`admin-btn ${tab === 'nav' ? 'admin-btn-primary' : 'admin-btn-secondary'}`} type="button" onClick={() => setTab('nav')}>Navigation</button>
      </div>
      {error && <div className="admin-card" style={{ marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>{error}</div>}
      {message && <div className="admin-card" style={{ marginBottom: '1rem', color: '#166534', fontSize: '0.85rem' }}>{message}</div>}

      {tab === 'site' && (
        <div className="admin-card">
          <div className="admin-form-group"><label>Site name</label><input value={siteName} onChange={(e) => setSiteName(e.target.value)} /></div>
          <div className="admin-form-group"><label>Company name</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="admin-form-group"><label>Contact email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@example.com" /></div>
          <div className="admin-form-group"><label>Phone label</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="admin-form-group"><label>Phone link</label><input value={phoneHref} onChange={(e) => setPhoneHref(e.target.value)} /></div>
          <div className="admin-form-group"><label>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="admin-form-group"><label>Address link</label><input value={addressUrl} onChange={(e) => setAddressUrl(e.target.value)} /></div>
          <div className="admin-form-group"><label>Logo path</label><input value={logo} onChange={(e) => setLogo(e.target.value)} /></div>
          <div className="admin-form-group"><label>Footer copyright</label><input value={copyright} onChange={(e) => setCopyright(e.target.value)} /></div>
          <div className="admin-form-group"><label>Default SEO title</label><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></div>
          <div className="admin-form-group"><label>Default SEO description</label><input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></div>
          <div className="admin-form-group"><label>Default social sharing image</label><input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="/og.png or a media URL" /></div>
          <div className="admin-form-group">
            <label>Social links</label>
            {social.map((link, i) => (
              <div key={`${link.label}-${i}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={link.label} onChange={(e) => setSocial((prev) => prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))} placeholder="Label" />
                <input value={link.href} onChange={(e) => setSocial((prev) => prev.map((l, j) => (j === i ? { ...l, href: e.target.value } : l)))} placeholder="https://..." />
                <button className="admin-btn admin-btn-danger" type="button" onClick={() => setSocial((prev) => prev.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={newSocialLabel} onChange={(e) => setNewSocialLabel(e.target.value)} placeholder="Label" />
              <input value={newSocialHref} onChange={(e) => setNewSocialHref(e.target.value)} placeholder="https://..." />
              <button
                className="admin-btn admin-btn-secondary"
                type="button"
                onClick={() => {
                  if (!newSocialLabel.trim() || !newSocialHref.trim()) return;
                  setSocial((prev) => [...prev, { label: newSocialLabel.trim(), href: newSocialHref.trim() }]);
                  setNewSocialLabel('');
                  setNewSocialHref('');
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="admin-btn admin-btn-secondary" type="button" disabled={saving} onClick={() => void saveSite(false)}><Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button className="admin-btn admin-btn-primary" type="button" disabled={saving} onClick={() => void saveSite(true)}><Eye size={16} /> Save & Publish</button>
          </div>
        </div>
      )}

      {tab === 'nav' && (
        <div className="admin-card">
          {navItems.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', opacity: item.enabled ? 1 : 0.55 }}>
              <input value={item.label} onChange={(e) => setNavItems((prev) => prev.map((n, j) => (j === index ? { ...n, label: e.target.value } : n)))} placeholder="Label" style={{ maxWidth: 180 }} />
              <input value={item.href} onChange={(e) => setNavItems((prev) => prev.map((n, j) => (j === index ? { ...n, href: e.target.value } : n)))} placeholder="/partners or #contact" />
              <button className="admin-btn admin-btn-ghost" type="button" title="Move up" onClick={() => moveNav(index, -1)}><ArrowUp size={14} /></button>
              <button className="admin-btn admin-btn-ghost" type="button" title="Move down" onClick={() => moveNav(index, 1)}><ArrowDown size={14} /></button>
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={() => setNavItems((prev) => prev.map((n, j) => (j === index ? { ...n, enabled: !n.enabled } : n)))}
              >
                {item.enabled ? 'Disable' : 'Enable'}
              </button>
              <button className="admin-btn admin-btn-danger" type="button" onClick={() => setNavItems((prev) => prev.filter((_, j) => j !== index))}><Trash2 size={14} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input value={newNavLabel} onChange={(e) => setNewNavLabel(e.target.value)} placeholder="Label" style={{ maxWidth: 180 }} />
            <input value={newNavHref} onChange={(e) => setNewNavHref(e.target.value)} placeholder="/partners or #contact" />
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              onClick={() => {
                if (!newNavLabel.trim() || !newNavHref.trim()) return;
                setNavItems((prev) => [...prev, { id: `nav-${Date.now()}`, label: newNavLabel.trim(), href: newNavHref.trim(), enabled: true }]);
                setNewNavLabel('');
                setNewNavHref('');
              }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="admin-btn admin-btn-secondary" type="button" disabled={saving} onClick={() => void saveNav(false)}><Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button className="admin-btn admin-btn-primary" type="button" disabled={saving} onClick={() => void saveNav(true)}><Eye size={16} /> Save & Publish</button>
          </div>
        </div>
      )}
    </div>
  );
}
