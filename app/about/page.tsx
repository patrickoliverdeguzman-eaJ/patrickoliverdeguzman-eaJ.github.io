import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About INFOStorage | Company history',
  description: 'Learn how INFOStorage grew from enterprise storage roots into a Philippine technology solutions integrator.',
};

export default function AboutPage() {
  return <PublishedContentPage slug="about" />;
}
