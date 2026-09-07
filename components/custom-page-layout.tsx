'use client';

/* oxlint-disable next/no-img-element, next/no-html-link-for-pages -- Preserve
 * the static site's native navigation and CMS-hosted, unoptimized images. */

import { ArrowUpRight, Menu } from 'lucide-react';
import { type ComponentProps, type CSSProperties } from 'react';
import { PageCssStyle } from '@/components/cms-site-page';
import { PageBuilderRenderer, type SiteChrome } from '@/components/page-builder-renderer';
import { BUILDER_SLOTS, type BuilderPage } from '@/lib/page-builder';

type Props = Omit<ComponentProps<typeof PageBuilderRenderer>, 'slot' | 'page' | 'chrome'> & {
  page?: BuilderPage;
  title: string;
  chrome: SiteChrome;
  style?: CSSProperties;
  previewCss?: boolean;
};

function navHref(href: string): string {
  if (href === '/partners' && process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true') return '/partners.html';
  return href.startsWith('#') ? `/${href}` : href;
}

/** Shared markup keeps element selectors identical in the CMS and live pages. */
export function CustomPageLayout({ page, title, chrome, style, previewCss, ...interactions }: Props) {
  return (
    <main className="custom-builder-page" style={style} data-cms-page="" data-cms-page-preview={previewCss ? '' : undefined}>
      <PageCssStyle css={page?.customCss} preview={previewCss} />
      <header className="custom-page-header" data-cms-chrome="custom-header">
        <nav className="nav-wrap" data-cms-chrome="header" aria-label="Main navigation">
          <a href="/" className="brand brand-image" aria-label="INFOStorage home"><span className="brand-logo-frame"><img className="brand-logo" src={chrome.site.logo} alt="INFOStorage Corporation" /></span></a>
          <div className="desktop-links">
            {chrome.navItems.filter((item) => item.enabled !== false).map((item) => <a key={item.id} data-cms-item={item.id} href={navHref(item.href)}>{item.label}</a>)}
          </div>
          <a className="nav-cta" href={navHref(chrome.headerCta.href)}>{chrome.headerCta.label} <ArrowUpRight size={16} strokeWidth={2.1} /></a>
          <details className="mobile-menu"><summary aria-label="Open navigation"><Menu size={22} /></summary><div className="mobile-menu-panel">
            {chrome.navItems.filter((item) => item.enabled !== false).map((item) => <a key={item.id} data-cms-item={item.id} href={navHref(item.href)}>{item.label}</a>)}
          </div></details>
        </nav>
        <div className="custom-page-title-wrap section-pad" data-cms-chrome="page-title"><p className="eyebrow">INFOStorage</p><h1>{title}</h1></div>
      </header>
      <div className="custom-page-content">
        {BUILDER_SLOTS.map((slot) => <PageBuilderRenderer key={slot.id} page={page} slot={slot.id} {...interactions} />)}
      </div>
      <footer className="site-footer" data-cms-chrome="footer">
        <a href="/" className="brand footer-brand" aria-label="INFOStorage home"><img className="footer-logo" src={chrome.site.logo} alt="INFOStorage Corporation" /></a>
        <p>{chrome.footer?.address ?? chrome.site.address}</p><span>{chrome.footer?.copyright ?? ''}</span>
      </footer>
    </main>
  );
}
