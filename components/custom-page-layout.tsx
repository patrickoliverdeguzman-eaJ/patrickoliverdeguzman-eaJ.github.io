'use client';

/* oxlint-disable next/no-img-element, next/no-html-link-for-pages -- Preserve
 * the static site's native navigation and CMS-hosted, unoptimized images. */

import { type ComponentProps, type CSSProperties } from 'react';
import { PageCssStyle } from '@/components/cms-site-page';
import { PageBuilderRenderer, SiteHeader, type SiteChrome } from '@/components/page-builder-renderer';
import { BUILDER_SLOTS, hasBuilderNodeType, type BuilderPage } from '@/lib/page-builder';

type Props = Omit<ComponentProps<typeof PageBuilderRenderer>, 'slot' | 'page' | 'chrome'> & {
  page?: BuilderPage;
  title: string;
  chrome: SiteChrome;
  style?: CSSProperties;
  previewCss?: boolean;
};

/** Shared markup keeps element selectors identical in the CMS and live pages. */
export function CustomPageLayout({ page, title, chrome, style, previewCss, ...interactions }: Props) {
  const explicitHeader = Boolean(page?.settings.hideDefaultHeader) || hasBuilderNodeType(page, 'site_header');
  const explicitFooter = Boolean(page?.settings.hideDefaultFooter) || hasBuilderNodeType(page, 'site_footer');
  return (
    <main className="custom-builder-page" style={style} data-cms-page="" data-cms-page-preview={previewCss ? '' : undefined}>
      <PageCssStyle css={page?.customCss} preview={previewCss} />
      {!explicitHeader && <header className="custom-page-header" data-cms-chrome="custom-header">
        <SiteHeader chrome={chrome} />
        <div className="custom-page-title-wrap section-pad" data-cms-chrome="page-title"><p className="eyebrow">INFOStorage</p><h1>{title}</h1></div>
      </header>}
      <div className="custom-page-content">
        {BUILDER_SLOTS.map((slot) => <PageBuilderRenderer key={slot.id} page={page} slot={slot.id} chrome={chrome} {...interactions} />)}
      </div>
      {!explicitFooter && <footer className="site-footer" data-cms-chrome="footer">
        <a href="/" className="brand footer-brand" aria-label="INFOStorage home"><img className="footer-logo" src={chrome.site.logo} alt="INFOStorage Corporation" /></a>
        <p>{chrome.footer?.address ?? chrome.site.address}</p><span>{chrome.footer?.copyright ?? ''}</span>
      </footer>}
    </main>
  );
}
