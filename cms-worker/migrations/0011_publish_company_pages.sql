PRAGMA foreign_keys = ON;

-- Replace the homepage-only menu with stable public routes. The legacy public
-- renderer also maps the old anchors to these routes, so cached navigation
-- documents cannot strand visitors on a one-page experience.
WITH next_navigation(data) AS (
  SELECT json_object(
    'items', json_array(
      json_object('id','nav-about','label','About','href','/about','enabled',json('true')),
      json_object('id','nav-solutions','label','Solutions','href','/solutions','enabled',json('true')),
      json_object('id','nav-services','label','Services','href','/services','enabled',json('true')),
      json_object('id','nav-partners','label','Partners','href','/partners','enabled',json('true')),
      json_object('id','nav-contact','label','Contact','href','/contact','enabled',json('true'))
    ),
    'ctaLabel', 'Start a conversation',
    'ctaHref', '/contact'
  )
)
INSERT INTO cms_document_revisions (
  id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
)
SELECT lower(hex(randomblob(16))), id, current_revision + 1, title, slug,
  (SELECT data FROM next_navigation), 'Converted site navigation to real page routes', updated_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'navigation' AND slug = 'main';

WITH next_navigation(data) AS (
  SELECT json_object(
    'items', json_array(
      json_object('id','nav-about','label','About','href','/about','enabled',json('true')),
      json_object('id','nav-solutions','label','Solutions','href','/solutions','enabled',json('true')),
      json_object('id','nav-services','label','Services','href','/services','enabled',json('true')),
      json_object('id','nav-partners','label','Partners','href','/partners','enabled',json('true')),
      json_object('id','nav-contact','label','Contact','href','/contact','enabled',json('true'))
    ),
    'ctaLabel', 'Start a conversation',
    'ctaHref', '/contact'
  )
)
UPDATE cms_documents
SET data_json = (SELECT data FROM next_navigation),
    published_data_json = (SELECT data FROM next_navigation),
    status = 'published',
    current_revision = current_revision + 1,
    published_revision = current_revision + 1,
    published_by = updated_by,
    updated_at = CURRENT_TIMESTAMP,
    published_at = CURRENT_TIMESTAMP
WHERE type = 'navigation' AND slug = 'main';

