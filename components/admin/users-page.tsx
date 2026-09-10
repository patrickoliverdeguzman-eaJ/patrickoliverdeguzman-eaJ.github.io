'use client';

import { CMS_API } from '@/lib/cms-api';
import { getCmsToken } from '@/lib/admin-session';

import { type SubmitEvent, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Plus, Trash2, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface UsersResponse {
  users: User[];
  error?: string;
}

interface RecoveryCode {
  user: User;
  recoveryToken: string;
  expiresAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('editor');
  const [saving, setSaving] = useState(false);
  const [issuingFor, setIssuingFor] = useState('');
  const [recovery, setRecovery] = useState<RecoveryCode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getCmsToken();
    fetch(`${CMS_API}/v1/admin/users`, { headers: { authorization: `Bearer ${token}` } })
      .then((res) => res.json() as Promise<UsersResponse>)
      .then((data) => setUsers(data.users ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const createUser = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = getCmsToken();
      const res = await fetch(`${CMS_API}/v1/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, displayName, password, role }),
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? 'Could not create user.');
      setUsers((prev) => [...prev, data.user as User]);
      setShowForm(false);
      setEmail('');
      setDisplayName('');
      setPassword('');
      setRole('editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user.');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    setError('');
    const token = getCmsToken();
    const res = await fetch(`${CMS_API}/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Could not delete user.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const issueRecoveryCode = async (user: User) => {
    setError('');
    setRecovery(null);
    setCopied(false);
    setIssuingFor(user.id);
    try {
      const token = getCmsToken();
      const res = await fetch(`${CMS_API}/v1/admin/users/${user.id}/recovery-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ expiresInMinutes: 15 }),
      });
      const data = (await res.json().catch(() => ({}))) as RecoveryCode & { error?: string };
      if (!res.ok || !data.recoveryToken) throw new Error(data.error ?? 'Could not create a recovery code.');
      setRecovery(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a recovery code.');
    } finally {
      setIssuingFor('');
    }
  };

  const copyRecoveryCode = async () => {
    if (!recovery) return;
    try {
      await navigator.clipboard.writeText(recovery.recoveryToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Copy was blocked by the browser. Select the code and copy it manually.');
    }
  };

  if (loading) return <div className="admin-empty"><p>Loading users...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Users</h2>
        <button className="admin-btn admin-btn-primary" type="button" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Add User
        </button>
      </div>
      {error && (
        <div className="admin-card" style={{ marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>{error}</div>
      )}
      {recovery && (
        <section className="admin-card" style={{ marginBottom: '1rem', borderColor: '#d97706' }} aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <strong>One-time recovery code for {recovery.user.displayName}</strong>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem' }}>
                This code expires at {new Date(recovery.expiresAt).toLocaleString()} and will not be shown again after this notice is closed.
              </p>
            </div>
            <button className="admin-btn admin-btn-ghost" type="button" aria-label="Close recovery code" onClick={() => setRecovery(null)}><X size={16} /></button>
          </div>
          <code style={{ display: 'block', margin: '1rem 0', padding: '0.8rem', overflowWrap: 'anywhere', borderRadius: '0.5rem', background: '#fff7ed', color: '#7c2d12' }}>
            {recovery.recoveryToken}
          </code>
          <button className="admin-btn admin-btn-primary" type="button" onClick={() => void copyRecoveryCode()}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy code'}
          </button>
        </section>
      )}
      {showForm && (
        <form className="admin-card" style={{ marginBottom: '1rem' }} onSubmit={createUser}>
          <div className="admin-form-group">
            <label htmlFor="new-user-email">Email</label>
            <input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="admin-form-group">
            <label htmlFor="new-user-display-name">Display name</label>
            <input id="new-user-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="new-user-password">Password (12+ characters)</label>
            <input id="new-user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="new-user-role">Role</label>
            <select id="new-user-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}
      <div className="admin-card">
        {users.length === 0 ? (
          <div className="admin-empty"><p>No users found.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td><span className={`admin-badge admin-badge-${user.role === 'admin' ? 'published' : user.role === 'editor' ? 'draft' : 'archived'}`}>{user.role}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      <button aria-label={`Create recovery code for ${user.displayName}`} className="admin-btn admin-btn-secondary" onClick={() => void issueRecoveryCode(user)} type="button" disabled={Boolean(issuingFor)}>
                        <KeyRound size={14} /> {issuingFor === user.id ? 'Creating…' : 'Recovery code'}
                      </button>
                      <button aria-label={`Delete ${user.displayName}`} className="admin-btn admin-btn-danger" onClick={() => void deleteUser(user.id)} type="button"><Trash2 size={14} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
