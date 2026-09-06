-- The initial page-tree migration used a SQL literal for the partner method
-- list. SQLite preserves \n in a literal, so convert that one field back to
-- real line breaks for the builder's repeatable-entry parser.
UPDATE cms_documents
SET
  data_json = json_set(
    data_json,
    '$.slots.afterServices[0].props.items',
    replace(
      json_extract(data_json, '$.slots.afterServices[0].props.items'),
      '\n',
      char(10)
    )
  ),
  published_data_json = json_set(
    published_data_json,
    '$.slots.afterServices[0].props.items',
    replace(
      json_extract(published_data_json, '$.slots.afterServices[0].props.items'),
      '\n',
      char(10)
    )
  ),
  current_revision = current_revision + 1,
  published_revision = current_revision + 1,
  published_by = updated_by,
  updated_at = CURRENT_TIMESTAMP,
  published_at = CURRENT_TIMESTAMP
WHERE type = 'builder_page'
  AND slug = 'partners'
  AND status = 'published'
  AND json_extract(data_json, '$.slots.afterServices[0].props.items') LIKE '%\n%';

INSERT INTO cms_document_revisions (id, document_id, revision_number, title, slug, data_json, note, created_by, created_at)
SELECT
  lower(hex(randomblob(16))),
  id,
  current_revision,
  title,
  slug,
  data_json,
  'Restored partner method list entries after page-tree migration',
  updated_by,
  CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page'
  AND slug = 'partners'
  AND status = 'published';

INSERT INTO cms_audit_log (id, user_id, action, resource_type, resource_id, detail, created_at)
SELECT
  lower(hex(randomblob(16))),
  updated_by,
  'document.migrate',
  'builder_page',
  id,
  'Restored partner method list entries after page-tree migration',
  CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page'
  AND slug = 'partners'
  AND status = 'published';
