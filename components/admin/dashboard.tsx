'use client';

import { CMS_API } from '@/lib/cms-api';
import siteContentSeed from '@/cms-worker/seed/site-content.json';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { adminPath } from '@/lib/site-paths';

interface Stats {
  totalDocuments: number;
  publishedDocuments: number;
  draftDocuments: number;
  totalMedia: number;
}

interface DocListResponse {
  documents: Array<{ id: string; title: string; type: string; status: string; updatedAt: string }>;
}

interface MediaResponse {
  media: Array<{ id: string }>;
}

interface AuditEntry {
  id: string;
  userEmail: string | null;
  userName: string | null;
  action: string;
  resourceType: string;
  detail: string;
  createdAt: string;
}

interface AuditResponse {
  audit: AuditEntry[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocListResponse['documents']>([]);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    const headers = { authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${CMS_API}/v1/admin/documents?limit=100&status=published`, { headers }).then((r) => r.json() as Promise<DocListResponse>).catch(() => ({ documents: [] })),
      fetch(`${CMS_API}/v1/admin/documents?limit=100&status=draft`, { headers }).then((r) => r.json() as Promise<DocListResponse>).catch(() => ({ documents: [] })),
      fetch(`${CMS_API}/v1/admin/media`, { headers }).then((r) => r.json() as Promise<MediaResponse>).catch(() => ({ media: [] })),
      fetch(`${CMS_API}/v1/admin/documents?limit=5`, { headers }).then((r) => r.json() as Promise<DocListResponse>).catch(() => ({ documents: [] })),
      fetch(`${CMS_API}/v1/admin/audit?limit=8`, { headers }).then((r) => r.json() as Promise<AuditResponse>).catch(() => ({ audit: [] })),
    ]).then(([publishedRes, draftRes, mediaRes, docsRes, auditRes]) => {
      setStats({
        totalDocuments: (publishedRes.documents.length + draftRes.documents.length) || 0,
        publishedDocuments: publishedRes.documents.length || 0,
        draftDocuments: draftRes.documents.length || 0,
        totalMedia: mediaRes.media.length || 0,
      });
      setRecentDocs(docsRes.documents ?? []);
      setActivity(auditRes.audit ?? []);
    });
  }, []);

  const importExistingContent = async () => {
    if (!window.confirm('Import the current Home and Partners content as published CMS documents? This can only run on an empty CMS.')) return;
    setImporting(true);
    setImportError('');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };
      const existingResponse = await fetch(`${CMS_API}/v1/admin/documents?limit=1`, { headers });
      const existing = (await existingResponse.json()) as DocListResponse & { error?: string };
      if (!existingResponse.ok) throw new Error(existing.error ?? 'Could not check the CMS contents.');
      if (existing.documents.length > 0) throw new Error('The CMS already contains documents, so the original-site import was not run.');

      for (const entry of siteContentSeed.documents) {
        const createdResponse = await fetch(`${CMS_API}/v1/admin/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...entry, note: 'Imported from the original static site' }),
        });
        const created = (await createdResponse.json()) as { document?: { id: string }; error?: string };
        if (!createdResponse.ok || !created.document) throw new Error(created.error ?? `Could not import ${entry.title}.`);

        const publishedResponse = await fetch(`${CMS_API}/v1/admin/documents/${created.document.id}/publish`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });
        if (!publishedResponse.ok) {
          const published = (await publishedResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(published.error ?? `Could not publish ${entry.title}.`);
        }
      }

      window.location.reload();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The original-site import could not complete.');
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="admin-stats">
        <Link href={adminPath('/admin/documents')} className="admin-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">Total Documents</div>
          <div className="stat-value">{stats?.totalDocuments ?? '—'}</div>
          <div className="stat-desc">All content types</div>
        </Link>
        <Link href={adminPath('/admin/documents')} className="admin-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats?.publishedDocuments ?? '—'}</div>
          <div className="stat-desc">Live on site</div>
        </Link>
        <Link href={adminPath('/admin/documents')} className="admin-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{stats?.draftDocuments ?? '—'}</div>
          <div className="stat-desc">In progress</div>
        </Link>
        <Link href={adminPath('/admin/media')} className="admin-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">Media Files</div>
          <div className="stat-value">{stats?.totalMedia ?? '—'}</div>
          <div className="stat-desc">Images and PDFs</div>
        </Link>
      </div>

      {stats?.totalDocuments === 0 && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.45rem', fontSize: '1rem' }}>Import the existing site</h2>
          <p style={{ margin: '0 0 1rem', color: '#735568', fontSize: '0.86rem', lineHeight: 1.55 }}>
            Start with the current Home and Partners copy, navigation, partners, and client logos. The public site keeps its safe fallback until these documents are published.
          </p>
          {importError && <p style={{ color: '#991b1b', fontSize: '0.82rem' }}>{importError}</p>}
          <button className="admin-btn admin-btn-primary" type="button" disabled={importing} onClick={() => void importExistingContent()}>
            {importing ? 'Importing content…' : 'Import existing content'}
          </button>
        </div>
      )}

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Recent Documents</h2>
          <Link href={adminPath('/admin/documents')} style={{ fontSize: '0.82rem', color: '#820040' }}>
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        {recentDocs.length === 0 ? (
          <div className="admin-empty">
            <p>No documents yet. <Link href={adminPath('/admin/documents')} style={{ color: '#820040' }}>Create one</Link>.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {recentDocs.map((doc) => (
                <tr key={doc.id}>
                  <td><Link href={adminPath(`/admin/documents/edit?id=${doc.id}`)} style={{ color: '#820040' }}>{doc.title}</Link></td>
                  <td>{doc.type}</td>
                  <td><span className={`admin-badge admin-badge-${doc.status}`}>{doc.status}</span></td>
                  <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Recent Activity</h2>
        {activity.length === 0 ? (
          <div className="admin-empty"><p>No admin activity recorded yet.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Action</th><th>Detail</th><th>By</th><th>When</th></tr></thead>
            <tbody>
              {activity.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="admin-badge admin-badge-draft">{entry.action}</span></td>
                  <td>{entry.detail || `${entry.resourceType}`}</td>
                  <td>{entry.userName || entry.userEmail || '—'}</td>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
