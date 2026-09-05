'use client';

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
    `page-builder-visible-${node.responsive.visibility}`,
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
