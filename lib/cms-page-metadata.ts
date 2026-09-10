import type { Metadata } from 'next';
import type { BuilderPage } from '@/lib/page-builder';

function firstCmsDescription(page: BuilderPage): string {
  for (const nodes of Object.values(page.slots)) {
    for (const node of nodes) {
      const body = node.props.body;
      if (typeof body === 'string' && body.trim()) return body.trim();
    }
  }
  return '';
}

/** Metadata is derived only from the published CMS page document. */
export function cmsPageMetadata(page: BuilderPage, documentTitle: string): Metadata {
  const title = page.settings.seoTitle.trim() || documentTitle;
  const description = page.settings.seoDescription.trim() || firstCmsDescription(page);
  const image = page.settings.socialImage.trim();
  const images = image ? [image] : [];
  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}
