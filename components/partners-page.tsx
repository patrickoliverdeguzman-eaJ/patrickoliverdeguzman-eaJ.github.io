'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { CmsSitePage } from '@/components/cms-site-page';
import { DEFAULT_PARTNERS, createPartnersBuilderPage, designVariables, loadPartnersContent, type PartnersContent } from '@/lib/site-content';

export function PartnersPage() {
  const [content, setContent] = useState<PartnersContent>(DEFAULT_PARTNERS);

  useEffect(() => {
    let cancelled = false;
    void loadPartnersContent().then((loaded) => { if (!cancelled) setContent(loaded); });
    return () => { cancelled = true; };
  }, []);

  return <>
    <CmsSitePage
      kind="partners"
      page={content.builder ?? createPartnersBuilderPage(content)}
      chrome={{ variant: 'partners', navItems: content.navItems, headerCta: content.headerCta, site: content.site, footer: content.footer }}
      style={designVariables(content.design) as CSSProperties}
    />
    <SiteChatbot />
  </>;
}
