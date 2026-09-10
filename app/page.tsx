'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from './site-chatbot';
import { CmsSitePage } from '@/components/cms-site-page';
import { DEFAULT_HOME, createHomeBuilderPage, designVariables, loadHomeContent, type HomeContent } from '@/lib/site-content';

export default function Home() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME);

  useEffect(() => {
    let cancelled = false;
    void loadHomeContent().then((loaded) => { if (!cancelled) setContent(loaded); });
    return () => { cancelled = true; };
  }, []);

  return <>
    <CmsSitePage
      kind="home"
      page={content.builder ?? createHomeBuilderPage(content)}
      chrome={{ variant: 'home', currentPath: '/', navItems: content.navItems, headerCta: content.headerCta, site: content.site, footer: content.footer }}
      style={designVariables(content.design) as CSSProperties}
    />
    <SiteChatbot />
  </>;
}
