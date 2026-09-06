import { CMS_API } from './cms-api';
import { hasBuilderContent, normaliseBuilderPage, type BuilderNode, type BuilderNodeType, type BuilderPage } from './page-builder';

// Content layer for the public site.
//
// The public pages keep their exact markup and styling. This module provides
// the current hardcoded copy as defaults, then overlays values published in
// the CMS (Workers + D1). When the CMS is unreachable or a document is still
// a draft, the page silently falls back to the defaults, so missing optional
// content can never crash the page or change the design.
//
// Security: CMS values are only ever rendered as React text nodes (which
// React escapes). Nothing from the CMS is injected with
// dangerouslySetInnerHTML.

export interface NavItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

export interface SolutionContent {
  title: string;
  description: string;
  items: string[];
}

export interface PartnerContent {
  name: string;
  focus: string;
  website: string;
}

export interface ClientContent {
  name: string;
  logo: string;
  website: string;
  logoClass: string;
}

export interface DesignSystem {
  primary: string;
  primaryDeep: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  muted: string;
  radius: 'compact' | 'regular' | 'generous';
  container: 'standard' | 'wide';
}

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  primary: '#62002f',
  primaryDeep: '#280817',
  accent: '#820040',
  accentSoft: '#ffd4e4',
  surface: '#fff8fb',
  surfaceMuted: '#f1e4ea',
  ink: '#2a0d1c',
  muted: '#735568',
  radius: 'regular',
  container: 'standard',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

export function designSystemFromDoc(value: unknown): DesignSystem {
  if (!isRecord(value)) return { ...DEFAULT_DESIGN_SYSTEM };
  return {
    primary: color(value.primary, DEFAULT_DESIGN_SYSTEM.primary),
    primaryDeep: color(value.primaryDeep, DEFAULT_DESIGN_SYSTEM.primaryDeep),
    accent: color(value.accent, DEFAULT_DESIGN_SYSTEM.accent),
    accentSoft: color(value.accentSoft, DEFAULT_DESIGN_SYSTEM.accentSoft),
    surface: color(value.surface, DEFAULT_DESIGN_SYSTEM.surface),
    surfaceMuted: color(value.surfaceMuted, DEFAULT_DESIGN_SYSTEM.surfaceMuted),
    ink: color(value.ink, DEFAULT_DESIGN_SYSTEM.ink),
    muted: color(value.muted, DEFAULT_DESIGN_SYSTEM.muted),
    radius: value.radius === 'compact' || value.radius === 'generous' ? value.radius : 'regular',
    container: value.container === 'wide' ? 'wide' : 'standard',
  };
}

export function designVariables(design: DesignSystem): Record<string, string> {
  return {
    '--background': design.surface,
    '--foreground': design.ink,
    '--navy': design.primary,
    '--navy-deep': design.primaryDeep,
    '--ink': design.ink,
    '--cream': design.surface,
    '--sand': design.surfaceMuted,
    '--muted': design.muted,
    '--copper': design.accent,
    '--electric': design.accentSoft,
    '--line': `color-mix(in srgb, ${design.accent} 17%, transparent)`,
    '--cms-radius': design.radius === 'compact' ? '0.45rem' : design.radius === 'generous' ? '1.5rem' : '0.9rem',
    '--cms-container': design.container === 'wide' ? '1560px' : '1440px',
  };
}

interface PublishedDoc {
  id: string;
  type: string;
  slug: string;
  title: string;
  data: Record<string, unknown>;
  order?: number;
}

