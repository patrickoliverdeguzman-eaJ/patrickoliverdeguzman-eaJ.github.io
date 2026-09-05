'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Heading, Type, Image, Layout, Minus } from 'lucide-react';

interface SortableBlockProps {
  block: { id: string; type: string; title: string; content: string };
  index: number;
  onUpdate: (id: string, updates: any) => void;
  onRemove: (id: string) => void;
}

const blockIcons: Record<string, React.ReactNode> = {
  heading: <Heading size={16} />,
  text: <Type size={16} />,
  image: <Image size={16} />,
  card: <Layout size={16} />,
  separator: <Minus size={16} />,
};

export function SortableBlock({ block, index, onUpdate, onRemove }: SortableBlockProps) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'white', border: '1px solid rgba(130,0,64,0.12)', borderRadius: '0.5rem', marginBottom: '0.75rem', cursor: 'grab' }} className="admin-block">
      <span style={{ display: 'grid', placeItems: 'center', cursor: 'grab', color: '#a08090', flexShrink: 0, marginTop: '0.25rem' }}>
        <GripVertical size={16} />
      </span>
      <span style={{ display: 'grid', placeItems: 'center', color: '#820040', flexShrink: 0 }}>{blockIcons[block.type] ?? <Type size={16} />}</span>
      <div style={{ flex: 1 }}>
        <input
          value={block.title}
          onChange={(e) => onUpdate(block.id, { title: e.target.value })}
          style={{ border: 'none', borderBottom: '1px dashed rgba(130,0,64,0.2)', padding: '0.25rem 0', fontSize: '0.9rem', fontWeight: 600, width: '100%', background: 'transparent', color: '#2a0d1c' }}
          placeholder="Block title..."
        />
        {block.type === 'text' && (
          <textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
            placeholder="Write content..."
            style={{ width: '100%', minHeight: 80, border: '1px solid rgba(130,0,64,0.12)', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', marginTop: '0.5rem' }}
          />
        )}
      </div>
      <button className="admin-btn admin-btn-ghost" onClick={() => onRemove(block.id)} style={{ padding: '0.25rem', flexShrink: 0 }} type="button">
        <GripVertical size={14} />
      </button>
    </div>
  );
}
