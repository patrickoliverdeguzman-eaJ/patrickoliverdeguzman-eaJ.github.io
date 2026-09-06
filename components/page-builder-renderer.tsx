'use client';

import { ArrowRight, ArrowUpRight, Check, ChevronRight, Database, Laptop, Menu, Network, Phone, ServerCog } from 'lucide-react';
import { createElement } from 'react';
import { type BuilderNode, type BuilderPage, type BuilderSlot, hasBuilderContent } from '@/lib/page-builder';

export type SiteChrome = {
  variant: 'home' | 'partners';
  navItems: Array<{ id: string; label: string; href: string; enabled?: boolean }>;
  headerCta: { label: string; href: string };
  site: { logo: string; phone: string; phoneHref: string; address: string; addressUrl: string };
  footer?: { address: string; copyright: string };
};

type PageBuilderRendererProps = {
  page?: BuilderPage;
  slot: BuilderSlot;
  chrome?: SiteChrome;
  editable?: boolean;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onDropNode?: (targetNodeId: string) => void;
  onDragStartNode?: (nodeId: string) => void;
};

function prop(node: BuilderNode, name: string, fallback = ''): string {
  const value = node.props[name];
  return typeof value === 'string' ? value : fallback;
}

function numberProp(node: BuilderNode, name: string, fallback: number): number {
  const value = node.props[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeLink(value: string): string {
  const href = value.trim();
  if (href.startsWith('//')) return '#';
  if (href.startsWith('#') || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '#';
  } catch {
    return '#';
  }
}

function safeImage(value: string): string | null {
  const src = value.trim();
  if (src.startsWith('//')) return null;
  if (src.startsWith('/')) return src;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function lines(value: string): string[] {
  // Builder textareas store real line breaks. Accept an escaped line break as
  // well so imported records cannot collapse a repeatable block into one row.
  return value.replaceAll('\\n', '\n').split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 24);
}

function records(value: string, fields: number): string[][] {
  return lines(value).map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    return Array.from({ length: fields }, (_, index) => parts[index] ?? '');
  });
}

