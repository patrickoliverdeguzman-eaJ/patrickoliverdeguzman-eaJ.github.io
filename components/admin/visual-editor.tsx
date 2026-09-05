'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Box,
  ChevronDown,
  Columns3,
  Copy,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Layers3,
  Minus,
  Monitor,
  MousePointer2,
  Plus,
  Redo2,
  Save,
  Send,
  Smartphone,
  Tablet,
  Text,
  Undo2,
} from 'lucide-react';
import { CMS_API } from '@/lib/cms-api';
import { adminPath } from '@/lib/site-paths';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import {
  appendBuilderNode,
  BUILDER_SLOTS,
  type BuilderNode,
  type BuilderNodeType,
  createBuilderNode,
  duplicateBuilderNode,
  emptyBuilderPage,
  findBuilderNode,
  moveBuilderNode,
  normaliseBuilderPage,
  removeBuilderNode,
  updateBuilderNode,
} from '@/lib/page-builder';
import siteContentSeed from '@/cms-worker/seed/site-content.json';
import {
  DEFAULT_HOME,
  DEFAULT_PARTNERS,
  type ClientContent,
  type PartnerContent,
  type SolutionContent,
} from '@/lib/site-content';

type CmsDocument = {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  updatedAt: string;
};

type MediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
};
type PageKey = 'home' | 'partners';
type Device = 'desktop' | 'tablet' | 'mobile';
type FieldRef = { documentId: string; key: string };
type HeaderLink = { id: string; label: string; href: string; enabled: boolean };

type Layer = {
  id: string;
  label: string;
  type: string;
  slug?: string;
  repeating?: boolean;
  locked?: boolean;
};

const PAGE_LAYERS: Record<PageKey, Layer[]> = {
  home: [
    {
      id: 'global',
      label: 'Global header & footer',
      type: 'site_settings',
      slug: 'global',
      locked: true,
    },
    {
      id: 'navigation',
      label: 'Navigation',
      type: 'navigation',
      slug: 'main',
    },
    { id: 'hero', label: 'Hero', type: 'home_section', slug: 'hero' },
    {
      id: 'approach',
      label: 'INFOStorage difference',
      type: 'home_section',
      slug: 'approach',
    },
    {
      id: 'solutions-heading',
      label: 'Solutions heading',
      type: 'home_section',
      slug: 'solutions-heading',
    },
    {
      id: 'solutions',
      label: 'Solution cards',
      type: 'solution',
      repeating: true,
    },
    {
      id: 'continuity',
      label: 'Data protection',
      type: 'home_section',
      slug: 'continuity',
    },
    {
      id: 'services-heading',
      label: 'Services heading',
      type: 'home_section',
      slug: 'services-heading',
    },
    { id: 'services', label: 'Service rows', type: 'service', repeating: true },
    {
      id: 'sectors',
      label: 'Industries',
      type: 'home_section',
      slug: 'sectors',
    },
    {
      id: 'contact',
      label: 'Contact CTA',
      type: 'home_section',
      slug: 'contact',
    },
  ],
  partners: [
    {
      id: 'global',
      label: 'Global header & footer',
      type: 'site_settings',
      slug: 'global',
      locked: true,
    },
    {
      id: 'navigation',
      label: 'Navigation',
      type: 'navigation',
      slug: 'main',
    },
    {
      id: 'partners-hero',
      label: 'Partners hero',
      type: 'page_section',
      slug: 'partners-hero',
    },
    {
      id: 'partners-directory',
      label: 'Technology partners heading',
      type: 'page_section',
      slug: 'partners-directory',
    },
    {
      id: 'partners',
      label: 'Technology partner cards',
      type: 'partner',
      repeating: true,
    },
    {
      id: 'partners-clients',
      label: 'Valued clients heading',
      type: 'page_section',
      slug: 'partners-clients',
    },
    {
      id: 'clients',
      label: 'Valued client logos',
      type: 'client',
      repeating: true,
    },
  ],
};

const DEFAULT_DATA: Record<string, Record<string, unknown>> = {
  solution: { description: '', items: [] },
  service: { description: '' },
  partner: { focus: '', website: '' },
  client: { logo: '', website: '' },
};

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function fieldName(key: string): string {
  if (key === '__title') return 'Title';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isMediaKey(key: string): boolean {
  return (
    /(?:logo|image)$/i.test(key) ||
    /(?:heroImage|backgroundImage|ogImage)$/i.test(key)
  );
}

function nextSlug(value: string): string {
  const root =
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'content';
  return `${root}-${Date.now().toString(36)}`.slice(0, 120);
}

function slugFromTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function customPageHref(slug: string): string {
  const base = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/custom.html' : '/custom';
  return `${base}?page=${encodeURIComponent(slug)}`;
}

function headerLinks(value: unknown): HeaderLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `header-link-${index}`,
      label: typeof item.label === 'string' ? item.label : '',
      href: typeof item.href === 'string' ? item.href : '#',
      enabled: item.enabled !== false,
    }));
}

function findDocument(
  documents: CmsDocument[],
  type: string,
  slug?: string,
): CmsDocument | undefined {
  return documents.find(
    (document) => document.type === type && (!slug || document.slug === slug),
  );
}

function EditorText({
  field,
  value,
  selected,
  onSelect,
  onChange,
  className,
}: {
  field?: FieldRef;
  value: string;
  selected: FieldRef | null;
  onSelect: (field: FieldRef) => void;
  onChange: (field: FieldRef, value: string) => void;
  className?: string;
}) {
  const isSelected = Boolean(
    field &&
    selected?.documentId === field.documentId &&
    selected.key === field.key,
  );
  return (
    <span
      className={`${className ?? ''} visual-editable ${isSelected ? 'visual-editable-selected' : ''}`}
      data-cms-document-id={field?.documentId}
      data-cms-field={field?.key}
      data-cms-type={field ? 'text' : undefined}
      contentEditable={Boolean(field)}
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(event) => {
        if (!field) return;
        event.stopPropagation();
        onSelect(field);
      }}
      onInput={(event) => {
        if (field) onChange(field, event.currentTarget.textContent ?? '');
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
      }}
    >
      {value}
    </span>
  );
}

