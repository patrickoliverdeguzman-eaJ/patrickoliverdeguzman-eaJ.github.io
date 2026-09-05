'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  MessageCircle,
  Settings,
  PanelsTopLeft,
} from 'lucide-react';
import { adminPath } from '@/lib/site-paths';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/visual-editor', label: 'Visual editor', icon: PanelsTopLeft },
  { href: '/admin/media', label: 'Media Library', icon: Image },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/chat', label: 'Chat', icon: MessageCircle },
];

export function AdminSidebar() {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    handler();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const isCurrent = (href: string) => {
    const target = adminPath(href);
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src="/infostorage-logo.png" alt="INFOStorage" />
        <span>INFOStorage</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={adminPath(item.href)}
            className={isCurrent(item.href) ? 'active' : ''}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="section-label">System</div>
      <Link href={adminPath('/admin/settings')}>
        <Settings size={18} />
        Settings
      </Link>
    </aside>
  );
}
