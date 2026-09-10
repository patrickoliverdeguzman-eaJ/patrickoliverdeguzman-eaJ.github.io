import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Services | INFOStorage',
  description: 'Explore INFOStorage Value Added Services for installation, maintenance, helpdesk, consulting, and systems integration.',
};

export default function ServicesPage() {
  return <PublishedContentPage slug="services" />;
}
