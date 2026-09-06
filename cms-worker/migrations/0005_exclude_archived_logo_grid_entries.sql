PRAGMA foreign_keys = ON;

-- An archived client is intentionally absent from the public directory. Keep
-- the immutable 19-card grid source in sync with that CMS publication rule.
WITH live_clients AS (
  SELECT COALESCE(group_concat(
    title || '|' || COALESCE(json_extract(data_json, '$.logo'), '') || '|' ||
    CASE title
      WHEN 'Government Service Insurance System' THEN 'client-logo-gsis'
      WHEN 'League One Finance and Leasing Corporation' THEN 'client-logo-league'
      WHEN 'Global Payments' THEN 'client-logo-wide-white'
      WHEN 'Credit Information Corporation' THEN 'client-logo-wide-white'
      WHEN 'DENR Biodiversity Management Bureau' THEN 'client-logo-denr'
      WHEN 'Hitachi Digital Services' THEN 'client-logo-wide-white'
      WHEN 'Amdocs' THEN 'client-logo-amdocs'
      WHEN '7-Eleven' THEN 'client-logo-7eleven'
      WHEN 'Cathay United Bank' THEN 'client-logo-cathay'
      ELSE ''
    END,
    char(10)
  ), '') AS items
  FROM cms_documents
  WHERE type = 'client' AND status = 'published'
)
UPDATE cms_documents
SET
  data_json = json_set(data_json, '$.slots.afterSolutions[0].props.items', (SELECT items FROM live_clients)),
  published_data_json = json_set(published_data_json, '$.slots.afterSolutions[0].props.items', (SELECT items FROM live_clients)),
  current_revision = current_revision + 1,
  published_revision = current_revision + 1,
  published_by = updated_by,
  updated_at = CURRENT_TIMESTAMP,
  published_at = CURRENT_TIMESTAMP
WHERE type = 'builder_page' AND slug = 'partners';

INSERT INTO cms_document_revisions (id, document_id, revision_number, title, slug, data_json, note, created_by, created_at)
SELECT lower(hex(randomblob(16))), id, current_revision, title, slug, data_json, 'Excluded archived client entries from the public logo grid', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug = 'partners';

INSERT INTO cms_audit_log (id, user_id, action, resource_type, resource_id, detail, created_at)
SELECT lower(hex(randomblob(16))), updated_by, 'document.migrate', 'builder_page', id, 'Excluded archived client entries from the public logo grid', CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug = 'partners';
