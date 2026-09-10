'use client';

import { CMS_API } from '@/lib/cms-api';

import { useState, useEffect, type SyntheticEvent } from 'react';
import { Mail, Lock, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { adminPath } from '@/lib/site-paths';
import { getCmsToken, setCmsToken } from '@/lib/admin-session';

interface LoginResponse {
  token: string;
  error?: string;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getCmsToken();
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

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
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
      setCmsToken(data.token);
      window.location.href = adminPath('/admin');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${CMS_API}/v1/admin/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recoveryToken, newPassword: password }),
      });
      const data = (await res.json()) as { reset?: boolean; error?: string };
      if (!res.ok || !data.reset) throw new Error(data.error ?? 'Password reset failed.');
      setRecovering(false);
      setPassword('');
      setConfirmPassword('');
      setRecoveryToken('');
      setMessage('Password reset. Sign in with your new password.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <img src="/infostorage-logo.png" alt="INFOStorage" style={{ width: 64, height: 64, marginBottom: '1rem' }} />
        <h1>{recovering ? 'Reset password' : 'Welcome back'}</h1>
        <p>{recovering ? 'Use the one-time recovery code created for you by a CMS administrator.' : 'Sign in to manage the INFOStorage CMS'}</p>
        <form onSubmit={recovering ? handleRecovery : handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a08090' }} />
              <input
                id="admin-email"
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
            <label htmlFor="admin-password">{recovering ? 'New password' : 'Password'}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a08090' }} />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={recovering ? 'At least 12 characters' : 'Enter password'}
                minLength={recovering ? 12 : undefined}
                required
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          {recovering && (
            <>
              <div className="admin-form-group">
                <label htmlFor="admin-confirm-password">Confirm new password</label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="admin-recovery-token">One-time recovery code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a08090' }} />
                  <input
                    id="admin-recovery-token"
                    type="password"
                    value={recoveryToken}
                    onChange={(event) => setRecoveryToken(event.target.value)}
                    autoComplete="off"
                    required
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
                <small>Ask a CMS administrator to create a 15-minute recovery code from Users. If you are the only administrator, contact the deployment owner.</small>
              </div>
            </>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {message && <div style={{ color: '#166534', fontSize: '0.82rem', marginBottom: '1rem' }}>{message}</div>}
          <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
            {loading ? (recovering ? 'Resetting...' : 'Signing in...') : (recovering ? 'Reset password' : 'Sign in')}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            onClick={() => {
              setRecovering((value) => !value);
              setError('');
              setMessage('');
              setPassword('');
            }}
          >
            {recovering ? <><ArrowLeft size={16} /> Back to sign in</> : 'Forgot password?'}
          </button>
        </form>
      </div>
    </div>
  );
}
