'use client';

import { CMS_API } from '@/lib/cms-api';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, FileText, Video, File, Search } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  altText: string;
  title: string;
  caption: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  url: string;
}

interface MediaResponse {
  media: MediaItem[];
}

const allowedMediaTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]);

export function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    const token = localStorage.getItem('cms_token');
    try {
      const res = await fetch(`${CMS_API}/v1/admin/media`, { headers: { authorization: `Bearer ${token}` } });
      const data: MediaResponse = await res.json();
      setMedia(data.media ?? []);
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const uploadFiles = async (files: File[]) => {
    const token = localStorage.getItem('cms_token');
    setUploading(true);
    for (const file of files) {
      try {
        if (!allowedMediaTypes.has(file.type)) {
          setNotice(`${file.name} is not a supported image or PDF.`);
          continue;
        }
        if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
          setNotice(`${file.name} must be between 1 byte and 10 MB.`);
          continue;
        }
        const res = await fetch(`${CMS_API}/v1/admin/media`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': file.type,
            'X-File-Name': file.name,
          },
          body: file,
        });
        if (res.ok) {
          const data: { media: MediaItem } = await res.json();
          if (data.media) setMedia((prev) => [data.media, ...prev]);
        } else {
          setNotice(`Could not upload ${file.name}.`);
        }
      } catch {
        setNotice(`Could not upload ${file.name}.`);
      }
    }
    setUploading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
  };

  const deleteMedia = async (id: string) => {
    const item = media.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Delete “${item.filename}”? Existing pages using its URL may show a broken image.`)) return;
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/media/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setNotice('The media file could not be deleted.');
      return;
    }
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setNotice(`${item.filename} was deleted.`);
  };

  const changeMetadata = (id: string, field: 'altText' | 'title' | 'caption', value: string) => {
    setMedia((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const saveMetadata = async (item: MediaItem) => {
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ altText: item.altText, title: item.title, caption: item.caption }),
    });
    if (!response.ok) {
      setNotice(`Could not save metadata for ${item.filename}.`);
      return;
    }
    setNotice(`Metadata saved for ${item.filename}.`);
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setNotice(`${item.filename} URL copied. You can paste it into an image or logo field.`);
    } catch {
      setNotice('Could not copy the media URL.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={24} color="#820040" />;
    if (mimeType.startsWith('video/')) return <Video size={24} color="#735568" />;
    if (mimeType === 'application/pdf') return <FileText size={24} color="#735568" />;
    return <File size={24} color="#735568" />;
  };

  const filteredMedia = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return media;
    return media.filter((item) => [item.filename, item.altText, item.title, item.caption].some((value) => value.toLowerCase().includes(query)));
  }, [media, search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Media Library</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()} type="button">
          <Upload size={16} /> Upload
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf" onChange={handleFileInput} style={{ display: 'none' }} />
      </div>

      <div
        className={`admin-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: '1.5rem', cursor: 'pointer', minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <>
            <Upload size={32} />
            <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Drag & drop files here</p>
            <p style={{ fontSize: '0.78rem' }}>or click to browse — JPEG, PNG, WebP, AVIF, GIF, and PDF files up to 10 MB</p>
          </>
        )}
      </div>

      {notice && <p style={{ margin: '0 0 1rem', color: '#735568', fontSize: '0.82rem' }}>{notice}</p>}

      <label className="admin-media-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search media</span>
        <input type="search" value={search} placeholder="Search images and metadata" onChange={(event) => setSearch(event.target.value)} />
      </label>

      {loading ? (
        <div className="admin-empty"><p>Loading media...</p></div>
      ) : media.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <FileText size={32} style={{ marginBottom: '0.5rem' }} />
            <p>No media files yet.</p>
          </div>
        </div>
      ) : (
        <div className="admin-media-grid">
          {filteredMedia.map((item) => (
            <div key={item.id} className="admin-media-item">
              <div style={{ height: 140, display: 'grid', placeItems: 'center', background: '#faf5f7', overflow: 'hidden' }}>
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.altText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getIcon(item.mimeType)
                )}
              </div>
              <div className="info">
                <p style={{ fontWeight: 600 }}>{item.filename}</p>
                <p>{formatSize(item.byteSize)}</p>
                {item.mimeType.startsWith('image/') && <div className="admin-media-metadata">
                  <label>Alternative text<input value={item.altText} maxLength={240} onChange={(event) => changeMetadata(item.id, 'altText', event.target.value)} onBlur={() => void saveMetadata(item)} /></label>
                  <label>Title<input value={item.title} maxLength={240} onChange={(event) => changeMetadata(item.id, 'title', event.target.value)} onBlur={() => void saveMetadata(item)} /></label>
                  <label>Caption<textarea value={item.caption} maxLength={500} rows={2} onChange={(event) => changeMetadata(item.id, 'caption', event.target.value)} onBlur={() => void saveMetadata(item)} /></label>
                </div>}
                <button className="admin-btn admin-btn-secondary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} onClick={() => void copyUrl(item)} type="button">
                  Copy URL
                </button>
                <button className="admin-btn admin-btn-danger" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} onClick={() => deleteMedia(item.id)} type="button">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
          {!filteredMedia.length && <div className="admin-empty"><p>No media matches “{search}”.</p></div>}
        </div>
      )}
    </div>
  );
}
