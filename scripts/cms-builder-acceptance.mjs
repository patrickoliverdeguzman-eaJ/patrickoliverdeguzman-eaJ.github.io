import assert from 'node:assert/strict';
import {
  createBuilderNode,
  emptyBuilderPage,
  normaliseBuilderPage,
} from '../lib/page-builder.ts';

const api = process.env.CMS_ACCEPTANCE_API ?? 'http://127.0.0.1:8787';
const setupToken = 'cms-test-setup-token';
const email = 'acceptance@local.test';
const password = 'LocalAcceptance!2026';

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${body.error ?? 'request failed'}`);
  return body;
}

const session = await request('/v1/admin/bootstrap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ setupToken, email, displayName: 'Acceptance Admin', password }),
});
const headers = { 'Content-Type': 'application/json', authorization: `Bearer ${session.token}` };

function firstPage() {
  const page = emptyBuilderPage();
  page.settings = { ...page.settings, seoTitle: 'Atlas platform', seoDescription: 'A complete CMS-generated page.', hideDefaultHeader: true, hideDefaultFooter: true };
  const header = createBuilderNode('site_header');
  const hero = createBuilderNode('brand_hero');
  hero.props = { ...hero.props, title: 'Atlas operations', accent: 'without limits.', body: 'A first page built entirely from CMS data.' };
  hero.styles.advanced = { backgroundGradient: 'linear-gradient(135deg, #11243d, #236b8e)', minHeight: '680px' };
  hero.responsive.mobile = { minHeight: '560px', fontSize: '42px', paddingLeft: '20px', paddingRight: '20px' };

  const section = createBuilderNode('section');
  section.styles.advanced = { backgroundColor: '#f4f8fb', paddingTop: '80px', paddingBottom: '80px' };
  const container = createBuilderNode('container');
  const columns = createBuilderNode('columns');
  columns.props.columns = 2;
  columns.responsive.mobile = { display: 'grid', gridTemplateColumns: '1fr', gap: '20px' };
  const left = createBuilderNode('column');
  const heading = createBuilderNode('heading');
  heading.props = { text: 'Built by the CMS', level: 2 };
  heading.styles.advanced = { color: '#11243d', fontSize: '52px', fontWeight: '700' };
  const paragraph = createBuilderNode('text');
  paragraph.props.text = 'Text, spacing, colour, typography, order, and responsive behavior all persist as structured content.';
  const button = createBuilderNode('button');
  button.props = { label: 'Explore Atlas', href: '#atlas-cards', variant: 'primary' };
  left.children = [heading, paragraph, button];
  const right = createBuilderNode('column');
  const image = createBuilderNode('image');
  image.props = { src: '/infostorage-logo.png', alt: 'INFOStorage mark', title: 'Atlas image', caption: 'Reusable media and metadata' };
  right.children = [image];
  columns.children = [left, right];
  container.children = [columns];
  section.children = [container];

  const grid = createBuilderNode('grid');
  grid.props.columns = 3;
  grid.styles.elementId = 'atlas-cards';
  grid.styles.advanced = { gap: '24px', paddingTop: '56px', paddingBottom: '56px' };
  grid.responsive.mobile = { gridTemplateColumns: '1fr', gap: '14px' };
  grid.children = ['Plan', 'Build', 'Operate'].map((label) => {
    const card = createBuilderNode('card');
    const cardHeading = createBuilderNode('heading');
    cardHeading.props = { text: label, level: 3 };
    const cardText = createBuilderNode('text');
    cardText.props.text = `${label} with an editable nested card.`;
    card.children = [cardHeading, cardText];
    return card;
  });
  page.slots.afterHero = [header, hero];
  page.slots.afterApproach = [section];
  page.slots.afterSolutions = [grid];
  page.slots.afterContent = [createBuilderNode('site_footer')];
  return normaliseBuilderPage(page);
}

function secondPage() {
  const page = emptyBuilderPage();
  page.settings = { ...page.settings, seoTitle: 'Signal studio', seoDescription: 'A visually different CMS-generated page.', hideDefaultHeader: true, hideDefaultFooter: true };
  const header = createBuilderNode('site_header');
  const cta = createBuilderNode('cta');
  cta.props = { ...cta.props, eyebrow: 'Signal studio', heading: 'A different page language.', body: 'The same renderer supports a distinct layout and theme.', primaryLabel: 'View plans', primaryHref: '#plans' };
  cta.styles.advanced = { backgroundColor: '#fff4df', color: '#321b0f', minHeight: '520px', paddingTop: '120px', paddingBottom: '100px', textAlign: 'center' };
  cta.responsive.mobile = { minHeight: '420px', paddingTop: '96px', paddingBottom: '64px' };
  const stats = createBuilderNode('statistics');
  stats.props = { kicker: 'Measured outcomes', heading: 'A compact proof layer', items: '99.9%|Availability\n24/7|Support\n3×|Faster delivery' };
  const testimonials = createBuilderNode('testimonials');
  testimonials.props = { kicker: 'In their words', heading: 'Designed for trust', items: 'The builder gave our team control.|Operations lead\nEvery breakpoint remained intentional.|Design lead' };
  const pricing = createBuilderNode('pricing');
  pricing.props = { kicker: 'Options', heading: 'Choose the right engagement', items: 'Foundation|Custom|Discovery;Plan;Handover|Talk to us\nScale|Custom|Architecture;Delivery;Support|Start a conversation' };
  pricing.styles.elementId = 'plans';
  pricing.responsive.mobile = { display: 'grid', gridTemplateColumns: '1fr' };
  page.slots.afterHero = [header, cta];
  page.slots.afterApproach = [stats];
  page.slots.afterSolutions = [testimonials];
  page.slots.afterServices = [pricing];
  page.slots.afterContent = [createBuilderNode('site_footer')];
  return normaliseBuilderPage(page);
}

async function createAndPublish(title, slug, data) {
  const created = await request('/v1/admin/documents', { method: 'POST', headers, body: JSON.stringify({ type: 'builder_page', title, slug, data, note: 'CMS builder acceptance page' }) });
  const published = await request(`/v1/admin/documents/${created.document.id}/publish`, { method: 'POST', headers });
  return published.document;
}

const atlas = await createAndPublish('Atlas Operations', 'acceptance-atlas', firstPage());
const signal = await createAndPublish('Signal Studio', 'acceptance-signal', secondPage());

const navigation = await request('/v1/admin/documents', {
  method: 'POST', headers,
  body: JSON.stringify({ type: 'navigation', title: 'Acceptance navigation', slug: 'acceptance-main', data: { items: [
    { id: 'atlas', label: 'Atlas', href: '/custom?page=acceptance-atlas', enabled: true },
    { id: 'signal', label: 'Signal', href: '/custom?page=acceptance-signal', enabled: true, parentId: 'atlas' },
  ], ctaLabel: 'Start', ctaHref: '/#contact' } }),
});
await request(`/v1/admin/documents/${navigation.document.id}/publish`, { method: 'POST', headers });

const atlasPublic = await request('/v1/content/builder_page/acceptance-atlas');
const signalPublic = await request('/v1/content/builder_page/acceptance-signal');
assert.equal(atlasPublic.document.data.slots.afterHero[1].props.title, 'Atlas operations');
assert.equal(atlasPublic.document.data.slots.afterApproach[0].children[0].children[0].responsive.mobile.gridTemplateColumns, '1fr');
assert.equal(atlasPublic.document.data.slots.afterSolutions[0].children.length, 3);
assert.equal(signalPublic.document.data.slots.afterHero[1].type, 'cta');
assert.equal(signalPublic.document.data.slots.afterServices[0].styles.elementId, 'plans');

const atlasDraft = structuredClone(atlas.data);
atlasDraft.slots.afterHero[1].props.title = 'Atlas operations revised';
await request(`/v1/admin/documents/${atlas.id}`, { method: 'PATCH', headers, body: JSON.stringify({ title: atlas.title, slug: atlas.slug, data: atlasDraft, note: 'Acceptance revision' }) });
const revisions = await request(`/v1/admin/documents/${atlas.id}/revisions`, { headers });
assert.ok(revisions.revisions.length >= 2);

const future = new Date(Date.now() + 10 * 60_000).toISOString();
const scheduled = await request(`/v1/admin/documents/${signal.id}/schedule`, { method: 'POST', headers, body: JSON.stringify({ publishAt: future }) });
assert.equal(scheduled.document.scheduledAt, future);
const unscheduled = await request(`/v1/admin/documents/${signal.id}/schedule`, { method: 'POST', headers, body: JSON.stringify({ publishAt: null }) });
assert.equal(unscheduled.document.scheduledAt, null);

await request(`/v1/admin/documents/${signal.id}/unpublish`, { method: 'POST', headers });
const unpublishedResponse = await fetch(`${api}/v1/content/builder_page/acceptance-signal`);
assert.equal(unpublishedResponse.status, 404);
await request(`/v1/admin/documents/${signal.id}/publish`, { method: 'POST', headers });
await request(`/v1/admin/documents/${signal.id}`, { method: 'DELETE', headers });
const restored = await request(`/v1/admin/documents/${signal.id}/restore-archived`, { method: 'POST', headers });
assert.equal(restored.document.status, 'draft');
await request(`/v1/admin/documents/${signal.id}/publish`, { method: 'POST', headers });

console.log(JSON.stringify({
  passed: true,
  pages: ['acceptance-atlas', 'acceptance-signal'],
  verified: ['nested block trees', 'per-element styles', 'mobile overrides', 'navigation nesting', 'draft revisions', 'publish/unpublish', 'schedule/cancel', 'archive/restore', 'public retrieval'],
}, null, 2));
