PRAGMA foreign_keys = ON;

-- The original public routes now own their header and footer in the same block
-- tree as every other visible section. The header is rendered as an overlay so
-- this structural migration preserves the existing visual composition.
UPDATE cms_documents
SET
  data_json = json_insert(
    json_set(
      json_set(
        data_json,
        '$.settings', json_object(
          'seoTitle', title || ' | INFOStorage',
          'seoDescription', '',
          'socialImage', '',
          'hideDefaultHeader', json('false'),
          'hideDefaultFooter', json('false')
        )
      ),
      '$.slots.afterHero', json_array(
        json_object(
          'id', slug || '-header', 'type', 'site_header',
          'props', json_object('useGlobal', json('true')),
          'styles', json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none','advanced',json_object(),'customClass','','elementId',''),
          'responsive', json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit','tablet',json_object(),'mobile',json_object()),
          'children', json_array()
        ),
        json_extract(data_json, '$.slots.afterHero[0]')
      )
    ),
    '$.slots.afterContent[#]', json_object(
      'id', slug || '-footer', 'type', 'site_footer',
      'props', json_object('useGlobal', json('true')),
      'styles', json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none','advanced',json_object(),'customClass','','elementId',''),
      'responsive', json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit','tablet',json_object(),'mobile',json_object()),
      'children', json_array()
    )
  ),
  published_data_json = CASE WHEN published_data_json IS NULL THEN NULL ELSE json_insert(
    json_set(
      json_set(
        published_data_json,
        '$.settings', json_object(
          'seoTitle', title || ' | INFOStorage',
          'seoDescription', '',
          'socialImage', '',
          'hideDefaultHeader', json('false'),
          'hideDefaultFooter', json('false')
        )
      ),
      '$.slots.afterHero', json_array(
        json_object(
          'id', slug || '-header', 'type', 'site_header',
          'props', json_object('useGlobal', json('true')),
          'styles', json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none','advanced',json_object(),'customClass','','elementId',''),
          'responsive', json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit','tablet',json_object(),'mobile',json_object()),
          'children', json_array()
        ),
        json_extract(published_data_json, '$.slots.afterHero[0]')
      )
    ),
    '$.slots.afterContent[#]', json_object(
      'id', slug || '-footer', 'type', 'site_footer',
      'props', json_object('useGlobal', json('true')),
      'styles', json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none','advanced',json_object(),'customClass','','elementId',''),
      'responsive', json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit','tablet',json_object(),'mobile',json_object()),
      'children', json_array()
    )
  ) END,
  current_revision = current_revision + 1,
  published_revision = CASE WHEN published_data_json IS NULL THEN published_revision ELSE current_revision + 1 END,
  updated_at = CURRENT_TIMESTAMP,
  published_at = CASE WHEN published_data_json IS NULL THEN published_at ELSE CURRENT_TIMESTAMP END
WHERE type = 'builder_page'
  AND slug IN ('home', 'partners')
  AND NOT EXISTS (
    SELECT 1 FROM json_each(data_json, '$.slots.afterHero')
    WHERE json_extract(value, '$.type') = 'site_header'
  );

INSERT INTO cms_document_revisions (id, document_id, revision_number, title, slug, data_json, note, created_by, created_at)
SELECT lower(hex(randomblob(16))), id, current_revision, title, slug, data_json, 'Moved global header and footer into the CMS block tree', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('home', 'partners');
