'use client';

import {
  Archive,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { type SubmitEvent, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './cms-workspace.module.css';

type Role = 'admin' | 'editor' | 'viewer';
type Status = 'draft' | 'published' | 'archived';
type View = 'content' | 'media' | 'team';

type CmsHealth = {
  ready: boolean;
  setupConfigured: boolean;
  initialized: boolean;
  migrationRequired?: boolean;
};

type CmsUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

type CmsDocument = {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: Status;
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  currentRevision: number;
  publishedRevision: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type CmsRevision = {
  id: string;
  revisionNumber: number;
  title: string;
  slug: string;
  data: Record<string, unknown>;
  note: string | null;
  createdAt: string;
};

type CmsMedia = {
  id: string;
  filename: string;
  altText: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  url: string;
};

type Draft = {
  id?: string;
  type: string;
  title: string;
  slug: string;
  data: string;
  note: string;
};

const endpointFromBuild = process.env.NEXT_PUBLIC_CMS_API_URL ?? '';
const endpointStorageKey = 'infostorage.cms.endpoint';
const tokenStorageKey = 'infostorage.cms.session-token';

const contentTypes = [
  { value: 'site_settings', label: 'Site settings' },
  { value: 'solution', label: 'Solution' },
  { value: 'service', label: 'Service' },
  { value: 'partner', label: 'Technology partner' },
  { value: 'client', label: 'Valued client' },
  { value: 'page', label: 'Page' },
];

const starterContent: Record<string, Record<string, unknown>> = {
  site_settings: {
    hero: { eyebrow: 'Premium solutions integrator', title: '', description: '' },
    contact: { phone: '', address: '' },
  },
  solution: { description: '', items: [] },
  service: { description: '' },
  partner: { focus: '', website: '' },
  client: { logo: '', website: '' },
  page: { summary: '', blocks: [] },
};

function blankDraft(type = 'site_settings'): Draft {
  return {
    type,
    title: '',
    slug: '',
    data: JSON.stringify(starterContent[type] ?? {}, null, 2),
    note: '',
  };
}

function fromDocument(document: CmsDocument): Draft {
  return {
    id: document.id,
    type: document.type,
    title: document.title,
    slug: document.slug,
    data: JSON.stringify(document.data, null, 2),
    note: '',
  };
}

function cleanEndpoint(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
}

function dateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: Status): string {
  return status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft';
}

export default function CmsWorkspace() {
  const [endpoint, setEndpoint] = useState(endpointFromBuild);
  const [health, setHealth] = useState<CmsHealth | null>(null);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<CmsUser | null>(null);
  const [view, setView] = useState<View>('content');
  const [documents, setDocuments] = useState<CmsDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CmsDocument | null>(null);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [draft, setDraft] = useState<Draft>(() => blankDraft());
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [team, setTeam] = useState<CmsUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  const api = useCallback(async <T,>(path: string, options: RequestInit = {}, overrideToken?: string): Promise<T> => {
    const apiEndpoint = cleanEndpoint(endpoint);
    if (!apiEndpoint) throw new Error('Enter the CMS API address first.');

    const headers = new Headers(options.headers);
    const activeToken = overrideToken ?? token;
    if (activeToken) headers.set('Authorization', `Bearer ${activeToken}`);
    const response = await fetch(`${apiEndpoint}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(data.error ?? 'The CMS could not complete that request.');
    return data;
  }, [endpoint, token]);

  const checkHealth = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const resolvedEndpoint = cleanEndpoint(endpoint);
      if (!resolvedEndpoint) throw new Error('Enter the CMS API address first.');
      const response = await fetch(`${resolvedEndpoint}/v1/health`);
      const data = await response.json() as CmsHealth & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'The CMS API is unavailable.');
      setEndpoint(resolvedEndpoint);
      sessionStorage.setItem(endpointStorageKey, resolvedEndpoint);
      setHealth(data);
      setNotice({ tone: 'success', message: data.ready ? 'CMS connection verified.' : 'CMS database migration is still required.' });
    } catch (error) {
      setHealth(null);
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not reach the CMS API.' });
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  const loadDocuments = useCallback(async () => {
    const data = await api<{ documents: CmsDocument[] }>('/v1/admin/documents');
    setDocuments(data.documents);
  }, [api]);

  const loadMedia = useCallback(async () => {
    const data = await api<{ media: CmsMedia[] }>('/v1/admin/media');
    setMedia(data.media);
  }, [api]);

  const loadTeam = useCallback(async () => {
    const data = await api<{ users: CmsUser[] }>('/v1/admin/users');
    setTeam(data.users);
  }, [api]);

  const loadRevisions = useCallback(async (id: string) => {
    const data = await api<{ revisions: CmsRevision[] }>(`/v1/admin/documents/${id}/revisions`);
    setRevisions(data.revisions);
  }, [api]);

  const refreshWorkspace = useCallback(async () => {
    await loadDocuments();
    if (view === 'media') await loadMedia();
    if (view === 'team' && isAdmin) await loadTeam();
  }, [isAdmin, loadDocuments, loadMedia, loadTeam, view]);

  useEffect(() => {
    const savedEndpoint = sessionStorage.getItem(endpointStorageKey);
    const savedToken = sessionStorage.getItem(tokenStorageKey);
    if (!savedEndpoint && !savedToken) return;
    window.setTimeout(() => {
      if (savedEndpoint) setEndpoint(savedEndpoint);
      if (savedToken) setToken(savedToken);
    }, 0);
  }, []);

  useEffect(() => {
    if (!token || !endpoint) return;
    void (async () => {
      try {
        const data = await api<{ user: CmsUser }>('/v1/admin/me');
        setUser(data.user);
        await loadDocuments();
      } catch {
        sessionStorage.removeItem(tokenStorageKey);
        setToken('');
        setUser(null);
      }
    })();
  }, [api, endpoint, loadDocuments, token]);

  const selectDocument = async (document: CmsDocument) => {
    setSelectedDocument(document);
    setDraft(fromDocument(document));
    setView('content');
    try {
      await loadRevisions(document.id);
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not load revisions.' });
    }
  };

  const saveDocument = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    setBusy(true);
    setNotice(null);
    try {
      const data = JSON.parse(draft.data) as Record<string, unknown>;
      if (Array.isArray(data) || data === null || typeof data !== 'object') {
        throw new Error('Content data must be a JSON object.');
      }
      const body = JSON.stringify({ type: draft.type, title: draft.title, slug: draft.slug, data, note: draft.note || undefined });
      const response = draft.id
        ? await api<{ document: CmsDocument }>(`/v1/admin/documents/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        : await api<{ document: CmsDocument }>('/v1/admin/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      setSelectedDocument(response.document);
      setDraft(fromDocument(response.document));
      await Promise.all([loadDocuments(), loadRevisions(response.document.id)]);
      setNotice({ tone: 'success', message: draft.id ? 'Draft saved as a new revision.' : 'New draft created.' });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not save the draft.' });
    } finally {
      setBusy(false);
    }
  };

  const updatePublication = async (action: 'publish' | 'unpublish' | 'archive') => {
    if (!selectedDocument || !canEdit) return;
    const labels = { publish: 'published', unpublish: 'returned to draft', archive: 'archived' };
    setBusy(true);
    try {
      const method = action === 'archive' ? 'DELETE' : 'POST';
      const path = action === 'archive'
        ? `/v1/admin/documents/${selectedDocument.id}`
        : `/v1/admin/documents/${selectedDocument.id}/${action}`;
      const response = await api<{ document: CmsDocument }>(path, { method });
      setSelectedDocument(response.document);
      setDraft(fromDocument(response.document));
      await loadDocuments();
      setNotice({ tone: 'success', message: `Entry ${labels[action]}.` });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not update publication state.' });
    } finally {
      setBusy(false);
    }
  };

  const restoreRevision = async (revisionNumber: number) => {
    if (!selectedDocument || !canEdit) return;
    setBusy(true);
    try {
      const response = await api<{ document: CmsDocument }>(
        `/v1/admin/documents/${selectedDocument.id}/restore/${revisionNumber}`,
        { method: 'POST' },
      );
      setSelectedDocument(response.document);
      setDraft(fromDocument(response.document));
      await Promise.all([loadDocuments(), loadRevisions(response.document.id)]);
      setNotice({ tone: 'success', message: `Revision ${revisionNumber} restored as a new draft.` });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not restore that revision.' });
    } finally {
      setBusy(false);
    }
  };

  const uploadMedia = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    const form = event.currentTarget;
    const input = form.elements.namedItem('file') as HTMLInputElement | null;
    const altInput = form.elements.namedItem('altText') as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setNotice({ tone: 'error', message: 'Choose a file to upload.' });
      return;
    }
    setBusy(true);
    try {
      await api<{ media: CmsMedia }>('/v1/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': file.name,
          'X-Alt-Text': altInput?.value ?? '',
        },
        body: file,
      });
      form.reset();
      await loadMedia();
      setNotice({ tone: 'success', message: 'Media uploaded to the library.' });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not upload this file.' });
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api('/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.get('displayName'),
          email: form.get('email'),
          password: form.get('password'),
          role: form.get('role'),
        }),
      });
      setShowMemberForm(false);
      await loadTeam();
      setNotice({ tone: 'success', message: 'Team member added.' });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Could not add the team member.' });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await api('/v1/admin/logout', { method: 'POST' });
    } catch {
      // The local session should still be removed when the network is unavailable.
    }
    sessionStorage.removeItem(tokenStorageKey);
    setToken('');
    setUser(null);
    setSelectedDocument(null);
    setDocuments([]);
  };

  const documentCount = useMemo(() => ({
    draft: documents.filter((document) => document.status === 'draft').length,
    published: documents.filter((document) => document.status === 'published').length,
  }), [documents]);

  const changeView = (nextView: View) => {
    setView(nextView);
    if (nextView === 'media') void loadMedia();
    if (nextView === 'team' && isAdmin) void loadTeam();
  };

  if (!user) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authPanel}>
          <div className={styles.authBrand}>
            <Link href="/" aria-label="INFOStorage home"><Image src="/infostorage-logo.png" alt="INFOStorage Corporation" width={142} height={44} priority /></Link>
            <span>Content Studio</span>
          </div>
          <div className={styles.authIntro}>
            <p className={styles.eyebrow}>Private publishing workspace</p>
            <h1>Control the site without touching its code.</h1>
            <p>Manage structured content, keep drafts private, restore a prior revision, and publish only when it is ready.</p>
          </div>
          <div className={styles.connectCard}>
            <label htmlFor="cms-endpoint">CMS API address</label>
            <div className={styles.endpointRow}>
              <input
                id="cms-endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://your-cms.workers.dev"
                autoComplete="url"
              />
              <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => void checkHealth()}>
                {busy ? <LoaderCircle size={16} className={styles.spin} /> : <RefreshCcw size={16} />} Connect
              </button>
            </div>
            <p className={styles.helper}>The API address is saved only for this browser session.</p>
          </div>

          {notice && <Notice notice={notice} />}

          {health?.migrationRequired && (
            <div className={styles.warningBox}><CircleAlert size={18} /> The API is online, but its database schema has not been applied yet.</div>
          )}

          {health?.ready && !health.initialized && (
            <BootstrapForm api={api} onAuthenticated={(result) => {
              sessionStorage.setItem(tokenStorageKey, result.token);
              setToken(result.token);
              setUser(result.user);
              setNotice({ tone: 'success', message: 'First administrator created.' });
            }} />
          )}

          {health?.ready && health.initialized && (
            <LoginForm api={api} onAuthenticated={(result) => {
              sessionStorage.setItem(tokenStorageKey, result.token);
              setToken(result.token);
              setUser(result.user);
              setNotice(null);
            }} />
          )}
        </section>
        <aside className={styles.authAside} aria-hidden="true">
          <div className={styles.authOrbitOne} />
          <div className={styles.authOrbitTwo} />
          <div className={styles.authSignal}><ShieldCheck size={28} /><span>Drafts stay private until you publish.</span></div>
        </aside>
      </main>
    );
  }

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <Link className={styles.studioBrand} href="/">
          <Image src="/infostorage-logo.png" alt="INFOStorage Corporation" width={128} height={40} />
          <span>Content<br />Studio</span>
        </Link>
        <nav className={styles.navigation} aria-label="CMS sections">
          <button className={view === 'content' ? styles.navActive : ''} onClick={() => changeView('content')}><FileText size={18} /> Content <span>{documents.length}</span></button>
          <button className={view === 'media' ? styles.navActive : ''} onClick={() => changeView('media')}><ImageIcon size={18} /> Media</button>
          {isAdmin && <button className={view === 'team' ? styles.navActive : ''} onClick={() => changeView('team')}><Users size={18} /> Team</button>}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userMark}>{user.displayName.slice(0, 1).toUpperCase()}</div>
          <div><strong>{user.displayName}</strong><span>{user.role}</span></div>
          <button aria-label="Sign out" onClick={() => void signOut()}><LogOut size={17} /></button>
        </div>
      </aside>

      <section className={styles.mainPanel}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>{view === 'content' ? 'Content library' : view === 'media' ? 'Media library' : 'Team access'}</p>
            <h1>{view === 'content' ? 'Publishing with a safety net.' : view === 'media' ? 'Files for your stories.' : 'People and permissions.'}</h1>
          </div>
          <div className={styles.topbarActions}>
            <a className={styles.viewSite} href="/" target="_blank" rel="noreferrer"><Eye size={16} /> View site</a>
            <button className={styles.iconButton} aria-label="Refresh workspace" onClick={() => void refreshWorkspace()} disabled={busy}><RefreshCcw size={17} /></button>
          </div>
        </header>

        {notice && <Notice notice={notice} />}

        {view === 'content' && (
          <div className={styles.contentLayout}>
            <section className={styles.documentList} aria-label="Content entries">
              <div className={styles.listHead}>
                <div><span>{documentCount.published} live</span><span>{documentCount.draft} draft</span></div>
                {canEdit && <button className={styles.addButton} onClick={() => { setSelectedDocument(null); setRevisions([]); setDraft(blankDraft()); }}><Plus size={17} /> New</button>}
              </div>
              <div className={styles.documentCards}>
                {documents.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => void selectDocument(document)}
                    className={`${styles.documentCard} ${selectedDocument?.id === document.id ? styles.selectedDocument : ''}`}
                  >
                    <span className={`${styles.statusDot} ${styles[document.status]}`} />
                    <div><small>{contentTypes.find((type) => type.value === document.type)?.label ?? document.type}</small><strong>{document.title}</strong><em>/{document.slug}</em></div>
                    <span className={styles.cardStatus}>{statusLabel(document.status)}</span>
                  </button>
                ))}
                {documents.length === 0 && <div className={styles.emptyState}><FileText size={22} /><p>No entries yet. Start with a small, structured piece of content.</p></div>}
              </div>
            </section>
            <section className={styles.editorPanel}>
              <div className={styles.editorHead}>
                <div>
                  <span>{selectedDocument ? `Revision ${selectedDocument.currentRevision}` : 'New content'}</span>
                  <h2>{selectedDocument?.title || 'Create a content entry'}</h2>
                </div>
                {selectedDocument && <span className={`${styles.statusPill} ${styles[selectedDocument.status]}`}>{statusLabel(selectedDocument.status)}</span>}
              </div>
              <form className={styles.editorForm} onSubmit={saveDocument}>
                <div className={styles.fieldGrid}>
                  <label>Content type
                    <select value={draft.type} disabled={Boolean(draft.id) || !canEdit} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value, data: current.id ? current.data : JSON.stringify(starterContent[event.target.value] ?? {}, null, 2) }))}>
                      {contentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </label>
                  <label>Slug
                    <input value={draft.slug} disabled={!canEdit} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="e.g. data-protection" />
                  </label>
                </div>
                <label>Title
                  <input value={draft.title} disabled={!canEdit} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Clear, audience-facing title" />
                </label>
                <label>Structured fields <span>JSON object</span>
                  <textarea value={draft.data} disabled={!canEdit} onChange={(event) => setDraft((current) => ({ ...current, data: event.target.value }))} spellCheck="false" />
                </label>
                <label>Revision note <span>optional</span>
                  <input value={draft.note} disabled={!canEdit} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="What changed?" />
                </label>
                <div className={styles.editorActions}>
                  {canEdit && <button className={styles.primaryButton} disabled={busy}><Save size={17} /> {busy ? 'Saving…' : 'Save draft'}</button>}
                  {selectedDocument && canEdit && selectedDocument.status !== 'published' && <button type="button" className={styles.publishButton} disabled={busy} onClick={() => void updatePublication('publish')}><CircleCheck size={17} /> Publish</button>}
                  {selectedDocument && canEdit && selectedDocument.status === 'published' && <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => void updatePublication('unpublish')}><ChevronLeft size={17} /> Unpublish</button>}
                  {selectedDocument && canEdit && selectedDocument.status !== 'archived' && <button type="button" className={styles.archiveButton} disabled={busy} onClick={() => void updatePublication('archive')}><Archive size={16} /> Archive</button>}
                </div>
              </form>

              {selectedDocument && (
                <div className={styles.revisionsPanel}>
                  <div><p className={styles.eyebrow}>Revision history</p><span>Restoring creates a new draft; it never rewrites history.</span></div>
                  <ol>
                    {revisions.map((revision) => (
                      <li key={revision.id}>
                        <div><strong>Revision {revision.revisionNumber}</strong><span>{revision.note || 'Saved draft'} · {dateTime(revision.createdAt)}</span></div>
                        {canEdit && revision.revisionNumber !== selectedDocument.currentRevision && <button type="button" onClick={() => void restoreRevision(revision.revisionNumber)} disabled={busy}><RefreshCcw size={14} /> Restore</button>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'media' && (
          <section className={styles.libraryPanel}>
            {canEdit && <form className={styles.uploadCard} onSubmit={uploadMedia}>
              <div><Upload size={20} /><strong>Add media</strong><span>Images, video, and PDFs up to 10 MB.</span></div>
              <input name="file" type="file" accept="image/*,video/*,application/pdf" />
              <input name="altText" placeholder="Alt text (recommended for images)" />
              <button className={styles.primaryButton} disabled={busy}><Upload size={16} /> Upload</button>
            </form>}
            <div className={styles.mediaGrid}>
              {media.map((item) => (
                <article className={styles.mediaCard} key={item.id}>
                  <div className={styles.mediaPreview}>{item.mimeType.startsWith('image/') ? <Image src={item.url} alt={item.altText || item.filename} fill unoptimized sizes="(max-width: 640px) 100vw, 220px" /> : <ImageIcon size={24} />}</div>
                  <strong>{item.filename}</strong><span>{fileSize(item.byteSize)} · {item.mimeType}</span>
                  <button type="button" onClick={() => navigator.clipboard.writeText(item.url).then(() => setNotice({ tone: 'success', message: 'Media URL copied.' })).catch(() => setNotice({ tone: 'error', message: 'Could not copy the media URL.' }))}>Copy URL</button>
                </article>
              ))}
              {media.length === 0 && <div className={styles.emptyState}><ImageIcon size={22} /><p>Your shared media library is empty.</p></div>}
            </div>
          </section>
        )}

        {view === 'team' && isAdmin && (
          <section className={styles.libraryPanel}>
            <div className={styles.teamHead}><div><p className={styles.eyebrow}>Access control</p><h2>Roles set the boundary.</h2><p>Admins manage access, editors manage content, and viewers can inspect the workspace.</p></div><button className={styles.addButton} onClick={() => setShowMemberForm((current) => !current)}><Plus size={17} /> Add member</button></div>
            {showMemberForm && <form className={styles.memberForm} onSubmit={addMember}>
              <input name="displayName" placeholder="Name" required />
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" minLength={12} placeholder="Temporary password (12+ characters)" required />
              <select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select>
              <button className={styles.primaryButton} disabled={busy}>Create account</button>
            </form>}
            <div className={styles.teamList}>
              {team.map((member) => <article key={member.id}><div className={styles.userMark}>{member.displayName.slice(0, 1).toUpperCase()}</div><div><strong>{member.displayName}</strong><span>{member.email}</span></div><em>{member.role}</em></article>)}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Notice({ notice }: { notice: { tone: 'success' | 'error'; message: string } }) {
  return <div className={`${styles.notice} ${notice.tone === 'success' ? styles.noticeSuccess : styles.noticeError}`}>{notice.tone === 'success' ? <CircleCheck size={17} /> : <CircleAlert size={17} />}{notice.message}</div>;
}

function BootstrapForm({ api, onAuthenticated }: { api: <T>(path: string, options?: RequestInit, overrideToken?: string) => Promise<T>; onAuthenticated: (result: { token: string; user: CmsUser }) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api<{ token: string; user: CmsUser }>('/v1/admin/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setupToken: form.get('setupToken'), displayName: form.get('displayName'), email: form.get('email'), password: form.get('password') }) });
      onAuthenticated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the first administrator.');
    } finally {
      setBusy(false);
    }
  };
  return <form className={styles.authForm} onSubmit={submit}><div><p className={styles.eyebrow}>First-time setup</p><h2>Create the first administrator</h2><p>The one-time setup token is never saved in the browser.</p></div><input name="displayName" placeholder="Your name" required /><input name="email" type="email" placeholder="Work email" required /><input name="password" type="password" minLength={12} placeholder="Create a password (12+ characters)" required /><input name="setupToken" type="password" placeholder="One-time setup token" required />{error && <Notice notice={{ tone: 'error', message: error }} />}<button className={styles.primaryButton} disabled={busy}>{busy ? <LoaderCircle size={17} className={styles.spin} /> : <ShieldCheck size={17} />} Create secure workspace</button></form>;
}

function LoginForm({ api, onAuthenticated }: { api: <T>(path: string, options?: RequestInit, overrideToken?: string) => Promise<T>; onAuthenticated: (result: { token: string; user: CmsUser }) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api<{ token: string; user: CmsUser }>('/v1/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      onAuthenticated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };
  return <form className={styles.authForm} onSubmit={submit}><div><p className={styles.eyebrow}>Welcome back</p><h2>Sign in to Content Studio</h2><p>Your session remains only in this browser tab.</p></div><input name="email" type="email" placeholder="Work email" autoComplete="email" required /><input name="password" type="password" placeholder="Password" autoComplete="current-password" required />{error && <Notice notice={{ tone: 'error', message: error }} />}<button className={styles.primaryButton} disabled={busy}>{busy ? <LoaderCircle size={17} className={styles.spin} /> : <ShieldCheck size={17} />} Sign in securely</button></form>;
}
