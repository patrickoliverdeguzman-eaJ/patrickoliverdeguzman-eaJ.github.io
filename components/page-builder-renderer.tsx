'use client';

import { AlertCircle, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, Cloud, Code2, Database, Laptop, Menu, Network, Phone, ServerCog, ShieldCheck, Sparkles } from 'lucide-react';
import { createElement, type CSSProperties } from 'react';
import { SortableBlockList } from '@/components/admin/builder-dnd';
import { BUILDER_ADVANCED_STYLE_KEYS, type BuilderAdvancedStyleKey, type BuilderAdvancedStyles, type BuilderNode, type BuilderPage, type BuilderSlot, hasBuilderContent, hasBuilderNodeType } from '@/lib/page-builder';

export type SiteChrome = {
  variant: 'home' | 'partners';
  /** Route rendered by the current page. Used for active navigation state. */
  currentPath?: string;
  navItems: Array<{ id: string; label: string; href: string; enabled?: boolean; parentId?: string }>;
  headerCta: { label: string; href: string };
  site: { logo: string; logoLight?: string; logoDark?: string; logoMobile?: string; logoWidth?: string; logoMobileWidth?: string; logoAlignment?: string; logoSpacing?: string; phone: string; phoneHref: string; address: string; addressUrl: string };
  footer?: { address: string; copyright: string };
};

type PageBuilderRendererProps = {
  page?: BuilderPage;
  slot: BuilderSlot;
  chrome?: SiteChrome;
  editable?: boolean;
  dragActive?: boolean;
  activeDragType?: BuilderNode['type'];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onUpdateNodeProp?: (nodeId: string, key: string, value: string) => void;
  onSelectNavigationItem?: (itemId: string) => void;
  onUpdateNavigationItem?: (itemId: string, label: string) => void;
};

function prop(node: BuilderNode, name: string, fallback = ''): string {
  const value = node.props[name];
  return typeof value === 'string' ? value : fallback;
}

