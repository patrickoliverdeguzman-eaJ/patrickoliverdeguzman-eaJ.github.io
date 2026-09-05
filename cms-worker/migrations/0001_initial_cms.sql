PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cms_sessions_token_idx ON cms_sessions(token_hash);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry_idx ON cms_sessions(expires_at);

CREATE TABLE IF NOT EXISTS cms_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  data_json TEXT NOT NULL,
  published_data_json TEXT,
  current_revision INTEGER NOT NULL DEFAULT 1,
  published_revision INTEGER,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  published_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  UNIQUE(type, slug),
  FOREIGN KEY (created_by) REFERENCES cms_users(id),
  FOREIGN KEY (updated_by) REFERENCES cms_users(id),
  FOREIGN KEY (published_by) REFERENCES cms_users(id)
);

CREATE INDEX IF NOT EXISTS cms_documents_admin_idx ON cms_documents(type, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS cms_documents_public_idx ON cms_documents(type, slug, status);

CREATE TABLE IF NOT EXISTS cms_document_revisions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  data_json TEXT NOT NULL,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, revision_number),
  FOREIGN KEY (document_id) REFERENCES cms_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES cms_users(id)
);

CREATE INDEX IF NOT EXISTS cms_revisions_document_idx ON cms_document_revisions(document_id, revision_number DESC);

CREATE TABLE IF NOT EXISTS cms_media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES cms_users(id)
);

CREATE INDEX IF NOT EXISTS cms_media_created_idx ON cms_media(created_at DESC);
