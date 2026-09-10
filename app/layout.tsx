import type { Metadata } from 'next';
import './globals.css';
import SiteMetadata from './site-metadata';
import { cmsPageMetadata } from '@/lib/cms-page-metadata';
import { loadHomeContent } from '@/lib/site-content';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadHomeContent({ requireCms: true });
  return {
    metadataBase: new URL('https://infostorage-enterprise.yasuoxd-yx.chatgpt.site'),
    ...cmsPageMetadata(content.builder, content.builderTitle),
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const production = process.env.NODE_ENV === 'production';
  return (
    <html lang="en">
      {production && (
        <head>
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https:; connect-src 'self' https://infostorage-cms.patrickoliverdeguzman.workers.dev; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; upgrade-insecure-requests"
          />
          <meta name="referrer" content="no-referrer" />
        </head>
      )}
      <body>
        <SiteMetadata />
        {children}
      </body>
    </html>
  );
}
