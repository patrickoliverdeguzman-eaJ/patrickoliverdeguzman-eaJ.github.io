PRAGMA foreign_keys = ON;

ALTER TABLE cms_documents ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS cms_documents_order_idx ON cms_documents(sort_order ASC, updated_at DESC);

CREATE TABLE IF NOT EXISTS cms_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS cms_audit_log_created_idx ON cms_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS cms_audit_log_resource_idx ON cms_audit_log(resource_type, resource_id);
