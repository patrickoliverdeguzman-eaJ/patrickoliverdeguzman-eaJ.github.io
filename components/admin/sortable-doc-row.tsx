'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableDocRowProps {
  id: string;
  title: string;
  type: string;
  slug: string;
  status: string;
  updatedAt: string;
  onClick: () => void;
}

export function SortableDocRow({ id, title, type, slug, status, updatedAt, onClick }: SortableDocRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '0.5rem' }} className="admin-card">
      <span {...attributes} {...listeners} style={{ display: 'grid', placeItems: 'center', cursor: 'grab', color: '#a08090', flexShrink: 0 }}>
        <GripVertical size={16} />
      </span>
      <div onClick={onClick} style={{ flex: 1, cursor: 'pointer' }}>
        <strong>{title}</strong>
        <div style={{ fontSize: '0.78rem', color: '#735568', marginTop: '0.25rem' }}>{type} / {slug}</div>
      </div>
      <span className={`admin-badge admin-badge-${status}`}>{status}</span>
      <span style={{ fontSize: '0.75rem', color: '#a08090', whiteSpace: 'nowrap' }}>{new Date(updatedAt).toLocaleDateString()}</span>
    </div>
  );
}
