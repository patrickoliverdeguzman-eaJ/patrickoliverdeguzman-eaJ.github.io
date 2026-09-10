'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { CmsSitePage } from '@/components/cms-site-page';
import { cmsPageSnapshot, designVariables, loadHomeContent, type CmsPageSnapshot } from '@/lib/site-content';

export function HomePage({ initialContent }: { initialContent: CmsPageSnapshot }) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    let cancelled = false;
    void loadHomeContent({ requireCms: true })
      .then((loaded) => { if (!cancelled) setContent(cmsPageSnapshot(loaded)); })
      .catch(() => { /* Keep the CMS snapshot embedded during the build. */ });
    return () => { cancelled = true; };
  }, []);

  return <>
    <CmsSitePage
      kind="home"
      page={content.builder}
      chrome={{ variant: 'home', currentPath: '/', navItems: content.navItems, headerCta: content.headerCta, site: content.site, footer: content.footer }}
      style={designVariables(content.design) as CSSProperties}
    />
    <SiteChatbot />
  </>;
}
