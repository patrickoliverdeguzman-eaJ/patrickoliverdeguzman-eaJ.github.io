'use client';

import { CMS_API } from '@/lib/cms-api';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    fetch(`${CMS_API}/v1/admin/users`, { headers: { authorization: `Bearer ${token}` } })
      .then((res) => res.json() as Promise<UsersResponse>)
      .then((data) => setUsers(data.users ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('cms_token');
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
    const token = localStorage.getItem('cms_token');
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
      {showForm && (
        <form className="admin-card" style={{ marginBottom: '1rem' }} onSubmit={createUser}>
          <div className="admin-form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="admin-form-group">
            <label>Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
          </div>
          <div className="admin-form-group">
            <label>Password (12+ characters)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} />
          </div>
          <div className="admin-form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
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
                  <td><button className="admin-btn admin-btn-danger" onClick={() => deleteUser(user.id)} type="button"><Trash2 size={14} /> Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
