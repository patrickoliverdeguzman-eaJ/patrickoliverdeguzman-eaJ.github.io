'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { CustomPageLayout } from '@/components/custom-page-layout';
import { CMS_API } from '@/lib/cms-api';
import { normaliseBuilderPage, type BuilderPage } from '@/lib/page-builder';
import { DEFAULT_HOME, designVariables, loadHomeContent, type HomeContent } from '@/lib/site-content';

type PublishedBuilderDocument = {
  title: string;
  data: Record<string, unknown>;
};

function pageSlug(): string | null {
  const value = new URLSearchParams(window.location.search).get('page')?.toLowerCase() ?? '';
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

export function CustomBuilderPage() {
  const [site, setSite] = useState<HomeContent>(DEFAULT_HOME);
  const [title, setTitle] = useState('New page');
  const [page, setPage] = useState<BuilderPage | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    const slug = pageSlug();
    if (!slug) {
      setState('missing');
      return;
    }
    void Promise.all([
      loadHomeContent(),
      fetch(`${CMS_API}/v1/content/builder_page/${encodeURIComponent(slug)}`).then(async (response) => {
        if (!response.ok) throw new Error('not_found');
        return (await response.json()) as { document?: PublishedBuilderDocument };
      }),
    ])
      .then(([home, response]) => {
        if (cancelled || !response.document) return;
        setSite(home);
        setTitle(response.document.title);
        setPage(normaliseBuilderPage(response.document.data));
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('missing');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'missing') {
    return (
      <main className="custom-page-missing">
        <a href="/" className="brand">INFOStorage</a>
        <h1>Page not found</h1>
        <p>This page is not published yet, or the address is incomplete.</p>
      </main>
    );
  }

  return (
    <>
      <CustomPageLayout page={page ?? undefined} title={state === 'loading' ? 'Loading page…' : title}
        chrome={{ variant: 'home', site: site.site, navItems: site.navItems, headerCta: site.headerCta, footer: site.footer }}
        style={designVariables(site.design) as CSSProperties} />
      <SiteChatbot />
    </>
  );
}