function siteHref(href: string, chrome?: SiteChrome): string {
  const safe = safeLink(href);
  if (safe === '/partners' && process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true') return '/partners.html';
  if (chrome?.variant === 'partners' && safe.startsWith('#')) return `/${safe}`;
  return safe;
}

function SiteHeader({ chrome }: { chrome: SiteChrome }) {
  const isPartners = chrome.variant === 'partners';
  return (
    <nav className="nav-wrap" aria-label="Main navigation">
      <a href={isPartners ? '/' : '#top'} className="brand brand-image" aria-label="INFOStorage home">
        <span className={`brand-logo-frame ${isPartners ? 'partner-brand-logo-frame' : ''}`}>
          <img className="brand-logo" src={chrome.site.logo} alt="INFOStorage Corporation" />
        </span>
      </a>
      <div className="desktop-links">
        {chrome.navItems.filter((item) => item.enabled !== false).map((item) => (
          <a className={isPartners && item.href === '/partners' ? 'nav-active' : undefined} href={siteHref(item.href, chrome)} key={item.id}>{item.label}</a>
        ))}
      </div>
      <a className="nav-cta" href={siteHref(chrome.headerCta.href, chrome)}>{chrome.headerCta.label} <ArrowUpRight size={16} strokeWidth={2.1} /></a>
      <details className="mobile-menu"><summary aria-label="Open navigation"><Menu size={22} /></summary><div className="mobile-menu-panel">{chrome.navItems.filter((item) => item.enabled !== false).map((item) => <a href={siteHref(item.href, chrome)} key={item.id}>{item.label}</a>)}</div></details>
    </nav>
  );
}

function nodeClasses(node: BuilderNode, editable?: boolean, selectedNodeId?: string | null): string {
  return [
    'page-builder-node', `page-builder-${node.type}`,
    `page-builder-tone-${node.styles.tone}`, `page-builder-padding-${node.styles.padding}`,
    `page-builder-align-${node.styles.align}`, `page-builder-width-${node.styles.width}`,
    `page-builder-radius-${node.styles.radius}`, `page-builder-border-${node.styles.border}`,
    `page-builder-shadow-${node.styles.shadow}`, `page-builder-gap-${node.styles.gap}`,
    `page-builder-motion-${node.styles.motion}`, `page-builder-hover-${node.styles.hover}`,
    `page-builder-visible-${node.responsive.visibility}`,
    `page-builder-tablet-columns-${node.responsive.tabletColumns}`, `page-builder-mobile-columns-${node.responsive.mobileColumns}`,
    `page-builder-tablet-align-${node.responsive.tabletAlign}`, `page-builder-mobile-align-${node.responsive.mobileAlign}`,
    `page-builder-tablet-padding-${node.responsive.tabletPadding}`, `page-builder-mobile-padding-${node.responsive.mobilePadding}`,
    selectedNodeId === node.id && editable ? 'page-builder-node-selected' : '', editable ? 'page-builder-node-editable' : '',
  ].filter(Boolean).join(' ');
}

function BuilderNodeView({ node, editable, selectedNodeId, onSelectNode, onDropNode, onDragStartNode, chrome }: Omit<PageBuilderRendererProps, 'page' | 'slot'> & { node: BuilderNode }) {
  const className = nodeClasses(node, editable, selectedNodeId);
  const interactions = editable ? {
    draggable: true,
    onClick: (event: React.MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); onSelectNode?.(node.id); },
    onDragStart: (event: React.DragEvent<HTMLElement>) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-infostorage-builder-node', node.id); onDragStartNode?.(node.id); },
    onDragOver: (event: React.DragEvent<HTMLElement>) => event.preventDefault(),
    onDrop: (event: React.DragEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); onDropNode?.(node.id); },
  } : {};
  const children = node.children.map((child) => <BuilderNodeView key={child.id} node={child} editable={editable} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onDropNode={onDropNode} onDragStartNode={onDragStartNode} chrome={chrome} />);

  if (node.type === 'brand_hero') {
    const isPartners = prop(node, 'variant') === 'partners';
    const logo = safeImage(prop(node, 'logo')) ?? chrome?.site.logo;
    if (isPartners) return <section className={`${className} partner-hero`} {...interactions}>
      {chrome && <SiteHeader chrome={chrome} />}
      <div className="partner-hero-inner section-pad"><div className="partner-hero-copy"><p className="eyebrow hero-reveal">{prop(node, 'eyebrow')}</p><h1 className="partner-title hero-reveal">{prop(node, 'title')} <span>{prop(node, 'accent')}</span></h1><p className="partner-description hero-reveal">{prop(node, 'body')}</p><a className="button button-primary hero-reveal" href={siteHref(prop(node, 'primaryHref', '#content'), chrome)}>{prop(node, 'primaryLabel', 'Explore')} <ArrowRight size={18} /></a></div><div className="partner-logo-stage" aria-hidden="true"><div className="logo-stage-orbit orbit-a" /><div className="logo-stage-orbit orbit-b" /><div className="partner-logo-plaque">{logo && <img src={logo} alt="" />}</div></div></div>
    </section>;
    return <section className={`${className} hero`} id="top" {...interactions}>
      <div className="hero-scanline" aria-hidden="true" />
      {chrome && <SiteHeader chrome={chrome} />}
      <div className="hero-inner"><div className="hero-copy"><p className="eyebrow hero-reveal">{prop(node, 'eyebrow')}</p><h1 className="hero-title hero-reveal">{prop(node, 'title')} <span>{prop(node, 'accent')}</span></h1><p className="hero-description hero-reveal">{prop(node, 'body')}</p><div className="hero-actions hero-reveal"><a className="button button-primary" href={siteHref(prop(node, 'primaryHref', '#content'), chrome)}>{prop(node, 'primaryLabel', 'Explore')} <ArrowRight size={18} /></a>{prop(node, 'secondaryLabel') && <a className="button button-quiet" href={siteHref(prop(node, 'secondaryHref', '#contact'), chrome)}>{prop(node, 'secondaryLabel')} <ChevronRight size={18} /></a>}</div></div><div className="hero-brand-stage" aria-hidden="true"><div className="hero-brand-orbit hero-brand-orbit-one" /><div className="hero-brand-orbit hero-brand-orbit-two" /><div className="hero-logo-plaque">{logo && <img src={logo} alt="" />}</div></div></div>
      <div className="hero-footer" aria-label="Capabilities">{lines(prop(node, 'capabilities')).map((item) => <span key={item}>{item}</span>)}</div>
    </section>;
  }

  if (node.type === 'home_intro') return <section className={`${className} intro section-pad`} id="approach" {...interactions}><div className="section-kicker reveal">{prop(node, 'kicker')}</div><div className="intro-grid"><h2 className="display-heading reveal">{prop(node, 'heading')}<br /><em>{prop(node, 'accent')}</em></h2><div className="intro-copy reveal"><p>{prop(node, 'body')}</p>{prop(node, 'linkLabel') && <a className="text-link" href={siteHref(prop(node, 'linkHref', '#content'), chrome)}>{prop(node, 'linkLabel')} <ArrowRight size={17} /></a>}</div></div><div className="principles reveal">{records(prop(node, 'items'), 2).map(([title, body], index) => <div key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></div>)}</div></section>;

  if (node.type === 'split_intro') return <section className={`${className} cms-block-split-intro`} {...interactions}><p className="section-kicker">{prop(node, 'kicker')}</p><div><h2 className="display-heading">{prop(node, 'heading')}<br /><em>{prop(node, 'accent')}</em></h2><div className="cms-block-split-copy"><p>{prop(node, 'body')}</p>{prop(node, 'linkLabel') && <a className="text-link" href={siteHref(prop(node, 'linkHref', '#content'), chrome)}>{prop(node, 'linkLabel')} <ArrowRight size={17} /></a>}</div></div></section>;
  if (node.type === 'principle_grid') return <section className={`${className} cms-block-principles`} {...interactions}>{records(prop(node, 'items'), 2).map(([title, body], index) => <article key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title || 'Principle'}</h3><p>{body}</p></article>)}</section>;

  if (node.type === 'solution_grid') {
    const iconSet = [ServerCog, Network, Database, Laptop];
    return <section className={`${className} solutions-section section-pad`} id="solutions" {...interactions}><div className="solutions-heading reveal"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div className="solutions-grid">{records(prop(node, 'items'), 3).map(([title, body, features], index) => { const Icon = iconSet[index % iconSet.length]; return <article className="solution-card reveal" key={`${title}-${index}`}><div className="solution-topline"><span>{String(index + 1).padStart(2, '0')}</span><Icon size={25} strokeWidth={1.6} /></div><h3>{title || 'Solution'}</h3><p>{body}</p><ul>{features.split(';').filter(Boolean).slice(0, 8).map((feature) => <li key={feature}><Check size={15} strokeWidth={2.4} />{feature.trim()}</li>)}</ul><a href={siteHref('#contact', chrome)}>Discuss this solution <ArrowUpRight size={18} /></a></article>; })}</div></section>;
  }

  if (node.type === 'continuity_panel') return <section className={`${className} continuity-panel section-pad`} {...interactions}><div className="continuity-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="circuit-line line-one" /><div className="circuit-line line-two" /><span>01</span><span>10</span><span>11</span></div><div className="continuity-copy reveal"><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><a className="button button-sand" href={siteHref(prop(node, 'ctaHref', '#contact'), chrome)}>{prop(node, 'ctaLabel', 'Start a conversation')} <ArrowRight size={18} /></a></div></section>;
  if (node.type === 'service_list') return <section className={`${className} services-section section-pad`} id="services" {...interactions}><div className="services-head reveal"><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p></div><div className="service-list">{lines(prop(node, 'items')).map((item, index) => <a className="service-row reveal" href={siteHref(prop(node, 'href', '#contact'), chrome)} key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><ArrowUpRight size={22} strokeWidth={1.7} /></a>)}</div></section>;
  if (node.type === 'tag_band') return <section className={`${className} sectors section-pad`} {...interactions}><div className="sectors-copy reveal"><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><div className="sector-tags reveal" aria-label="Sectors served">{lines(prop(node, 'tags')).map((tag) => <span key={tag}>{tag}</span>)}</div></section>;
  if (node.type === 'contact_panel') return <section className={`${className} contact-panel`} id="contact" {...interactions}><div className="contact-orbit" aria-hidden="true" /><div className="contact-content reveal"><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><div className="contact-actions"><a className="button button-primary" href={siteHref(chrome?.site.phoneHref ?? prop(node, 'primaryHref', '#contact'), chrome)}><Phone size={17} /> {chrome?.site.phone ?? prop(node, 'primaryLabel', 'Contact us')}</a>{chrome?.site.address && <a className="contact-address" href={siteHref(chrome.site.addressUrl, chrome)} target="_blank" rel="noreferrer">{chrome.site.address} <ArrowUpRight size={16} /></a>}</div></div></section>;

  if (node.type === 'partner_directory') return <section className={`${className} partner-directory section-pad`} id="partner-directory" {...interactions}><div className="partner-directory-heading reveal"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div className="partner-grid">{records(prop(node, 'items'), 2).map(([name, focus], index) => <article className="partner-card reveal" key={`${name}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{name || 'Technology partner'}</h3><p>{focus}</p><div className="partner-card-line" /><small>Technology ecosystem</small></article>)}</div><p className="partner-note reveal">{prop(node, 'note')}</p></section>;
  if (node.type === 'logo_grid') {
    const clients = records(prop(node, 'items'), 3);
    const rows = Array.from({ length: Math.ceil(clients.length / 4) }, (_, row) => clients.slice(row * 4, row * 4 + 4));
    return <section className={`${className} partner-clients section-pad`} id="valued-clients" {...interactions}><div className="partner-clients-heading reveal"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2>{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div className="partner-clients-grid" aria-label="Selected valued clients">{rows.map((row, rowIndex) => <div className={`partner-clients-row ${row.length === 3 ? 'partner-clients-row--proportional' : ''}`} key={`${rowIndex}-${row[0]?.[0] ?? 'row'}`}>{row.map(([name, logo, logoClass], itemIndex) => <article className={`partner-client-card reveal ${logoClass}`} key={`${name}-${itemIndex}`}><span>{String(rowIndex * 4 + itemIndex + 1).padStart(2, '0')}</span>{safeImage(logo) ? <img src={safeImage(logo) ?? ''} alt={`${name || 'Client'} logo`} loading="lazy" /> : <strong>{name || 'Client'}</strong>}<small>{name || 'Client'}</small></article>)}</div>)}</div></section>;
  }
  if (node.type === 'method_list') return <section className={`${className} partner-method section-pad`} {...interactions}><div className="partner-method-copy reveal"><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><div className="partner-method-list">{records(prop(node, 'items'), 2).map(([title, body], index) => <div className="reveal" key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title || 'Method'}</h3><p>{body}</p></div>)}</div></section>;
  if (node.type === 'partner_contact') return <section className={`${className} partner-contact`} {...interactions}><div className="partner-contact-content reveal"><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><a className="button button-sand" href={siteHref(prop(node, 'ctaHref', '/#contact'), chrome)}>{prop(node, 'ctaLabel', 'Start a conversation')} <ArrowRight size={18} /></a></div></section>;

  if (node.type === 'heading') { const level = Math.min(Math.max(Math.round(numberProp(node, 'level', 2)), 1), 4); return createElement(`h${level}`, { className, ...interactions }, prop(node, 'text', 'New heading')); }
  if (node.type === 'text') return <p className={className} {...interactions}>{prop(node, 'text', 'Add supporting text.')}</p>;
  if (node.type === 'image') { const src = safeImage(prop(node, 'src')); return <figure className={className} {...interactions}>{src ? <img src={src} alt={prop(node, 'alt', '')} /> : <div className="page-builder-image-placeholder">Select an image</div>}</figure>; }
  if (node.type === 'button') return <a className={`${className} page-builder-button-${prop(node, 'variant', 'primary')}`} href={siteHref(prop(node, 'href', '#'), chrome)} {...interactions}>{prop(node, 'label', 'Learn more')}</a>;
  if (node.type === 'divider') return <hr className={className} {...interactions} />;
  if (node.type === 'spacer') return <div className={`${className} page-builder-spacer-${prop(node, 'size', 'regular')}`} aria-hidden="true" {...interactions} />;
  if (node.type === 'columns') { const columns = Math.min(Math.max(Math.round(numberProp(node, 'columns', 2)), 1), 3); return <div className={`${className} page-builder-columns-${columns}`} {...interactions}>{children}</div>; }
  const label = prop(node, 'label');
  return createElement(node.type === 'card' ? 'article' : node.type === 'section' ? 'section' : 'div', { className, ...interactions }, label && editable ? <span className="page-builder-editor-label">{label}</span> : null, children);
}

export function PageBuilderRenderer(props: PageBuilderRendererProps) {
  if (!hasBuilderContent(props.page, props.slot)) return null;
  return <div className="page-builder-slot" data-builder-slot={props.slot}>{props.page?.slots[props.slot].map((node) => <BuilderNodeView key={node.id} node={node} {...props} />)}</div>;
}
