'use client';

import { CMS_API } from '@/lib/cms-api';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { adminPath } from '@/lib/site-paths';

export function AdminHeader() {
  const handleLogout = async () => {
    const token = localStorage.getItem('cms_token');
    await fetch(`${CMS_API}/v1/admin/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    });
    localStorage.removeItem('cms_token');
    window.location.href = adminPath('/admin/login');
  };

  return (
    <header className="admin-header">
      <h1>CMS Dashboard</h1>
      <div className="admin-header-actions">
        <button className="admin-btn admin-btn-ghost" onClick={handleLogout} type="button">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}
