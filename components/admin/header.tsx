'use client';

import { CMS_API } from '@/lib/cms-api';

import { LogOut } from 'lucide-react';
import { adminPath } from '@/lib/site-paths';
import { clearCmsToken, getCmsToken } from '@/lib/admin-session';

export function AdminHeader({ user }: { user: { displayName: string; role: string } }) {
  const handleLogout = async () => {
    const token = getCmsToken();
    await fetch(`${CMS_API}/v1/admin/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    });
    clearCmsToken();
    window.location.href = adminPath('/admin/login');
  };

  return (
    <header className="admin-header">
      <h1>CMS Dashboard</h1>
      <div className="admin-header-actions">
        <span className="admin-header-user">{user.displayName} · {user.role}</span>
        <button className="admin-btn admin-btn-ghost" onClick={handleLogout} type="button">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}