-- Company pages are stored in the same block schema used by the visual editor.
-- Keeping copy here makes the content migration auditable and ensures the live
-- renderer and the CMS begin with the same published snapshot.
WITH
  actor AS (
    SELECT id FROM cms_users WHERE role = 'admin' ORDER BY created_at LIMIT 1
  ),
  base AS (
    SELECT
      json_object(
        'visibility','all','tabletColumns','inherit','mobileColumns','inherit',
        'tabletAlign','inherit','mobileAlign','inherit','tabletPadding','inherit',
        'mobilePadding','inherit','tablet',json_object(),'mobile',json_object()
      ) AS responsive
  ),
  page_defs(slug, title, description, sort_order) AS (
    VALUES
      ('about', 'About INFOStorage', 'Company history, mission, values, and selected milestones.', 60),
      ('solutions', 'Solutions', 'Enterprise systems, security, protection, and workplace technology.', 61),
      ('services', 'Services', 'INFOStorage Value Added Services across the technology lifecycle.', 62),
      ('contact', 'Contact INFOStorage', 'Start a conversation with the INFOStorage team.', 63)
  ),
  nodes(page_slug, slot, sort_index, node_id, node_type, props, tone, width, padding, element_id) AS (
    VALUES
      ('about','afterHero',0,'about-header','site_header',json_object('useGlobal',json('true')),'default','full','inherit',''),
      ('about','afterHero',1,'about-hero','brand_hero',json_object(
        'variant','partners','eyebrow','Established 1999','title','Enterprise experience with','accent','local agility.',
        'body','INFOStorage grew from enterprise storage roots into a solutions integrator spanning data centres, security, protection, networks, workplace technology, and professional services.',
        'primaryLabel','Read our story','primaryHref','#history','logo','/infostorage-logo.png'
      ),'gradient','full','spacious',''),
      ('about','afterApproach',0,'about-history','split_intro',json_object(
        'kicker','Our history','heading','Built for enterprise work','accent','from the beginning.',
        'body','Founded in 1999 by senior technology managers, INFOStorage began as the Philippine distributor of StorageTek enterprise tape and disk systems. In 2000, the team delivered a 3,000-cartridge STK 9310 VSM Silo—an early virtual-tape implementation—and kept expanding its capabilities around the changing needs of enterprise customers.',
        'linkLabel','Explore our solutions','linkHref','/solutions'
      ),'default','full','spacious','history'),
      ('about','afterApproach',1,'about-facts','statistics',json_object(
        'kicker','Company milestones','heading','A long view of enterprise technology.',
        'items','1999|INFOStorage was established' || char(10) || '3,000|Cartridge enterprise tape system delivered in 2000' || char(10) || '2025|Recognised as a strategic solutions partner'
      ),'muted','wide','spacious',''),
      ('about','afterSolutions',0,'about-mission','feature_grid',json_object(
        'kicker','Mission and values','heading','Specialized. Recognized. Respected.',
        'body','Three commitments guide the way INFOStorage selects solutions, keeps promises, and works with customers.',
        'items','Specialized|Focused expertise across a chosen set of enterprise IT solutions.' || char(10) || 'Recognized|A commitment to deliver the work and outcomes promised to every client.' || char(10) || 'Respected|Professional service carried out with integrity from planning through support.'
      ),'default','wide','spacious',''),
      ('about','afterServices',0,'about-milestones','faq',json_object(
        'kicker','Selected recognition','heading','Milestones across more than two decades.',
        'items','2000–2005|Recognition from StorageTek and CA marked INFOStorage’s early years as a specialist enterprise technology partner.' || char(10) || '2010–2014|The company earned Oracle Gold status and partner recognition from BakBone, Hitachi, A10, FireEye, Synetcom, Netpoleon, and CA.' || char(10) || '2015–2019|INFOStorage received multiple Hitachi solution awards, a Lenovo Gold PC designation, Sangfor authorisation, and a McAfee rookie award.' || char(10) || '2025|Hitachi and VST ECS recognised INFOStorage as a strategic solutions partner.'
      ),'default','wide','spacious',''),
      ('about','afterContent',0,'about-contact','partner_contact',json_object(
        'eyebrow','Work with an experienced team','heading','Bring us the challenge behind the technology.',
        'body','We connect the right products, architecture, implementation, and support around the way your organisation operates.',
        'ctaLabel','Start a conversation','ctaHref','/contact'
      ),'brand','full','spacious',''),
      ('about','afterContent',1,'about-footer','site_footer',json_object('useGlobal',json('true')),'brand','full','inherit',''),

      ('solutions','afterHero',0,'solutions-header','site_header',json_object('useGlobal',json('true')),'default','full','inherit',''),
      ('solutions','afterHero',1,'solutions-page-hero','brand_hero',json_object(
        'variant','partners','eyebrow','Enterprise solutions','title','Build a complete foundation for','accent','data computing.',
        'body','INFOStorage brings systems, network security, data protection, and workplace technology together around business requirements—not isolated products.',
        'primaryLabel','View solution areas','primaryHref','#solution-areas','logo','/infostorage-logo.png'
      ),'gradient','full','spacious',''),
      ('solutions','afterApproach',0,'solutions-page-intro','split_intro',json_object(
        'kicker','Connected by design','heading','Technology that works','accent','as one environment.',
        'body','Solutions are selected and integrated to support the objective behind each workload. That means matching infrastructure, protection, connectivity, security, and user technology to the organisation’s actual operating needs.',
        'linkLabel','See how we support delivery','linkHref','/services'
      ),'default','full','spacious',''),
      ('solutions','afterSolutions',0,'solutions-page-grid','solution_grid',json_object(
        'kicker','Solution areas','heading','From platform to protection.',
        'body','Explore the four core areas INFOStorage uses to design complete enterprise environments.',
        'items','Systems & platforms|Enterprise infrastructure aligned to the business objectives behind every workload.|Enterprise storage systems;Oracle Cloud Infrastructure and engineered systems;Server and storage virtualization;Hyper-converged infrastructure' || char(10) || 'Network & security|Secure and reliable connectivity for collaboration, visibility, compliance, and continuity.|Cybersecurity and next-generation firewall;Load balancing and web application firewall;Data loss prevention and identity access governance;Performance monitoring and web isolation' || char(10) || 'Data protection|Protection mechanisms shaped around data requirements, recovery objectives, and risk.|Business continuity and disaster recovery;Enterprise backup and restore;Digital archiving;Protection strategy and implementation' || char(10) || 'Mobile & peripherals|Workplace computing and peripherals integrated into the wider technology environment.|Desktop and laptop computing;Mobile device integration;Business peripherals;Enterprise-ready deployment'
      ),'muted','full','spacious','solution-areas'),
      ('solutions','afterServices',0,'solutions-page-integration','feature_grid',json_object(
        'kicker','Ecosystem integration','heading','The value is in how the pieces connect.',
        'body','INFOStorage combines technologies into an environment that is practical to deploy, operate, protect, and support.',
        'items','Requirements first|Start with workloads, objectives, constraints, and risk before selecting technology.' || char(10) || 'Architecture fit|Connect hardware, software, cloud, network, and protection into a coherent design.' || char(10) || 'Operational continuity|Plan implementation, handover, and support so the environment remains useful after launch.'
      ),'muted','wide','spacious',''),
      ('solutions','afterContent',0,'solutions-page-contact','partner_contact',json_object(
        'eyebrow','Plan the right environment','heading','Turn a technology requirement into a practical next step.',
        'body','Talk with INFOStorage about your workloads, infrastructure, security, protection, or integration needs.',
        'ctaLabel','Discuss your requirements','ctaHref','/contact'
      ),'brand','full','spacious',''),
      ('solutions','afterContent',1,'solutions-footer','site_footer',json_object('useGlobal',json('true')),'brand','full','inherit',''),

      ('services','afterHero',0,'services-header','site_header',json_object('useGlobal',json('true')),'default','full','inherit',''),
      ('services','afterHero',1,'services-page-hero','brand_hero',json_object(
        'variant','partners','eyebrow','INFOStorage Value Added Services','title','Keep technology working','accent','in practice.',
        'body','IVAS adds the professional work around every solution—from installation and implementation through ongoing assistance and systems integration.',
        'primaryLabel','Explore services','primaryHref','#service-areas','logo','/infostorage-logo.png'
      ),'gradient','full','spacious',''),
      ('services','afterApproach',0,'services-page-intro','split_intro',json_object(
        'kicker','Beyond product supply','heading','Delivery support across','accent','the technology lifecycle.',
        'body','INFOStorage’s experienced professionals support data centres, data management, security, and related enterprise environments. The aim is to make each solution easier to implement, operate, maintain, and improve.',
        'linkLabel','Meet INFOStorage','linkHref','/about'
      ),'default','full','spacious',''),
      ('services','afterSolutions',0,'services-page-list','service_list',json_object(
        'kicker','Service areas','heading','Specialist help where it matters.',
        'body','Choose a focused engagement or connect services across a wider implementation.',
        'items','Hardware installation, maintenance and onsite support' || char(10) || 'Helpdesk' || char(10) || 'Consulting and implementation' || char(10) || 'Project management and systems integration',
        'href','/contact'
      ),'default','full','spacious','service-areas'),
      ('services','afterServices',0,'services-page-approach','feature_grid',json_object(
        'kicker','How engagements work','heading','A clear path from requirement to operation.',
        'body','Service work stays connected to the technical and business outcome the organisation needs.',
        'items','Understand|Clarify the environment, workload, objectives, dependencies, and risk.' || char(10) || 'Implement|Coordinate technology, people, milestones, testing, and operational handover.' || char(10) || 'Support|Stay available for maintenance, helpdesk assistance, and the next stage of improvement.'
      ),'muted','wide','spacious',''),
      ('services','afterContent',0,'services-page-contact','partner_contact',json_object(
        'eyebrow','Need specialist support?','heading','Let’s shape the right service engagement.',
        'body','Tell us what you are deploying, maintaining, integrating, or improving, and we will help define the next step.',
        'ctaLabel','Talk to the team','ctaHref','/contact'
      ),'brand','full','spacious',''),
      ('services','afterContent',1,'services-footer','site_footer',json_object('useGlobal',json('true')),'brand','full','inherit',''),

      ('contact','afterHero',0,'contact-header','site_header',json_object('useGlobal',json('true')),'default','full','inherit',''),
      ('contact','afterHero',1,'contact-page-hero','brand_hero',json_object(
        'variant','partners','eyebrow','Contact INFOStorage','title','Give your business what it needs','accent','to grow.',
        'body','Start with the challenge, the workload, or the outcome you need. Our team can help identify a practical enterprise technology path.',
        'primaryLabel','View contact details','primaryHref','#contact-details','logo','/infostorage-logo.png'
      ),'gradient','full','spacious',''),
      ('contact','afterApproach',0,'contact-page-details','split_intro',json_object(
        'kicker','Contact details','heading','Start a conversation','accent','with our team.',
        'body','Call +63 2 8899 4878 or visit INFOStorage at 1101 AIC Burgundy Empire Tower, ADB Avenue corner Sapphire and Garnet Roads, Ortigas Center, Pasig City, Philippines.',
        'linkLabel','Get directions','linkHref','https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City'
      ),'default','full','spacious','contact-details'),
      ('contact','afterSolutions',0,'contact-page-channels','feature_grid',json_object(
        'kicker','How to reach us','heading','Choose the channel that suits the conversation.',
        'body','Share the context you already have. A requirement, issue, project stage, or desired outcome is enough to begin.',
        'items','Call|Speak with INFOStorage at +63 2 8899 4878.' || char(10) || 'Visit|Find the team at AIC Burgundy Empire Tower in Ortigas Center, Pasig City.' || char(10) || 'Live chat|Use the chat button on this page to start a conversation with the site administrator.'
      ),'default','wide','spacious',''),
      ('contact','afterContent',0,'contact-page-panel','contact_panel',json_object(
        'eyebrow','INFOStorage Corporation','heading','Let’s discuss the work ahead.',
        'body','Talk with the team about systems, security, protection, workplace technology, implementation, integration, or support.'
      ),'gradient','full','spacious',''),
      ('contact','afterContent',1,'contact-footer','site_footer',json_object('useGlobal',json('true')),'brand','full','inherit','')
  ),
  rendered_nodes AS (
    SELECT page_slug, slot, sort_index,
      json_object(
        'id', node_id,
        'sortIndex', sort_index,
        'type', node_type,
        'props', json(props),
        'styles', json_object(
          'tone',tone,'padding',padding,'align','left','width',width,'radius','none',
          'border','none','shadow','none','gap','regular','motion','none','hover','none',
          'advanced',json_object(),'customClass','','elementId',element_id
        ),
        'responsive', json((SELECT responsive FROM base)),
        'children', json_array()
      ) AS node_json
    FROM nodes
  ),
  rendered_pages AS (
    SELECT page_defs.slug, page_defs.title, page_defs.description, page_defs.sort_order,
      json_object(
        'version', 1,
        'slots', json_object(
          'afterHero', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'afterHero' ORDER BY sort_index)), '[]')),
          'afterApproach', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'afterApproach' ORDER BY sort_index)), '[]')),
          'afterSolutions', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'afterSolutions' ORDER BY sort_index)), '[]')),
          'afterServices', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'afterServices' ORDER BY sort_index)), '[]')),
          'beforeContact', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'beforeContact' ORDER BY sort_index)), '[]')),
          'afterContent', json(COALESCE((SELECT json_group_array(json(node_json)) FROM (SELECT node_json FROM rendered_nodes WHERE page_slug = page_defs.slug AND slot = 'afterContent' ORDER BY sort_index)), '[]'))
        ),
        'settings', json_object(
          'seoTitle', page_defs.title || ' | INFOStorage',
          'seoDescription', page_defs.description,
          'socialImage', '',
          'hideDefaultHeader', json('false'),
          'hideDefaultFooter', json('false')
        ),
        'customCss', ''
      ) AS data_json
    FROM page_defs
  )
INSERT OR IGNORE INTO cms_documents (
  id, type, slug, title, status, data_json, published_data_json,
  current_revision, published_revision, sort_order, created_by, updated_by,
  published_by, created_at, updated_at, published_at
)
SELECT lower(hex(randomblob(16))), 'builder_page', slug, title, 'published',
  data_json, data_json, 1, 1, sort_order, actor.id, actor.id, actor.id,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM rendered_pages CROSS JOIN actor;

INSERT OR IGNORE INTO cms_document_revisions (
  id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
)
SELECT lower(hex(randomblob(16))), id, 1, title, slug, data_json,
  'Published official company content as dedicated site pages', created_by, CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('about', 'solutions', 'services', 'contact');

INSERT INTO cms_audit_log (id, user_id, action, resource_type, resource_id, detail, created_at)
SELECT lower(hex(randomblob(16))), updated_by, 'document.migrate', 'builder_page', id,
  'Published official company content as a dedicated route', CURRENT_TIMESTAMP
FROM cms_documents
WHERE type = 'builder_page' AND slug IN ('about', 'solutions', 'services', 'contact');
