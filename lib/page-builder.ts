export const BUILDER_NODE_TYPES = [
  'section',
  'container',
  'columns',
  'column',
  'card',
  'heading',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'brand_hero',
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
] as const;

export type BuilderNodeType = (typeof BUILDER_NODE_TYPES)[number];
export type BuilderSlot =
  | 'afterHero'
  | 'afterApproach'
  | 'afterSolutions'
  | 'afterServices'
  | 'beforeContact'
  | 'afterContent';

export type BuilderNode = {
  id: string;
  type: BuilderNodeType;
  props: Record<string, string | number | boolean>;
  styles: {
    tone: 'default' | 'muted' | 'brand' | 'gradient';
    padding: 'compact' | 'regular' | 'spacious';
    align: 'left' | 'center' | 'right';
    width: 'content' | 'wide' | 'full';
    radius: 'none' | 'sm' | 'md' | 'lg';
    border: 'none' | 'soft' | 'strong';
    shadow: 'none' | 'soft' | 'lifted';
    gap: 'compact' | 'regular' | 'spacious';
    motion: 'none' | 'reveal' | 'float';
    hover: 'none' | 'lift';
  };
  responsive: {
    visibility: 'all' | 'desktop' | 'mobile';
    tabletColumns: 'inherit' | 1 | 2 | 3 | 4;
    mobileColumns: 'inherit' | 1 | 2 | 3 | 4;
    tabletAlign: 'inherit' | 'left' | 'center' | 'right';
    mobileAlign: 'inherit' | 'left' | 'center' | 'right';
    tabletPadding: 'inherit' | 'compact' | 'regular' | 'spacious';
    mobilePadding: 'inherit' | 'compact' | 'regular' | 'spacious';
  };
  children: BuilderNode[];
};

export type BuilderPage = {
  version: 1;
  slots: Record<BuilderSlot, BuilderNode[]>;
};

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
};

const defaultResponsive: BuilderNode['responsive'] = {
  visibility: 'all',
  tabletColumns: 'inherit',
  mobileColumns: 'inherit',
  tabletAlign: 'inherit',
  mobileAlign: 'inherit',
  tabletPadding: 'inherit',
  mobilePadding: 'inherit',
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
  return { version: 1, slots: defaultSlots() };
}

export function createBuilderNode(type: BuilderNodeType): BuilderNode {
  const node: BuilderNode = {
    id: id(),
    type,
    props: {},
    styles: { ...defaultStyles },
    responsive: { ...defaultResponsive },
    children: [],
  };

  switch (type) {
    case 'heading':
      node.props = { text: 'A clear new heading', level: 2 };
      break;
    case 'text':
      node.props = {
        text: 'Add supporting copy that explains the value here.',
      };
      break;
    case 'image':
      node.props = { src: '', alt: 'Descriptive image' };
      break;
    case 'button':
      node.props = {
        label: 'Learn more',
        href: '#contact',
        variant: 'primary',
      };
      break;
    case 'columns':
      node.props = { columns: 2 };
      node.children = [
        createBuilderNode('column'),
        createBuilderNode('column'),
      ];
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
        eyebrow: 'Premium solutions integrator',
        title: 'Enterprise-class solutions for',
        accent: 'what comes next.',
        body: 'Introduce the value this page delivers and the work it helps people do.',
        primaryLabel: 'Explore solutions',
        primaryHref: '#content',
        secondaryLabel: 'Talk to an expert',
        secondaryHref: '#contact',
        logo: '/infostorage-logo.png',
      };
      node.styles = { ...defaultStyles, tone: 'gradient', padding: 'spacious', width: 'full', motion: 'reveal' };
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
      node.styles = { ...defaultStyles, padding: 'spacious', width: 'wide' };
      break;
    case 'principle_grid':
      node.props = {
        items: 'Specialized|Focused expertise for the work at hand.\nRecognized|Delivery that follows through.\nRespected|Professional stewardship from planning to support.',
      };
      node.styles = { ...defaultStyles, width: 'wide', gap: 'spacious' };
      break;
    case 'solution_grid':
      node.props = {
        kicker: 'Our solutions',
        heading: 'A complete foundation for data computing.',
        body: 'Use the established feature-card grid to frame a connected set of solutions.',
        items: 'Systems & platforms|Integrated systems built around the workload.|Enterprise storage;Virtualization\nNetwork & security|A secure and reliable network foundation.|Cybersecurity;Compliance\nData protection|Protection strategies aligned to risk.|Backup;Disaster recovery\nMobile & peripherals|Workplace technology that fits the wider environment.|Computing;Peripherals',
      };
      node.styles = { ...defaultStyles, tone: 'muted', padding: 'spacious', width: 'full', hover: 'lift' } as BuilderNode['styles'];
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
        items: 'Hardware installation and support\nHelpdesk\nConsulting and implementation\nProject management and integration',
        href: '#contact',
      };
      node.styles = { ...defaultStyles, padding: 'spacious', width: 'wide' };
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
      node.styles = { ...defaultStyles, tone: 'muted', padding: 'spacious', width: 'wide' };
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
    if (typeof item === 'string') result[key] = item.slice(0, 2_000);
    else if (typeof item === 'number' && Number.isFinite(item))
      result[key] = item;
    else if (typeof item === 'boolean') result[key] = item;
  }
  return result;
}

