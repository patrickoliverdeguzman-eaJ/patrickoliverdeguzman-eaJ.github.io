PRAGMA foreign_keys = ON;

ALTER TABLE cms_chat_conversations ADD COLUMN admin_read_at TEXT;

CREATE TABLE IF NOT EXISTS cms_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cms_rate_limits_updated_idx
ON cms_rate_limits(updated_at);

-- Remove editor-created placeholder rows that accidentally reached the live
-- builder pages. Both the draft and published snapshots are corrected so a
-- later save cannot reintroduce the same rows.
INSERT INTO cms_audit_log (
  id, user_id, action, resource_type, resource_id, detail, created_at
)
SELECT lower(hex(randomblob(16))), updated_by, 'document.cleanup', 'builder_page', id,
  'Removed placeholder rows from the live builder page', CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('home', 'partners')
  AND (
    instr(data_json, 'New solution') > 0 OR
    instr(data_json, 'New service') > 0 OR
    instr(data_json, 'New partner') > 0 OR
    instr(COALESCE(published_data_json, ''), 'New solution') > 0 OR
    instr(COALESCE(published_data_json, ''), 'New service') > 0 OR
    instr(COALESCE(published_data_json, ''), 'New partner') > 0
  );

-- Record a new draft revision only when the draft itself changes. Cleaning a
-- published snapshot must not pretend that unrelated unpublished draft edits
-- were also published.
INSERT INTO cms_document_revisions (
  id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
)
SELECT lower(hex(randomblob(16))), id, current_revision + 1, title, slug,
  json_set(
    json_set(
      data_json,
      '$.slots.afterSolutions[0].props.items',
      replace(
        replace(COALESCE(json_extract(data_json, '$.slots.afterSolutions[0].props.items'), ''), char(10) || 'New solution||', ''),
        char(10) || 'Test||',
        ''
      )
    ),
    '$.slots.afterServices[1].props.items',
    replace(COALESCE(json_extract(data_json, '$.slots.afterServices[1].props.items'), ''), char(10) || 'New service', '')
  ),
  'Removed placeholder content and enabled publish validation', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug = 'home'
  AND (instr(data_json, 'New solution') > 0 OR instr(data_json, 'New service') > 0 OR instr(data_json, 'Test') > 0);

UPDATE cms_documents
SET data_json = CASE
      WHEN instr(data_json, 'New solution') > 0 OR instr(data_json, 'New service') > 0 OR instr(data_json, 'Test') > 0
      THEN json_set(
      json_set(
        data_json,
        '$.slots.afterSolutions[0].props.items',
        replace(
          replace(COALESCE(json_extract(data_json, '$.slots.afterSolutions[0].props.items'), ''), char(10) || 'New solution||', ''),
          char(10) || 'Test||',
          ''
        )
      ),
      '$.slots.afterServices[1].props.items',
      replace(COALESCE(json_extract(data_json, '$.slots.afterServices[1].props.items'), ''), char(10) || 'New service', '')
    ) ELSE data_json END,
    published_data_json = CASE
      WHEN published_data_json IS NOT NULL AND (
        instr(published_data_json, 'New solution') > 0 OR
        instr(published_data_json, 'New service') > 0 OR
        instr(published_data_json, 'Test') > 0
      ) THEN json_set(
        json_set(
          published_data_json,
          '$.slots.afterSolutions[0].props.items',
          replace(
            replace(COALESCE(json_extract(published_data_json, '$.slots.afterSolutions[0].props.items'), ''), char(10) || 'New solution||', ''),
            char(10) || 'Test||',
            ''
          )
        ),
        '$.slots.afterServices[1].props.items',
        replace(COALESCE(json_extract(published_data_json, '$.slots.afterServices[1].props.items'), ''), char(10) || 'New service', '')
      ) ELSE published_data_json END,
    current_revision = current_revision + CASE
      WHEN instr(data_json, 'New solution') > 0 OR instr(data_json, 'New service') > 0 OR instr(data_json, 'Test') > 0 THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP,
    published_at = CASE
      WHEN published_data_json IS NOT NULL AND (
        instr(published_data_json, 'New solution') > 0 OR
        instr(published_data_json, 'New service') > 0 OR
        instr(published_data_json, 'Test') > 0
      ) THEN CURRENT_TIMESTAMP ELSE published_at END
WHERE type = 'builder_page' AND slug = 'home'
  AND (
    instr(data_json, 'New solution') > 0 OR
    instr(data_json, 'New service') > 0 OR
    instr(data_json, 'Test') > 0 OR
    instr(COALESCE(published_data_json, ''), 'New solution') > 0 OR
    instr(COALESCE(published_data_json, ''), 'New service') > 0 OR
    instr(COALESCE(published_data_json, ''), 'Test') > 0
  );

UPDATE cms_documents
SET data_json = CASE WHEN instr(data_json, 'New partner') > 0 THEN json_set(
      data_json,
      '$.slots.afterApproach[0].props.items',
      replace(COALESCE(json_extract(data_json, '$.slots.afterApproach[0].props.items'), ''), char(10) || 'New partner|', '')
    ) ELSE data_json END,
    published_data_json = CASE WHEN published_data_json IS NOT NULL AND instr(published_data_json, 'New partner') > 0 THEN json_set(
      published_data_json,
      '$.slots.afterApproach[0].props.items',
      replace(COALESCE(json_extract(published_data_json, '$.slots.afterApproach[0].props.items'), ''), char(10) || 'New partner|', '')
    ) ELSE published_data_json END,
    current_revision = current_revision + CASE WHEN instr(data_json, 'New partner') > 0 THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP,
    published_at = CASE WHEN published_data_json IS NOT NULL AND instr(published_data_json, 'New partner') > 0 THEN CURRENT_TIMESTAMP ELSE published_at END
WHERE type = 'builder_page' AND slug = 'partners'
  AND (instr(data_json, 'New partner') > 0 OR instr(COALESCE(published_data_json, ''), 'New partner') > 0);
