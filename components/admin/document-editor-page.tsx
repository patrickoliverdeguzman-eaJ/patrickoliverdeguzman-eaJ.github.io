'use client';

import { CMS_API } from '@/lib/cms-api';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Eye } from 'lucide-react';
import { SortableBlock } from './sortable-block';
import { StructuredFields, type MediaAsset } from './structured-fields';
import { adminPath } from '@/lib/site-paths';

interface Block {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface DocumentData {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: string;
  data: {
    blocks: Block[];
    [key: string]: unknown;
  };
  publishedData: {
    blocks: Block[];
    [key: string]: unknown;
  } | null;
}

interface DocResponse {
  document: DocumentData;
}

interface MediaResponse {
  media: MediaAsset[];
}

function normalizeDocument(document: DocumentData): DocumentData {
  return {
    ...document,
    data: { ...document.data, blocks: document.data.blocks ?? [] },
    publishedData: document.publishedData ? { ...document.publishedData, blocks: document.publishedData.blocks ?? [] } : null,
  };
}

export function DocumentEditorPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id') ?? '';
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newBlockType, setNewBlockType] = useState('');
  const [preview, setPreview] = useState<'draft' | 'published'>('draft');
  const [media, setMedia] = useState<MediaAsset[]>([]);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('cms_token');
    fetch(`${CMS_API}/v1/admin/documents/${documentId}`, { headers: { authorization: `Bearer ${token}` } })
      .then((res) => res.json().then((raw: unknown) => raw as DocResponse))
      .then((data: DocResponse) => {
        if (data.document) {
          setDoc(normalizeDocument(data.document));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    fetch(`${CMS_API}/v1/admin/media`, { headers: { authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() as Promise<MediaResponse> : { media: [] })
      .then((data) => setMedia(data.media ?? []))
      .catch(() => setMedia([]));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  const addBlock = (type: string) => {
    if (!doc) return;
    const block: Block = {
      id: crypto.randomUUID(),
      type,
      title: type === 'heading' ? 'New Heading' : type === 'text' ? 'New Text Block' : type === 'image' ? 'New Image' : 'New Block',
      content: '',
      order: doc.data.blocks.length,
    };
    setDoc({ ...doc, data: { ...doc.data, blocks: [...doc.data.blocks, block] } });
    setNewBlockType('');
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    if (!doc) return;
    setDoc({
      ...doc,
      data: { ...doc.data, blocks: doc.data.blocks.map((b) => b.id === blockId ? { ...b, ...updates } : b) },
    });
  };

  const removeBlock = (blockId: string) => {
    if (!doc) return;
    setDoc({
      ...doc,
      data: { ...doc.data, blocks: doc.data.blocks.filter((b) => b.id !== blockId) },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !doc) return;
    const oldIndex = doc.data.blocks.findIndex((b) => b.id === active.id);
    const newIndex = doc.data.blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(doc.data.blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
    setDoc({ ...doc, data: { ...doc.data, blocks: reordered } });
  };

  const persistDocument = async (): Promise<DocumentData> => {
    if (!doc) throw new Error('No document is loaded.');
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: doc.title, slug: doc.slug, data: doc.data }),
    });
    const result = (await response.json().catch(() => ({}))) as { document?: DocumentData; error?: string };
    if (!response.ok || !result.document) throw new Error(result.error ?? 'The draft could not be saved.');
    const saved = normalizeDocument(result.document);
    setDoc(saved);
    return saved;
  };

  const saveDocument = async () => {
    setSaving(true);
    setError('');
    try {
      await persistDocument();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The draft could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const publishDocument = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await persistDocument();
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents/${documentId}/publish`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const result = (await response.json().catch(() => ({}))) as { document?: DocumentData; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The document could not be published.');
      setDoc({ ...normalizeDocument(result.document), publishedData: { ...saved.data, blocks: saved.data.blocks ?? [] } });
      setPreview('published');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The document could not be published.');
    } finally {
      setSaving(false);
    }
  };

  const unpublishDocument = async () => {
    const token = localStorage.getItem('cms_token');
    await fetch(`${CMS_API}/v1/admin/documents/${documentId}/unpublish`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    setDoc({ ...doc!, status: 'draft', publishedData: null });
    setPreview('draft');
  };

  const archiveDocument = async () => {
    if (!window.confirm('Archive this document? It will be hidden from the site.')) return;
    const token = localStorage.getItem('cms_token');
    await fetch(`${CMS_API}/v1/admin/documents/${documentId}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    window.location.href = adminPath('/admin/documents');
  };

  if (loading) return <div className="admin-empty"><p>Loading document...</p></div>;
  if (!documentId) return <div className="admin-empty"><p>No document selected. Pick one from the document list.</p></div>;
  if (!doc) return <div className="admin-empty"><p>Document not found.</p></div>;

  const readOnly = preview === 'published';
  const blocks = readOnly ? (doc.publishedData?.blocks ?? []) : (doc.data.blocks ?? []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="admin-btn admin-btn-ghost" onClick={() => { window.location.href = adminPath('/admin/documents'); }} type="button">← Back</button>
          <input
            style={{ border: 'none', borderBottom: '2px solid transparent', padding: '0.5rem 0', fontSize: '1.25rem', fontWeight: 700, width: 300, background: 'transparent', color: '#2a0d1c' }}
            value={doc.title}
            onChange={(e) => setDoc({ ...doc, title: e.target.value })}
            placeholder="Document title..."
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn-secondary" onClick={saveDocument} disabled={saving || readOnly} type="button">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={publishDocument} disabled={readOnly} type="button">
            <Eye size={16} /> Publish
          </button>
          {doc.status === 'published' && (
            <button className="admin-btn admin-btn-secondary" onClick={unpublishDocument} type="button">
              Unpublish
            </button>
          )}
          <button className="admin-btn admin-btn-ghost" onClick={archiveDocument} type="button">
            Archive
          </button>
        </div>
      </div>

      {error && <div className="admin-card" style={{ marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>{error}</div>}

      {!readOnly && (
        <StructuredFields
          data={doc.data}
          media={media}
          onChange={(data) => setDoc({ ...doc, data: { ...data, blocks: Array.isArray(data.blocks) ? data.blocks as Block[] : [] } })}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Content Blocks</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#735568' }}>{blocks.length} blocks</span>
              <button className={`admin-btn ${preview === 'draft' ? 'admin-btn-primary' : 'admin-btn-ghost'}`} type="button" onClick={() => setPreview('draft')}>Draft</button>
              <button className={`admin-btn ${preview === 'published' ? 'admin-btn-primary' : 'admin-btn-ghost'}`} type="button" onClick={() => setPreview('published')} disabled={!doc.publishedData}>Published</button>
            </div>
          </div>
          {readOnly && (
            <div className="admin-card" style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#735568' }}>
              Previewing the published version. Switch to Draft to keep editing.
            </div>
          )}

          {readOnly ? (
            <div>
              {blocks.length === 0 && (
                <div className="admin-drop-zone" style={{ marginBottom: '1rem' }}>
                  <p>Nothing published yet.</p>
                </div>
              )}
              {blocks.map((block) => (
                <div key={block.id} className="admin-card" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#735568' }}>{block.type}</div>
                  {block.title && <div style={{ fontWeight: 600 }}>{block.title}</div>}
                  {block.content && <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{block.content}</div>}
                </div>
              ))}
            </div>
          ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div>
                {blocks.length === 0 && (
                  <div className="admin-drop-zone" style={{ marginBottom: '1rem' }}>
                    <p>No blocks yet. Add one below.</p>
                  </div>
                )}
                {blocks.map((block, index) => (
                  <SortableBlock key={block.id} block={block} index={index} onUpdate={updateBlock} onRemove={removeBlock} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          )}

          {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid rgba(130,0,64,0.2)', borderRadius: '0.5rem', fontSize: '0.82rem', background: 'white', minWidth: 140 }}>
              <option value="">Add block...</option>
              <option value="heading">Heading</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="card">Card</option>
              <option value="separator">Separator</option>
            </select>
            <button className="admin-btn admin-btn-secondary" onClick={() => { if (newBlockType) addBlock(newBlockType); }} type="button">
              <Plus size={16} /> Add
            </button>
          </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-card">
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Settings</h3>
            <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
              <label>Slug</label>
              <input value={doc.slug} onChange={(e) => setDoc({ ...doc, slug: e.target.value })} style={{ fontSize: '0.82rem' }} />
            </div>
            <p style={{ margin: 0, color: '#735568', fontSize: '0.82rem' }}>Status: <strong>{doc.status}</strong></p>
          </div>
          <div className="admin-card">
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Quick Actions</h3>
            <button className="admin-btn admin-btn-secondary" style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'center' }} onClick={saveDocument} type="button">
              💾 Save Draft
            </button>
            <button className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={publishDocument} type="button">
              <Eye size={16} /> Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
