PRAGMA foreign_keys = ON;

ALTER TABLE cms_users
ADD COLUMN password_scheme TEXT NOT NULL DEFAULT 'pbkdf2-sha256-v1';

CREATE TABLE IF NOT EXISTS cms_password_recovery_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES cms_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS cms_password_recovery_tokens_lookup_idx
ON cms_password_recovery_tokens(token_hash, used_at, expires_at);

CREATE INDEX IF NOT EXISTS cms_password_recovery_tokens_user_idx
ON cms_password_recovery_tokens(user_id, created_at DESC);
