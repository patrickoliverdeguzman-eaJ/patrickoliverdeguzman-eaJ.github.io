export const BUILDER_NODE_TYPES = [
  'section',
  'container',
  'row',
  'columns',
  'column',
  'grid',
  'card',
  'heading',
  'text',
  'rich_text',
  'image',
  'video',
  'icon',
  'button',
  'link',
  'list',
  'divider',
  'spacer',
  'badge',
  'accordion',
  'tabs',
  'modal',
  'alert',
  'tooltip',
  'cta',
  'feature_grid',
  'testimonials',
  'statistics',
  'pricing',
  'faq',
  'site_header',
  'menu',
  'breadcrumb',
  'site_footer',
  'form',
  'input',
  'textarea_field',
  'select_field',
  'checkbox',
  'radio_group',
  'submit',
  'brand_hero',
  'home_intro',
  'split_intro',
  'principle_grid',
  'solution_grid',
  'solution_card',
  'continuity_panel',
  'service_list',
  'service_row',
  'tag_band',
  'contact_panel',
  'partner_directory',
  'logo_grid',
  'method_list',
  'partner_contact',
] as const;

export type BuilderNodeType = (typeof BUILDER_NODE_TYPES)[number];

export const BUILDER_ADVANCED_STYLE_KEYS = [
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap',
  'gridTemplateColumns', 'gridTemplateRows', 'position',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap',
  'customWidth', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
  'backgroundColor', 'backgroundImage', 'backgroundGradient', 'color',
  'borderStyle', 'borderWidth', 'borderColor', 'borderRadius', 'boxShadow', 'opacity',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textAlign', 'textTransform',
] as const;

export type BuilderAdvancedStyleKey = (typeof BUILDER_ADVANCED_STYLE_KEYS)[number];
export type BuilderAdvancedStyles = Partial<Record<BuilderAdvancedStyleKey, string>>;
export type BuilderSlot =
  | 'afterHero'
  | 'afterApproach'
  | 'afterSolutions'
  | 'afterServices'
  | 'beforeContact'
  | 'afterContent';

export type BuilderNode = {
  id: string;
  /** Stable sibling order persisted with the CMS document. Arrays remain the
   * transport shape, while sortIndex makes ordering explicit and auditable. */
  sortIndex: number;
  type: BuilderNodeType;
  props: Record<string, string | number | boolean>;
  styles: {
    tone: 'default' | 'muted' | 'brand' | 'gradient';
    padding: 'inherit' | 'compact' | 'regular' | 'spacious';
    align: 'inherit' | 'left' | 'center' | 'right';
    width: 'inherit' | 'content' | 'wide' | 'full';
    radius: 'none' | 'sm' | 'md' | 'lg';
    border: 'none' | 'soft' | 'strong';
    shadow: 'none' | 'soft' | 'lifted';
    gap: 'inherit' | 'compact' | 'regular' | 'spacious';
    motion: 'none' | 'reveal' | 'float';
    hover: 'none' | 'lift';
    advanced: BuilderAdvancedStyles;
    customClass: string;
    elementId: string;
  };
  responsive: {
    visibility: 'all' | 'desktop' | 'mobile';
    tabletColumns: 'inherit' | 1 | 2 | 3 | 4;
    mobileColumns: 'inherit' | 1 | 2 | 3 | 4;
    tabletAlign: 'inherit' | 'left' | 'center' | 'right';
    mobileAlign: 'inherit' | 'left' | 'center' | 'right';
    tabletPadding: 'inherit' | 'compact' | 'regular' | 'spacious';
    mobilePadding: 'inherit' | 'compact' | 'regular' | 'spacious';
    tablet: BuilderAdvancedStyles;
    mobile: BuilderAdvancedStyles;
  };
  children: BuilderNode[];
};

export type BuilderPage = {
  version: 1;
  slots: Record<BuilderSlot, BuilderNode[]>;
  settings: {
    seoTitle: string;
    seoDescription: string;
    socialImage: string;
    hideDefaultHeader: boolean;
    hideDefaultFooter: boolean;
  };
  /** Page-specific CSS is intentionally separate from global design tokens.
   * It is useful when faithfully recreating an existing page treatment. */
  customCss: string;
};

export const MAX_PAGE_CSS_LENGTH = 80_000;

export const BUILDER_SLOTS: Array<{ id: BuilderSlot; label: string }> = [
  { id: 'afterHero', label: 'Below hero' },
  { id: 'afterApproach', label: 'After INFOStorage difference' },
  { id: 'afterSolutions', label: 'After solutions' },
  { id: 'afterServices', label: 'After services' },
  { id: 'beforeContact', label: 'Before contact' },
  { id: 'afterContent', label: 'At page end' },
];

const defaultStyles: BuilderNode['styles'] = {
  tone: 'default',
  padding: 'regular',
  align: 'left',
  width: 'content',
  radius: 'none',
  border: 'none',
  shadow: 'none',
  gap: 'regular',
  motion: 'none',
  hover: 'none',
  advanced: {},
  customClass: '',
  elementId: '',
};

