import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact | INFOStorage',
  description: 'Contact INFOStorage Corporation in Ortigas Center, Pasig City for enterprise technology solutions and services.',
};

export default function ContactPage() {
  return <PublishedContentPage slug="contact" />;
}
