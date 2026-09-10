import type { Metadata } from 'next';
import CmsWorkspace from './cms-workspace';

export const metadata: Metadata = {
  title: 'Content Studio | INFOStorage',
  description: 'Secure content management for INFOStorage.',
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function CmsPage() {
  if (process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f6e9ef', color: '#3d0b24' }}>
        <section style={{ width: 'min(520px, 100%)', padding: '2rem', border: '1px solid #e3bacd', borderRadius: '1rem', background: 'white', textAlign: 'center' }}>
          <h1>Private content studio</h1>
          <p>Editing tools are not available on the public GitHub site.</p>
          <a href="https://infostorage-enterprise.yasuoxd-yx.chatgpt.site/admin/login">Open the protected studio</a>
        </section>
      </main>
    );
  }
  return <CmsWorkspace />;
}