// Branded composition blocks own their internal reading width and visual
// framing. Their outer surface must therefore always occupy the viewport;
// otherwise a missing legacy `styles.width` value makes the section inherit
// the generic 1120px content limit and exposes blank space at desktop sizes.
const fullBleedBlockTypes = new Set<BuilderNodeType>([
  'site_header',
  'site_footer',
  'cta',
  'brand_hero',
  'home_intro',
  'split_intro',
  'principle_grid',
  'solution_grid',
  'continuity_panel',
  'service_list',
  'tag_band',
  'contact_panel',
  'partner_directory',
  'logo_grid',
  'method_list',
  'partner_contact',
]);

function defaultWidthForNode(type: BuilderNodeType): BuilderNode['styles']['width'] {
  return fullBleedBlockTypes.has(type) ? 'full' : 'content';
}

const defaultResponsive: BuilderNode['responsive'] = {
  visibility: 'all',
  tabletColumns: 'inherit',
  mobileColumns: 'inherit',
  tabletAlign: 'inherit',
  mobileAlign: 'inherit',
  tabletPadding: 'inherit',
  mobilePadding: 'inherit',
  tablet: {},
  mobile: {},
};

export const BUILDER_CONTAINER_NODE_TYPES = new Set<BuilderNodeType>([
  'section', 'container', 'row', 'columns', 'column', 'grid', 'card', 'form',
  'site_header', 'site_footer', 'solution_grid', 'service_list',
]);

export function canContainBuilderChildren(type: BuilderNodeType): boolean {
  return BUILDER_CONTAINER_NODE_TYPES.has(type);
}

export type BuilderInsertLocation = {
  slot: BuilderSlot;
  parentId?: string | null;
  index: number;
};

const defaultSlots = (): Record<BuilderSlot, BuilderNode[]> => ({
  afterHero: [],
  afterApproach: [],
  afterSolutions: [],
  afterServices: [],
  beforeContact: [],
  afterContent: [],
});

function id(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

export function emptyBuilderPage(): BuilderPage {
  return { version: 1, slots: defaultSlots(), settings: { seoTitle: '', seoDescription: '', socialImage: '', hideDefaultHeader: false, hideDefaultFooter: false }, customCss: '' };
}

function readableBriefTitle(brief: string): string {
  const cleaned = brief
    .replace(/^\s*(create|make|build|generate)\s+(an?\s+)?/i, '')
    .replace(/\b(page|website|landing page)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!]+$/, '');
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 90) : 'A clear next step';
}

/** Produces an editable, design-system-matched page blueprint. It uses only
 * the same structured blocks that the visual editor and public renderer use. */
export function createPageFromBrief(brief: string): BuilderPage {
  const page = emptyBuilderPage();
  const title = readableBriefTitle(brief);
  const hero = createBuilderNode('brand_hero');
  hero.props = {
    ...hero.props,
    title,
    accent: 'made practical.',
    body: 'Use this editable starting point to explain the value, audience, and next step for this page.',
  };
  page.slots.afterHero = [createBuilderNode('site_header'), hero];

  const partnerFocused = /partner|ecosystem|alliance|vendor/i.test(brief);
  const serviceFocused = /service|support|managed|consult/i.test(brief);
  if (partnerFocused) {
    page.slots.afterApproach = [createBuilderNode('partner_directory')];
    page.slots.afterSolutions = [createBuilderNode('logo_grid')];
    page.slots.afterServices = [createBuilderNode('method_list')];
  } else {
    page.slots.afterApproach = [createBuilderNode('split_intro'), createBuilderNode('principle_grid')];
    page.slots.afterSolutions = [createBuilderNode('solution_grid')];
    page.slots.afterServices = [serviceFocused ? createBuilderNode('service_list') : createBuilderNode('tag_band')];
  }
  page.slots.afterContent = [createBuilderNode('contact_panel'), createBuilderNode('site_footer')];
  return reindexBuilderPage(page);
}

