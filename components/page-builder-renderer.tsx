'use client';

import { ArrowRight, ArrowUpRight, Check, Database, Laptop, Network, ServerCog } from 'lucide-react';
import { createElement } from 'react';
import {
  type BuilderNode,
  type BuilderPage,
  type BuilderSlot,
  hasBuilderContent,
} from '@/lib/page-builder';

type PageBuilderRendererProps = {
  page?: BuilderPage;
  slot: BuilderSlot;
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
  if (
    href.startsWith('#') ||
    href.startsWith('/') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
    return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : '#';
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
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function records(value: string, fields: number): string[][] {
  return lines(value).map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    return Array.from({ length: fields }, (_, index) => parts[index] ?? '');
  });
}

function BuilderNodeView({
  node,
  editable,
  selectedNodeId,
  onSelectNode,
  onDropNode,
  onDragStartNode,
}: Omit<PageBuilderRendererProps, 'page' | 'slot'> & { node: BuilderNode }) {
  const selected = editable && node.id === selectedNodeId;
  const className = [
    'page-builder-node',
    `page-builder-${node.type}`,
    `page-builder-tone-${node.styles.tone}`,
    `page-builder-padding-${node.styles.padding}`,
    `page-builder-align-${node.styles.align}`,
    `page-builder-width-${node.styles.width}`,
    `page-builder-radius-${node.styles.radius}`,
    `page-builder-border-${node.styles.border}`,
    `page-builder-shadow-${node.styles.shadow}`,
    `page-builder-gap-${node.styles.gap}`,
    `page-builder-motion-${node.styles.motion}`,
    `page-builder-hover-${node.styles.hover}`,
    `page-builder-visible-${node.responsive.visibility}`,
    `page-builder-tablet-columns-${node.responsive.tabletColumns}`,
    `page-builder-mobile-columns-${node.responsive.mobileColumns}`,
    `page-builder-tablet-align-${node.responsive.tabletAlign}`,
    `page-builder-mobile-align-${node.responsive.mobileAlign}`,
    `page-builder-tablet-padding-${node.responsive.tabletPadding}`,
    `page-builder-mobile-padding-${node.responsive.mobilePadding}`,
    selected ? 'page-builder-node-selected' : '',
    editable ? 'page-builder-node-editable' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const interactions = editable
    ? {
        draggable: true,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          // Builder buttons render as links in the public site. While editing,
          // they must select their block rather than navigate away from the CMS.
          event.preventDefault();
          event.stopPropagation();
          onSelectNode?.(node.id);
        },
        onDragStart: (event: React.DragEvent<HTMLElement>) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData(
            'application/x-infostorage-builder-node',
            node.id,
          );
          onDragStartNode?.(node.id);
        },
        onDragOver: (event: React.DragEvent<HTMLElement>) =>
          event.preventDefault(),
        onDrop: (event: React.DragEvent<HTMLElement>) => {
          event.preventDefault();
          event.stopPropagation();
          onDropNode?.(node.id);
        },
      }
    : {};
  const children = node.children.map((child) => (
    <BuilderNodeView
      key={child.id}
      node={child}
      editable={editable}
      selectedNodeId={selectedNodeId}
      onSelectNode={onSelectNode}
      onDropNode={onDropNode}
      onDragStartNode={onDragStartNode}
    />
  ));

  if (node.type === 'brand_hero') {
    const logo = safeImage(prop(node, 'logo'));
    return (
      <section className={`${className} cms-block-hero`} {...interactions}>
        <div className="cms-block-hero-scanline" aria-hidden="true" />
        <div className="cms-block-hero-inner">
          <div className="cms-block-hero-copy">
            <p className="eyebrow">{prop(node, 'eyebrow')}</p>
            <h1>{prop(node, 'title', 'A strong page title')} <span>{prop(node, 'accent')}</span></h1>
            <p>{prop(node, 'body')}</p>
            <div className="cms-block-actions">
              <a className="button button-primary" href={safeLink(prop(node, 'primaryHref', '#content'))}>{prop(node, 'primaryLabel', 'Explore')} <ArrowRight size={18} /></a>
              {prop(node, 'secondaryLabel') && <a className="button button-quiet" href={safeLink(prop(node, 'secondaryHref', '#contact'))}>{prop(node, 'secondaryLabel')} <ArrowRight size={18} /></a>}
            </div>
          </div>
          {logo && <div className="cms-block-logo-stage" aria-hidden="true"><div /><div /><figure><img src={logo} alt="" /></figure></div>}
        </div>
      </section>
    );
  }

  if (node.type === 'split_intro') {
    return (
      <section className={`${className} cms-block-split-intro`} {...interactions}>
        <p className="section-kicker">{prop(node, 'kicker')}</p>
        <div>
          <h2 className="display-heading">{prop(node, 'heading', 'A clear point of view')}<br /><em>{prop(node, 'accent')}</em></h2>
          <div className="cms-block-split-copy"><p>{prop(node, 'body')}</p>{prop(node, 'linkLabel') && <a className="text-link" href={safeLink(prop(node, 'linkHref', '#content'))}>{prop(node, 'linkLabel')} <ArrowRight size={17} /></a>}</div>
        </div>
      </section>
    );
  }

  if (node.type === 'principle_grid') {
    return (
      <section className={`${className} cms-block-principles`} {...interactions}>
        {records(prop(node, 'items'), 2).map(([title, body], index) => <article key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title || 'Principle'}</h3><p>{body}</p></article>)}
      </section>
    );
  }

  if (node.type === 'solution_grid') {
    const iconSet = [ServerCog, Network, Database, Laptop];
    return (
      <section className={`${className} cms-block-solutions`} {...interactions}>
        <div className="cms-block-heading-pair"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div>
        <div className="cms-block-solution-grid">
          {records(prop(node, 'items'), 3).map(([title, body, features], index) => {
            const Icon = iconSet[index % iconSet.length];
            return <article key={`${title}-${index}`}><div><span>{String(index + 1).padStart(2, '0')}</span><Icon size={25} strokeWidth={1.6} /></div><h3>{title || 'Solution'}</h3><p>{body}</p><ul>{features.split(';').filter(Boolean).slice(0, 8).map((feature) => <li key={feature}><Check size={15} strokeWidth={2.4} />{feature.trim()}</li>)}</ul><a href="#contact">Discuss this solution <ArrowUpRight size={18} /></a></article>;
          })}
        </div>
      </section>
    );
  }

  if (node.type === 'continuity_panel') {
    return (
      <section className={`${className} cms-block-continuity`} {...interactions}>
        <div className="cms-block-continuity-art" aria-hidden="true"><i /><i /><b /><b /><span>01</span><span>10</span><span>11</span></div>
        <div className="cms-block-continuity-copy"><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><a className="button button-sand" href={safeLink(prop(node, 'ctaHref', '#contact'))}>{prop(node, 'ctaLabel', 'Start a conversation')} <ArrowRight size={18} /></a></div>
      </section>
    );
  }

  if (node.type === 'service_list') {
    return (
      <section className={`${className} cms-block-service-list`} {...interactions}>
        <div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p></div>
        <div>{lines(prop(node, 'items')).map((item, index) => <a href={safeLink(prop(node, 'href', '#contact'))} key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><ArrowUpRight size={22} strokeWidth={1.7} /></a>)}</div>
      </section>
    );
  }

  if (node.type === 'tag_band') {
    return <section className={`${className} cms-block-tag-band`} {...interactions}><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><div>{lines(prop(node, 'tags')).map((tag) => <span key={tag}>{tag}</span>)}</div></section>;
  }

  if (node.type === 'contact_panel') {
    return <section className={`${className} cms-block-contact`} {...interactions}><i aria-hidden="true" /><div><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><div className="cms-block-actions"><a className="button button-primary" href={safeLink(prop(node, 'primaryHref', '#contact'))}>{prop(node, 'primaryLabel', 'Contact us')} <ArrowRight size={18} /></a>{prop(node, 'secondaryLabel') && <a className="button button-quiet" href={safeLink(prop(node, 'secondaryHref'))}>{prop(node, 'secondaryLabel')} <ArrowRight size={18} /></a>}</div></div></section>;
  }

  if (node.type === 'partner_directory') {
    return <section className={`${className} cms-block-partner-directory`} {...interactions}><div className="cms-block-heading-pair"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div className="cms-block-partner-grid">{records(prop(node, 'items'), 2).map(([name, focus], index) => <article key={`${name}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{name || 'Technology partner'}</h3><p>{focus}</p><i /><small>Technology ecosystem</small></article>)}</div><p className="cms-block-note">{prop(node, 'note')}</p></section>;
  }

  if (node.type === 'logo_grid') {
    return <section className={`${className} cms-block-logo-grid`} {...interactions}><div className="cms-block-heading-pair"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2>{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div>{records(prop(node, 'items'), 2).map(([name, logo], index) => <article key={`${name}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{safeImage(logo) ? <img src={safeImage(logo) ?? ''} alt={`${name || 'Client'} logo`} /> : <strong>{name || 'Client'}</strong>}<small>{name || 'Client'}</small></article>)}</div></section>;
  }

  if (node.type === 'method_list') {
    return <section className={`${className} cms-block-method-list`} {...interactions}><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><div>{records(prop(node, 'items'), 2).map(([title, body], index) => <article key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title || 'Method'}</h3><p>{body}</p></article>)}</div></section>;
  }

  if (node.type === 'heading') {
    const level = Math.min(
      Math.max(Math.round(numberProp(node, 'level', 2)), 1),
      4,
    );
    return createElement(
      `h${level}`,
      { className, ...interactions },
      prop(node, 'text', 'New heading'),
    );
  }
  if (node.type === 'text')
    return (
      <p className={className} {...interactions}>
        {prop(node, 'text', 'Add supporting text.')}
      </p>
    );
  if (node.type === 'image') {
    const src = safeImage(prop(node, 'src'));
    return (
      <figure className={className} {...interactions}>
        {src ? (
          <img src={src} alt={prop(node, 'alt', '')} />
        ) : (
          <div className="page-builder-image-placeholder">Select an image</div>
        )}
      </figure>
    );
  }
  if (node.type === 'button') {
    return (
      <a
        className={`${className} page-builder-button-${prop(node, 'variant', 'primary')}`}
        href={safeLink(prop(node, 'href', '#'))}
        {...interactions}
      >
        {prop(node, 'label', 'Learn more')}
      </a>
    );
  }
  if (node.type === 'divider')
    return <hr className={className} {...interactions} />;
  if (node.type === 'spacer')
    return (
      <div
        className={`${className} page-builder-spacer-${prop(node, 'size', 'regular')}`}
        aria-hidden="true"
        {...interactions}
      />
    );
  if (node.type === 'columns') {
    const columns = Math.min(
      Math.max(Math.round(numberProp(node, 'columns', 2)), 1),
      3,
    );
    return (
      <div
        className={`${className} page-builder-columns-${columns}`}
        {...interactions}
      >
        {children}
      </div>
    );
  }
  const label = prop(node, 'label');
  const element =
    node.type === 'card'
      ? 'article'
      : node.type === 'section'
        ? 'section'
        : 'div';
  return createElement(
    element,
    { className, ...interactions },
    label && editable ? (
      <span className="page-builder-editor-label">{label}</span>
    ) : null,
    children,
  );
}

export function PageBuilderRenderer(props: PageBuilderRendererProps) {
  const { page, slot } = props;
  if (!hasBuilderContent(page, slot)) return null;
  return (
    <div className="page-builder-slot" data-builder-slot={slot}>
      {page?.slots[slot].map((node) => (
        <BuilderNodeView key={node.id} node={node} {...props} />
      ))}
    </div>
  );
}
