import type { Metadata } from 'next';
import './globals.css';
import SiteMetadata from './site-metadata';

export const metadata: Metadata = {
  metadataBase: new URL('https://infostorage-enterprise.yasuoxd-yx.chatgpt.site'),
  title: 'INFOStorage | Enterprise technology, thoughtfully connected',
  description: 'Enterprise technology solutions across systems, security, data protection, and professional services.',
  openGraph: {
    title: 'INFOStorage | Enterprise technology, thoughtfully connected',
    description: 'Systems, security, data protection, and support that work together.',
    type: 'website',
    images: [{ url: '/og.png', width: 1536, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INFOStorage | Enterprise technology, thoughtfully connected',
    description: 'Systems, security, data protection, and support that work together.',
    images: ['/og.png'],
  },
};

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
