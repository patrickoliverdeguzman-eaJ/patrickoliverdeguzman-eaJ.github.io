import type { Metadata } from 'next';
import './globals.css';

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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
