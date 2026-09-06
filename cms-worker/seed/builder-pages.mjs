const blockStyles = {
  tone: 'default', padding: 'inherit', align: 'inherit', width: 'inherit',
  radius: 'none', border: 'none', shadow: 'none', gap: 'inherit', motion: 'none', hover: 'none',
};

const responsive = {
  visibility: 'all', tabletColumns: 'inherit', mobileColumns: 'inherit',
  tabletAlign: 'inherit', mobileAlign: 'inherit', tabletPadding: 'inherit', mobilePadding: 'inherit',
};

const logoClasses = new Map([
  ['Government Service Insurance System', 'client-logo-gsis'],
  ['League One Finance and Leasing Corporation', 'client-logo-league'],
  ['Global Payments', 'client-logo-wide-white'],
  ['Credit Information Corporation', 'client-logo-wide-white'],
  ['DENR Biodiversity Management Bureau', 'client-logo-denr'],
  ['Hitachi Digital Services', 'client-logo-wide-white'],
  ['Amdocs', 'client-logo-amdocs'],
  ['7-Eleven', 'client-logo-7eleven'],
  ['Cathay United Bank', 'client-logo-cathay'],
]);

function node(id, type, props) {
  return { id, type, props, styles: { ...blockStyles }, responsive: { ...responsive }, children: [] };
}

function documentBy(entries, type, slug) {
  return entries.find((entry) => entry.type === type && entry.slug === slug)?.data ?? {};
}

function entriesBy(entries, type) {
  return entries.filter((entry) => entry.type === type);
}

/** Builds the original public pages from the exact seed content using the
 * same structured schema that the editor and browser renderer consume. */
export function createMigratedPageDocuments(entries) {
  const settings = documentBy(entries, 'site_settings', 'global');
  const hero = documentBy(entries, 'home_section', 'hero');
  const approach = documentBy(entries, 'home_section', 'approach');
  const solutionsHeading = documentBy(entries, 'home_section', 'solutions-heading');
  const continuity = documentBy(entries, 'home_section', 'continuity');
  const servicesHeading = documentBy(entries, 'home_section', 'services-heading');
  const sectors = documentBy(entries, 'home_section', 'sectors');
  const contact = documentBy(entries, 'home_section', 'contact');
  const partnerHero = documentBy(entries, 'page_section', 'partners-hero');
  const directory = documentBy(entries, 'page_section', 'partners-directory');
  const clientsHead = documentBy(entries, 'page_section', 'partners-clients');
  const logo = settings.logo || '/infostorage-logo.png';
  const solutions = entriesBy(entries, 'solution');
  const services = entriesBy(entries, 'service');
  const partners = entriesBy(entries, 'partner');
  const clients = entriesBy(entries, 'client');

  return [
    {
      type: 'builder_page', slug: 'home', title: 'Home',
      data: {
        version: 1,
        slots: {
          afterHero: [node('home-hero', 'brand_hero', { variant: 'home', eyebrow: hero.eyebrow, title: hero.titleA, accent: hero.titleAccent, body: hero.description, primaryLabel: hero.primaryLabel, primaryHref: hero.primaryHref, secondaryLabel: hero.secondaryLabel, secondaryHref: hero.secondaryHref, logo, capabilities: 'Systems & platforms\nNetwork & security\nData protection\nIVAS' })],
          afterApproach: [node('home-intro', 'home_intro', { kicker: approach.kicker, heading: approach.headingA, accent: approach.headingAccent, body: approach.body, linkLabel: approach.linkLabel, linkHref: approach.linkHref, items: (approach.principles || []).map((item) => `${item.title}|${item.text}`).join('\n') })],
          afterSolutions: [node('home-solutions', 'solution_grid', { kicker: solutionsHeading.kicker, heading: solutionsHeading.heading, body: solutionsHeading.body, items: solutions.map((item) => `${item.title}|${item.data.description || ''}|${(item.data.items || []).join(';')}`).join('\n') })],
          afterServices: [node('home-continuity', 'continuity_panel', { eyebrow: continuity.eyebrow, heading: continuity.heading, body: continuity.body, ctaLabel: continuity.ctaLabel, ctaHref: continuity.ctaHref }), node('home-services', 'service_list', { kicker: servicesHeading.kicker, heading: servicesHeading.heading, body: servicesHeading.body, items: services.map((item) => item.title).join('\n'), href: '#contact' })],
          beforeContact: [node('home-sectors', 'tag_band', { kicker: sectors.kicker, heading: sectors.heading, tags: (sectors.tags || []).join('\n') })],
          afterContent: [node('home-contact', 'contact_panel', { eyebrow: contact.eyebrow, heading: contact.heading, body: contact.body })],
        },
      },
    },
    {
      type: 'builder_page', slug: 'partners', title: 'Partners',
      data: {
        version: 1,
        slots: {
          afterHero: [node('partners-hero', 'brand_hero', { variant: 'partners', eyebrow: partnerHero.eyebrow, title: partnerHero.titleA, accent: partnerHero.titleAccent, body: partnerHero.description, primaryLabel: partnerHero.ctaLabel, primaryHref: partnerHero.ctaHref, logo })],
          afterApproach: [node('partners-directory', 'partner_directory', { kicker: directory.kicker, heading: directory.heading, body: directory.body, note: directory.note, items: partners.map((item) => `${item.title}|${item.data.focus || ''}`).join('\n') })],
          afterSolutions: [node('partners-clients', 'logo_grid', { kicker: clientsHead.kicker, heading: clientsHead.heading, body: clientsHead.body, items: clients.map((item) => `${item.title}|${item.data.logo || ''}|${logoClasses.get(item.title) || ''}`).join('\n') })],
          afterServices: [node('partners-method', 'method_list', { kicker: 'More than product selection', heading: 'The value is in the connection.', items: 'Context first|Start with the workload, risk, and operating reality—not a catalogue.\nIntegrated design|Bring the right technologies into an architecture that makes sense together.\nLocal stewardship|Stay close through implementation, operational handover, and ongoing support.' })],
          beforeContact: [],
          afterContent: [node('partners-contact', 'partner_contact', { eyebrow: 'Find the right fit', heading: 'Let’s match the technology to the work ahead.', body: 'Bring us the challenge. We will help you turn it into an integrated, practical next step.', ctaLabel: 'Start a conversation', ctaHref: '/#contact' })],
        },
      },
    },
  ];
}
