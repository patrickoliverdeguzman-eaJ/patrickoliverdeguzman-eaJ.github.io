import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import './globals.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
