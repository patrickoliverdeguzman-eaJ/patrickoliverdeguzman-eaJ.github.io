import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';
import { cmsPageMetadata } from '@/lib/cms-page-metadata';
import { cmsSiteSnapshot, loadPublishedBuilderRoute } from '@/lib/site-content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadPublishedBuilderRoute('about', { requireCms: true });
  return cmsPageMetadata(content.page, content.title);
}

export default async function AboutPage() {
  const content = await loadPublishedBuilderRoute('about', { requireCms: true });
  return <PublishedContentPage slug="about" title={content.title} initialSite={cmsSiteSnapshot(content.site)} initialPage={content.page} />;
}
