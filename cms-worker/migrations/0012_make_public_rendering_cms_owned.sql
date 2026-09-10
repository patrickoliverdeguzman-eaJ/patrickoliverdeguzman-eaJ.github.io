PRAGMA foreign_keys = ON;

-- Store the complete visual token set in the CMS instead of relying on the
-- frontend's editor defaults. This makes the published page tree, chrome,
-- metadata, and design configuration all originate in published CMS data.
WITH design(value) AS (
  SELECT json_object(
    'primary','#62002f','primaryDeep','#280817','secondary','#510028',
    'accent','#820040','accentSoft','#ffd4e4','background','#fff8fb',
    'surface','#fff8fb','surfaceMuted','#f1e4ea','card','#fff8fb',
    'ink','#2a0d1c','muted','#735568','border','#d9a7bc',
    'link','#820040','button','#820040','buttonHover','#62002f',
    'headingFont','geist','bodyFont','geist','baseFontSize','regular',
    'headingWeight','medium','bodyWeight','regular','lineHeight','regular',
    'letterSpacing','regular','radius','regular','buttonRadius','regular',
    'cardRadius','regular','shadow','soft','container','standard',
    'pageSpacing','regular','sectionSpacing','regular','gridGap','regular'
  )
)
UPDATE cms_documents
SET data_json = json_set(
      data_json,
      '$.design', json((SELECT value FROM design)), '$.homepageSlug', 'home',
      '$.logoLight', '/infostorage-logo.png', '$.logoDark', '/infostorage-logo.png',
      '$.logoMobile', '/infostorage-logo.png', '$.logoWidth', '52px',
      '$.logoMobileWidth', '46px', '$.logoAlignment', 'left', '$.logoSpacing', '0',
      '$.favicon', '/favicon.svg', '$.appIcon', '/infostorage-logo.png'
    ),
    published_data_json = json_set(
      published_data_json,
      '$.design', json((SELECT value FROM design)), '$.homepageSlug', 'home',
      '$.logoLight', '/infostorage-logo.png', '$.logoDark', '/infostorage-logo.png',
      '$.logoMobile', '/infostorage-logo.png', '$.logoWidth', '52px',
      '$.logoMobileWidth', '46px', '$.logoAlignment', 'left', '$.logoSpacing', '0',
      '$.favicon', '/favicon.svg', '$.appIcon', '/infostorage-logo.png'
    ),
    current_revision = current_revision + 1,
    published_revision = current_revision + 1,
    updated_at = CURRENT_TIMESTAMP,
    published_at = CURRENT_TIMESTAMP
WHERE type = 'site_settings' AND slug = 'global' AND published_data_json IS NOT NULL;

INSERT INTO cms_document_revisions (
  id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
)
SELECT lower(hex(randomblob(16))), id, current_revision, title, slug, data_json,
  'Moved the complete public design configuration into the CMS', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'site_settings' AND slug = 'global';

-- The builder page metadata is part of the same published document as its
-- blocks. Fill the two older page records that pre-date the metadata fields.
UPDATE cms_documents
SET data_json = json_set(
      data_json,
      '$.settings.seoTitle', CASE slug WHEN 'home' THEN 'Home | INFOStorage' ELSE 'Partners | INFOStorage' END,
      '$.settings.seoDescription', CASE slug
        WHEN 'home' THEN 'INFOStorage provides enterprise technology solutions across systems, security, data protection, and specialist services.'
        ELSE 'Explore the INFOStorage technology partner ecosystem and selected enterprise clients.'
      END
    ),
    published_data_json = json_set(
      published_data_json,
      '$.settings.seoTitle', CASE slug WHEN 'home' THEN 'Home | INFOStorage' ELSE 'Partners | INFOStorage' END,
      '$.settings.seoDescription', CASE slug
        WHEN 'home' THEN 'INFOStorage provides enterprise technology solutions across systems, security, data protection, and specialist services.'
        ELSE 'Explore the INFOStorage technology partner ecosystem and selected enterprise clients.'
      END
    ),
    current_revision = current_revision + 1,
    published_revision = current_revision + 1,
    updated_at = CURRENT_TIMESTAMP,
    published_at = CURRENT_TIMESTAMP
WHERE type = 'builder_page' AND slug IN ('home', 'partners') AND published_data_json IS NOT NULL;

INSERT INTO cms_document_revisions (
  id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
)
SELECT lower(hex(randomblob(16))), id, current_revision, title, slug, data_json,
  'Completed CMS-managed public page metadata', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('home', 'partners');
