PRAGMA foreign_keys = ON;

ALTER TABLE cms_documents ADD COLUMN scheduled_at TEXT;
CREATE INDEX IF NOT EXISTS cms_documents_schedule_idx
  ON cms_documents(scheduled_at)
  WHERE scheduled_at IS NOT NULL;

ALTER TABLE cms_media ADD COLUMN title_text TEXT NOT NULL DEFAULT '';
ALTER TABLE cms_media ADD COLUMN caption TEXT NOT NULL DEFAULT '';
