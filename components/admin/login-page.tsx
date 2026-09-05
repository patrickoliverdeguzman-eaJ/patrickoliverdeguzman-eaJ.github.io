'use client';

import { CMS_API } from '@/lib/cms-api';

import { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { adminPath } from '@/lib/site-paths';

interface LoginResponse {
  token: string;
  error?: string;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    if (token) {
      fetch(`${CMS_API}/v1/admin/me`, { headers: { authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.ok) {
            window.location.href = adminPath('/admin');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${CMS_API}/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? 'Login failed');
      }
      localStorage.setItem('cms_token', data.token);
      window.location.href = adminPath('/admin');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <img src="/infostorage-logo.png" alt="INFOStorage" style={{ width: 64, height: 64, marginBottom: '1rem' }} />
        <h1>Welcome back</h1>
        <p>Sign in to manage the INFOStorage CMS</p>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a08090' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@infostorage.com"
                required
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a08090' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