export function createBuilderNode(type: BuilderNodeType): BuilderNode {
  const node: BuilderNode = {
    id: id(),
    sortIndex: 0,
    type,
    props: {},
    styles: { ...defaultStyles, width: defaultWidthForNode(type) },
    responsive: { ...defaultResponsive },
    children: [],
  };

  switch (type) {
    case 'site_header':
      node.props = {
        useGlobal: true,
        logo: '',
        mobileLogo: '',
        logoAlt: 'INFOStorage Corporation',
        logoWidth: '52px',
        mobileLogoWidth: '46px',
        logoAlignment: 'left',
        logoSpacing: '0',
        links: '',
        ctaLabel: '',
        ctaHref: '',
      };
      node.styles = { ...defaultStyles, padding: 'inherit', width: 'full', advanced: {}, customClass: '', elementId: '' };
      break;
    case 'site_footer':
      node.props = {
        useGlobal: true,
        logo: '',
        logoAlt: 'INFOStorage Corporation',
        address: '',
        copyright: '',
        links: '',
      };
      node.styles = { ...defaultStyles, tone: 'brand', padding: 'inherit', width: 'full', advanced: {}, customClass: '', elementId: '' };
      break;
    case 'heading':
      node.props = { text: 'A clear new heading', level: 2 };
      break;
    case 'text':
      node.props = {
        text: 'Add supporting copy that explains the value here.',
      };
      break;
    case 'rich_text':
      node.props = {
        text: 'Add a rich text introduction.\n\nStart a new paragraph on a blank line.',
      };
      break;
    case 'image':
      node.props = { src: '', alt: 'Descriptive image', title: '', caption: '' };
      break;
    case 'video':
      node.props = { src: '', title: 'Video', poster: '', controls: true };
      break;
    case 'icon':
      node.props = { name: 'database', label: 'Database', size: 36 };
      break;
    case 'button':
      node.props = {
        label: 'Learn more',
        href: '#contact',
        variant: 'primary',
      };
      break;
    case 'link':
      node.props = { label: 'Learn more', href: '#content', external: false };
      break;
    case 'list':
      node.props = { items: 'First list item\nSecond list item\nThird list item', ordered: false };
      break;
    case 'row':
      node.props = { label: 'New row' };
      node.styles = { ...defaultStyles, width: 'content', advanced: { display: 'flex', flexWrap: 'wrap' }, customClass: '', elementId: '' };
      break;
    case 'columns':
      node.props = { columns: 2 };
      node.children = [
        createBuilderNode('column'),
        createBuilderNode('column'),
      ];
      break;
    case 'grid':
      node.props = { columns: 3, label: 'New grid' };
      node.styles = { ...defaultStyles, width: 'content', advanced: {}, customClass: '', elementId: '' };
      break;
    case 'badge':
      node.props = { text: 'Badge' };
      break;
    case 'accordion':
      node.props = { items: 'What does this include?|Add the answer here.\nCan I customise it?|Yes. Edit every item in the CMS.' };
      break;
    case 'tabs':
      node.props = { items: 'Overview|Add the overview content here.\nDetails|Add supporting details here.' };
      break;
    case 'modal':
      node.props = { triggerLabel: 'Open details', title: 'More information', body: 'Add the modal content here.' };
      break;
    case 'alert':
      node.props = { title: 'Important update', body: 'Add a clear, useful message here.', variant: 'info' };
      break;
    case 'tooltip':
      node.props = { label: 'More information', tip: 'Add a short explanation.' };
      break;
    case 'cta':
      node.props = { eyebrow: 'Next step', heading: 'Ready to move forward?', body: 'Give visitors a clear reason to take the next action.', primaryLabel: 'Start a conversation', primaryHref: '#contact', secondaryLabel: '', secondaryHref: '' };
      node.styles = { ...defaultStyles, tone: 'gradient', padding: 'spacious', width: 'full', advanced: {}, customClass: '', elementId: '' };
      break;
    case 'feature_grid':
      node.props = { kicker: 'What you get', heading: 'Built for practical outcomes.', body: 'Present the strongest benefits in a flexible card grid.', items: 'Reliable|Explain the first benefit.\nFlexible|Explain the second benefit.\nSupported|Explain the third benefit.' };
      break;
    case 'testimonials':
      node.props = { kicker: 'Client perspective', heading: 'Trusted in demanding environments.', items: 'Add a concise customer quote.|Client name|Role or company' };
      break;
    case 'statistics':
      node.props = { kicker: 'At a glance', heading: 'Results that are easy to understand.', items: '24/7|Support availability\n99.9%|Target availability\n20+|Years of experience' };
      break;
    case 'pricing':
      node.props = { kicker: 'Options', heading: 'Choose the right starting point.', items: 'Essential|Contact us|Core discovery;Recommended architecture|Talk to us\nAdvanced|Custom quote|Detailed planning;Implementation support|Request quote' };
      break;
    case 'faq':
      node.props = { kicker: 'Frequently asked questions', heading: 'What teams usually ask.', items: 'How do we begin?|Start with a short discovery conversation.\nCan this be customised?|Yes. The solution is shaped around your environment.' };
      break;
    case 'menu':
      node.props = { label: 'Menu', items: 'Home|/\nPartners|/partners' };
      break;
    case 'breadcrumb':
      node.props = { items: 'Home|/\nCurrent page|' };
      break;
    case 'form':
      node.props = { title: 'Contact form', action: '', method: 'post', successMessage: 'Thank you. Your message has been received.' };
      node.children = [createBuilderNode('input'), createBuilderNode('textarea_field'), createBuilderNode('submit')];
      break;
    case 'input':
      node.props = { label: 'Name', name: 'name', placeholder: 'Your name', inputType: 'text', required: true };
      break;
    case 'textarea_field':
      node.props = { label: 'Message', name: 'message', placeholder: 'How can we help?', required: true, rows: 5 };
      break;
    case 'select_field':
      node.props = { label: 'Choose an option', name: 'option', options: 'Option one\nOption two', required: false };
      break;
    case 'checkbox':
      node.props = { label: 'I agree', name: 'agreement', required: false };
      break;
    case 'radio_group':
      node.props = { label: 'Choose one', name: 'choice', options: 'Option one\nOption two', required: false };
      break;
    case 'submit':
      node.props = { label: 'Submit' };
      break;
    case 'spacer':
      node.props = { size: 'regular' };
      break;
    case 'divider':
      node.props = { label: '' };
      break;
    case 'section':
      node.props = { label: 'New section' };
      break;
    case 'card':
      node.props = { label: 'Content card' };
      break;
    case 'brand_hero':
      node.props = {
        variant: 'home',
        eyebrow: 'Premium solutions integrator',
        title: 'Enterprise-class solutions for',
        accent: 'what comes next.',
        body: 'Introduce the value this page delivers and the work it helps people do.',
        primaryLabel: 'Explore solutions',
        primaryHref: '#content',
        secondaryLabel: 'Talk to an expert',
        secondaryHref: '#contact',
        logo: '/infostorage-logo.png',
        capabilities: 'Systems & platforms\nNetwork & security\nData protection\nIVAS',
      };
      node.styles = { ...defaultStyles, tone: 'gradient', padding: 'spacious', width: 'full', motion: 'reveal' };
      break;
    case 'home_intro':
      node.props = {
        kicker: 'The INFOStorage difference',
        heading: 'Manage your data',
        accent: 'more efficiently.',
        body: 'Use the established editorial introduction and principle grid for a concise positioning statement.',
        linkLabel: 'Explore IVAS',
        linkHref: '#services',
        items: 'Specialized|Focused expertise across a chosen set of enterprise IT solutions.\nRecognized|A commitment to deliver on the work we take on with every client.\nRespected|Professional service delivered with integrity from planning through support.',
      };
      break;
    case 'split_intro':
      node.props = {
        kicker: 'The INFOStorage difference',
        heading: 'Make the next decision',
        accent: 'with confidence.',
        body: 'Use the established split editorial layout for a concise positioning statement and supporting copy.',
        linkLabel: 'Explore more',
        linkHref: '#content',
      };
      node.styles = { ...defaultStyles, padding: 'spacious', width: 'full' };
      break;
    case 'principle_grid':
      node.props = {
        items: 'Specialized|Focused expertise for the work at hand.\nRecognized|Delivery that follows through.\nRespected|Professional stewardship from planning to support.',
      };
      node.styles = { ...defaultStyles, width: 'full', gap: 'spacious' };
      break;
    case 'solution_grid':
      node.props = {
        kicker: 'Our solutions',
        heading: 'A complete foundation for data computing.',
        body: 'Use the established feature-card grid to frame a connected set of solutions.',
      };
      node.children = [
        ['Systems & platforms', 'Integrated systems built around the workload.', 'Enterprise storage;Virtualization'],
        ['Network & security', 'A secure and reliable network foundation.', 'Cybersecurity;Compliance'],
        ['Data protection', 'Protection strategies aligned to risk.', 'Backup;Disaster recovery'],
        ['Mobile & peripherals', 'Workplace technology that fits the wider environment.', 'Computing;Peripherals'],
      ].map(([title, body, features], sortIndex) => ({ ...createBuilderNode('solution_card'), sortIndex, props: { title, body, features, href: '#contact' } }));
      node.styles = { ...defaultStyles, tone: 'muted', padding: 'spacious', width: 'full', hover: 'lift' } as BuilderNode['styles'];
      break;
    case 'solution_card':
      node.props = { title: 'New solution', body: 'Describe this solution.', features: 'Feature one;Feature two', href: '#contact' };
      node.styles = { ...defaultStyles, width: 'full', hover: 'lift' } as BuilderNode['styles'];
      break;
    case 'continuity_panel':
      node.props = {
        eyebrow: 'Data protection',
        heading: 'Protect the information your operations depend on.',
        body: 'Use the existing continuity panel with its branded visual system for a focused technology or service story.',
        ctaLabel: 'Start a conversation',
        ctaHref: '#contact',
      };
      node.styles = { ...defaultStyles, tone: 'brand', padding: 'spacious', width: 'full', motion: 'float' };
      break;
    case 'service_list':
      node.props = {
        kicker: 'Value added services',
        heading: 'Services that keep technology working in practice.',
        body: 'Use service rows for a concise, scannable list of capabilities.',
        href: '#contact',
      };
      node.children = [
        'Hardware installation and support',
        'Helpdesk',
        'Consulting and implementation',
        'Project management and integration',
      ].map((text, sortIndex) => ({ ...createBuilderNode('service_row'), sortIndex, props: { text, href: '#contact' } }));
      node.styles = { ...defaultStyles, padding: 'spacious', width: 'full' };
      break;
    case 'service_row':
      node.props = { text: 'New service', href: '#contact' };
      node.styles = { ...defaultStyles, width: 'full' };
      break;
    case 'tag_band':
      node.props = {
        kicker: 'Built across industries',
        heading: 'Trusted where the work matters most.',
        tags: 'Financial services\nTelecommunications\nUtilities\nGovernment',
      };
      node.styles = { ...defaultStyles, tone: 'muted', padding: 'regular', width: 'full' };
      break;
    case 'contact_panel':
      node.props = {
        eyebrow: 'Contact INFOStorage',
        heading: 'Give your business what it needs to grow.',
        body: 'Use the established contact call-to-action treatment to turn interest into a next step.',
        primaryLabel: 'Start a conversation',
        primaryHref: '#contact',
        secondaryLabel: 'Email us',
        secondaryHref: 'mailto:',
      };
      node.styles = { ...defaultStyles, tone: 'gradient', padding: 'spacious', width: 'full', motion: 'float' };
      break;
    case 'partner_directory':
      node.props = {
        kicker: 'Selected technology partners',
        heading: 'Built around the systems you rely on.',
        body: 'A focused ecosystem of infrastructure, security, cloud, and protection technologies.',
        note: 'Technology availability and solution fit can vary by requirement.',
        items: 'A10 Networks|Application delivery and security\nHitachi Data Systems|Enterprise data infrastructure\nOracle|Cloud and engineered systems\nLenovo|Servers and workplace computing',
      };
      node.styles = { ...defaultStyles, padding: 'spacious', width: 'full', hover: 'lift' } as BuilderNode['styles'];
      break;
    case 'logo_grid':
      node.props = {
        kicker: 'Valued clients',
        heading: 'Trusted where the work matters most.',
        body: 'A selection of organisations that have chosen INFOStorage.',
        items: 'Client name|/infostorage-logo.png\nClient name|/infostorage-logo.png\nClient name|/infostorage-logo.png\nClient name|/infostorage-logo.png',
      };
      node.styles = { ...defaultStyles, tone: 'gradient', padding: 'spacious', width: 'full' };
      break;
    case 'method_list':
      node.props = {
        kicker: 'More than product selection',
        heading: 'The value is in the connection.',
        items: 'Context first|Start with the workload, risk, and operating reality.\nIntegrated design|Bring the right technologies into one architecture.\nLocal stewardship|Stay close through implementation and handover.',
      };
      node.styles = { ...defaultStyles, tone: 'muted', padding: 'spacious', width: 'full' };
      break;
    case 'partner_contact':
      node.props = {
        eyebrow: 'Find the right fit',
        heading: 'Let’s match the technology to the work ahead.',
        body: 'Bring us the challenge. We will help you turn it into an integrated, practical next step.',
        ctaLabel: 'Start a conversation',
        ctaHref: '/#contact',
      };
      node.styles = { ...defaultStyles, tone: 'brand', padding: 'spacious', width: 'full' };
      break;
  }
  return node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, fallback = '', max = 2_000): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

