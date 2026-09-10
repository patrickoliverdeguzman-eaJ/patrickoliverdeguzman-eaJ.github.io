'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { CustomPageLayout } from '@/components/custom-page-layout';
import { CONTENT_PAGES, type ContentPageSlug } from '@/lib/content-pages';
import { hasBuilderContent, normaliseBuilderPage, type BuilderPage } from '@/lib/page-builder';
import { DEFAULT_HOME, designVariables, fetchPublishedDoc, loadHomeContent, type HomeContent } from '@/lib/site-content';

export function PublishedContentPage({ slug }: { slug: ContentPageSlug }) {
  const definition = CONTENT_PAGES[slug];
  const [site, setSite] = useState<HomeContent>(DEFAULT_HOME);
  const [page, setPage] = useState<BuilderPage>(definition.page);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadHomeContent(),
      fetchPublishedDoc('builder_page', slug),
    ]).then(([loadedSite, published]) => {
      if (cancelled) return;
      setSite(loadedSite);
      if (published) {
        const managedPage = normaliseBuilderPage(published);
        if (hasBuilderContent(managedPage)) setPage(managedPage);
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  return <>
    <CustomPageLayout
      page={page}
      title={definition.title}
      chrome={{
        variant: 'partners',
        currentPath: `/${slug}`,
        site: site.site,
        navItems: site.navItems,
        headerCta: site.headerCta,
        footer: site.footer,
      }}
      style={designVariables(site.design) as CSSProperties}
    />
    <SiteChatbot />
  </>;
}
