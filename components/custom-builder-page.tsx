'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import Link from 'next/link';
import SiteChatbot from '@/app/site-chatbot';
import { CustomPageLayout } from '@/components/custom-page-layout';
import { designVariables, loadPublishedBuilderRoute } from '@/lib/site-content';

function pageSlug(): string | null {
  const value = new URLSearchParams(window.location.search).get('page')?.toLowerCase() ?? '';
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

export function CustomBuilderPage() {
  const [content, setContent] = useState<Awaited<ReturnType<typeof loadPublishedBuilderRoute>> | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    const slug = pageSlug();
    if (!slug) {
      queueMicrotask(() => { if (!cancelled) setState('missing'); });
      return;
    }
    void loadPublishedBuilderRoute(slug, { requireCms: true })
      .then((loaded) => {
        if (cancelled) return;
        setContent(loaded);
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
        <Link href="/" className="brand">INFOStorage</Link>
        <h1>Page not found</h1>
        <p>This page is not published yet, or the address is incomplete.</p>
      </main>
    );
  }

  if (!content) {
    return <main className="custom-page-missing"><p>Loading published page…</p></main>;
  }

  return (
    <>
      <CustomPageLayout page={content.page} title={content.title}
        chrome={{ variant: 'home', site: content.site.site, navItems: content.site.navItems, headerCta: content.site.headerCta, footer: content.site.footer }}
        style={designVariables(content.site.design) as CSSProperties} />
      <SiteChatbot />
    </>
  );
}