/** CSS is page data, not markup. Disallow style tags so a draft cannot escape
 * its own style element while it is being previewed in the CMS. */
export function normalisePageCss(value: unknown): string {
  if (typeof value !== 'string') return '';
  const css = value.slice(0, MAX_PAGE_CSS_LENGTH).trim();
  return /<\s*\/?\s*style\b/i.test(css) ? '' : css;
}

function safeChoice<T extends string | number>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
): T {
  return (typeof value === 'string' || typeof value === 'number') &&
    (choices as readonly (string | number)[]).includes(value)
    ? (value as T)
    : fallback;
}

function safeProps(value: unknown): BuilderNode['props'] {
  if (!isRecord(value)) return {};
  const result: BuilderNode['props'] = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    if (typeof item === 'string') result[key] = item.slice(0, 10_000);
    else if (typeof item === 'number' && Number.isFinite(item))
      result[key] = item;
    else if (typeof item === 'boolean') result[key] = item;
  }
  return result;
}

function safeAdvancedStyles(value: unknown): BuilderAdvancedStyles {
  if (!isRecord(value)) return {};
  const result: BuilderAdvancedStyles = {};
  for (const key of BUILDER_ADVANCED_STYLE_KEYS) {
    const item = value[key];
    if (typeof item !== 'string') continue;
    const cleaned = item.trim().slice(0, 240);
    // These values become React style values or scoped media-query declarations.
    // Keep them declaration-only so braces, semicolons, and markup cannot escape.
    if (cleaned && !/[{};<>]/.test(cleaned)) result[key] = cleaned;
  }
  return result;
}