function numberProp(node: BuilderNode, name: string, fallback: number): number {
  const value = node.props[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanProp(node: BuilderNode, name: string, fallback = false): boolean {
  const value = node.props[name];
  return typeof value === 'boolean' ? value : fallback;
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

function styleValue(value: string): string {
  const cleaned = value.trim().slice(0, 240);
  return /[{};<>]/.test(cleaned) ? '' : cleaned;
}

const STYLE_PROPERTY: Record<BuilderAdvancedStyleKey, keyof CSSProperties> = {
  display: 'display', flexDirection: 'flexDirection', justifyContent: 'justifyContent', alignItems: 'alignItems', flexWrap: 'flexWrap',
  gridTemplateColumns: 'gridTemplateColumns', gridTemplateRows: 'gridTemplateRows', position: 'position',
  marginTop: 'marginTop', marginRight: 'marginRight', marginBottom: 'marginBottom', marginLeft: 'marginLeft',
  paddingTop: 'paddingTop', paddingRight: 'paddingRight', paddingBottom: 'paddingBottom', paddingLeft: 'paddingLeft', gap: 'gap',
  customWidth: 'width', minWidth: 'minWidth', maxWidth: 'maxWidth', height: 'height', minHeight: 'minHeight', maxHeight: 'maxHeight',
  backgroundColor: 'backgroundColor', backgroundImage: 'backgroundImage', backgroundGradient: 'backgroundImage', color: 'color',
  borderStyle: 'borderStyle', borderWidth: 'borderWidth', borderColor: 'borderColor', borderRadius: 'borderRadius', boxShadow: 'boxShadow', opacity: 'opacity',
  fontFamily: 'fontFamily', fontSize: 'fontSize', fontWeight: 'fontWeight', lineHeight: 'lineHeight', letterSpacing: 'letterSpacing',
  textAlign: 'textAlign', textTransform: 'textTransform',
};

function cssStyleValue(key: BuilderAdvancedStyleKey, raw: string): string {
  const value = styleValue(raw);
  if (!value) return '';
  if (key === 'backgroundImage') {
    const image = safeImage(value);
    return image ? `url("${image.replaceAll('"', '%22')}")` : '';
  }
  if (key === 'backgroundGradient' && !/^(?:linear|radial|conic)-gradient\(/i.test(value)) return '';
  return value;
}

function advancedInlineStyle(values: BuilderAdvancedStyles): CSSProperties {
  const style: Record<string, string> = {};
  for (const key of BUILDER_ADVANCED_STYLE_KEYS) {
    const value = values[key] ? cssStyleValue(key, values[key]!) : '';
    if (value) style[STYLE_PROPERTY[key] as string] = value;
  }
  if (values.backgroundColor && !values.backgroundGradient && !values.backgroundImage) {
    style.backgroundImage = 'none';
  }
  return style as CSSProperties;
}

function toCssProperty(key: BuilderAdvancedStyleKey): string {
  return String(STYLE_PROPERTY[key]).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function responsiveDeclarations(values: BuilderAdvancedStyles): string {
  const declarations = BUILDER_ADVANCED_STYLE_KEYS.map((key) => {
    const value = values[key] ? cssStyleValue(key, values[key]!) : '';
    return value ? `${toCssProperty(key)}:${value}` : '';
  }).filter(Boolean);
  if (values.backgroundColor && !values.backgroundGradient && !values.backgroundImage) declarations.push('background-image:none');
  return declarations.join(';');
}

function responsiveCss(nodes: BuilderNode[]): string {
  const tablet: string[] = [];
  const mobile: string[] = [];
  const visit = (node: BuilderNode) => {
    const selector = `[data-cms-node="${node.id}"]`;
    const tabletRules = responsiveDeclarations(node.responsive.tablet);
    const mobileRules = responsiveDeclarations(node.responsive.mobile);
    if (tabletRules) tablet.push(`${selector}{${tabletRules}}`);
    if (mobileRules) mobile.push(`${selector}{${mobileRules}}`);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return `${tablet.length ? `@media(max-width:900px){${tablet.join('')}}` : ''}${mobile.length ? `@media(max-width:620px){${mobile.join('')}}` : ''}`;
}

function EditableValue({ node, field, fallback, editable, onUpdateNodeProp, className }: { node: BuilderNode; field: string; fallback?: string; editable?: boolean; onUpdateNodeProp?: PageBuilderRendererProps['onUpdateNodeProp']; className?: string }) {
  const value = prop(node, field, fallback);
  if (!editable) return <>{value}</>;
  return <span className={className} contentEditable suppressContentEditableWarning spellCheck={false} data-cms-inline-field={field}
    onClick={(event) => event.stopPropagation()}
    onBlur={(event) => onUpdateNodeProp?.(node.id, field, event.currentTarget.textContent ?? '')}>{value}</span>;
}

function siteHref(href: string, _chrome?: SiteChrome): string {
  let safe = safeLink(href);
  const legacySectionRoutes: Record<string, string> = {
    '#approach': '/about',
    '#solutions': '/solutions',
    '#services': '/services',
    '#contact': '/contact',
    '/#approach': '/about',
    '/#solutions': '/solutions',
    '/#services': '/services',
    '/#contact': '/contact',
  };
  safe = legacySectionRoutes[safe] ?? safe;
  if (process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true') {
    const [path, fragment] = safe.split('#', 2);
    if (/^\/(?:about|solutions|services|partners|contact)$/.test(path)) {
      return `${path}.html${fragment ? `#${fragment}` : ''}`;
    }
  }
  return safe;
}

export function SiteHeader({ chrome, node, editable, onUpdateNodeProp, onSelectNavigationItem, onUpdateNavigationItem }: { chrome: SiteChrome; node?: BuilderNode; editable?: boolean; onUpdateNodeProp?: PageBuilderRendererProps['onUpdateNodeProp']; onSelectNavigationItem?: PageBuilderRendererProps['onSelectNavigationItem']; onUpdateNavigationItem?: PageBuilderRendererProps['onUpdateNavigationItem'] }) {
  const isPartners = chrome.variant === 'partners';
  const useGlobal = !node || booleanProp(node, 'useGlobal', true);
  const customLinks: SiteChrome['navItems'] = node ? records(prop(node, 'links'), 2).map(([label, href], index) => ({ id: `${node.id}-link-${index}`, label, href, enabled: true })) : [];
  const navItems: SiteChrome['navItems'] = useGlobal || !customLinks.length ? chrome.navItems : customLinks;
  const rootItems = navItems.filter((item) => item.enabled !== false && !item.parentId);
  const logo = useGlobal ? (chrome.site.logoLight || chrome.site.logo) : (safeImage(prop(node!, 'logo')) ?? chrome.site.logoLight ?? chrome.site.logo);
  const mobileLogo = useGlobal ? (chrome.site.logoMobile || logo) : (safeImage(prop(node!, 'mobileLogo')) ?? logo);
  const logoWidth = useGlobal ? (chrome.site.logoWidth || '52px') : prop(node!, 'logoWidth', '52px');
  const mobileLogoWidth = useGlobal ? (chrome.site.logoMobileWidth || '46px') : prop(node!, 'mobileLogoWidth', '46px');
  const logoAlignment = useGlobal ? (chrome.site.logoAlignment || 'left') : prop(node!, 'logoAlignment', 'left');
  const logoSpacing = useGlobal ? (chrome.site.logoSpacing || '0') : prop(node!, 'logoSpacing', '0');
  const logoStyle = { '--cms-logo-width': styleValue(logoWidth), '--cms-mobile-logo-width': styleValue(mobileLogoWidth), margin: styleValue(logoSpacing) } as CSSProperties;
  const ctaLabel = useGlobal ? chrome.headerCta.label : prop(node!, 'ctaLabel', chrome.headerCta.label);
  const ctaHref = useGlobal ? chrome.headerCta.href : prop(node!, 'ctaHref', chrome.headerCta.href);
  const navigationLabel = (item: SiteChrome['navItems'][number]) => editable && useGlobal ? (
    <span
      className="nav-inline-edit"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-cms-navigation-item={item.id}
      title="Click to edit this menu label"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelectNavigationItem?.(item.id);
      }}
      onBlur={(event) => {
        const label = event.currentTarget.textContent?.trim() || item.label;
        onUpdateNavigationItem?.(item.id, label);
      }}
    >
      {item.label}
    </span>
  ) : item.label;
  return (
    <nav className="nav-wrap" data-cms-chrome="header" aria-label="Main navigation">
      <a href="/" className={`brand brand-image brand-align-${['left', 'center', 'right'].includes(logoAlignment) ? logoAlignment : 'left'}`} aria-label="INFOStorage home" style={logoStyle}>
        <span className={`brand-logo-frame ${isPartners ? 'partner-brand-logo-frame' : ''}`}>
          <picture>{mobileLogo !== logo && <source media="(max-width: 620px)" srcSet={mobileLogo} />}<img className="brand-logo" src={logo} alt={node ? prop(node, 'logoAlt', 'INFOStorage Corporation') : 'INFOStorage Corporation'} /></picture>
        </span>
      </a>
      <div className="desktop-links">
        {rootItems.map((item) => {
          const children = navItems.filter((child) => child.enabled !== false && child.parentId === item.id);
          return children.length ? <details className="nav-dropdown" key={item.id}><summary data-cms-item={item.id}>{navigationLabel(item)}<ChevronRight size={13} /></summary><div>{children.map((child) => <a data-cms-item={child.id} href={siteHref(child.href, chrome)} key={child.id}>{navigationLabel(child)}</a>)}</div></details> : <a data-cms-item={item.id} className={chrome.currentPath === item.href ? 'nav-active' : undefined} href={siteHref(item.href, chrome)} key={item.id}>{navigationLabel(item)}</a>;
        })}
      </div>
      <a className="nav-cta" href={siteHref(ctaHref, chrome)}>{node ? <EditableValue node={node} field="ctaLabel" fallback={ctaLabel} editable={editable && !useGlobal} onUpdateNodeProp={onUpdateNodeProp} /> : ctaLabel} <ArrowUpRight size={16} strokeWidth={2.1} /></a>
      <details className="mobile-menu"><summary aria-label="Open navigation"><Menu size={22} /></summary><div className="mobile-menu-panel">{navItems.filter((item) => item.enabled !== false).map((item) => <a className={item.parentId ? 'mobile-menu-child' : undefined} href={siteHref(item.href, chrome)} key={item.id}>{navigationLabel(item)}</a>)}</div></details>
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
    node.styles.customClass, selectedNodeId === node.id && editable ? 'page-builder-node-selected' : '', editable ? 'page-builder-node-editable' : '',
  ].filter(Boolean).join(' ');
}

function orderedNodes(nodes: BuilderNode[]): BuilderNode[] {
  return nodes
    .map((node, index) => ({ node, index }))
    .sort((left, right) => left.node.sortIndex - right.node.sortIndex || left.index - right.index)
    .map(({ node }) => node);
}

function BuilderNodeView({ node, slot, editable, dragActive, activeDragType, selectedNodeId, onSelectNode, onUpdateNodeProp, onSelectNavigationItem, onUpdateNavigationItem, chrome, explicitHeader }: Omit<PageBuilderRendererProps, 'page'> & { node: BuilderNode; explicitHeader?: boolean }) {
  const className = nodeClasses(node, editable, selectedNodeId);
  const interactions: React.HTMLAttributes<HTMLElement> & { 'data-cms-node': string } = { 'data-cms-node': node.id, ...(node.styles.elementId ? { id: node.styles.elementId } : {}), style: advancedInlineStyle(node.styles.advanced), ...(editable ? {
    onClick: (event: React.MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); onSelectNode?.(node.id); },
  } : {}) };
  const childNodes = orderedNodes(node.children);
  const renderChild = (child: BuilderNode) => <BuilderNodeView key={child.id} node={child} slot={slot} editable={editable} dragActive={dragActive} activeDragType={activeDragType} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onUpdateNodeProp={onUpdateNodeProp} onSelectNavigationItem={onSelectNavigationItem} onUpdateNavigationItem={onUpdateNavigationItem} chrome={chrome} explicitHeader={explicitHeader} />;
  const children = editable
    ? <SortableBlockList nodes={childNodes} slot={slot} parentId={node.id} parentType={node.type} dragActive={Boolean(dragActive)} activeType={activeDragType} renderNode={renderChild} />
    : childNodes.map(renderChild);

  if (node.type === 'site_header') return <header className={className} {...interactions}>{chrome && <SiteHeader chrome={chrome} node={node} editable={editable} onUpdateNodeProp={onUpdateNodeProp} onSelectNavigationItem={onSelectNavigationItem} onUpdateNavigationItem={onUpdateNavigationItem} />}{children}</header>;
  if (node.type === 'site_footer') {
    const useGlobal = booleanProp(node, 'useGlobal', true);
    const logo = useGlobal ? (chrome?.site.logoLight || chrome?.site.logo) : (safeImage(prop(node, 'logo')) ?? chrome?.site.logo);
    const address = useGlobal ? chrome?.footer?.address ?? chrome?.site.address : prop(node, 'address');
    const copyright = useGlobal ? chrome?.footer?.copyright : prop(node, 'copyright');
    const links = records(prop(node, 'links'), 2);
    return <footer className={`${className} site-footer`} data-cms-chrome="footer" {...interactions}>
      <a href="/" className="brand footer-brand" aria-label="INFOStorage home">{logo && <img className="footer-logo" src={logo} alt={prop(node, 'logoAlt', 'INFOStorage Corporation')} />}</a>
      <p>{editable && !useGlobal ? <EditableValue node={node} field="address" editable onUpdateNodeProp={onUpdateNodeProp} /> : address}</p>
      <span>{editable && !useGlobal ? <EditableValue node={node} field="copyright" editable onUpdateNodeProp={onUpdateNodeProp} /> : copyright}</span>
      {links.length > 0 && <nav aria-label="Footer links">{links.map(([label, href], index) => <a key={`${label}-${index}`} href={siteHref(href, chrome)}>{label}</a>)}</nav>}
      {children}
    </footer>;
  }

  if (node.type === 'brand_hero') {
    const isPartners = prop(node, 'variant') === 'partners';
    const logo = safeImage(prop(node, 'logo')) ?? chrome?.site.logo;
    if (isPartners) return <section className={`${className} partner-hero`} {...interactions}>
      {chrome && !explicitHeader && <SiteHeader chrome={chrome} />}
      <div className="partner-hero-inner section-pad"><div className="partner-hero-copy"><p className="eyebrow hero-reveal"><EditableValue node={node} field="eyebrow" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h1 className="partner-title hero-reveal"><EditableValue node={node} field="title" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <span><EditableValue node={node} field="accent" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></span></h1><p className="partner-description hero-reveal"><EditableValue node={node} field="body" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><a className="button button-primary hero-reveal" href={siteHref(prop(node, 'primaryHref', '#content'), chrome)}><EditableValue node={node} field="primaryLabel" fallback="Explore" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <ArrowRight size={18} /></a></div><div className="partner-logo-stage" aria-hidden="true"><div className="logo-stage-orbit orbit-a" /><div className="logo-stage-orbit orbit-b" /><div className="partner-logo-plaque">{logo && <img src={logo} alt="" />}</div></div></div>
    </section>;
    return <section className={`${className} hero`} {...interactions} id={node.styles.elementId || 'top'}>
      <div className="hero-scanline" aria-hidden="true" />
      {chrome && !explicitHeader && <SiteHeader chrome={chrome} />}
      <div className="hero-inner"><div className="hero-copy"><p className="eyebrow hero-reveal"><EditableValue node={node} field="eyebrow" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h1 className="hero-title hero-reveal"><EditableValue node={node} field="title" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <span><EditableValue node={node} field="accent" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></span></h1><p className="hero-description hero-reveal"><EditableValue node={node} field="body" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><div className="hero-actions hero-reveal"><a className="button button-primary" href={siteHref(prop(node, 'primaryHref', '#content'), chrome)}><EditableValue node={node} field="primaryLabel" fallback="Explore" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <ArrowRight size={18} /></a>{prop(node, 'secondaryLabel') && <a className="button button-quiet" href={siteHref(prop(node, 'secondaryHref', '#contact'), chrome)}><EditableValue node={node} field="secondaryLabel" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <ChevronRight size={18} /></a>}</div></div><div className="hero-brand-stage" aria-hidden="true"><div className="hero-brand-orbit hero-brand-orbit-one" /><div className="hero-brand-orbit hero-brand-orbit-two" /><div className="hero-logo-plaque">{logo && <img src={logo} alt="" />}</div></div></div>
      <div className="hero-footer" aria-label="Capabilities">{lines(prop(node, 'capabilities')).map((item) => <span key={item}>{item}</span>)}</div>
    </section>;
  }

  if (node.type === 'home_intro') return <section className={`${className} intro section-pad`} id="approach" {...interactions}><div className="section-kicker reveal">{prop(node, 'kicker')}</div><div className="intro-grid"><h2 className="display-heading reveal">{prop(node, 'heading')}<br /><em>{prop(node, 'accent')}</em></h2><div className="intro-copy reveal"><p>{prop(node, 'body')}</p>{prop(node, 'linkLabel') && <a className="text-link" href={siteHref(prop(node, 'linkHref', '#content'), chrome)}>{prop(node, 'linkLabel')} <ArrowRight size={17} /></a>}</div></div><div className="principles reveal">{records(prop(node, 'items'), 2).map(([title, body], index) => <div key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></div>)}</div></section>;

  if (node.type === 'split_intro') return <section className={`${className} cms-block-split-intro`} {...interactions}><p className="section-kicker">{prop(node, 'kicker')}</p><div><h2 className="display-heading">{prop(node, 'heading')}<br /><em>{prop(node, 'accent')}</em></h2><div className="cms-block-split-copy"><p>{prop(node, 'body')}</p>{prop(node, 'linkLabel') && <a className="text-link" href={siteHref(prop(node, 'linkHref', '#content'), chrome)}>{prop(node, 'linkLabel')} <ArrowRight size={17} /></a>}</div></div></section>;
  if (node.type === 'principle_grid') return <section className={`${className} cms-block-principles`} {...interactions}>{records(prop(node, 'items'), 2).map(([title, body], index) => <article key={`${title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title || 'Principle'}</h3><p>{body}</p></article>)}</section>;

  if (node.type === 'solution_grid') {
    return <section className={`${className} solutions-section section-pad`} id="solutions" {...interactions}><div className="solutions-heading reveal"><div><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2></div><p>{prop(node, 'body')}</p></div><div className="solutions-grid">{children}</div></section>;
  }

  if (node.type === 'solution_card') {
    const iconSet = [ServerCog, Network, Database, Laptop];
    const Icon = iconSet[node.sortIndex % iconSet.length];
    return <article className={`${className} solution-card reveal`} {...interactions}><div className="solution-topline"><span>{String(node.sortIndex + 1).padStart(2, '0')}</span><Icon size={25} strokeWidth={1.6} /></div><h3><EditableValue node={node} field="title" fallback="Solution" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h3><p><EditableValue node={node} field="body" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><ul>{prop(node, 'features').split(';').filter(Boolean).slice(0, 8).map((feature) => <li key={feature}><Check size={15} strokeWidth={2.4} />{feature.trim()}</li>)}</ul><a href={siteHref(prop(node, 'href', '#contact'), chrome)}>Discuss this solution <ArrowUpRight size={18} /></a></article>;
  }

  if (node.type === 'continuity_panel') return <section className={`${className} continuity-panel section-pad`} {...interactions}><div className="continuity-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="circuit-line line-one" /><div className="circuit-line line-two" /><span>01</span><span>10</span><span>11</span></div><div className="continuity-copy reveal"><p className="eyebrow">{prop(node, 'eyebrow')}</p><h2>{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p><a className="button button-sand" href={siteHref(prop(node, 'ctaHref', '#contact'), chrome)}>{prop(node, 'ctaLabel', 'Start a conversation')} <ArrowRight size={18} /></a></div></section>;
  if (node.type === 'service_list') return <section className={`${className} services-section section-pad`} id="services" {...interactions}><div className="services-head reveal"><p className="section-kicker">{prop(node, 'kicker')}</p><h2 className="display-heading">{prop(node, 'heading')}</h2><p>{prop(node, 'body')}</p></div><div className="service-list">{children}</div></section>;
  if (node.type === 'service_row') return <a className={`${className} service-row reveal`} href={siteHref(prop(node, 'href', '#contact'), chrome)} {...interactions}><span>{String(node.sortIndex + 1).padStart(2, '0')}</span><strong><EditableValue node={node} field="text" fallback="Service" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></strong><ArrowUpRight size={22} strokeWidth={1.7} /></a>;
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

  if (node.type === 'cta') return <section className={`${className} page-builder-cta`} {...interactions}><p className="eyebrow"><EditableValue node={node} field="eyebrow" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><p><EditableValue node={node} field="body" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><div><a className="button button-primary" href={siteHref(prop(node, 'primaryHref', '#contact'), chrome)}><EditableValue node={node} field="primaryLabel" fallback="Start a conversation" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></a>{prop(node, 'secondaryLabel') && <a className="button button-quiet" href={siteHref(prop(node, 'secondaryHref', '#'), chrome)}><EditableValue node={node} field="secondaryLabel" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></a>}</div></section>;

  if (node.type === 'feature_grid') return <section className={`${className} page-builder-marketing-section`} {...interactions}><p className="section-kicker"><EditableValue node={node} field="kicker" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><p><EditableValue node={node} field="body" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><div className="page-builder-feature-items">{records(prop(node, 'items'), 2).map(([title, body], index) => <article key={`${title}-${index}`}><Sparkles size={22} /><h3>{title || 'Feature'}</h3><p>{body}</p></article>)}</div></section>;
  if (node.type === 'testimonials') return <section className={`${className} page-builder-marketing-section`} {...interactions}><p className="section-kicker"><EditableValue node={node} field="kicker" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><div className="page-builder-testimonial-items">{records(prop(node, 'items'), 3).map(([quote, name, role], index) => <figure key={`${name}-${index}`}><blockquote>“{quote}”</blockquote><figcaption><strong>{name || 'Client name'}</strong><span>{role}</span></figcaption></figure>)}</div></section>;
  if (node.type === 'statistics') return <section className={`${className} page-builder-marketing-section`} {...interactions}><p className="section-kicker"><EditableValue node={node} field="kicker" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><div className="page-builder-statistic-items">{records(prop(node, 'items'), 2).map(([value, label], index) => <article key={`${label}-${index}`}><strong>{value}</strong><span>{label}</span></article>)}</div></section>;
  if (node.type === 'pricing') return <section className={`${className} page-builder-marketing-section`} {...interactions}><p className="section-kicker"><EditableValue node={node} field="kicker" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><div className="page-builder-pricing-items">{records(prop(node, 'items'), 4).map(([name, price, features, cta], index) => <article key={`${name}-${index}`}><h3>{name || 'Plan'}</h3><strong>{price}</strong><ul>{features.split(';').filter(Boolean).map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><a className="page-builder-button page-builder-button-primary" href="#contact">{cta || 'Contact us'}</a></article>)}</div></section>;
  if (node.type === 'faq') return <section className={`${className} page-builder-marketing-section`} {...interactions}><p className="section-kicker"><EditableValue node={node} field="kicker" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p><h2><EditableValue node={node} field="heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></h2><div className="page-builder-accordion">{records(prop(node, 'items'), 2).map(([question, answer], index) => <details key={`${question}-${index}`}><summary>{question || 'Question'}<ChevronRight size={17} /></summary><p>{answer}</p></details>)}</div></section>;

  if (node.type === 'rich_text') return <div className={`${className} page-builder-rich-text`} {...interactions}>{prop(node, 'text').split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
  if (node.type === 'video') { const src = safeImage(prop(node, 'src')); const poster = safeImage(prop(node, 'poster')); return <figure className={`${className} page-builder-video`} {...interactions}>{src ? <video controls={booleanProp(node, 'controls', true)} poster={poster ?? undefined} preload="metadata"><source src={src} /></video> : <div className="page-builder-image-placeholder">Choose a video URL</div>}<figcaption>{prop(node, 'title')}</figcaption></figure>; }
  if (node.type === 'icon') { const iconName = prop(node, 'name', 'database').toLowerCase(); const icons = { database: Database, network: Network, server: ServerCog, laptop: Laptop, shield: ShieldCheck, cloud: Cloud, code: Code2, sparkles: Sparkles }; const Icon = icons[iconName as keyof typeof icons] ?? Database; return <span className={`${className} page-builder-icon`} role="img" aria-label={prop(node, 'label', iconName)} {...interactions}><Icon size={Math.min(Math.max(numberProp(node, 'size', 36), 16), 160)} /></span>; }
  if (node.type === 'link') return <a className={`${className} page-builder-link`} href={siteHref(prop(node, 'href', '#'), chrome)} target={booleanProp(node, 'external') ? '_blank' : undefined} rel={booleanProp(node, 'external') ? 'noreferrer' : undefined} {...interactions}><EditableValue node={node} field="label" fallback="Learn more" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /> <ArrowUpRight size={16} /></a>;
  if (node.type === 'list') { const Tag = booleanProp(node, 'ordered') ? 'ol' : 'ul'; return <Tag className={`${className} page-builder-list`} {...interactions}>{lines(prop(node, 'items')).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</Tag>; }
  if (node.type === 'badge') return <span className={`${className} page-builder-badge`} {...interactions}><EditableValue node={node} field="text" fallback="Badge" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></span>;
  if (node.type === 'accordion') return <div className={`${className} page-builder-accordion`} {...interactions}>{records(prop(node, 'items'), 2).map(([question, answer], index) => <details key={`${question}-${index}`}><summary>{question || 'Question'}<ChevronRight size={17} /></summary><p>{answer}</p></details>)}</div>;
  if (node.type === 'tabs') return <div className={`${className} page-builder-tabs`} {...interactions} role="tablist" aria-label="Tabbed content">{records(prop(node, 'items'), 2).map(([label, body], index) => <details open={index === 0} key={`${label}-${index}`}><summary role="tab">{label || 'Tab'}</summary><p>{body}</p></details>)}</div>;
  if (node.type === 'modal') return <details className={`${className} page-builder-modal`} {...interactions}><summary>{prop(node, 'triggerLabel', 'Open details')}</summary><div role="dialog" aria-modal="true" aria-label={prop(node, 'title', 'More information')}><h3>{prop(node, 'title')}</h3><p>{prop(node, 'body')}</p></div></details>;
  if (node.type === 'alert') return <aside className={`${className} page-builder-alert page-builder-alert-${prop(node, 'variant', 'info')}`} role="status" {...interactions}><AlertCircle size={20} /><div><strong>{prop(node, 'title')}</strong><p>{prop(node, 'body')}</p></div></aside>;
  if (node.type === 'tooltip') return <span className={`${className} page-builder-tooltip`} tabIndex={0} aria-describedby={`${node.id}-tip`} {...interactions}>{prop(node, 'label', 'More information')} <CircleHelp size={15} /><span id={`${node.id}-tip`} role="tooltip">{prop(node, 'tip')}</span></span>;
  if (node.type === 'menu') return <nav className={`${className} page-builder-menu`} aria-label={prop(node, 'label', 'Menu')} {...interactions}>{records(prop(node, 'items'), 2).map(([label, href], index) => <a href={siteHref(href, chrome)} key={`${label}-${index}`}>{label}</a>)}</nav>;
  if (node.type === 'breadcrumb') return <nav className={`${className} page-builder-breadcrumb`} aria-label="Breadcrumb" {...interactions}><ol>{records(prop(node, 'items'), 2).map(([label, href], index) => <li key={`${label}-${index}`}>{href ? <a href={siteHref(href, chrome)}>{label}</a> : <span aria-current="page">{label}</span>}</li>)}</ol></nav>;

  if (node.type === 'form') return <form className={`${className} page-builder-form`} action={safeLink(prop(node, 'action'))} method={prop(node, 'method') === 'get' ? 'get' : 'post'} onSubmit={editable ? (event) => event.preventDefault() : undefined} {...interactions}><h3>{prop(node, 'title')}</h3>{children}</form>;
  if (node.type === 'input') { const inputType = ['text', 'email', 'tel', 'url', 'number', 'date'].includes(prop(node, 'inputType')) ? prop(node, 'inputType') : 'text'; return <label className={`${className} page-builder-field`} {...interactions}><span>{prop(node, 'label')}</span><input type={inputType} name={prop(node, 'name')} placeholder={prop(node, 'placeholder')} required={booleanProp(node, 'required')} /></label>; }
  if (node.type === 'textarea_field') return <label className={`${className} page-builder-field`} {...interactions}><span>{prop(node, 'label')}</span><textarea name={prop(node, 'name')} placeholder={prop(node, 'placeholder')} required={booleanProp(node, 'required')} rows={Math.min(Math.max(numberProp(node, 'rows', 5), 2), 12)} /></label>;
  if (node.type === 'select_field') return <label className={`${className} page-builder-field`} {...interactions}><span>{prop(node, 'label')}</span><select name={prop(node, 'name')} required={booleanProp(node, 'required')}><option value="">Select…</option>{lines(prop(node, 'options')).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  if (node.type === 'checkbox') return <label className={`${className} page-builder-choice`} {...interactions}><input type="checkbox" name={prop(node, 'name')} required={booleanProp(node, 'required')} /><span>{prop(node, 'label')}</span></label>;
  if (node.type === 'radio_group') return <fieldset className={`${className} page-builder-field`} {...interactions}><legend>{prop(node, 'label')}</legend>{lines(prop(node, 'options')).map((option) => <label className="page-builder-choice" key={option}><input type="radio" name={prop(node, 'name')} value={option} required={booleanProp(node, 'required')} /><span>{option}</span></label>)}</fieldset>;
  if (node.type === 'submit') return <button className={`${className} page-builder-button page-builder-button-primary`} type="submit" {...interactions}><EditableValue node={node} field="label" fallback="Submit" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></button>;

  if (node.type === 'heading') { const level = Math.min(Math.max(Math.round(numberProp(node, 'level', 2)), 1), 4); return createElement(`h${level}`, { className, ...interactions }, <EditableValue node={node} field="text" fallback="New heading" editable={editable} onUpdateNodeProp={onUpdateNodeProp} />); }
  if (node.type === 'text') return <p className={className} {...interactions}><EditableValue node={node} field="text" fallback="Add supporting text." editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></p>;
  if (node.type === 'image') { const src = safeImage(prop(node, 'src')); return <figure className={className} {...interactions}>{src ? <img src={src} alt={prop(node, 'alt', '')} title={prop(node, 'title') || undefined} /> : <div className="page-builder-image-placeholder">Select an image</div>}{prop(node, 'caption') && <figcaption>{prop(node, 'caption')}</figcaption>}</figure>; }
  if (node.type === 'button') return <a className={`${className} page-builder-button-${prop(node, 'variant', 'primary')}`} href={siteHref(prop(node, 'href', '#'), chrome)} {...interactions}><EditableValue node={node} field="label" fallback="Learn more" editable={editable} onUpdateNodeProp={onUpdateNodeProp} /></a>;
  if (node.type === 'divider') return <hr className={className} {...interactions} />;
  if (node.type === 'spacer') return <div className={`${className} page-builder-spacer-${prop(node, 'size', 'regular')}`} aria-hidden="true" {...interactions} />;
  if (node.type === 'columns' || node.type === 'grid') { const columns = Math.min(Math.max(Math.round(numberProp(node, 'columns', node.type === 'grid' ? 3 : 2)), 1), 6); return <div className={`${className} page-builder-columns page-builder-columns-${columns}`} {...interactions}>{children}</div>; }
  if (node.type === 'row') return <div className={`${className} page-builder-row`} {...interactions}>{children}</div>;
  const label = prop(node, 'label');
  return createElement(node.type === 'card' ? 'article' : node.type === 'section' ? 'section' : 'div', { className, ...interactions }, label && editable ? <span className="page-builder-editor-label" data-cms-editor-only="">{label}</span> : null, children);
}

export function PageBuilderRenderer(props: PageBuilderRendererProps) {
  if (!props.editable && !hasBuilderContent(props.page, props.slot)) return null;
  const nodes = orderedNodes(props.page?.slots[props.slot] ?? []);
  const css = responsiveCss(nodes);
  const renderNode = (node: BuilderNode) => <BuilderNodeView key={node.id} node={node} explicitHeader={Boolean(props.page?.settings.hideDefaultHeader) || hasBuilderNodeType(props.page, 'site_header')} {...props} />;
  return <div className="page-builder-slot" data-builder-slot={props.slot}>{css && <style data-cms-responsive-styles dangerouslySetInnerHTML={{ __html: css }} />}{props.editable ? <SortableBlockList nodes={nodes} slot={props.slot} dragActive={Boolean(props.dragActive)} activeType={props.activeDragType} renderNode={renderNode} /> : nodes.map(renderNode)}</div>;
}
