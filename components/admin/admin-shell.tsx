'use client';

import { useEffect, useState } from 'react';
import { CMS_API } from '@/lib/cms-api';
import { AdminSidebar } from './sidebar';
import { AdminHeader } from './header';
import { adminPath } from '@/lib/site-paths';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

type ShellState =
  | { status: 'checking' }
  | { status: 'login' }
  | { status: 'app' };

function isLoginPath(pathname: string): boolean {
  return pathname === adminPath('/admin/login') || pathname === '/admin/login/';
}

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${CMS_API}/v1/admin/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Not authenticated');
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShellState>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;
    try {
      const path = window.location.pathname;
      const loginPage = isLoginPath(path);
      let token: string | null = null;
      try {
        token = localStorage.getItem('cms_token');
        if (!token) {
          token = sessionStorage.getItem('infostorage.cms.session-token');
          if (token) localStorage.setItem('cms_token', token);
        }
      } catch {
        token = null;
      }

      if (!token) {
        if (loginPage) {
          if (!cancelled) setState({ status: 'login' });
        } else {
          window.location.href = adminPath('/admin/login');
        }
        return;
      }

      fetchMe(token)
        .then(() => {
          if (cancelled) return;
          if (loginPage) {
            window.location.href = adminPath('/admin');
          } else {
            setState({ status: 'app' });
          }
        })
        .catch(() => {
          // Drop dead tokens (e.g. issued by a different worker database)
          // so the user lands cleanly on the login form instead of bouncing.
          try {
            localStorage.removeItem('cms_token');
          } catch {
            // storage unavailable; continue to login form anyway
          }
          if (cancelled) return;
          if (loginPage) {
            setState({ status: 'login' });
          } else {
            window.location.href = adminPath('/admin/login');
          }
        });
    } catch {
      if (!cancelled) {
        setState({ status: 'login' });
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'checking') {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100vh',
          background: '#f6e9ef',
        }}
      >
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <p>Loading CMS…</p>
        </div>
      </div>
    );
  }

  if (state.status === 'login') {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
