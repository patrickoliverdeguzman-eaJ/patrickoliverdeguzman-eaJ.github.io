'use client';

import { type CSSProperties } from 'react';
import { PageBuilderRenderer, type SiteChrome } from '@/components/page-builder-renderer';
import { type BuilderPage, BUILDER_SLOTS } from '@/lib/page-builder';

type BuilderInteractions = {
  editable?: boolean;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onDropNode?: (targetNodeId: string) => void;
  onDragStartNode?: (nodeId: string) => void;
};

type CmsSitePageProps = BuilderInteractions & {
  kind: 'home' | 'partners';
  page?: BuilderPage;
  chrome: SiteChrome;
  style?: CSSProperties;
};

/** The public page shell has no page-specific copy or layout. It composes the
 * CMS page tree with shared CMS-managed navigation and footer data. */
export function CmsSitePage({ kind, page, chrome, style, ...interactions }: CmsSitePageProps) {
  const className = kind === 'partners' ? 'partner-page' : 'site-shell';
  return (
    <main className={className} style={style}>
      {BUILDER_SLOTS.map((slot) => (
        <PageBuilderRenderer key={slot.id} page={page} slot={slot.id} chrome={chrome} {...interactions} />
      ))}
      <footer className="site-footer">
        <a href={kind === 'partners' ? '/' : '#top'} className={`brand footer-brand ${kind === 'partners' ? 'partner-footer-brand' : ''}`} aria-label={kind === 'partners' ? 'INFOStorage home' : 'Back to top'}>
          <img className="footer-logo" src={chrome.site.logo} alt="INFOStorage Corporation" />
        </a>
        <p>{chrome.footer?.address ?? chrome.site.address}</p>
        <span>{chrome.footer?.copyright ?? ''}</span>
      </footer>
    </main>
  );
}
