import type { Metadata } from 'next';
import { PublishedContentPage } from '@/components/published-content-page';
import { cmsPageMetadata } from '@/lib/cms-page-metadata';
import { cmsSiteSnapshot, loadPublishedBuilderRoute } from '@/lib/site-content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadPublishedBuilderRoute('solutions', { requireCms: true });
  return cmsPageMetadata(content.page, content.title);
}

export default async function SolutionsPage() {
  const content = await loadPublishedBuilderRoute('solutions', { requireCms: true });
  return <PublishedContentPage slug="solutions" title={content.title} initialSite={cmsSiteSnapshot(content.site)} initialPage={content.page} />;
}
