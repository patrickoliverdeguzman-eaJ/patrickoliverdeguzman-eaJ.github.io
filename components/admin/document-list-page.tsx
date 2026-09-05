'use client';

import { CMS_API } from '@/lib/cms-api';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { SortableDocRow } from './sortable-doc-row';
import { adminPath } from '@/lib/site-paths';

interface DocResponse {
  documents: Array<{
    id: string;
    title: string;
    type: string;
    slug: string;
    status: string;
    updatedAt: string;
  }>;
}

export function DocumentListPage() {
  const [documents, setDocuments] = useState<DocResponse['documents']>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem('cms_token');
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('limit', '100');
    try {
      const res = await fetch(`${CMS_API}/v1/admin/documents?${params}`, { headers: { authorization: `Bearer ${token}` } });
      const data: DocResponse = await res.json();
      setDocuments(data.documents ?? []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = documents.findIndex((d) => d.id === active.id);
    const newIndex = documents.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(documents, oldIndex, newIndex);
    setDocuments(reordered);
    const token = localStorage.getItem('cms_token');
    await fetch(`${CMS_API}/v1/admin/documents/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: reordered.map((d) => d.id) }),
    }).catch(() => {});
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <option value="">All types</option>
            <option value="page">Page</option>
            <option value="home_section">Home section</option>
            <option value="page_section">Page section</option>
            <option value="solution">Solution</option>
            <option value="service">Service</option>
            <option value="partner">Partner</option>
            <option value="client">Client</option>
            <option value="site_settings">Site settings</option>
            <option value="navigation">Navigation</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Link href={adminPath('/admin/documents/new')} className="admin-btn admin-btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={16} /> New Document
        </Link>
      </div>

      {loading ? (
        <div className="admin-empty"><p>Loading documents...</p></div>
      ) : documents.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <p>No documents found.</p>
            <Link href={adminPath('/admin/documents/new')} className="admin-btn admin-btn-primary" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-flex' }}>
              <Plus size={16} /> Create Document
            </Link>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={documents.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {documents.map((doc) => (
                <SortableDocRow
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  type={doc.type}
                  slug={doc.slug}
                  status={doc.status}
                  updatedAt={doc.updatedAt}
                  onClick={() => { window.location.href = adminPath(`/admin/documents/edit?id=${doc.id}`); }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