function safeClassName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.split(/\s+/).filter((item) => /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(item)).slice(0, 8).join(' ');
}

function safeElementId(value: unknown): string {
  return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value.trim()) ? value.trim() : '';
}

function nextUniqueId(knownIds: Set<string>): string {
  let nextId = id();
  while (knownIds.has(nextId)) nextId = id();
  return nextId;
}

function orderedRawNodes(values: unknown[]): unknown[] {
  return values
    .map((value, index) => ({
      value,
      index,
      order: isRecord(value) && Number.isInteger(value.sortIndex) && (value.sortIndex as number) >= 0
        ? value.sortIndex as number
        : index,
    }))
    .sort((left, right) => left.order - right.order || left.index - right.index)
    .map(({ value }) => value);
}

function normaliseNode(
  value: unknown,
  depth = 0,
  knownIds = new Set<string>(),
  sortIndex = 0,
): BuilderNode | null {
  if (!isRecord(value) || depth > 8) return null;
  const type = safeChoice(value.type, BUILDER_NODE_TYPES, 'text');
  const suppliedId = safeText(value.id, '', 80);
  const nodeId = suppliedId && !knownIds.has(suppliedId)
    ? suppliedId
    : nextUniqueId(knownIds);
  knownIds.add(nodeId);
  const props = safeProps(value.props);
  let rawChildren: unknown[] = Array.isArray(value.children) ? value.children : [];
  // Upgrade the two original repeaters to first-class child blocks. Their IDs
  // are deterministic until the upgraded page is saved, so selection and drag
  // state remain stable even when loading an older document.
  if (!rawChildren.length && typeof props.items === 'string' && (type === 'solution_grid' || type === 'service_list')) {
    const legacyRows = props.items.replaceAll('\\n', '\n').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 24);
    rawChildren = legacyRows.map((line, index) => {
      const childType: BuilderNodeType = type === 'solution_grid' ? 'solution_card' : 'service_row';
      const child = createBuilderNode(childType);
      child.id = `${nodeId.slice(0, 58)}-${type === 'solution_grid' ? 'solution' : 'service'}-${index}`;
      child.sortIndex = index;
      if (childType === 'solution_card') {
        const [title = '', body = '', features = ''] = line.split('|').map((part) => part.trim());
        child.props = { title, body, features, href: '#contact' };
      } else {
        child.props = { text: line, href: typeof props.href === 'string' ? props.href : '#contact' };
      }
      return child;
    });
  }
  const children = orderedRawNodes(rawChildren)
    .slice(0, 30)
    .map((child, index) => normaliseNode(child, depth + 1, knownIds, index))
    .filter((child): child is BuilderNode => Boolean(child));
  return {
    id: nodeId,
    sortIndex,
    type,
    props,
    styles: {
      tone: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.tone : undefined,
        ['default', 'muted', 'brand', 'gradient'] as const,
        'default',
      ),
      padding: safeChoice(
        value.styles && isRecord(value.styles)
          ? value.styles.padding
          : undefined,
        ['inherit', 'compact', 'regular', 'spacious'] as const,
        'regular',
      ),
      align: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.align : undefined,
        ['inherit', 'left', 'center', 'right'] as const,
        'left',
      ),
      width: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.width : undefined,
        ['inherit', 'content', 'wide', 'full'] as const,
        defaultWidthForNode(type),
      ),
      radius: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.radius : undefined,
        ['none', 'sm', 'md', 'lg'] as const,
        'none',
      ),
      border: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.border : undefined,
        ['none', 'soft', 'strong'] as const,
        'none',
      ),
      shadow: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.shadow : undefined,
        ['none', 'soft', 'lifted'] as const,
        'none',
      ),
      gap: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.gap : undefined,
        ['inherit', 'compact', 'regular', 'spacious'] as const,
        'regular',
      ),
      motion: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.motion : undefined,
        ['none', 'reveal', 'float'] as const,
        'none',
      ),
      hover: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.hover : undefined,
        ['none', 'lift'] as const,
        'none',
      ),
      advanced: safeAdvancedStyles(
        value.styles && isRecord(value.styles) ? value.styles.advanced : undefined,
      ),
      customClass: safeClassName(
        value.styles && isRecord(value.styles) ? value.styles.customClass : undefined,
      ),
      elementId: safeElementId(
        value.styles && isRecord(value.styles) ? value.styles.elementId : undefined,
      ),
    },
    responsive: {
      visibility: safeChoice(
        value.responsive && isRecord(value.responsive)
          ? value.responsive.visibility
          : undefined,
        ['all', 'desktop', 'mobile'] as const,
        'all',
      ),
      tabletColumns: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.tabletColumns : undefined,
        ['inherit', 1, 2, 3, 4] as const,
        'inherit',
      ),
      mobileColumns: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.mobileColumns : undefined,
        ['inherit', 1, 2, 3, 4] as const,
        'inherit',
      ),
      tabletAlign: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.tabletAlign : undefined,
        ['inherit', 'left', 'center', 'right'] as const,
        'inherit',
      ),
      mobileAlign: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.mobileAlign : undefined,
        ['inherit', 'left', 'center', 'right'] as const,
        'inherit',
      ),
      tabletPadding: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.tabletPadding : undefined,
        ['inherit', 'compact', 'regular', 'spacious'] as const,
        'inherit',
      ),
      mobilePadding: safeChoice(
        value.responsive && isRecord(value.responsive) ? value.responsive.mobilePadding : undefined,
        ['inherit', 'compact', 'regular', 'spacious'] as const,
        'inherit',
      ),
      tablet: safeAdvancedStyles(
        value.responsive && isRecord(value.responsive) ? value.responsive.tablet : undefined,
      ),
      mobile: safeAdvancedStyles(
        value.responsive && isRecord(value.responsive) ? value.responsive.mobile : undefined,
      ),
    },
    children,
  };
}