function nextUniqueId(knownIds: Set<string>): string {
  let nextId = id();
  while (knownIds.has(nextId)) nextId = id();
  return nextId;
}

function normaliseNode(
  value: unknown,
  depth = 0,
  knownIds = new Set<string>(),
): BuilderNode | null {
  if (!isRecord(value) || depth > 8) return null;
  const type = safeChoice(value.type, BUILDER_NODE_TYPES, 'text');
  const suppliedId = safeText(value.id, '', 80);
  const nodeId = suppliedId && !knownIds.has(suppliedId)
    ? suppliedId
    : nextUniqueId(knownIds);
  knownIds.add(nodeId);
  const rawChildren = Array.isArray(value.children) ? value.children : [];
  const children = rawChildren
    .slice(0, 30)
    .map((child) => normaliseNode(child, depth + 1, knownIds))
    .filter((child): child is BuilderNode => Boolean(child));
  return {
    id: nodeId,
    type,
    props: safeProps(value.props),
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
        ['compact', 'regular', 'spacious'] as const,
        'regular',
      ),
      align: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.align : undefined,
        ['left', 'center', 'right'] as const,
        'left',
      ),
      width: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.width : undefined,
        ['content', 'wide', 'full'] as const,
        'content',
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
        ['compact', 'regular', 'spacious'] as const,
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
    },
    children,
  };
}

export function normaliseBuilderPage(value: unknown): BuilderPage {
  const page = emptyBuilderPage();
  if (!isRecord(value) || !isRecord(value.slots)) return page;
  const knownIds = new Set<string>();
  for (const slot of BUILDER_SLOTS) {
    const rawNodes = value.slots[slot.id];
    if (!Array.isArray(rawNodes)) continue;
    page.slots[slot.id] = rawNodes
      .slice(0, 30)
      .map((node) => normaliseNode(node, 0, knownIds))
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
  if (!parentId) {
    return {
      ...page,
      slots: { ...page.slots, [slot]: [...page.slots[slot], node] },
    };
  }
  let added = false;
  const next = updateBuilderNode(page, parentId, (parent) => {
    if (!['section', 'container', 'columns', 'column', 'card'].includes(parent.type))
      return parent;
    added = true;
    return { ...parent, children: [...parent.children, node] };
  });
  return added
    ? next
    : {
        ...page,
        slots: { ...page.slots, [slot]: [...page.slots[slot], node] },
      };
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
  return {
    page: {
      ...page,
      slots: Object.fromEntries(
        BUILDER_SLOTS.map(({ id: slot }) => [slot, remove(page.slots[slot])]),
      ) as BuilderPage['slots'],
    },
    removed,
  };
}

export function duplicateBuilderNode(
  page: BuilderPage,
  nodeId: string,
): BuilderPage {
  const source = findBuilderNode(page, nodeId);
  if (!source) return page;
  const duplicated = cloneBuilderNode(source);
  for (const { id: slot } of BUILDER_SLOTS) {
    const index = page.slots[slot].findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      const nodes = [...page.slots[slot]];
      nodes.splice(index + 1, 0, duplicated);
      return { ...page, slots: { ...page.slots, [slot]: nodes } };
    }
  }
  return appendBuilderNode(page, 'afterContent', duplicated);
}

export function cloneBuilderNode(source: BuilderNode): BuilderNode {
  const copy = structuredClone(source);
  const assignIds = (node: BuilderNode): BuilderNode => ({
    ...node,
    id: id(),
    children: node.children.map(assignIds),
  });
  return assignIds(copy);
}

/** Move a block before another block in the same page tree. The operation is
 * immutable and refuses a drop into a node that moved with its own subtree. */
export function moveBuilderNode(
  page: BuilderPage,
  nodeId: string,
  targetId: string,
): BuilderPage {
  if (nodeId === targetId) return page;
  const { page: withoutSource, removed } = removeBuilderNode(page, nodeId);
  if (!removed || !findBuilderNode(withoutSource, targetId)) return page;
  let inserted = false;
  const insert = (nodes: BuilderNode[]): BuilderNode[] => {
    const next: BuilderNode[] = [];
    for (const node of nodes) {
      if (node.id === targetId) {
        next.push(removed);
        inserted = true;
      }
      next.push({ ...node, children: insert(node.children) });
    }
    return next;
  };
  const slots = Object.fromEntries(
    BUILDER_SLOTS.map(({ id: slot }) => [
      slot,
      insert(withoutSource.slots[slot]),
    ]),
  ) as BuilderPage['slots'];
  return inserted ? { ...withoutSource, slots } : page;
}
