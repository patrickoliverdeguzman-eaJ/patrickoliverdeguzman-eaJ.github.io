import type { Metadata } from 'next';
import { HomePage } from '@/components/home-page';
import { cmsPageMetadata } from '@/lib/cms-page-metadata';
import { cmsPageSnapshot, loadHomeContent } from '@/lib/site-content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadHomeContent({ requireCms: true });
  return cmsPageMetadata(content.builder, content.builderTitle);
}

export default async function Home() {
  const content = await loadHomeContent({ requireCms: true });
  return <HomePage initialContent={cmsPageSnapshot(content)} />;
}