export function normaliseBuilderPage(value: unknown): BuilderPage {
  const page = emptyBuilderPage();
  if (!isRecord(value) || !isRecord(value.slots)) return page;
  page.customCss = normalisePageCss(value.customCss);
  const settings = isRecord(value.settings) ? value.settings : {};
  page.settings = {
    seoTitle: safeText(settings.seoTitle, '', 160),
    seoDescription: safeText(settings.seoDescription, '', 320),
    socialImage: safeText(settings.socialImage, '', 2_000),
    hideDefaultHeader: settings.hideDefaultHeader === true,
    hideDefaultFooter: settings.hideDefaultFooter === true,
  };
  const knownIds = new Set<string>();
  for (const slot of BUILDER_SLOTS) {
    const rawNodes = value.slots[slot.id];
    if (!Array.isArray(rawNodes)) continue;
    page.slots[slot.id] = orderedRawNodes(rawNodes)
      .slice(0, 30)
      .map((node, index) => normaliseNode(node, 0, knownIds, index))
      .filter((node): node is BuilderNode => Boolean(node));
  }
  return page;
}

export function hasBuilderContent(
  page: BuilderPage | undefined,
  slot?: BuilderSlot,
): boolean {
  if (!page) return false;
  if (slot) return page.slots[slot].length > 0;
  return BUILDER_SLOTS.some(({ id: slotId }) => page.slots[slotId].length > 0);
}