export function VisualEditor() {
  const [page, setPage] = useState<PageKey>('home');
  const [documents, setDocuments] = useState<CmsDocument[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<FieldRef | null>(null);
  const [history, setHistory] = useState<CmsDocument[][]>([]);
  const [future, setFuture] = useState<CmsDocument[][]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [device, setDevice] = useState<Device>('desktop');
  const [status, setStatus] = useState<
    'loading' | 'saved' | 'saving' | 'publishing' | 'error'
  >('loading');
  const [message, setMessage] = useState('Loading editor…');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [activeBuilderSlot, setActiveBuilderSlot] = useState(BUILDER_SLOTS[0].id);
  const [selectedBuilderNodeId, setSelectedBuilderNodeId] = useState<string | null>(null);
  const [draggedBuilderNodeId, setDraggedBuilderNodeId] = useState<string | null>(null);
  const [activeCustomPageId, setActiveCustomPageId] = useState<string | null>(null);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setMessage('Loading editor…');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = { authorization: `Bearer ${token}` };
      const [documentsResponse, mediaResponse] = await Promise.all([
        fetch(`${CMS_API}/v1/admin/documents?limit=100`, { headers }),
        fetch(`${CMS_API}/v1/admin/media`, { headers }),
      ]);
      const documentsBody = (await documentsResponse.json()) as {
        documents?: CmsDocument[];
        error?: string;
      };
      const mediaBody = (await mediaResponse.json()) as {
        media?: MediaAsset[];
      };
      if (!documentsResponse.ok)
        throw new Error(
          documentsBody.error ?? 'The CMS documents could not be loaded.',
        );
      setDocuments(documentsBody.documents ?? []);
      setMedia(mediaBody.media ?? []);
      setStatus('saved');
      setMessage(
        documentsBody.documents?.length
          ? 'All changes saved'
          : 'Import the existing site to begin editing',
      );
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'The editor could not load.',
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const customPages = documents.filter(
    (document) =>
      document.type === 'builder_page' &&
      document.slug !== 'home' &&
      document.slug !== 'partners',
  );
  const activeCustomPage = customPages.find(
    (document) => document.id === activeCustomPageId,
  );
  const isCustomPage = Boolean(activeCustomPage);
  const activePageSlug = activeCustomPage?.slug ?? page;
  const pageLayers = isCustomPage ? [] : PAGE_LAYERS[page];
  const builderDocument = findDocument(
    documents,
    'builder_page',
    activePageSlug,
  );
  const builderPage = builderDocument ? normaliseBuilderPage(builderDocument.data) : emptyBuilderPage();
  const hasPageBindings =
    isCustomPage
      ? true
      : page === 'home'
      ? Boolean(findDocument(documents, 'home_section', 'hero'))
      : Boolean(findDocument(documents, 'page_section', 'partners-hero'));
  const pageDocuments = useMemo(() => {
    const types = new Set(pageLayers.map((layer) => layer.type));
    return documents.filter(
      (document) =>
        types.has(document.type) ||
        (document.type === 'builder_page' && document.slug === activePageSlug),
    );
  }, [activePageSlug, documents, pageLayers]);

  const markChanged = (nextDocuments: CmsDocument[], ids: string[]) => {
    setHistory((items) => [...items, structuredClone(documents)].slice(-30));
    setFuture([]);
    setDocuments(nextDocuments);
    setDirtyIds((current) => new Set([...current, ...ids]));
    setStatus('saved');
    setMessage('Unsaved draft changes');
  };

  const updateField = (field: FieldRef, value: string | boolean) => {
    const next = documents.map((document) => {
      if (document.id !== field.documentId) return document;
      if (field.key === '__title') return { ...document, title: String(value) };
      return { ...document, data: { ...document.data, [field.key]: value } };
    });
    markChanged(next, [field.documentId]);
  };

  const updateHeaderLinks = (documentId: string, links: HeaderLink[]) => {
    const next = documents.map((document) =>
      document.id === documentId
        ? { ...document, data: { ...document.data, items: links } }
        : document,
    );
    markChanged(next, [documentId]);
  };

  const updateBuilder = (nextPage: ReturnType<typeof emptyBuilderPage>) => {
    if (!builderDocument) return;
    const next = documents.map((document) =>
      document.id === builderDocument.id ? { ...document, data: nextPage } : document,
    );
    markChanged(next, [builderDocument.id]);
  };

  const ensureBuilderDocument = async (): Promise<CmsDocument | null> => {
    if (builderDocument) return builderDocument;
    setStatus('saving');
    setMessage('Preparing a structured page canvas…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'builder_page',
          slug: activePageSlug,
          title: activeCustomPage?.title ?? `${page === 'home' ? 'Home' : 'Partners'} custom blocks`,
          data: emptyBuilderPage(),
          note: 'Created structured visual-builder canvas',
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The builder canvas could not be created.');
      return result.document;
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The builder canvas could not be created.');
      return null;
    }
  };

  const createPage = async () => {
    const title = newPageTitle.trim();
    const slug = slugFromTitle(newPageSlug || title);
    if (!title || !slug) {
      setStatus('error');
      setMessage('Give the new page a title and a valid URL name.');
      return;
    }
    if (documents.some((document) => document.type === 'builder_page' && document.slug === slug)) {
      setStatus('error');
      setMessage('That page URL is already in use. Choose another URL name.');
      return;
    }
    setStatus('saving');
    setMessage('Creating page draft…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'builder_page',
          slug,
          title,
          data: emptyBuilderPage(),
          note: 'Created as a new visual-builder page',
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The page draft could not be created.');
      setDocuments((current) => [...current, result.document!]);
      setActiveCustomPageId(result.document.id);
      setSelected(null);
      setSelectedBuilderNodeId(null);
      setActiveBuilderSlot(BUILDER_SLOTS[0].id);
      setAddingPage(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setStatus('saved');
      setMessage('New page draft is ready. Add blocks, then publish it.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The page draft could not be created.');
    }
  };

  const addBuilderElement = async (type: BuilderNodeType) => {
    const document = await ensureBuilderDocument();
    if (!document) return;
    const currentPage = normaliseBuilderPage(document.data);
    const selectedNode = selectedBuilderNodeId ? findBuilderNode(currentPage, selectedBuilderNodeId) : undefined;
    const canContain = Boolean(selectedNode && ['section', 'container', 'column', 'card'].includes(selectedNode.type));
    const node = createBuilderNode(type);
    const nextPage = appendBuilderNode(currentPage, activeBuilderSlot, node, canContain ? selectedNode?.id : undefined);
    const nextDocuments = (document.id === builderDocument?.id ? documents : [...documents, document]).map((entry) =>
      entry.id === document.id ? { ...entry, data: nextPage } : entry,
    );
    markChanged(nextDocuments, [document.id]);
    setSelectedBuilderNodeId(node.id);
    setSelected(null);
    setStatus('saved');
    setMessage(`${type.replace('_', ' ')} added to the draft`);
  };

  const changeBuilderNode = (nodeId: string, change: (node: BuilderNode) => BuilderNode) => {
    updateBuilder(updateBuilderNode(builderPage, nodeId, change));
  };

  const removeSelectedBuilderNode = () => {
    if (!selectedBuilderNodeId) return;
    updateBuilder(removeBuilderNode(builderPage, selectedBuilderNodeId).page);
    setSelectedBuilderNodeId(null);
    setMessage('Custom block removed from the draft');
  };

  const duplicateSelectedBuilderNode = () => {
    if (!selectedBuilderNodeId) return;
    updateBuilder(duplicateBuilderNode(builderPage, selectedBuilderNodeId));
    setMessage('Custom block duplicated in the draft');
  };

  const moveBuilderBlock = (targetId: string) => {
    if (!draggedBuilderNodeId) return;
    updateBuilder(moveBuilderNode(builderPage, draggedBuilderNodeId, targetId));
    setDraggedBuilderNodeId(null);
    setMessage('Custom block order updated');
  };

  const selectDocument = (document: CmsDocument, key = '__title') => {
    setSelectedBuilderNodeId(null);
    setSelected({ documentId: document.id, key });
  };

  const initializeEditableDrafts = async () => {
    setInitializing(true);
    setStatus('saving');
    setMessage('Creating editable draft bindings…');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      };
      const known = new Set(
        documents.map((document) => `${document.type}/${document.slug}`),
      );
      const builderDrafts = (['home', 'partners'] as PageKey[]).map((pageKey) => ({
        type: 'builder_page',
        slug: pageKey,
        title: `${pageKey === 'home' ? 'Home' : 'Partners'} custom blocks`,
        data: emptyBuilderPage(),
      }));
      const toCreate = [...siteContentSeed.documents, ...builderDrafts].filter(
        (entry) => !known.has(`${entry.type}/${entry.slug}`),
      );
      const created: CmsDocument[] = [];
      for (const entry of toCreate) {
        const response = await fetch(`${CMS_API}/v1/admin/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...entry,
            note: 'Initialized for visual editing from the current static site',
          }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          document?: CmsDocument;
          error?: string;
        };
        if (!response.ok || !result.document)
          throw new Error(result.error ?? `Could not bind ${entry.title}.`);
        created.push(result.document);
      }
      setDocuments((current) => [...current, ...created]);
      setStatus('saved');
      setMessage('Editable drafts are ready — the live site is unchanged');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The editable draft bindings could not be created.',
      );
    } finally {
      setInitializing(false);
    }
  };

  const saveDrafts = useCallback(
    async (ids = Array.from(dirtyIds)) => {
      if (!ids.length) return true;
      setStatus('saving');
      setMessage('Saving draft…');
      try {
        const token = localStorage.getItem('cms_token');
        const headers = {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        };
        for (const id of ids) {
          const document = documents.find((item) => item.id === id);
          if (!document) continue;
          const response = await fetch(`${CMS_API}/v1/admin/documents/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              title: document.title,
              slug: document.slug,
              data: document.data,
              note: 'Edited in visual editor',
            }),
          });
          const result = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!response.ok)
            throw new Error(
              result.error ?? `Could not save ${document.title}.`,
            );
        }
        setDirtyIds(
          (current) => new Set([...current].filter((id) => !ids.includes(id))),
        );
        setStatus('saved');
        setMessage('All changes saved');
        return true;
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'The draft could not be saved.',
        );
        return false;
      }
    },
    [dirtyIds, documents],
  );

  useEffect(() => {
    if (!dirtyIds.size) return;
    const timer = window.setTimeout(() => {
      void saveDrafts();
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [dirtyIds, documents, saveDrafts]);

  const publishPage = async () => {
    const saved = await saveDrafts();
    if (!saved) return;
    const ids = pageDocuments.map((document) => document.id);
    if (!ids.length) {
      setStatus('error');
      setMessage('Import the existing site before publishing this page.');
      return;
    }
    setStatus('publishing');
    setMessage('Publishing…');
    try {
      const token = localStorage.getItem('cms_token');
      for (const id of ids) {
        const response = await fetch(
          `${CMS_API}/v1/admin/documents/${id}/publish`,
          {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
          },
        );
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error ?? 'The page could not be published.');
      }
      setDocuments((current) =>
        current.map((document) =>
          ids.includes(document.id)
            ? {
                ...document,
                status: 'published',
                publishedData: structuredClone(document.data),
              }
            : document,
        ),
      );
      setStatus('saved');
      setMessage('Published to the live site');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The page could not be published.',
      );
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [structuredClone(documents), ...items].slice(0, 30));
    setHistory((items) => items.slice(0, -1));
    setDocuments(previous);
    setDirtyIds(new Set(previous.map((document) => document.id)));
    setMessage('Undid the last change');
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, structuredClone(documents)].slice(-30));
    setFuture((items) => items.slice(1));
    setDocuments(next);
    setDirtyIds(new Set(next.map((document) => document.id)));
    setMessage('Restored the change');
  };

  const addRepeater = async (
    type: 'solution' | 'service' | 'partner' | 'client',
  ) => {
    const baseTitle =
      type === 'solution'
        ? 'New solution'
        : type === 'service'
          ? 'New service'
          : type === 'partner'
            ? 'New partner'
            : 'New client';
    setStatus('saving');
    setMessage(`Adding ${baseTitle.toLowerCase()}…`);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title: baseTitle,
          slug: nextSlug(baseTitle),
          data: DEFAULT_DATA[type],
          note: 'Added in visual editor',
        }),
      });
      const result = (await response.json()) as {
        document?: CmsDocument;
        error?: string;
      };
      if (!response.ok || !result.document)
        throw new Error(result.error ?? 'The block could not be added.');
      setDocuments((current) => [...current, result.document!]);
      setSelected({ documentId: result.document.id, key: '__title' });
      setDirtyIds((current) => new Set([...current, result.document!.id]));
      setStatus('saved');
      setMessage(`${baseTitle} added as a draft`);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be added.',
      );
    }
  };

  const duplicateSelected = async () => {
    const document = selected
      ? documents.find((item) => item.id === selected.documentId)
      : undefined;
    if (
      !document ||
      !['solution', 'service', 'partner', 'client'].includes(document.type)
    )
      return;
    setStatus('saving');
    try {
      const token = localStorage.getItem('cms_token');
      const title = `${document.title} copy`;
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: document.type,
          title,
          slug: nextSlug(title),
          data: document.data,
          note: 'Duplicated in visual editor',
        }),
      });
      const result = (await response.json()) as {
        document?: CmsDocument;
        error?: string;
      };
      if (!response.ok || !result.document)
        throw new Error(result.error ?? 'The block could not be duplicated.');
      setDocuments((current) => [...current, result.document!]);
      setSelected({ documentId: result.document.id, key: '__title' });
      setDirtyIds((current) => new Set([...current, result.document!.id]));
      setStatus('saved');
      setMessage('Block duplicated as a draft');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be duplicated.',
      );
    }
  };

  const archiveSelected = async () => {
    const document = selected
      ? documents.find((item) => item.id === selected.documentId)
      : undefined;
    if (
      !document ||
      !['solution', 'service', 'partner', 'client'].includes(document.type)
    )
      return;
    if (
      !window.confirm(
        `Archive “${document.title}”? It will be removed from the live page after publishing.`,
      )
    )
      return;
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(
        `${CMS_API}/v1/admin/documents/${document.id}`,
        { method: 'DELETE', headers: { authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error('The block could not be archived.');
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
      setSelected(null);
      setMessage('Block archived');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be archived.',
      );
    }
  };

  const reorderRepeater = async (type: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const items = documents.filter((document) => document.type === type);
    const fromIndex = items.findIndex((document) => document.id === draggedId);
    const targetIndex = items.findIndex((document) => document.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const ids = reordered.map((document) => document.id);
    const currentPositions = documents.map((document) =>
      document.type === type ? reordered.shift()! : document,
    );
    setDocuments(currentPositions);
    setMessage('Reordering blocks…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('The new order could not be saved.');
      setMessage('Block order saved');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The new order could not be saved.',
      );
      void load();
    } finally {
      setDraggedId(null);
    }
  };

  const selectedDocument = selected
    ? documents.find((document) => document.id === selected.documentId)
    : undefined;
  const selectedBuilderNode = selectedBuilderNodeId
    ? findBuilderNode(builderPage, selectedBuilderNodeId)
    : undefined;
  const selectedHeaderLinks =
    selectedDocument?.type === 'navigation'
      ? headerLinks(selectedDocument.data.items)
      : [];
  const selectedFields = selectedDocument
    ? [
        { key: '__title', value: selectedDocument.title },
        ...Object.entries(selectedDocument.data)
          .filter(
            ([key, value]) =>
              (typeof value === 'string' || typeof value === 'boolean') &&
              !(
                selectedDocument.type === 'navigation' &&
                ['ctaLabel', 'ctaHref'].includes(key)
              ),
          )
          .map(([key, value]) => ({ key, value: value as string | boolean })),
      ]
    : [];

  const selectLayer = (layer: Layer) => {
    const document = layer.repeating
      ? documents.find((item) => item.type === layer.type)
      : findDocument(documents, layer.type, layer.slug);
    if (document) selectDocument(document);
  };

  const previewProps = {
    documents,
    selected,
    onSelect: (field: FieldRef) => setSelected(field),
    onChange: updateField,
    onSelectDocument: selectDocument,
    draggedId,
    setDraggedId,
    onDropRepeater: reorderRepeater,
  };

  return (
    <div className="visual-editor">
      <header className="visual-toolbar">
        <a className="admin-btn admin-btn-ghost" href={adminPath('/admin')}>
          <ArrowLeft size={16} /> Back to CMS
        </a>
        <div className="visual-page-switcher">
          {(['home', 'partners'] as PageKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={!isCustomPage && page === key ? 'active' : ''}
              onClick={() => {
                setPage(key);
                setActiveCustomPageId(null);
                setSelected(null);
                setSelectedBuilderNodeId(null);
                setActiveBuilderSlot(BUILDER_SLOTS[0].id);
              }}
            >
              {key === 'home' ? 'Home' : 'Partners'}
            </button>
          ))}
          {customPages.map((customPage) => (
            <button
              key={customPage.id}
              type="button"
              className={activeCustomPageId === customPage.id ? 'active' : ''}
              title={customPage.slug}
              onClick={() => {
                setActiveCustomPageId(customPage.id);
                setSelected(null);
                setSelectedBuilderNodeId(null);
                setActiveBuilderSlot(BUILDER_SLOTS[0].id);
              }}
            >
              {customPage.title}
            </button>
          ))}
          <button
            type="button"
            className="visual-add-page"
            onClick={() => setAddingPage(true)}
          >
            <Plus size={14} /> Add page
          </button>
        </div>
        <div
          className={`visual-save-status status-${status}`}
          aria-live="polite"
        >
          {status === 'saving' || status === 'publishing' ? '● ' : ''}
          {message}
        </div>
        <div className="visual-toolbar-actions">
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            disabled={!history.length}
            onClick={undo}
            title="Undo"
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            disabled={!future.length}
            onClick={redo}
            title="Redo"
          >
            <Redo2 size={16} /> Redo
          </button>
          <div className="visual-devices" aria-label="Preview device">
            <button
              type="button"
              className={device === 'desktop' ? 'active' : ''}
              onClick={() => setDevice('desktop')}
              title="Desktop preview"
            >
              <Monitor size={16} />
            </button>
            <button
              type="button"
              className={device === 'tablet' ? 'active' : ''}
              onClick={() => setDevice('tablet')}
              title="Tablet preview"
            >
              <Tablet size={16} />
            </button>
            <button
              type="button"
              className={device === 'mobile' ? 'active' : ''}
              onClick={() => setDevice('mobile')}
              title="Mobile preview"
            >
              <Smartphone size={16} />
            </button>
          </div>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            onClick={() => void saveDrafts()}
            disabled={!dirtyIds.size || status === 'saving'}
          >
            <Save size={16} /> Save draft
          </button>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={() => void publishPage()}
            disabled={status === 'publishing'}
          >
            <Send size={16} /> Publish
          </button>
        </div>
      </header>

      {addingPage && (
        <section className="visual-new-page-form" aria-label="Create a new page">
          <div>
            <strong>Create a page draft</strong>
            <p>The page will go live at a shareable static URL after you publish it.</p>
          </div>
          <label>
            Title
            <input
              autoFocus
              value={newPageTitle}
              placeholder="For example: Managed services"
              onChange={(event) => {
                setNewPageTitle(event.target.value);
                setNewPageSlug(slugFromTitle(event.target.value));
              }}
            />
          </label>
          <label>
            URL name
            <input
              value={newPageSlug}
              placeholder="managed-services"
              onChange={(event) => setNewPageSlug(slugFromTitle(event.target.value))}
            />
          </label>
          <button className="admin-btn admin-btn-primary" type="button" onClick={() => void createPage()}>
            Create draft
          </button>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setAddingPage(false)}>
            Cancel
          </button>
        </section>
      )}

      <div className="visual-editor-body">
        <aside className="visual-left-panel">
          <div className="visual-panel-heading">
            <Layers3 size={16} />
            <span>Pages & layers</span>
          </div>
          <div className="visual-page-tree">
            <button
              type="button"
              className="visual-tree-page"
              onClick={() => setLayersOpen((value) => !value)}
            >
              <ChevronDown
                size={15}
                className={layersOpen ? '' : 'collapsed'}
              />{' '}
              {page === 'home' ? 'Home' : 'Partners'}
            </button>
            {layersOpen &&
              pageLayers.map((layer) => {
                const entries = layer.repeating
                  ? documents.filter((document) => document.type === layer.type)
                  : [];
                const direct = layer.repeating
                  ? undefined
                  : findDocument(documents, layer.type, layer.slug);
                const active = Boolean(
                  selected &&
                  (direct?.id === selected.documentId ||
                    entries.some((entry) => entry.id === selected.documentId)),
                );
                return (
                  <div key={layer.id} className="visual-layer-group">
                    <button
                      type="button"
                      className={`visual-layer ${active ? 'active' : ''}`}
                      onClick={() => selectLayer(layer)}
                    >
                      <MousePointer2 size={13} /> {layer.label}{' '}
                      {layer.locked && <small>GLOBAL</small>}
                    </button>
                    {layer.repeating &&
                      entries.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          className={`visual-layer visual-layer-child ${selected?.documentId === entry.id ? 'active' : ''}`}
                          onClick={() => selectDocument(entry)}
                        >
                          <GripVertical size={13} /> {entry.title}
                        </button>
                      ))}
                  </div>
                );
              })}
          </div>
          {!isCustomPage && <div className="visual-add-block">
            <span>ADD BLOCK</span>
            {page === 'home' ? (
              <>
                <button
                  type="button"
                  onClick={() => void addRepeater('solution')}
                >
                  <Plus size={15} /> Solution card
                </button>
                <button
                  type="button"
                  onClick={() => void addRepeater('service')}
                >
                  <Plus size={15} /> Service row
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void addRepeater('partner')}
                >
                  <Plus size={15} /> Partner card
                </button>
                <button
                  type="button"
                  onClick={() => void addRepeater('client')}
                >
                  <Plus size={15} /> Client logo
                </button>
              </>
            )}
          </div>}
          {activeCustomPage && (
            <div className="visual-custom-page-info">
              <span>NEW PAGE</span>
              <strong>{activeCustomPage.title}</strong>
              <a href={customPageHref(activeCustomPage.slug)} target="_blank" rel="noreferrer">
                Open published URL
              </a>
            </div>
          )}
          <div className="visual-builder-library">
            <span>STRUCTURED BUILDER</span>
            <p>Add safe page blocks. Existing site sections stay protected.</p>
            <label className="visual-field">
              <span>Insert location</span>
              <select value={activeBuilderSlot} onChange={(event) => setActiveBuilderSlot(event.target.value as typeof activeBuilderSlot)}>
                {BUILDER_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
              </select>
            </label>
            <div className="visual-builder-outline">
              {builderPage.slots[activeBuilderSlot].length ? builderPage.slots[activeBuilderSlot].map((node) => (
                <button
                  key={node.id}
                  type="button"
                  draggable
                  className={`visual-layer ${selectedBuilderNodeId === node.id ? 'active' : ''}`}
                  onClick={() => { setSelectedBuilderNodeId(node.id); setSelected(null); }}
                  onDragStart={(event) => { event.dataTransfer.setData('application/x-infostorage-builder-node', node.id); setDraggedBuilderNodeId(node.id); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); moveBuilderBlock(node.id); }}
                >
                  <GripVertical size={13} /> {node.type}
                </button>
              )) : <small className="visual-builder-empty">Drop or add a block here.</small>}
            </div>
            <div className="visual-builder-elements">
              {[
                { type: 'section', label: 'Section', Icon: Box },
                { type: 'container', label: 'Container', Icon: Box },
                { type: 'heading', label: 'Heading', Icon: Heading },
                { type: 'text', label: 'Text', Icon: Text },
                { type: 'image', label: 'Image', Icon: ImageIcon },
                { type: 'button', label: 'Button', Icon: MousePointer2 },
                { type: 'columns', label: 'Columns', Icon: Columns3 },
                { type: 'card', label: 'Card', Icon: Box },
                { type: 'divider', label: 'Divider', Icon: Minus },
                { type: 'spacer', label: 'Spacer', Icon: Plus },
              ].map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  draggable
                  onClick={() => void addBuilderElement(type as BuilderNodeType)}
                  onDragStart={(event) => { event.dataTransfer.setData('application/x-infostorage-builder-new', type); event.dataTransfer.effectAllowed = 'copy'; }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main
          className="visual-canvas-area"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const type = event.dataTransfer.getData('application/x-infostorage-builder-new');
            if (type && ['section', 'container', 'heading', 'text', 'image', 'button', 'columns', 'card', 'divider', 'spacer'].includes(type)) void addBuilderElement(type as BuilderNodeType);
          }}
        >
          {!hasPageBindings && (
            <div className="visual-initialize-banner" role="status">
              <div>
                <strong>
                  These visible values are currently static fallbacks.
                </strong>
                <p>
                  Create CMS draft records to bind every heading, button, card,
                  and image to the editor. Nothing will be published
                  automatically.
                </p>
              </div>
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={initializing}
                onClick={() => void initializeEditableDrafts()}
              >
                {initializing
                  ? 'Preparing editable drafts…'
                  : 'Make this page editable'}
              </button>
            </div>
          )}
          <div className={`visual-canvas visual-canvas-${device}`}>
            {isCustomPage ? (
              <section className="visual-custom-page-cover">
                <p>Custom INFOStorage page</p>
                <h1>{activeCustomPage?.title}</h1>
                <span>{activeCustomPage && customPageHref(activeCustomPage.slug)}</span>
              </section>
            ) : page === 'home' ? (
              <HomePreview {...previewProps} />
            ) : (
              <PartnersPreview {...previewProps} />
            )}
            <section className="visual-builder-preview" aria-label="Custom block preview">
              <p>
                Custom blocks · {BUILDER_SLOTS.find((slot) => slot.id === activeBuilderSlot)?.label}
              </p>
              <PageBuilderRenderer
                page={builderPage}
                slot={activeBuilderSlot}
                editable
                selectedNodeId={selectedBuilderNodeId}
                onSelectNode={(nodeId) => { setSelectedBuilderNodeId(nodeId); setSelected(null); }}
                onDropNode={moveBuilderBlock}
                onDragStartNode={setDraggedBuilderNodeId}
              />
              {!builderPage.slots[activeBuilderSlot].length && (
                <div className="visual-builder-drop-target">
                  Drag an element here or choose one from the library.
                </div>
              )}
            </section>
          </div>
        </main>

        <aside className="visual-right-panel">
          <div className="visual-panel-heading">
            <MousePointer2 size={16} />
            <span>Content settings</span>
          </div>
          {selectedBuilderNode ? (
            <div className="visual-settings-content">
              <div className="visual-selection-label">
                <span>Structured block</span>
                <strong>{selectedBuilderNode.type}</strong>
                <small>Safe component settings only — no raw HTML or custom CSS.</small>
              </div>
              {['section', 'container', 'column', 'card'].includes(selectedBuilderNode.type) && (
                <label className="visual-field">
                  <span>Editor label</span>
                  <input value={String(selectedBuilderNode.props.label ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, label: event.target.value } }))} />
                </label>
              )}
              {['heading', 'text'].includes(selectedBuilderNode.type) && (
                <label className="visual-field">
                  <span>{selectedBuilderNode.type === 'heading' ? 'Heading' : 'Text'}</span>
                  <textarea value={String(selectedBuilderNode.props.text ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, text: event.target.value } }))} />
                </label>
              )}
              {selectedBuilderNode.type === 'heading' && (
                <label className="visual-field">
                  <span>Heading level</span>
                  <select value={String(selectedBuilderNode.props.level ?? 2)} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, level: Number(event.target.value) } }))}>
                    <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option><option value="4">H4</option>
                  </select>
                </label>
              )}
              {selectedBuilderNode.type === 'image' && (
                <>
                  <label className="visual-field">
                    <span>Image URL</span>
                    <input value={String(selectedBuilderNode.props.src ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, src: event.target.value } }))} />
                  </label>
                  <label className="visual-field">
                    <span>Alt text</span>
                    <input value={String(selectedBuilderNode.props.alt ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, alt: event.target.value } }))} />
                  </label>
                  {media.length > 0 && (
                    <label className="visual-field">
                      <span>Media library</span>
                      <select value="" onChange={(event) => { if (event.target.value) changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, src: event.target.value } })); }}>
                        <option value="">Choose an uploaded image…</option>
                        {media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}
                      </select>
                    </label>
                  )}
                </>
              )}
              {selectedBuilderNode.type === 'button' && (
                <>
                  <label className="visual-field"><span>Button label</span><input value={String(selectedBuilderNode.props.label ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, label: event.target.value } }))} /></label>
                  <label className="visual-field"><span>Destination</span><input value={String(selectedBuilderNode.props.href ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, href: event.target.value } }))} /></label>
                  <label className="visual-field"><span>Button treatment</span><select value={String(selectedBuilderNode.props.variant ?? 'primary')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, variant: event.target.value } }))}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></label>
                </>
              )}
              {selectedBuilderNode.type === 'columns' && (
                <label className="visual-field"><span>Desktop columns</span><select value={String(selectedBuilderNode.props.columns ?? 2)} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, columns: Number(event.target.value) } }))}><option value="1">One column</option><option value="2">Two columns</option><option value="3">Three columns</option></select></label>
              )}
              {selectedBuilderNode.type === 'spacer' && (
                <label className="visual-field"><span>Spacer size</span><select value={String(selectedBuilderNode.props.size ?? 'regular')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, size: event.target.value } }))}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
              )}
              <section className="visual-section-actions">
                <h3>Layout & visibility</h3>
                <label className="visual-field"><span>Colour treatment</span><select value={selectedBuilderNode.styles.tone} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, tone: event.target.value as BuilderNode['styles']['tone'] } }))}><option value="default">Default</option><option value="muted">Soft neutral</option><option value="brand">Brand dark</option></select></label>
                <label className="visual-field"><span>Vertical spacing</span><select value={selectedBuilderNode.styles.padding} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, padding: event.target.value as BuilderNode['styles']['padding'] } }))}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                <label className="visual-field"><span>Content alignment</span><select value={selectedBuilderNode.styles.align} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, align: event.target.value as BuilderNode['styles']['align'] } }))}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
                <label className="visual-field"><span>Visibility</span><select value={selectedBuilderNode.responsive.visibility} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { visibility: event.target.value as BuilderNode['responsive']['visibility'] } }))}><option value="all">All devices</option><option value="desktop">Desktop only</option><option value="mobile">Mobile only</option></select></label>
              </section>
              <section className="visual-section-actions">
                <h3>Block actions</h3>
                <button type="button" onClick={duplicateSelectedBuilderNode}><Copy size={15} /> Duplicate</button>
                <button type="button" className="danger" onClick={removeSelectedBuilderNode}><Archive size={15} /> Remove</button>
              </section>
            </div>
          ) : !selectedDocument ? (
            <div className="visual-empty-settings">
              <MousePointer2 size={24} />
              <p>
                Click a highlighted item in the preview, or choose a layer to
                edit it.
              </p>
            </div>
          ) : (
            <div className="visual-settings-content">
              <div className="visual-selection-label">
                <span>{selectedDocument.type.replace('_', ' ')}</span>
                <strong>{selectedDocument.title}</strong>
                <small>
                  {selectedDocument.status === 'published'
                    ? 'Published — edits stay draft until you publish'
                    : 'Draft'}
                </small>
              </div>
              {selectedDocument.type === 'navigation' && (
                <section className="visual-section-actions visual-header-editor">
                  <h3>Header navigation</h3>
                  <p>
                    Edit the shared header links. These labels and destinations
                    are used on every public page.
                  </p>
                  <label className="visual-field">
                    <span>Header button label</span>
                    <input
                      value={text(selectedDocument.data.ctaLabel, 'Start a conversation')}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: 'ctaLabel' },
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label className="visual-field">
                    <span>Header button destination</span>
                    <input
                      value={text(selectedDocument.data.ctaHref, '#contact')}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: 'ctaHref' },
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  {selectedHeaderLinks.map((item, index) => (
                    <div key={item.id} className="visual-header-link">
                      <input
                        aria-label={`Header label ${index + 1}`}
                        value={item.label}
                        placeholder="Link label"
                        onChange={(event) =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.map((link, linkIndex) =>
                              linkIndex === index
                                ? { ...link, label: event.target.value }
                                : link,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={`Header destination ${index + 1}`}
                        value={item.href}
                        placeholder="/destination or #section"
                        onChange={(event) =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.map((link, linkIndex) =>
                              linkIndex === index
                                ? { ...link, href: event.target.value }
                                : link,
                            ),
                          )
                        }
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            updateHeaderLinks(
                              selectedDocument.id,
                              selectedHeaderLinks.map((link, linkIndex) =>
                                linkIndex === index
                                  ? { ...link, enabled: event.target.checked }
                                  : link,
                              ),
                            )
                          }
                        />
                        Show
                      </label>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.filter(
                              (_, linkIndex) => linkIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateHeaderLinks(selectedDocument.id, [
                        ...selectedHeaderLinks,
                        {
                          id: `header-link-${Date.now()}`,
                          label: 'New link',
                          href: '#',
                          enabled: true,
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> Add header link
                  </button>
                </section>
              )}
              {selectedFields.map((field) => (
                <label key={field.key} className="visual-field">
                  <span>{fieldName(field.key)}</span>
                  {typeof field.value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: field.key },
                          event.target.checked,
                        )
                      }
                    />
                  ) : (
                    <>
                      {field.key === selected?.key &&
                      field.value.length > 90 ? (
                        <textarea
                          value={field.value}
                          onChange={(event) =>
                            updateField(
                              {
                                documentId: selectedDocument.id,
                                key: field.key,
                              },
                              event.target.value,
                            )
                          }
                        />
                      ) : (
                        <input
                          value={field.value}
                          onFocus={() =>
                            setSelected({
                              documentId: selectedDocument.id,
                              key: field.key,
                            })
                          }
                          onChange={(event) =>
                            updateField(
                              {
                                documentId: selectedDocument.id,
                                key: field.key,
                              },
                              event.target.value,
                            )
                          }
                        />
                      )}
                      {isMediaKey(field.key) && media.length > 0 && (
                        <select
                          value=""
                          onChange={(event) => {
                            if (event.target.value)
                              updateField(
                                {
                                  documentId: selectedDocument.id,
                                  key: field.key,
                                },
                                event.target.value,
                              );
                          }}
                        >
                          <option value="">Replace from media library…</option>
                          {media
                            .filter((asset) =>
                              asset.mimeType.startsWith('image/'),
                            )
                            .map((asset) => (
                              <option key={asset.id} value={asset.url}>
                                {asset.filename}
                              </option>
                            ))}
                        </select>
                      )}
                    </>
                  )}
                </label>
              ))}
              <section className="visual-section-actions">
                <h3>Block actions</h3>
                {['solution', 'service', 'partner', 'client'].includes(
                  selectedDocument.type,
                ) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void duplicateSelected()}
                    >
                      <Copy size={15} /> Duplicate
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void archiveSelected()}
                    >
                      <Archive size={15} /> Archive
                    </button>
                  </>
                ) : (
                  <p>
                    This is a protected layout or shared component. Its content
                    can change, but its placement stays safe.
                  </p>
                )}
              </section>
              <section className="visual-section-actions">
                <h3>Revision safety</h3>
                <p>
                  Every autosave creates a draft revision. Publishing never
                  exposes unsaved edits.
                </p>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type PreviewProps = {
  documents: CmsDocument[];
  selected: FieldRef | null;
  onSelect: (field: FieldRef) => void;
  onChange: (field: FieldRef, value: string) => void;
  onSelectDocument: (document: CmsDocument, key?: string) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  onDropRepeater: (type: string, targetId: string) => void;
};

