'use client';

export type MediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
};

type StructuredFieldsProps = {
  data: Record<string, unknown>;
  media: MediaAsset[];
  disabled?: boolean;
  onChange: (data: Record<string, unknown>) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function fieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function prefersTextarea(key: string): boolean {
  return /(?:body|description|note|text|summary|content)$/i.test(key);
}

function isMediaField(key: string): boolean {
  return /(?:logo|image)$/i.test(key) || /(?:heroImage|backgroundImage|ogImage)$/i.test(key);
}

export function StructuredFields({ data, media, disabled = false, onChange }: StructuredFieldsProps) {
  const update = (key: string, value: unknown) => onChange({ ...data, [key]: value });
  const entries = Object.entries(data).filter(([key]) => key !== 'blocks');

  if (entries.length === 0) return null;

  return (
    <section className="admin-card" style={{ marginBottom: '1.5rem' }} aria-label="Structured content fields">
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 600 }}>Structured content</h2>
      <p style={{ margin: '0 0 1.25rem', color: '#735568', fontSize: '0.84rem' }}>
        These fields match the public section directly. Save a draft before publishing it.
      </p>

      {entries.map(([key, value]) => {
        if (typeof value === 'boolean') {
          return (
            <label key={key} className="admin-form-group" style={{ alignItems: 'flex-start', flexDirection: 'row', gap: '0.7rem' }}>
              <input
                type="checkbox"
                checked={value}
                disabled={disabled}
                onChange={(event) => update(key, event.target.checked)}
                style={{ marginTop: '0.2rem' }}
              />
              <span>
                <strong style={{ display: 'block', color: '#2a0d1c' }}>{fieldLabel(key)}</strong>
                <span style={{ color: '#735568', fontSize: '0.8rem' }}>Turn this content on or off on the public site.</span>
              </span>
            </label>
          );
        }

        if (isStringArray(value)) {
          return (
            <label key={key} className="admin-form-group">
              <span>{fieldLabel(key)}</span>
              <textarea
                value={value.join('\n')}
                disabled={disabled}
                onChange={(event) => update(key, event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
                placeholder="One item per line"
              />
              <span style={{ color: '#735568', fontSize: '0.78rem' }}>Enter one item per line. Their order is preserved.</span>
            </label>
          );
        }

        if (isRecordArray(value)) {
          return (
            <fieldset key={key} className="admin-form-group" style={{ border: 0, margin: '0 0 1.25rem', padding: 0 }}>
              <legend style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2a0d1c', marginBottom: '0.5rem' }}>{fieldLabel(key)}</legend>
              {value.map((item, index) => (
                <div key={`${key}-${index}`} style={{ display: 'grid', gap: '0.6rem', border: '1px solid rgba(130, 0, 64, 0.12)', borderRadius: '0.5rem', padding: '0.85rem', marginBottom: '0.6rem' }}>
                  {Object.entries(item).map(([itemKey, itemValue]) => (
                    <label key={itemKey} className="admin-form-group" style={{ margin: 0 }}>
                      <span>{fieldLabel(itemKey)}</span>
                      {typeof itemValue === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={itemValue}
                          disabled={disabled}
                          onChange={(event) => {
                            const next = value.map((entry, itemIndex) => itemIndex === index ? { ...entry, [itemKey]: event.target.checked } : entry);
                            update(key, next);
                          }}
                        />
                      ) : prefersTextarea(itemKey) ? (
                        <textarea
                          value={typeof itemValue === 'string' ? itemValue : ''}
                          disabled={disabled}
                          onChange={(event) => {
                            const next = value.map((entry, itemIndex) => itemIndex === index ? { ...entry, [itemKey]: event.target.value } : entry);
                            update(key, next);
                          }}
                        />
                      ) : (
                        <input
                          value={typeof itemValue === 'string' || typeof itemValue === 'number' ? String(itemValue) : ''}
                          disabled={disabled}
                          onChange={(event) => {
                            const next = value.map((entry, itemIndex) => itemIndex === index ? { ...entry, [itemKey]: event.target.value } : entry);
                            update(key, next);
                          }}
                        />
                      )}
                    </label>
                  ))}
                  <button
                    className="admin-btn admin-btn-danger"
                    type="button"
                    disabled={disabled}
                    onClick={() => update(key, value.filter((_, itemIndex) => itemIndex !== index))}
                    style={{ justifySelf: 'start' }}
                  >
                    Remove item
                  </button>
                </div>
              ))}
              <button
                className="admin-btn admin-btn-secondary"
                type="button"
                disabled={disabled}
                onClick={() => update(key, [...value, { title: '', text: '' }])}
                style={{ justifySelf: 'start' }}
              >
                Add item
              </button>
            </fieldset>
          );
        }

        if (isRecord(value)) {
          return (
            <label key={key} className="admin-form-group">
              <span>{fieldLabel(key)}</span>
              <textarea
                value={JSON.stringify(value, null, 2)}
                disabled={disabled}
                onChange={(event) => {
                  try {
                    const parsed: unknown = JSON.parse(event.target.value);
                    if (isRecord(parsed)) update(key, parsed);
                  } catch {
                    // Keep partially typed JSON in the field until it is valid.
                  }
                }}
              />
            </label>
          );
        }

        const textValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
        return (
          <label key={key} className="admin-form-group">
            <span>{fieldLabel(key)}</span>
            {prefersTextarea(key) ? (
              <textarea value={textValue} disabled={disabled} onChange={(event) => update(key, event.target.value)} />
            ) : (
              <input value={textValue} disabled={disabled} onChange={(event) => update(key, event.target.value)} />
            )}
            {isMediaField(key) && media.length > 0 && (
              <select
                value=""
                disabled={disabled}
                onChange={(event) => {
                  if (event.target.value) update(key, event.target.value);
                }}
              >
                <option value="">Choose from media library…</option>
                {media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => (
                  <option key={asset.id} value={asset.url}>{asset.filename}</option>
                ))}
              </select>
            )}
          </label>
        );
      })}
    </section>
  );
}
