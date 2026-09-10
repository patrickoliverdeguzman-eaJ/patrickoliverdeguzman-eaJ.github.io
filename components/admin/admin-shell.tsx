'use client';

import { useEffect, useState } from 'react';
import { CMS_API } from '@/lib/cms-api';
import { AdminSidebar } from './sidebar';
import { AdminHeader } from './header';
import { adminPath } from '@/lib/site-paths';
import { clearCmsToken, getCmsToken } from '@/lib/admin-session';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

type ShellState =
  | { status: 'checking' }
  | { status: 'login' }
  | { status: 'app'; user: AuthUser };

const PRIVATE_STUDIO_URL = 'https://infostorage-enterprise.yasuoxd-yx.chatgpt.site/admin/login';
const PUBLIC_GITHUB_BUILD = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';

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
      if (PUBLIC_GITHUB_BUILD) {
        window.location.replace(PRIVATE_STUDIO_URL);
        return () => {
          cancelled = true;
        };
      }
      const path = window.location.pathname;
      const loginPage = isLoginPath(path);
      const token = getCmsToken();

      if (!token) {
        if (loginPage) {
          if (!cancelled) setState({ status: 'login' });
        } else {
          window.location.href = adminPath('/admin/login');
        }
        return;
      }

      fetchMe(token)
        .then((user) => {
          if (cancelled) return;
          if (loginPage) {
            window.location.href = adminPath('/admin');
          } else {
            setState({ status: 'app', user });
          }
        })
        .catch(() => {
          // Drop dead tokens (e.g. issued by a different worker database)
          // so the user lands cleanly on the login form instead of bouncing.
          clearCmsToken();
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

  if (PUBLIC_GITHUB_BUILD) {
    return (
      <div className="admin-login">
        <div className="admin-login-card" style={{ textAlign: 'center' }}>
          <h1>Private studio</h1>
          <p>The CMS is available only through the protected INFOStorage studio.</p>
          <a className="admin-btn admin-btn-primary" href={PRIVATE_STUDIO_URL} style={{ justifyContent: 'center' }}>Open secure studio</a>
        </div>
      </div>
    );
  }

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
      <AdminSidebar role={state.user.role} />
      <div className="admin-main">
        <AdminHeader user={state.user} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
