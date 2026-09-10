import type { Metadata } from 'next';
import { PartnersPage } from '@/components/partners-page';
import { cmsPageMetadata } from '@/lib/cms-page-metadata';
import { cmsPageSnapshot, loadPartnersContent } from '@/lib/site-content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadPartnersContent({ requireCms: true });
  return cmsPageMetadata(content.builder, content.builderTitle);
}

export default async function PartnersPageRoute() {
  const content = await loadPartnersContent({ requireCms: true });
  return <PartnersPage initialContent={cmsPageSnapshot(content)} />;
}