export function hasBuilderNodeType(page: BuilderPage | undefined, type: BuilderNodeType): boolean {
  if (!page) return false;
  const visit = (nodes: BuilderNode[]): boolean => nodes.some((node) => node.type === type || visit(node.children));
  return BUILDER_SLOTS.some(({ id: slot }) => visit(page.slots[slot]));
}

export function updateBuilderNode(
  page: BuilderPage,
  nodeId: string,
  change: (node: BuilderNode) => BuilderNode,
): BuilderPage {
  const update = (nodes: BuilderNode[]): BuilderNode[] =>
    nodes.map((node) =>
      node.id === nodeId
        ? change(node)
        : { ...node, children: update(node.children) },
    );
  return {
    ...page,
    slots: Object.fromEntries(
      BUILDER_SLOTS.map(({ id: slot }) => [slot, update(page.slots[slot])]),
    ) as BuilderPage['slots'],
  };
}

export function findBuilderNode(
  page: BuilderPage,
  nodeId: string,
): BuilderNode | undefined {
  const visit = (nodes: BuilderNode[]): BuilderNode | undefined => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      const child = visit(node.children);
      if (child) return child;
    }
  };
  for (const { id: slot } of BUILDER_SLOTS) {
    const found = visit(page.slots[slot]);
    if (found) return found;
  }
}

export function appendBuilderNode(
  page: BuilderPage,
  slot: BuilderSlot,
  node: BuilderNode,
  parentId?: string | null,
): BuilderPage {
  const parent = parentId ? findBuilderNode(page, parentId) : undefined;
  const index = parent && canContainBuilderChildren(parent.type)
    ? parent.children.length
    : page.slots[slot].length;
  return insertBuilderNodeAtLocation(page, node, {
    slot,
    parentId: parent && canContainBuilderChildren(parent.type) ? parentId : null,
    index,
  });
}

function reindexNodes(nodes: BuilderNode[]): BuilderNode[] {
  return nodes.map((node, index) => ({
    ...node,
    sortIndex: index,
    children: reindexNodes(node.children),
  }));
}

/** Keeps every sibling array and its persisted sortIndex values in lockstep. */
export function reindexBuilderPage(page: BuilderPage): BuilderPage {
  return {
    ...page,
    slots: Object.fromEntries(
      BUILDER_SLOTS.map(({ id: slot }) => [slot, reindexNodes(page.slots[slot])]),
    ) as BuilderPage['slots'],
  };
}

function insertIntoLocation(
  page: BuilderPage,
  node: BuilderNode,
  location: BuilderInsertLocation,
): BuilderPage | null {
  if (!canInsertBuilderNodeAtLocation(page, node.type, location)) return null;
  if (!location.parentId) {
    const siblings = page.slots[location.slot];
    if (!siblings) return null;
    const index = Math.min(Math.max(Math.trunc(location.index), 0), siblings.length);
    return {
      ...page,
      slots: {
        ...page.slots,
        [location.slot]: [...siblings.slice(0, index), node, ...siblings.slice(index)],
      },
    };
  }

  let inserted = false;
  const next = updateBuilderNode(page, location.parentId, (parent) => {
    if (!canContainBuilderChildren(parent.type)) return parent;
    const index = Math.min(Math.max(Math.trunc(location.index), 0), parent.children.length);
    inserted = true;
    return {
      ...parent,
      children: [...parent.children.slice(0, index), node, ...parent.children.slice(index)],
    };
  });
  return inserted ? next : null;
}

/** Instantiate a new library/template block at an exact visual insertion zone. */
export function insertBuilderNodeAtLocation(
  page: BuilderPage,
  node: BuilderNode,
  location: BuilderInsertLocation,
): BuilderPage {
  const inserted = insertIntoLocation(page, node, location);
  return inserted ? reindexBuilderPage(inserted) : page;
}

