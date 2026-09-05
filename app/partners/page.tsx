import type { Metadata } from 'next';
import { PartnersPage } from '@/components/partners-page';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Partners | INFOStorage',
  description: 'Explore the INFOStorage technology partner ecosystem.',
  openGraph: {
    title: 'Partners | INFOStorage',
    description: 'Explore the INFOStorage technology partner ecosystem.',
    images: [],
  },
  twitter: {
    images: [],
  },
};

export default function PartnersPageRoute() {
  return <PartnersPage />;
}
