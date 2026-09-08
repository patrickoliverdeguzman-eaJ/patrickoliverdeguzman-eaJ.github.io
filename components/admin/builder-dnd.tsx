'use client';

import {
  useDraggable,
  useDroppable,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, type LucideIcon } from 'lucide-react';
import { type CSSProperties, type ReactNode } from 'react';
import type { BuilderInsertLocation, BuilderNode, BuilderNodeType, BuilderSlot } from '@/lib/page-builder';

export type BuilderDragData =
  | { kind: 'node'; nodeId: string; blockType: BuilderNodeType; label: string; location: BuilderInsertLocation }
  | { kind: 'library'; blockType: BuilderNodeType; label: string }
  | { kind: 'insert'; location: BuilderInsertLocation };

export function builderNodeDndId(nodeId: string): string {
  return `builder-node:${nodeId}`;
}

function insertDndId(location: BuilderInsertLocation): string {
  return `builder-insert:${location.slot}:${location.parentId ?? 'root'}:${location.index}`;
}

export function BlockDragHandle({
  label,
  attributes,
  listeners,
  setActivatorNodeRef,
}: {
  label: string;
  attributes: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}) {
  return (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className="builder-block-drag-handle"
      aria-label={`Move ${label}. Press Space, then use arrow keys to reposition it.`}
      title={`Drag ${label}`}
      onClick={(event) => event.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function DroppableInsertZone({
  slot,
  parentId,
  index,
  dragActive,
  enabled = true,
}: {
  slot: BuilderSlot;
  parentId?: string | null;
  index: number;
  dragActive: boolean;
  enabled?: boolean;
}) {
  const location: BuilderInsertLocation = { slot, parentId: parentId ?? null, index };
  const { setNodeRef, isOver } = useDroppable({
    id: insertDndId(location),
    data: { kind: 'insert', location } satisfies BuilderDragData,
    disabled: !enabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={`builder-insert-zone ${dragActive && enabled ? 'builder-insert-zone-active' : ''} ${isOver ? 'builder-insert-zone-over' : ''}`}
      data-builder-insert-slot={slot}
      data-builder-insert-parent={parentId ?? 'root'}
      data-builder-insert-index={index}
      aria-hidden="true"
    >
      <span>{isOver ? 'Drop block here' : ''}</span>
    </div>
  );
}

export function DraggableBlock({
  node,
  slot,
  parentId,
  index,
  children,
}: {
  node: BuilderNode;
  slot: BuilderSlot;
  parentId?: string | null;
  index: number;
  children: ReactNode;
}) {
  const label = node.type.replaceAll('_', ' ');
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: builderNodeDndId(node.id),
    data: {
      kind: 'node',
      nodeId: node.id,
      blockType: node.type,
      label,
      location: { slot, parentId: parentId ?? null, index },
    } satisfies BuilderDragData,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`builder-drag-shell builder-drag-shell-${node.type} ${isDragging ? 'builder-drag-shell-active' : ''} ${isOver ? 'builder-drag-shell-over' : ''}`}
      data-builder-sort-id={node.id}
    >
      <BlockDragHandle
        label={label}
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
      {children}
    </div>
  );
}

export function SortableBlockList({
  nodes,
  slot,
  parentId,
  dragActive,
  activeType,
  parentType,
  renderNode,
}: {
  nodes: BuilderNode[];
  slot: BuilderSlot;
  parentId?: string | null;
  dragActive: boolean;
  activeType?: BuilderNodeType;
  parentType?: BuilderNodeType;
  renderNode: (node: BuilderNode) => ReactNode;
}) {
  const acceptsActiveType = !activeType
    || (parentType === 'solution_grid' && activeType === 'solution_card')
    || (parentType === 'service_list' && activeType === 'service_row')
    || (!parentType && activeType !== 'solution_card' && activeType !== 'service_row')
    || (Boolean(parentType) && parentType !== 'solution_grid' && parentType !== 'service_list' && activeType !== 'solution_card' && activeType !== 'service_row');
  const useBlockTargets = parentType === 'solution_grid';
  return (
    <SortableContext items={nodes.map((node) => builderNodeDndId(node.id))} strategy={verticalListSortingStrategy}>
      {(!useBlockTargets || nodes.length === 0) && <DroppableInsertZone slot={slot} parentId={parentId} index={0} dragActive={dragActive} enabled={acceptsActiveType} />}
      {nodes.map((node, index) => (
        <div className="builder-sortable-position" key={node.id}>
          <DraggableBlock node={node} slot={slot} parentId={parentId} index={index}>
            {renderNode(node)}
          </DraggableBlock>
          {!useBlockTargets && <DroppableInsertZone slot={slot} parentId={parentId} index={index + 1} dragActive={dragActive} enabled={acceptsActiveType} />}
        </div>
      ))}
    </SortableContext>
  );
}

export function BlockLibraryItem({
  type,
  label,
  Icon,
  onClick,
}: {
  type: BuilderNodeType;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `builder-library:${type}`,
    data: { kind: 'library', blockType: type, label } satisfies BuilderDragData,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-cms-builder-library={type}
      className={isDragging ? 'builder-library-item-dragging' : undefined}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="builder-library-grip" size={13} aria-hidden="true" />
      <Icon size={14} />
      {label}
    </button>
  );
}

export function BuilderDragOverlay({ label, isNew }: { label: string; isNew?: boolean }) {
  return (
    <div className="builder-drag-overlay">
      <GripVertical size={16} aria-hidden="true" />
      <span>{isNew ? 'Add' : 'Move'} {label}</span>
    </div>
  );
}