export function removeBuilderNode(
  page: BuilderPage,
  nodeId: string,
): { page: BuilderPage; removed?: BuilderNode } {
  let removed: BuilderNode | undefined;
  const remove = (nodes: BuilderNode[]): BuilderNode[] =>
    nodes
      .filter((node) => {
        if (node.id !== nodeId) return true;
        removed = node;
        return false;
      })
      .map((node) => ({ ...node, children: remove(node.children) }));
  const nextPage = {
      ...page,
      slots: Object.fromEntries(
        BUILDER_SLOTS.map(({ id: slot }) => [slot, remove(page.slots[slot])]),
      ) as BuilderPage['slots'],
  };
  return { page: removed ? reindexBuilderPage(nextPage) : page, removed };
}

export function duplicateBuilderNode(
  page: BuilderPage,
  nodeId: string,
): BuilderPage {
  const source = findBuilderNode(page, nodeId);
  if (!source) return page;
  const duplicated = cloneBuilderNode(source);
  let inserted = false;
  const duplicate = (nodes: BuilderNode[]): BuilderNode[] => {
    const next: BuilderNode[] = [];
    for (const node of nodes) {
      next.push({ ...node, children: duplicate(node.children) });
      if (node.id === nodeId) {
        next.push(duplicated);
        inserted = true;
      }
    }
    return next;
  };
  const slots = Object.fromEntries(BUILDER_SLOTS.map(({ id: slot }) => [slot, duplicate(page.slots[slot])])) as BuilderPage['slots'];
  return inserted ? reindexBuilderPage({ ...page, slots }) : page;
}

export function cloneBuilderNode(source: BuilderNode): BuilderNode {
  const copy = structuredClone(source);
  const assignIds = (node: BuilderNode): BuilderNode => ({
    ...node,
    id: id(),
    children: node.children.map(assignIds),
  });
  return reindexNodes([assignIds(copy)])[0];
}

/** Move one existing block without cloning it. All content, responsive values,
 * CSS and metadata stay on the same stable id. */
export function moveBuilderNodeToLocation(
  page: BuilderPage,
  nodeId: string,
  location: BuilderInsertLocation,
): BuilderPage {
  const source = findBuilderNode(page, nodeId);
  if (!source || location.parentId === nodeId) return page;

  // Refuse a move into the source subtree. Removing it first makes every one
  // of its descendants disappear from the remaining page tree.
  const { page: withoutSource, removed } = removeBuilderNode(page, nodeId);
  if (!removed) return page;
  if (location.parentId && !findBuilderNode(withoutSource, location.parentId)) return page;

  let index = location.index;
  const sourceLocation = findBuilderNodeLocation(page, nodeId);
  if (
    sourceLocation &&
    sourceLocation.slot === location.slot &&
    (sourceLocation.parentId ?? null) === (location.parentId ?? null) &&
    sourceLocation.index < index
  ) {
    index -= 1;
  }

  const inserted = insertIntoLocation(withoutSource, removed, { ...location, index });
  return inserted ? reindexBuilderPage(inserted) : page;
}

export function findBuilderNodeLocation(
  page: BuilderPage,
  nodeId: string,
): BuilderInsertLocation | undefined {
  const visit = (
    nodes: BuilderNode[],
    slot: BuilderSlot,
    parentId: string | null,
  ): BuilderInsertLocation | undefined => {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (node.id === nodeId) return { slot, parentId, index };
      const nested = visit(node.children, slot, node.id);
      if (nested) return nested;
    }
  };
  for (const { id: slot } of BUILDER_SLOTS) {
    const found = visit(page.slots[slot], slot, null);
    if (found) return found;
  }
}

/** Central placement rule shared by pointer, touch, keyboard and fallback
 * insertion. Nested design items stay in the matching structured section. */
export function canInsertBuilderNodeAtLocation(
  page: BuilderPage,
  type: BuilderNodeType,
  location: BuilderInsertLocation,
): boolean {
  if (!location.parentId) return type !== 'solution_card' && type !== 'service_row';
  const parent = findBuilderNode(page, location.parentId);
  if (!parent || !canContainBuilderChildren(parent.type)) return false;
  if (parent.type === 'solution_grid') return type === 'solution_card';
  if (parent.type === 'service_list') return type === 'service_row';
  return type !== 'solution_card' && type !== 'service_row';
}

/** Move a block before another block in the same page tree. The operation is
 * immutable and refuses a drop into a node that moved with its own subtree. */
export function moveBuilderNode(
  page: BuilderPage,
  nodeId: string,
  targetId: string,
  mode: 'before' | 'inside' = 'before',
): BuilderPage {
  if (nodeId === targetId) return page;
  const sourceLocation = findBuilderNodeLocation(page, nodeId);
  const targetLocation = findBuilderNodeLocation(page, targetId);
  const target = findBuilderNode(page, targetId);
  if (!sourceLocation || !targetLocation || !target) return page;
  if (mode === 'inside' && target && canContainBuilderChildren(target.type)) {
    return moveBuilderNodeToLocation(page, nodeId, {
      slot: targetLocation.slot,
      parentId: targetId,
      index: target.children.length,
    });
  }
  return moveBuilderNodeToLocation(page, nodeId, targetLocation);
}
