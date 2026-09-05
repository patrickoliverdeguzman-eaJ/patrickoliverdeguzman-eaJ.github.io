'use client';

import { ArrowUpRight, Menu } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
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

function navHref(href: string): string {
  if (href === '/partners' && process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true') return '/partners.html';
  return href.startsWith('#') ? `/${href}` : href;
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
      <main className="custom-builder-page" style={designVariables(site.design) as CSSProperties}>
        <header className="custom-page-header">
          <nav className="nav-wrap" aria-label="Main navigation">
            <a href="/" className="brand brand-image" aria-label="INFOStorage home">
              <span className="brand-logo-frame">
                <img className="brand-logo" src={site.site.logo} alt="INFOStorage Corporation" />
              </span>
            </a>
            <div className="desktop-links">
              {site.navItems.map((item) => <a key={item.id} href={navHref(item.href)}>{item.label}</a>)}
            </div>
            <a className="nav-cta" href={navHref(site.headerCta.href)}>
              {site.headerCta.label} <ArrowUpRight size={16} strokeWidth={2.1} />
            </a>
            <details className="mobile-menu">
              <summary aria-label="Open navigation"><Menu size={22} /></summary>
              <div className="mobile-menu-panel">
                {site.navItems.map((item) => <a key={item.id} href={navHref(item.href)}>{item.label}</a>)}
              </div>
            </details>
          </nav>
          <div className="custom-page-title-wrap section-pad">
            <p className="eyebrow">INFOStorage</p>
            <h1>{state === 'loading' ? 'Loading page…' : title}</h1>
          </div>
        </header>
        {page && (
          <div className="custom-page-content">
            <PageBuilderRenderer page={page} slot="afterHero" />
            <PageBuilderRenderer page={page} slot="afterApproach" />
            <PageBuilderRenderer page={page} slot="afterSolutions" />
            <PageBuilderRenderer page={page} slot="afterServices" />
            <PageBuilderRenderer page={page} slot="beforeContact" />
            <PageBuilderRenderer page={page} slot="afterContent" />
          </div>
        )}
        <footer className="site-footer">
          <a href="/" className="brand footer-brand" aria-label="INFOStorage home">
            <img className="footer-logo" src={site.site.logo} alt="INFOStorage Corporation" />
          </a>
          <p>{site.footer.address}</p>
          <span>{site.footer.copyright}</span>
        </footer>
      </main>
      <SiteChatbot />
    </>
  );
}
