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
    tone: 'default' | 'muted' | 'brand';
    padding: 'compact' | 'regular' | 'spacious';
    align: 'left' | 'center' | 'right';
    width: 'content' | 'wide';
  };
  responsive: { visibility: 'all' | 'desktop' | 'mobile' };
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
};

const defaultResponsive: BuilderNode['responsive'] = { visibility: 'all' };

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
  }
  return node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, fallback = '', max = 2_000): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function safeChoice<T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' &&
    (choices as readonly string[]).includes(value)
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

function normaliseNode(value: unknown, depth = 0): BuilderNode | null {
  if (!isRecord(value) || depth > 8) return null;
  const type = safeChoice(value.type, BUILDER_NODE_TYPES, 'text');
  const rawChildren = Array.isArray(value.children) ? value.children : [];
  const children = rawChildren
    .slice(0, 30)
    .map((child) => normaliseNode(child, depth + 1))
    .filter((child): child is BuilderNode => Boolean(child));
  return {
    id: safeText(value.id, id(), 80) || id(),
    type,
    props: safeProps(value.props),
    styles: {
      tone: safeChoice(
        value.styles && isRecord(value.styles) ? value.styles.tone : undefined,
        ['default', 'muted', 'brand'] as const,
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
        ['content', 'wide'] as const,
        'content',
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
    },
    children,
  };
}

export function normaliseBuilderPage(value: unknown): BuilderPage {
  const page = emptyBuilderPage();
  if (!isRecord(value) || !isRecord(value.slots)) return page;
  for (const slot of BUILDER_SLOTS) {
    const rawNodes = value.slots[slot.id];
    if (!Array.isArray(rawNodes)) continue;
    page.slots[slot.id] = rawNodes
      .slice(0, 30)
      .map((node) => normaliseNode(node))
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
    if (!['section', 'container', 'column', 'card'].includes(parent.type))
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
  const copy = structuredClone(source);
  const assignIds = (node: BuilderNode): BuilderNode => ({
    ...node,
    id: id(),
    children: node.children.map(assignIds),
  });
  const duplicated = assignIds(copy);
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