interface ContentDocResponse {
  document: PublishedDoc;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${CMS_API}${path}`, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchPublishedDoc(type: string, slug: string): Promise<Record<string, unknown> | null> {
  const data = await fetchJson<ContentDocResponse>(`/v1/content/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`);
  return data?.document?.data ?? null;
}

// ---------------------------------------------------------------------------
// Defaults extracted verbatim from the original static pages.
// ---------------------------------------------------------------------------

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'nav-solutions', label: 'Solutions', href: '#solutions', enabled: true },
  { id: 'nav-services', label: 'Services', href: '#services', enabled: true },
  { id: 'nav-approach', label: 'Why INFOStorage', href: '#approach', enabled: true },
  { id: 'nav-partners', label: 'Partners', href: '/partners', enabled: true },
  { id: 'nav-contact', label: 'Contact', href: '#contact', enabled: true },
];

export const DEFAULT_SOLUTIONS: SolutionContent[] = [
  {
    title: 'Systems & platforms',
    description: 'Integrated systems designed to support the business objectives behind every workload.',
    items: [
      'Enterprise storage systems',
      'Oracle Cloud Infrastructure & engineered systems',
      'Server and storage virtualization',
      'Hyper-converged infrastructure solutions',
    ],
  },
  {
    title: 'Network & security',
    description: 'A secure, reliable network foundation for collaboration and business continuity.',
    items: [
      'Cybersecurity, IAG & next-generation firewall',
      'Load balancing, WAF & DLP compliance',
      'Performance monitoring & web isolation',
    ],
  },
  {
    title: 'Data protection',
    description: 'Protection strategies tailored to your organisation’s data, requirements, and risk profile.',
    items: [
      'Business continuity & disaster recovery',
      'Enterprise backup and restore',
      'Digital archiving',
    ],
  },
  {
    title: 'Mobile & peripherals',
    description: 'Workplace technology integrated into the wider IT environment for seamless operation.',
    items: [
      'Desktop and laptop computing',
      'Mobile device integration',
      'Business peripherals',
    ],
  },
];

export const DEFAULT_SERVICES: string[] = [
  'Hardware installation, maintenance & onsite support',
  'Helpdesk',
  'Consulting and implementation',
  'Project management and systems integration',
];

export const DEFAULT_PARTNER_LIST: PartnerContent[] = [
  { name: 'A10 Networks', focus: 'Application delivery & security', website: '' },
  { name: 'Hitachi Data Systems', focus: 'Enterprise data infrastructure', website: '' },
  { name: 'Oracle', focus: 'Cloud & engineered systems', website: '' },
  { name: 'Lenovo', focus: 'Servers & workplace computing', website: '' },
  { name: 'UltraBac', focus: 'Backup & recovery', website: '' },
  { name: 'EMC Data Domain', focus: 'Data protection storage', website: '' },
  { name: 'StorageTek', focus: 'Enterprise tape & storage', website: '' },
];

export const DEFAULT_CLIENT_LIST: ClientContent[] = [
  { name: 'Government Service Insurance System', logo: '/client-logos/gsis-reference.png', website: '', logoClass: 'client-logo-gsis' },
  { name: 'League One Finance and Leasing Corporation', logo: '/client-logos/league-one-reference.png', website: '', logoClass: 'client-logo-league' },
  { name: 'Bangko Sentral ng Pilipinas', logo: '/client-logos/bsp-reference.png', website: '', logoClass: '' },
  { name: 'Securities and Exchange Commission', logo: '/client-logos/sec-reference.png', website: '', logoClass: '' },
  { name: 'Office of the President of the Philippines', logo: '/client-logos/op-malacanang-reference.png', website: '', logoClass: '' },
  { name: 'Global Payments', logo: '/client-logos/global-payments-reference.png', website: '', logoClass: 'client-logo-wide-white' },
  { name: 'Credit Information Corporation', logo: '/client-logos/credit-information-reference.png', website: '', logoClass: 'client-logo-wide-white' },
  { name: 'SYSTRA Philippines', logo: 'https://images.seeklogo.com/logo-png/50/1/systra-logo-png_seeklogo-505360.png', website: '', logoClass: '' },
  { name: 'NextVAS', logo: '/client-logos/nextvas-reference.png', website: '', logoClass: '' },
  { name: 'Home Credit', logo: 'https://static.wixstatic.com/media/58bb01_f895c5145c0b4edfa4bfa8b83b0ff5a9~mv2.png/v1/fill/w_152%2Ch_95%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/Home_Credit_Logo_Grey.png', website: '', logoClass: '' },
  { name: 'ADP Pharma', logo: 'https://www.adppharma.com/wp-content/uploads/2022/05/adp-logo.png', website: '', logoClass: '' },
  { name: 'San-Yang Furniture', logo: 'https://pbs.twimg.com/profile_images/704835910391599104/Brmm68EG.jpg', website: '', logoClass: '' },
  { name: 'JINS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/JINS_Logo.svg/3840px-JINS_Logo.svg.png', website: '', logoClass: '' },
  { name: 'DENR Biodiversity Management Bureau', logo: '/client-logos/denr-reference.png', website: '', logoClass: 'client-logo-denr' },
  { name: 'One Cainta', logo: 'https://static.wixstatic.com/media/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png/v1/fit/w_2500%2Ch_1330%2Cal_c/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png', website: '', logoClass: '' },
  { name: 'Hitachi Digital Services', logo: '/client-logos/hitachi-digital-services-reference.png', website: '', logoClass: 'client-logo-wide-white' },
  { name: 'Amdocs', logo: '/client-logos/amdocs-reference.png', website: '', logoClass: 'client-logo-amdocs' },
  { name: '7-Eleven', logo: 'https://www.clipartmax.com/png/middle/58-586690_7-eleven-brand-logo-7-11-logo.png', website: '', logoClass: 'client-logo-7eleven' },
  { name: 'Cathay United Bank', logo: 'https://www.singaporeair.com/content/dam/sia/web-assets/images/ppsclub-krisflyer/earn-miles/earnontheground/financial-services-partners/cathayunitedbanktaiwan/CathayUnitedBanklogo_1240x%20400.png', website: '', logoClass: 'client-logo-cathay' },
];

export interface HomeContent {
  design: DesignSystem;
  navItems: NavItem[];
  headerCta: { label: string; href: string };
  hero: {
    eyebrow: string;
    titleA: string;
    titleAccent: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  approach: {
    kicker: string;
    headingA: string;
    headingAccent: string;
    body: string;
    linkLabel: string;
    linkHref: string;
    principles: Array<{ n: string; title: string; text: string }>;
  };
  solutionsHeading: { kicker: string; heading: string; body: string };
  solutions: SolutionContent[];
  continuity: { eyebrow: string; heading: string; body: string; ctaLabel: string; ctaHref: string };
  servicesHead: { kicker: string; heading: string; body: string };
  services: string[];
  sectors: { kicker: string; heading: string; tags: string[] };
  contact: { eyebrow: string; heading: string; body: string };
  site: { phone: string; phoneHref: string; address: string; addressUrl: string; logo: string };
  footer: { address: string; copyright: string };
  /** Optional, schema-defined sections added through the visual builder. */
  builder?: BuilderPage;
}

export const DEFAULT_HOME: HomeContent = {
  design: DEFAULT_DESIGN_SYSTEM,
  navItems: DEFAULT_NAV_ITEMS,
  headerCta: { label: 'Start a conversation', href: '#contact' },
  hero: {
    eyebrow: 'Premium solutions integrator',
    titleA: 'Enterprise-class solutions for',
    titleAccent: 'what comes next.',
    description:
      'INFOStorage Corporation provides comprehensive data computing solutions—from systems and security to protection and specialist services.',
    primaryLabel: 'Explore our solutions',
    primaryHref: '#solutions',
    secondaryLabel: 'Talk to an expert',
    secondaryHref: '#contact',
  },
  approach: {
    kicker: 'The INFOStorage difference',
    headingA: 'Manage your data',
    headingAccent: 'more efficiently.',
    body: 'INFOStorage is a leading IT consultant providing enterprise-class data center solutions. Our experience spans servers, DAS/SAN/NAS storage, automated tape, data protection and disaster recovery, and network implementation. Our vision is to be the vendor of choice for IT enterprise-class solutions and services.',
    linkLabel: 'Explore IVAS',
    linkHref: '#services',
    principles: [
      { n: '01', title: 'Specialized', text: 'Focused expertise across a chosen set of enterprise IT solutions.' },
      { n: '02', title: 'Recognized', text: 'A commitment to deliver on the work we take on with every client.' },
      { n: '03', title: 'Respected', text: 'Professional service delivered with integrity from planning through support.' },
    ],
  },
  solutionsHeading: {
    kicker: 'Our solutions',
    heading: 'A complete foundation for data computing.',
    body: 'Hardware, software, and infrastructure components brought together around your organisation’s operating needs and objectives.',
  },
  solutions: DEFAULT_SOLUTIONS,
  continuity: {
    eyebrow: 'Data protection',
    heading: 'Protect the information your operations depend on.',
    body: 'We design, deploy, and maintain data protection mechanisms that fit your requirements—from business continuity and disaster recovery to backup, restore, and digital archiving.',
    ctaLabel: 'Discuss data protection',
    ctaHref: '#contact',
  },
  servicesHead: {
    kicker: 'INFOStorage Value Added Services',
    heading: 'Services that keep technology working in practice.',
    body: 'INFOStorage Value Added Services bring professional support around every solution, from installation and implementation to ongoing assistance.',
  },
  services: DEFAULT_SERVICES,
  sectors: {
    kicker: 'Built across industries',
    heading: 'Trusted by multinational and local enterprises.',
    tags: ['Financial services', 'Telecommunications', 'Utilities', 'Government'],
  },
  contact: {
    eyebrow: 'Contact INFOStorage',
    heading: 'Give your business what it needs to grow.',
    body: 'Let’s discuss your data storage and computing needs, and identify the right enterprise solution for your environment.',
  },
  site: {
    phone: '+63 2 8899 4878',
    phoneHref: 'tel:+63288994878',
    address: '1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City',
    addressUrl: 'https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City',
    logo: '/infostorage-logo.png',
  },
  footer: {
    address: '1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City',
    copyright: '© 2025 INFOStorage Corporation',
  },
};

export interface PartnersContent {
  design: DesignSystem;
  navItems: NavItem[];
  headerCta: HomeContent['headerCta'];
  site: HomeContent['site'];
  footer: HomeContent['footer'];
  partners: PartnerContent[];
  clients: ClientContent[];
  hero: { eyebrow: string; titleA: string; titleAccent: string; description: string; ctaLabel: string; ctaHref: string };
  directory: { kicker: string; heading: string; body: string; note: string };
  clientsHead: { kicker: string; heading: string; body: string };
  /** Optional, schema-defined sections added through the visual builder. */
  builder?: BuilderPage;
}

export const DEFAULT_PARTNERS: PartnersContent = {
  design: DEFAULT_DESIGN_SYSTEM,
  navItems: DEFAULT_NAV_ITEMS,
  headerCta: DEFAULT_HOME.headerCta,
  site: DEFAULT_HOME.site,
  footer: DEFAULT_HOME.footer,
  partners: DEFAULT_PARTNER_LIST,
  clients: DEFAULT_CLIENT_LIST,
  hero: {
    eyebrow: 'Partner ecosystem',
    titleA: 'Integration starts with the',
    titleAccent: 'right ecosystem.',
    description:
      'INFOStorage works with global product brands and enterprise solution providers to deliver technology stacks that fit the way your organisation operates.',
    ctaLabel: 'Explore the ecosystem',
    ctaHref: '#partner-directory',
  },
  directory: {
    kicker: 'Selected technology partners',
    heading: 'Built around the systems you rely on.',
    body: 'A focused ecosystem of infrastructure, security, cloud, and protection technologies—brought together around your operating needs.',
    note: 'Technology availability and solution fit can vary by requirement. Talk with INFOStorage to identify the most suitable current option for your environment.',
  },
  clientsHead: {
    kicker: 'Valued clients (partial)',
    heading: 'Trusted where the work matters most.',
    body: 'A selection of organisations that have chosen INFOStorage for enterprise technology, integration, and support.',
  },
};

const migratedBlockStyles: BuilderNode['styles'] = {
  tone: 'default',
  padding: 'inherit',
  align: 'inherit',
  width: 'inherit',
  radius: 'none',
  border: 'none',
  shadow: 'none',
  gap: 'inherit',
  motion: 'none',
  hover: 'none',
};

const migratedBlockResponsive: BuilderNode['responsive'] = {
  visibility: 'all',
  tabletColumns: 'inherit',
  mobileColumns: 'inherit',
  tabletAlign: 'inherit',
  mobileAlign: 'inherit',
  tabletPadding: 'inherit',
  mobilePadding: 'inherit',
};

function migratedBlock(id: string, type: BuilderNodeType, props: BuilderNode['props']): BuilderNode {
  return { id, type, props, styles: { ...migratedBlockStyles }, responsive: { ...migratedBlockResponsive }, children: [] };
}

/** The CMS migration blueprint for the original homepage. It deliberately uses
 * the same visual component blocks as every new CMS page, not legacy JSX. */
export function createHomeBuilderPage(content: HomeContent = DEFAULT_HOME): BuilderPage {
  return {
    version: 1,
    slots: {
      afterHero: [migratedBlock('home-hero', 'brand_hero', {
        variant: 'home', eyebrow: content.hero.eyebrow, title: content.hero.titleA, accent: content.hero.titleAccent,
        body: content.hero.description, primaryLabel: content.hero.primaryLabel, primaryHref: content.hero.primaryHref,
        secondaryLabel: content.hero.secondaryLabel, secondaryHref: content.hero.secondaryHref, logo: content.site.logo,
        capabilities: 'Systems & platforms\nNetwork & security\nData protection\nIVAS',
      })],
      afterApproach: [migratedBlock('home-intro', 'home_intro', {
        kicker: content.approach.kicker, heading: content.approach.headingA, accent: content.approach.headingAccent,
        body: content.approach.body, linkLabel: content.approach.linkLabel, linkHref: content.approach.linkHref,
        items: content.approach.principles.map((item) => `${item.title}|${item.text}`).join('\n'),
      })],
      afterSolutions: [migratedBlock('home-solutions', 'solution_grid', {
        kicker: content.solutionsHeading.kicker, heading: content.solutionsHeading.heading, body: content.solutionsHeading.body,
        items: content.solutions.map((item) => `${item.title}|${item.description}|${item.items.join(';')}`).join('\n'),
      })],
      afterServices: [
        migratedBlock('home-continuity', 'continuity_panel', { eyebrow: content.continuity.eyebrow, heading: content.continuity.heading, body: content.continuity.body, ctaLabel: content.continuity.ctaLabel, ctaHref: content.continuity.ctaHref }),
        migratedBlock('home-services', 'service_list', { kicker: content.servicesHead.kicker, heading: content.servicesHead.heading, body: content.servicesHead.body, items: content.services.join('\n'), href: '#contact' }),
      ],
      beforeContact: [migratedBlock('home-sectors', 'tag_band', { kicker: content.sectors.kicker, heading: content.sectors.heading, tags: content.sectors.tags.join('\n') })],
      afterContent: [migratedBlock('home-contact', 'contact_panel', { eyebrow: content.contact.eyebrow, heading: content.contact.heading, body: content.contact.body })],
    },
  };
}

/** The CMS migration blueprint for the original Partners page. */
export function createPartnersBuilderPage(content: PartnersContent = DEFAULT_PARTNERS): BuilderPage {
  return {
    version: 1,
    slots: {
      afterHero: [migratedBlock('partners-hero', 'brand_hero', {
        variant: 'partners', eyebrow: content.hero.eyebrow, title: content.hero.titleA, accent: content.hero.titleAccent,
        body: content.hero.description, primaryLabel: content.hero.ctaLabel, primaryHref: content.hero.ctaHref, logo: content.site.logo,
      })],
      afterApproach: [migratedBlock('partners-directory', 'partner_directory', {
        kicker: content.directory.kicker, heading: content.directory.heading, body: content.directory.body, note: content.directory.note,
        items: content.partners.map((item) => `${item.name}|${item.focus}`).join('\n'),
      })],
      afterSolutions: [migratedBlock('partners-clients', 'logo_grid', {
        kicker: content.clientsHead.kicker, heading: content.clientsHead.heading, body: content.clientsHead.body,
        items: content.clients.map((item) => `${item.name}|${item.logo}|${item.logoClass}`).join('\n'),
      })],
      afterServices: [migratedBlock('partners-method', 'method_list', {
        kicker: 'More than product selection', heading: 'The value is in the connection.',
        items: 'Context first|Start with the workload, risk, and operating reality—not a catalogue.\nIntegrated design|Bring the right technologies into an architecture that makes sense together.\nLocal stewardship|Stay close through implementation, operational handover, and ongoing support.',
      })],
      beforeContact: [],
      afterContent: [migratedBlock('partners-contact', 'partner_contact', {
        eyebrow: 'Find the right fit', heading: 'Let’s match the technology to the work ahead.',
        body: 'Bring us the challenge. We will help you turn it into an integrated, practical next step.', ctaLabel: 'Start a conversation', ctaHref: '/#contact',
      })],
    },
  };
}

function navFromDoc(data: Record<string, unknown> | null): NavItem[] | null {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;
  const items = (data.items as Array<Record<string, unknown>>)
    .filter((i) => i && typeof i.label === 'string' && typeof i.href === 'string' && i.enabled !== false)
    .map((i, index) => ({
      id: typeof i.id === 'string' && i.id ? i.id : `nav-${index}`,
      label: i.label as string,
      href: i.href as string,
      enabled: true,
    }));
  return items.length ? items : null;
}

function siteFromDoc(data: Record<string, unknown> | null): Partial<HomeContent['site'] & HomeContent['footer']> {
  if (!data) return {};
  return {
    phone: typeof data.phone === 'string' && data.phone ? data.phone : undefined,
    phoneHref: typeof data.phoneHref === 'string' && data.phoneHref ? data.phoneHref : undefined,
    address: typeof data.address === 'string' && data.address ? data.address : undefined,
    addressUrl: typeof data.addressUrl === 'string' && data.addressUrl ? data.addressUrl : undefined,
    logo: typeof data.logo === 'string' && data.logo ? data.logo : undefined,
    copyright: typeof data.copyright === 'string' && data.copyright ? data.copyright : undefined,
  };
}

export async function loadHomeContent(): Promise<HomeContent> {
  const content: HomeContent = structuredClone(DEFAULT_HOME);
  try {
    const [settings, nav, builder] =
      await Promise.all([
        fetchPublishedDoc('site_settings', 'global'),
        fetchPublishedDoc('navigation', 'main'),
        fetchPublishedDoc('builder_page', 'home'),
      ]);

    if (builder) {
      const managedPage = normaliseBuilderPage(builder);
      if (hasBuilderContent(managedPage)) content.builder = managedPage;
    }

    const navItems = navFromDoc(nav);
    if (navItems) content.navItems = navItems;
    if (nav) {
      content.headerCta = {
        label: str(nav.ctaLabel, content.headerCta.label),
        href: str(nav.ctaHref, content.headerCta.href),
      };
    }

    const { copyright, ...site } = siteFromDoc(settings);
    content.design = designSystemFromDoc(settings?.design);
    content.site = { ...content.site, ...Object.fromEntries(Object.entries(site).filter(([, v]) => v !== undefined)) };
    content.footer = { ...content.footer, address: content.site.address, copyright: copyright ?? content.footer.copyright };
  } catch {
    // Fall back to defaults; the page must never break.
  }
  // The fallback exists only for an unavailable CMS. Published CMS page data
  // always wins above; the public renderer never composes the former JSX page.
  content.builder ??= createHomeBuilderPage(content);
  return content;
}

export async function loadPartnersContent(): Promise<PartnersContent> {
  const content: PartnersContent = structuredClone(DEFAULT_PARTNERS);
  try {
    const [settings, nav, builder] = await Promise.all([
      fetchPublishedDoc('site_settings', 'global'),
      fetchPublishedDoc('navigation', 'main'),
      fetchPublishedDoc('builder_page', 'partners'),
    ]);
    if (builder) {
      const managedPage = normaliseBuilderPage(builder);
      if (hasBuilderContent(managedPage)) content.builder = managedPage;
    }
    const navItems = navFromDoc(nav);
    if (navItems) content.navItems = navItems;
    if (nav) {
      content.headerCta = {
        label: str(nav.ctaLabel, content.headerCta.label),
        href: str(nav.ctaHref, content.headerCta.href),
      };
    }
    const { copyright, ...site } = siteFromDoc(settings);
    content.design = designSystemFromDoc(settings?.design);
    content.site = { ...content.site, ...Object.fromEntries(Object.entries(site).filter(([, value]) => value !== undefined)) };
    content.footer = { ...content.footer, address: content.site.address, copyright: copyright ?? content.footer.copyright };
  } catch {
    // Fall back to defaults.
  }
  content.builder ??= createPartnersBuilderPage(content);
  return content;
}
