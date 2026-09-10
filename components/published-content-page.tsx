'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { CustomPageLayout } from '@/components/custom-page-layout';
import type { BuilderPage } from '@/lib/page-builder';
import { cmsSiteSnapshot, designVariables, loadPublishedBuilderRoute, type CmsSiteSnapshot, type PublishedPageSlug } from '@/lib/site-content';

type Props = {
  slug: PublishedPageSlug;
  title: string;
  initialSite: CmsSiteSnapshot;
  initialPage: BuilderPage;
};

export function PublishedContentPage({ slug, title, initialSite, initialPage }: Props) {
  const [site, setSite] = useState(initialSite);
  const [page, setPage] = useState(initialPage);
  const [documentTitle, setDocumentTitle] = useState(title);

  useEffect(() => {
    let cancelled = false;
    void loadPublishedBuilderRoute(slug, { requireCms: true })
      .then((loaded) => {
        if (cancelled) return;
        setSite(cmsSiteSnapshot(loaded.site));
        setPage(loaded.page);
        setDocumentTitle(loaded.title);
      })
      .catch(() => { /* Keep the CMS snapshot embedded during the build. */ });
    return () => { cancelled = true; };
  }, [slug]);

  return <>
    <CustomPageLayout
      page={page}
      title={documentTitle}
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
