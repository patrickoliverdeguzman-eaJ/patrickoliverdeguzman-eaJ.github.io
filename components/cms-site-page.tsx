'use client';

import { type CSSProperties } from 'react';
import { PageBuilderRenderer, type SiteChrome } from '@/components/page-builder-renderer';
import { type BuilderPage, BUILDER_SLOTS, hasBuilderNodeType, normalisePageCss } from '@/lib/page-builder';

type BuilderInteractions = {
  editable?: boolean;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onDropNode?: (targetNodeId: string, mode?: 'before' | 'inside') => void;
  onDragStartNode?: (nodeId: string) => void;
  onUpdateNodeProp?: (nodeId: string, key: string, value: string) => void;
};

type CmsSitePageProps = BuilderInteractions & {
  kind: 'home' | 'partners';
  page?: BuilderPage;
  chrome: SiteChrome;
  style?: CSSProperties;
  /** The CMS preview scopes page CSS so a draft cannot restyle editor chrome. */
  previewCss?: boolean;
};

export function PageCssStyle({ css, preview }: { css?: string; preview?: boolean }) {
  const safeCss = normalisePageCss(css);
  if (!safeCss) return null;
  const renderedCss = preview
    ? `@scope ([data-cms-page-preview]) {\n${safeCss}\n}`
    : safeCss;
  return <style data-cms-page-css="true" dangerouslySetInnerHTML={{ __html: renderedCss }} />;
}

/** The public page shell has no page-specific copy or layout. It composes the
 * CMS page tree with shared CMS-managed navigation and footer data. */
export function CmsSitePage({ kind, page, chrome, style, previewCss, ...interactions }: CmsSitePageProps) {
  const className = kind === 'partners' ? 'partner-page' : 'site-shell';
  return (
    <main className={className} style={style} data-cms-page="" data-cms-page-preview={previewCss ? '' : undefined}>
      <PageCssStyle css={page?.customCss} preview={previewCss} />
      {BUILDER_SLOTS.map((slot) => (
        <PageBuilderRenderer key={slot.id} page={page} slot={slot.id} chrome={chrome} {...interactions} />
      ))}
      {!page?.settings.hideDefaultFooter && !hasBuilderNodeType(page, 'site_footer') && <footer className="site-footer" data-cms-chrome="footer">
        <a href={kind === 'partners' ? '/' : '#top'} className={`brand footer-brand ${kind === 'partners' ? 'partner-footer-brand' : ''}`} aria-label={kind === 'partners' ? 'INFOStorage home' : 'Back to top'}>
          <img className="footer-logo" src={chrome.site.logo} alt="INFOStorage Corporation" />
        </a>
        <p>{chrome.footer?.address ?? chrome.site.address}</p>
        <span>{chrome.footer?.copyright ?? ''}</span>
      </footer>}
    </main>
  );
}
