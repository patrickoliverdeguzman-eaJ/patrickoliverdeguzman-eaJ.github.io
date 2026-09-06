PRAGMA foreign_keys = ON;

-- Promote the original public routes to the structured builder schema. Values
-- are read from the current CMS documents so existing published copy is kept.

INSERT OR IGNORE INTO cms_documents (
  id, type, slug, title, status, data_json, published_data_json,
  current_revision, published_revision, created_by, updated_by, published_by,
  created_at, updated_at, published_at
)
SELECT
  lower(hex(randomblob(16))), 'builder_page', 'partners', 'Partners', 'draft',
  json_object('version', 1, 'slots', json_object('afterHero', json_array(), 'afterApproach', json_array(), 'afterSolutions', json_array(), 'afterServices', json_array(), 'beforeContact', json_array(), 'afterContent', json_array())),
  NULL, 1, NULL, created_by, created_by, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
FROM cms_documents
WHERE type = 'site_settings' AND slug = 'global'
LIMIT 1;

WITH
  base AS (
    SELECT
      json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none') AS styles,
      json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit') AS responsive,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'hero') AS hero,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'approach') AS approach,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'solutions-heading') AS solutions_heading,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'continuity') AS continuity,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'services-heading') AS services_heading,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'sectors') AS sectors,
      (SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'contact') AS contact,
      (SELECT json_extract(data_json, '$.logo') FROM cms_documents WHERE type = 'site_settings' AND slug = 'global') AS logo,
      COALESCE((SELECT group_concat(json_extract(value, '$.title') || '|' || json_extract(value, '$.text'), char(10)) FROM json_each((SELECT data_json FROM cms_documents WHERE type = 'home_section' AND slug = 'approach'), '$.principles')), '') AS principles,
      COALESCE((SELECT group_concat(title || '|' || COALESCE(json_extract(data_json, '$.description'), '') || '|' || COALESCE((SELECT group_concat(value, ';') FROM json_each(data_json, '$.items')), ''), char(10)) FROM cms_documents WHERE type = 'solution' AND status = 'published'), '') AS solutions,
      COALESCE((SELECT group_concat(title, char(10)) FROM cms_documents WHERE type = 'service' AND status = 'published'), '') AS services
  ),
  page AS (
    SELECT json_object('version', 1, 'slots', json_object(
      'afterHero', json_array(json_object('id','home-hero','type','brand_hero','props',json_object('variant','home','eyebrow',json_extract(hero,'$.eyebrow'),'title',json_extract(hero,'$.titleA'),'accent',json_extract(hero,'$.titleAccent'),'body',json_extract(hero,'$.description'),'primaryLabel',json_extract(hero,'$.primaryLabel'),'primaryHref',json_extract(hero,'$.primaryHref'),'secondaryLabel',json_extract(hero,'$.secondaryLabel'),'secondaryHref',json_extract(hero,'$.secondaryHref'),'logo',COALESCE(logo,'/infostorage-logo.png'),'capabilities','Systems & platforms\nNetwork & security\nData protection\nIVAS'),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterApproach', json_array(json_object('id','home-intro','type','home_intro','props',json_object('kicker',json_extract(approach,'$.kicker'),'heading',json_extract(approach,'$.headingA'),'accent',json_extract(approach,'$.headingAccent'),'body',json_extract(approach,'$.body'),'linkLabel',json_extract(approach,'$.linkLabel'),'linkHref',json_extract(approach,'$.linkHref'),'items',principles),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterSolutions', json_array(json_object('id','home-solutions','type','solution_grid','props',json_object('kicker',json_extract(solutions_heading,'$.kicker'),'heading',json_extract(solutions_heading,'$.heading'),'body',json_extract(solutions_heading,'$.body'),'items',solutions),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterServices', json_array(
        json_object('id','home-continuity','type','continuity_panel','props',json_object('eyebrow',json_extract(continuity,'$.eyebrow'),'heading',json_extract(continuity,'$.heading'),'body',json_extract(continuity,'$.body'),'ctaLabel',json_extract(continuity,'$.ctaLabel'),'ctaHref',json_extract(continuity,'$.ctaHref')),'styles',styles,'responsive',responsive,'children',json_array()),
        json_object('id','home-services','type','service_list','props',json_object('kicker',json_extract(services_heading,'$.kicker'),'heading',json_extract(services_heading,'$.heading'),'body',json_extract(services_heading,'$.body'),'items',services,'href','#contact'),'styles',styles,'responsive',responsive,'children',json_array())
      ),
      'beforeContact', json_array(json_object('id','home-sectors','type','tag_band','props',json_object('kicker',json_extract(sectors,'$.kicker'),'heading',json_extract(sectors,'$.heading'),'tags',COALESCE((SELECT group_concat(value, char(10)) FROM json_each(sectors, '$.tags')), '')),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterContent', json_array(json_object('id','home-contact','type','contact_panel','props',json_object('eyebrow',json_extract(contact,'$.eyebrow'),'heading',json_extract(contact,'$.heading'),'body',json_extract(contact,'$.body')),'styles',styles,'responsive',responsive,'children',json_array()))
    )) AS data FROM base
  )
UPDATE cms_documents
SET title = 'Home', data_json = (SELECT data FROM page), published_data_json = (SELECT data FROM page),
  status = 'published', current_revision = current_revision + 1, published_revision = current_revision + 1,
  published_by = updated_by, updated_at = CURRENT_TIMESTAMP, published_at = CURRENT_TIMESTAMP
WHERE type = 'builder_page' AND slug = 'home';

WITH
  base AS (
    SELECT
      json_object('tone','default','padding','inherit','align','inherit','width','inherit','radius','none','border','none','shadow','none','gap','inherit','motion','none','hover','none') AS styles,
      json_object('visibility','all','tabletColumns','inherit','mobileColumns','inherit','tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit','mobilePadding','inherit') AS responsive,
      (SELECT data_json FROM cms_documents WHERE type = 'page_section' AND slug = 'partners-hero') AS hero,
      (SELECT data_json FROM cms_documents WHERE type = 'page_section' AND slug = 'partners-directory') AS directory,
      (SELECT data_json FROM cms_documents WHERE type = 'page_section' AND slug = 'partners-clients') AS clients_heading,
      (SELECT json_extract(data_json, '$.logo') FROM cms_documents WHERE type = 'site_settings' AND slug = 'global') AS logo,
      COALESCE((SELECT group_concat(title || '|' || COALESCE(json_extract(data_json, '$.focus'), ''), char(10)) FROM cms_documents WHERE type = 'partner' AND status = 'published'), '') AS partners,
      COALESCE((SELECT group_concat(title || '|' || COALESCE(json_extract(data_json, '$.logo'), '') || '|' || CASE title WHEN 'Government Service Insurance System' THEN 'client-logo-gsis' WHEN 'League One Finance and Leasing Corporation' THEN 'client-logo-league' WHEN 'Global Payments' THEN 'client-logo-wide-white' WHEN 'Credit Information Corporation' THEN 'client-logo-wide-white' WHEN 'DENR Biodiversity Management Bureau' THEN 'client-logo-denr' WHEN 'Hitachi Digital Services' THEN 'client-logo-wide-white' WHEN 'Amdocs' THEN 'client-logo-amdocs' WHEN '7-Eleven' THEN 'client-logo-7eleven' WHEN 'Cathay United Bank' THEN 'client-logo-cathay' ELSE '' END, char(10)) FROM cms_documents WHERE type = 'client' AND status = 'published'), '') AS clients
  ),
  page AS (
    SELECT json_object('version', 1, 'slots', json_object(
      'afterHero', json_array(json_object('id','partners-hero','type','brand_hero','props',json_object('variant','partners','eyebrow',json_extract(hero,'$.eyebrow'),'title',json_extract(hero,'$.titleA'),'accent',json_extract(hero,'$.titleAccent'),'body',json_extract(hero,'$.description'),'primaryLabel',json_extract(hero,'$.ctaLabel'),'primaryHref',json_extract(hero,'$.ctaHref'),'logo',COALESCE(logo,'/infostorage-logo.png')),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterApproach', json_array(json_object('id','partners-directory','type','partner_directory','props',json_object('kicker',json_extract(directory,'$.kicker'),'heading',json_extract(directory,'$.heading'),'body',json_extract(directory,'$.body'),'note',json_extract(directory,'$.note'),'items',partners),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterSolutions', json_array(json_object('id','partners-clients','type','logo_grid','props',json_object('kicker',json_extract(clients_heading,'$.kicker'),'heading',json_extract(clients_heading,'$.heading'),'body',json_extract(clients_heading,'$.body'),'items',clients),'styles',styles,'responsive',responsive,'children',json_array())),
      'afterServices', json_array(json_object('id','partners-method','type','method_list','props',json_object('kicker','More than product selection','heading','The value is in the connection.','items','Context first|Start with the workload, risk, and operating reality—not a catalogue.\nIntegrated design|Bring the right technologies into an architecture that makes sense together.\nLocal stewardship|Stay close through implementation, operational handover, and ongoing support.'),'styles',styles,'responsive',responsive,'children',json_array())),
      'beforeContact', json_array(),
      'afterContent', json_array(json_object('id','partners-contact','type','partner_contact','props',json_object('eyebrow','Find the right fit','heading','Let’s match the technology to the work ahead.','body','Bring us the challenge. We will help you turn it into an integrated, practical next step.','ctaLabel','Start a conversation','ctaHref','/#contact'),'styles',styles,'responsive',responsive,'children',json_array()))
    )) AS data FROM base
  )
UPDATE cms_documents
SET title = 'Partners', data_json = (SELECT data FROM page), published_data_json = (SELECT data FROM page),
  status = 'published', current_revision = current_revision + 1, published_revision = current_revision + 1,
  published_by = updated_by, updated_at = CURRENT_TIMESTAMP, published_at = CURRENT_TIMESTAMP
WHERE type = 'builder_page' AND slug = 'partners';

INSERT INTO cms_document_revisions (id, document_id, revision_number, title, slug, data_json, note, created_by, created_at)
SELECT lower(hex(randomblob(16))), id, current_revision, title, slug, data_json, 'Migrated public route to structured CMS blocks', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('home', 'partners');

INSERT INTO cms_audit_log (id, user_id, action, resource_type, resource_id, detail, created_at)
SELECT lower(hex(randomblob(16))), updated_by, 'document.migrate', 'builder_page', id, 'Migrated public route to structured CMS blocks', CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('home', 'partners');
