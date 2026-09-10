import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Solutions | INFOStorage',
  description: 'Explore INFOStorage solutions for systems, network security, data protection, mobile computing, and peripherals.',
};

export default function SolutionsPage() {
  return <PublishedContentPage slug="solutions" />;
}