function HomePreview(props: PreviewProps) {
  const {
    documents,
    selected,
    onSelect,
    onChange,
    onSelectDocument,
    draggedId,
    setDraggedId,
    onDropRepeater,
  } = props;
  const get = (type: string, slug: string) =>
    findDocument(documents, type, slug);
  const ref = (
    document: CmsDocument | undefined,
    key: string,
  ): FieldRef | undefined =>
    document ? { documentId: document.id, key } : undefined;
  const value = (
    document: CmsDocument | undefined,
    key: string,
    fallback: string,
  ) =>
    document
      ? key === '__title'
        ? document.title
        : text(document.data[key], fallback)
      : fallback;
  const site = get('site_settings', 'global');
  const navigation = get('navigation', 'main');
  const hero = get('home_section', 'hero');
  const approach = get('home_section', 'approach');
  const solutionsHeading = get('home_section', 'solutions-heading');
  const continuity = get('home_section', 'continuity');
  const servicesHeading = get('home_section', 'services-heading');
  const sectors = get('home_section', 'sectors');
  const contact = get('home_section', 'contact');
  const solutions = documents.filter(
    (document) => document.type === 'solution',
  );
  const services = documents.filter((document) => document.type === 'service');
  const logo = value(site, 'logo', DEFAULT_HOME.site.logo);
  const logoSelected =
    selected?.documentId === site?.id && selected?.key === 'logo';
  const solutionFallbacks = DEFAULT_HOME.solutions;
  const serviceFallbacks = DEFAULT_HOME.services;
  const navLinks = headerLinks(navigation?.data.items).length
    ? headerLinks(navigation?.data.items)
    : DEFAULT_HOME.navItems;

  return (
    <div className="site-shell visual-public-preview">
      <section
        className="hero visual-section"
        onClick={() => hero && onSelectDocument(hero)}
      >
        <nav
          className="nav-wrap visual-header-preview"
          onClick={(event) => {
            event.stopPropagation();
            if (navigation) onSelectDocument(navigation);
          }}
        >
          <span
            className="brand brand-image"
            role={site ? 'button' : undefined}
            tabIndex={site ? 0 : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (site) onSelectDocument(site, 'logo');
            }}
          >
            <span className="brand-logo-frame">
              <img className="brand-logo" src={logo} alt="INFOStorage" />
            </span>
          </span>
          <div className="desktop-links">
            {navLinks
              .filter((item) => item.enabled)
              .map((item) => <span key={item.id}>{item.label}</span>)}
          </div>
          <span className="nav-cta">
            <EditorText
              field={ref(navigation, 'ctaLabel')}
              value={value(navigation, 'ctaLabel', 'Start a conversation')}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </span>
        </nav>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">
              <EditorText
                field={ref(hero, 'eyebrow')}
                value={value(hero, 'eyebrow', DEFAULT_HOME.hero.eyebrow)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h1 className="hero-title">
              <EditorText
                field={ref(hero, 'titleA')}
                value={value(hero, 'titleA', DEFAULT_HOME.hero.titleA)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />{' '}
              <span>
                <EditorText
                  field={ref(hero, 'titleAccent')}
                  value={value(
                    hero,
                    'titleAccent',
                    DEFAULT_HOME.hero.titleAccent,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </h1>
            <p className="hero-description">
              <EditorText
                field={ref(hero, 'description')}
                value={value(
                  hero,
                  'description',
                  DEFAULT_HOME.hero.description,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <div className="hero-actions">
              <span className="button button-primary">
                <EditorText
                  field={ref(hero, 'primaryLabel')}
                  value={value(
                    hero,
                    'primaryLabel',
                    DEFAULT_HOME.hero.primaryLabel,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
              <span className="button button-quiet">
                <EditorText
                  field={ref(hero, 'secondaryLabel')}
                  value={value(
                    hero,
                    'secondaryLabel',
                    DEFAULT_HOME.hero.secondaryLabel,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </div>
          </div>
          <div className="hero-brand-stage">
            <div className="hero-logo-plaque">
              <img
                className={`visual-editable-image ${logoSelected ? 'visual-editable-selected' : ''}`}
                src={logo}
                alt="INFOStorage"
                role={site ? 'button' : undefined}
                tabIndex={site ? 0 : undefined}
                data-cms-document-id={site?.id}
                data-cms-field={site ? 'logo' : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  if (site) onSelectDocument(site, 'logo');
                }}
                onKeyDown={(event) => {
                  if (site && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSelectDocument(site, 'logo');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <section
        className="intro section-pad visual-section"
        onClick={() => approach && onSelectDocument(approach)}
      >
        <div className="section-kicker">
          <EditorText
            field={ref(approach, 'kicker')}
            value={value(approach, 'kicker', DEFAULT_HOME.approach.kicker)}
            selected={selected}
            onSelect={onSelect}
            onChange={onChange}
          />
        </div>
        <div className="intro-grid">
          <h2 className="display-heading">
            <EditorText
              field={ref(approach, 'headingA')}
              value={value(
                approach,
                'headingA',
                DEFAULT_HOME.approach.headingA,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
            <br />
            <em>
              <EditorText
                field={ref(approach, 'headingAccent')}
                value={value(
                  approach,
                  'headingAccent',
                  DEFAULT_HOME.approach.headingAccent,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </em>
          </h2>
          <div className="intro-copy">
            <p>
              <EditorText
                field={ref(approach, 'body')}
                value={value(approach, 'body', DEFAULT_HOME.approach.body)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
          </div>
        </div>
      </section>
      <section
        className="solutions-section section-pad visual-section"
        onClick={() => solutionsHeading && onSelectDocument(solutionsHeading)}
      >
        <div className="solutions-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(solutionsHeading, 'kicker')}
                value={value(
                  solutionsHeading,
                  'kicker',
                  DEFAULT_HOME.solutionsHeading.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2 className="display-heading">
              <EditorText
                field={ref(solutionsHeading, 'heading')}
                value={value(
                  solutionsHeading,
                  'heading',
                  DEFAULT_HOME.solutionsHeading.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(solutionsHeading, 'body')}
              value={value(
                solutionsHeading,
                'body',
                DEFAULT_HOME.solutionsHeading.body,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="solutions-grid">
          {(solutions.length ? solutions : solutionFallbacks).map(
            (item, index) => {
              const document = 'id' in item ? (item as CmsDocument) : undefined;
              const fallback = document ? undefined : (item as SolutionContent);
              return (
                <article
                  key={document?.id ?? fallback?.title}
                  className={`solution-card visual-repeater ${draggedId === document?.id ? 'dragging' : ''}`}
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('solution', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <div className="solution-topline">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <GripVertical size={18} />
                  </div>
                  <h3>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback?.title ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </h3>
                  <p>
                    <EditorText
                      field={ref(document, 'description')}
                      value={value(
                        document,
                        'description',
                        fallback?.description ?? '',
                      )}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </p>
                </article>
              );
            },
          )}
        </div>
      </section>
      <section
        className="continuity-panel section-pad visual-section"
        onClick={() => continuity && onSelectDocument(continuity)}
      >
        <div className="continuity-art" />
        <div className="continuity-copy">
          <p className="eyebrow">
            <EditorText
              field={ref(continuity, 'eyebrow')}
              value={value(
                continuity,
                'eyebrow',
                DEFAULT_HOME.continuity.eyebrow,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2>
            <EditorText
              field={ref(continuity, 'heading')}
              value={value(
                continuity,
                'heading',
                DEFAULT_HOME.continuity.heading,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
          <p>
            <EditorText
              field={ref(continuity, 'body')}
              value={value(continuity, 'body', DEFAULT_HOME.continuity.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
      </section>
      <section
        className="services-section section-pad visual-section"
        onClick={() => servicesHeading && onSelectDocument(servicesHeading)}
      >
        <div className="services-head">
          <p className="section-kicker">
            <EditorText
              field={ref(servicesHeading, 'kicker')}
              value={value(
                servicesHeading,
                'kicker',
                DEFAULT_HOME.servicesHead.kicker,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2 className="display-heading">
            <EditorText
              field={ref(servicesHeading, 'heading')}
              value={value(
                servicesHeading,
                'heading',
                DEFAULT_HOME.servicesHead.heading,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
        </div>
        <div className="service-list">
          {(services.length ? services : serviceFallbacks).map(
            (item, index) => {
              const document =
                typeof item === 'object' ? (item as CmsDocument) : undefined;
              const fallback = typeof item === 'string' ? item : '';
              return (
                <div
                  key={document?.id ?? fallback}
                  className="service-row visual-repeater"
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('service', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback)}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </strong>
                  <GripVertical size={18} />
                </div>
              );
            },
          )}
        </div>
      </section>
      <section
        className="sectors section-pad visual-section"
        onClick={() => sectors && onSelectDocument(sectors)}
      >
        <div className="sectors-copy">
          <p className="section-kicker">
            <EditorText
              field={ref(sectors, 'kicker')}
              value={value(sectors, 'kicker', DEFAULT_HOME.sectors.kicker)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2 className="display-heading">
            <EditorText
              field={ref(sectors, 'heading')}
              value={value(sectors, 'heading', DEFAULT_HOME.sectors.heading)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
        </div>
      </section>
      <section
        className="contact-panel visual-section"
        onClick={() => contact && onSelectDocument(contact)}
      >
        <div className="contact-content">
          <p className="eyebrow">
            <EditorText
              field={ref(contact, 'eyebrow')}
              value={value(contact, 'eyebrow', DEFAULT_HOME.contact.eyebrow)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2>
            <EditorText
              field={ref(contact, 'heading')}
              value={value(contact, 'heading', DEFAULT_HOME.contact.heading)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
          <p>
            <EditorText
              field={ref(contact, 'body')}
              value={value(contact, 'body', DEFAULT_HOME.contact.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
      </section>
    </div>
  );
}

function PartnersPreview(props: PreviewProps) {
  const {
    documents,
    selected,
    onSelect,
    onChange,
    onSelectDocument,
    draggedId,
    setDraggedId,
    onDropRepeater,
  } = props;
  const get = (type: string, slug: string) =>
    findDocument(documents, type, slug);
  const ref = (
    document: CmsDocument | undefined,
    key: string,
  ): FieldRef | undefined =>
    document ? { documentId: document.id, key } : undefined;
  const value = (
    document: CmsDocument | undefined,
    key: string,
    fallback: string,
  ) =>
    document
      ? key === '__title'
        ? document.title
        : text(document.data[key], fallback)
      : fallback;
  const hero = get('page_section', 'partners-hero');
  const navigation = get('navigation', 'main');
  const site = get('site_settings', 'global');
  const directory = get('page_section', 'partners-directory');
  const clientsHead = get('page_section', 'partners-clients');
  const partners = documents.filter((document) => document.type === 'partner');
  const clients = documents.filter((document) => document.type === 'client');
  const partnerFallbacks = DEFAULT_PARTNERS.partners;
  const clientFallbacks = DEFAULT_PARTNERS.clients;
  const navLinks = headerLinks(navigation?.data.items).length
    ? headerLinks(navigation?.data.items)
    : DEFAULT_PARTNERS.navItems;
  return (
    <div className="partner-page visual-public-preview">
      <section
        className="partner-hero visual-section"
        onClick={() => hero && onSelectDocument(hero)}
      >
        <nav
          className="nav-wrap visual-header-preview"
          onClick={(event) => {
            event.stopPropagation();
            if (navigation) onSelectDocument(navigation);
          }}
        >
          <span
            className="brand"
            role={site ? 'button' : undefined}
            tabIndex={site ? 0 : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (site) onSelectDocument(site, 'logo');
            }}
          >
            INFOStorage
          </span>
          <div className="desktop-links">
            {navLinks
              .filter((item) => item.enabled)
              .map((item) => <span key={item.id}>{item.label}</span>)}
          </div>
          <span className="nav-cta">
            <EditorText
              field={ref(navigation, 'ctaLabel')}
              value={value(navigation, 'ctaLabel', 'Start a conversation')}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </span>
        </nav>
        <div className="partner-hero-inner section-pad">
          <div className="partner-hero-copy">
            <p className="eyebrow">
              <EditorText
                field={ref(hero, 'eyebrow')}
                value={value(hero, 'eyebrow', DEFAULT_PARTNERS.hero.eyebrow)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h1 className="partner-title">
              <EditorText
                field={ref(hero, 'titleA')}
                value={value(hero, 'titleA', DEFAULT_PARTNERS.hero.titleA)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />{' '}
              <span>
                <EditorText
                  field={ref(hero, 'titleAccent')}
                  value={value(
                    hero,
                    'titleAccent',
                    DEFAULT_PARTNERS.hero.titleAccent,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </h1>
            <p className="partner-description">
              <EditorText
                field={ref(hero, 'description')}
                value={value(
                  hero,
                  'description',
                  DEFAULT_PARTNERS.hero.description,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
          </div>
        </div>
      </section>
      <section
        className="partner-directory section-pad visual-section"
        onClick={() => directory && onSelectDocument(directory)}
      >
        <div className="partner-directory-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(directory, 'kicker')}
                value={value(
                  directory,
                  'kicker',
                  DEFAULT_PARTNERS.directory.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2 className="display-heading">
              <EditorText
                field={ref(directory, 'heading')}
                value={value(
                  directory,
                  'heading',
                  DEFAULT_PARTNERS.directory.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(directory, 'body')}
              value={value(directory, 'body', DEFAULT_PARTNERS.directory.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="partner-grid">
          {(partners.length ? partners : partnerFallbacks).map(
            (item, index) => {
              const document = 'id' in item ? (item as CmsDocument) : undefined;
              const fallback = document ? undefined : (item as PartnerContent);
              return (
                <article
                  key={document?.id ?? fallback?.name}
                  className="partner-card visual-repeater"
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('partner', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback?.name ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </h3>
                  <p>
                    <EditorText
                      field={ref(document, 'focus')}
                      value={value(document, 'focus', fallback?.focus ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </p>
                  <GripVertical size={16} />
                </article>
              );
            },
          )}
        </div>
      </section>
      <section
        className="partner-clients section-pad visual-section"
        onClick={() => clientsHead && onSelectDocument(clientsHead)}
      >
        <div className="partner-clients-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(clientsHead, 'kicker')}
                value={value(
                  clientsHead,
                  'kicker',
                  DEFAULT_PARTNERS.clientsHead.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2>
              <EditorText
                field={ref(clientsHead, 'heading')}
                value={value(
                  clientsHead,
                  'heading',
                  DEFAULT_PARTNERS.clientsHead.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(clientsHead, 'body')}
              value={value(
                clientsHead,
                'body',
                DEFAULT_PARTNERS.clientsHead.body,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="partner-clients-grid">
          {(clients.length ? clients : clientFallbacks).map((item, index) => {
            const document = 'id' in item ? (item as CmsDocument) : undefined;
            const fallback = document ? undefined : (item as ClientContent);
            return (
              <article
                key={document?.id ?? fallback?.name}
                className={`partner-client-card visual-repeater ${draggedId === document?.id ? 'dragging' : ''}`}
                draggable={Boolean(document)}
                onDragStart={() => document && setDraggedId(document.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => document && onDropRepeater('client', document.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (document) onSelectDocument(document);
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {text(document?.data.logo, fallback?.logo ?? '') ? (
                  <img
                    src={text(document?.data.logo, fallback?.logo ?? '')}
                    alt="Client logo"
                  />
                ) : (
                  <ImageIcon size={30} />
                )}
                <small>
                  <EditorText
                    field={ref(document, '__title')}
                    value={value(document, '__title', fallback?.name ?? '')}
                    selected={selected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                </small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
