import {
  createBuilderNode,
  emptyBuilderPage,
  reindexBuilderPage,
  type BuilderNode,
  type BuilderNodeType,
  type BuilderPage,
} from './page-builder';

export const CONTENT_PAGE_SLUGS = ['about', 'solutions', 'services', 'contact'] as const;
export type ContentPageSlug = (typeof CONTENT_PAGE_SLUGS)[number];

export type ContentPageDefinition = {
  slug: ContentPageSlug;
  title: string;
  description: string;
  page: BuilderPage;
};

function block(
  id: string,
  type: BuilderNodeType,
  props: BuilderNode['props'],
  options: {
    elementId?: string;
    tone?: BuilderNode['styles']['tone'];
    width?: BuilderNode['styles']['width'];
    padding?: BuilderNode['styles']['padding'];
  } = {},
): BuilderNode {
  const node = createBuilderNode(type);
  node.id = id;
  node.props = { ...node.props, ...props };
  node.styles = {
    ...node.styles,
    ...(options.tone ? { tone: options.tone } : {}),
    ...(options.width ? { width: options.width } : {}),
    ...(options.padding ? { padding: options.padding } : {}),
    elementId: options.elementId ?? node.styles.elementId,
  };
  return node;
}

function page(
  slug: ContentPageSlug,
  seoTitle: string,
  seoDescription: string,
  slots: Partial<BuilderPage['slots']>,
): BuilderPage {
  const result = emptyBuilderPage();
  result.settings = {
    ...result.settings,
    seoTitle,
    seoDescription,
  };
  result.slots = { ...result.slots, ...slots };
  return reindexBuilderPage(result);
}

function chrome(slug: string): { header: BuilderNode; footer: BuilderNode } {
  return {
    header: block(`${slug}-header`, 'site_header', { useGlobal: true }),
    footer: block(`${slug}-footer`, 'site_footer', { useGlobal: true }),
  };
}

function aboutPage(): BuilderPage {
  const { header, footer } = chrome('about');
  const hero = block('about-hero', 'brand_hero', {
    variant: 'partners',
    eyebrow: 'Established 1999',
    title: 'Enterprise experience with',
    accent: 'local agility.',
    body: 'INFOStorage grew from enterprise storage roots into a solutions integrator spanning data centres, security, protection, networks, workplace technology, and professional services.',
    primaryLabel: 'Read our story',
    primaryHref: '#history',
    logo: '/infostorage-logo.png',
  });
  const history = block('about-history', 'split_intro', {
    kicker: 'Our history',
    heading: 'Built for enterprise work',
    accent: 'from the beginning.',
    body: 'Founded in 1999 by senior technology managers, INFOStorage began as the Philippine distributor of StorageTek enterprise tape and disk systems. In 2000, the team delivered a 3,000-cartridge STK 9310 VSM Silo—an early virtual-tape implementation—and kept expanding its capabilities around the changing needs of enterprise customers.',
    linkLabel: 'Explore our solutions',
    linkHref: '/solutions',
  }, { elementId: 'history' });
  const facts = block('about-facts', 'statistics', {
    kicker: 'Company milestones',
    heading: 'A long view of enterprise technology.',
    items: '1999|INFOStorage was established\n3,000|Cartridge enterprise tape system delivered in 2000\n2025|Recognised as a strategic solutions partner',
  }, { tone: 'muted', width: 'wide', padding: 'spacious' });
  const mission = block('about-mission', 'feature_grid', {
    kicker: 'Mission and values',
    heading: 'Specialized. Recognized. Respected.',
    body: 'Three commitments guide the way INFOStorage selects solutions, keeps promises, and works with customers.',
    items: 'Specialized|Focused expertise across a chosen set of enterprise IT solutions.\nRecognized|A commitment to deliver the work and outcomes promised to every client.\nRespected|Professional service carried out with integrity from planning through support.',
  }, { width: 'wide', padding: 'spacious' });
  const milestones = block('about-milestones', 'faq', {
    kicker: 'Selected recognition',
    heading: 'Milestones across more than two decades.',
    items: '2000–2005|Recognition from StorageTek and CA marked INFOStorage’s early years as a specialist enterprise technology partner.\n2010–2014|The company earned Oracle Gold status and partner recognition from BakBone, Hitachi, A10, FireEye, Synetcom, Netpoleon, and CA.\n2015–2019|INFOStorage received multiple Hitachi solution awards, a Lenovo Gold PC designation, Sangfor authorisation, and a McAfee rookie award.\n2025|Hitachi and VST ECS recognised INFOStorage as a strategic solutions partner.',
  }, { width: 'wide', padding: 'spacious' });
  const contact = block('about-contact', 'partner_contact', {
    eyebrow: 'Work with an experienced team',
    heading: 'Bring us the challenge behind the technology.',
    body: 'We connect the right products, architecture, implementation, and support around the way your organisation operates.',
    ctaLabel: 'Start a conversation',
    ctaHref: '/contact',
  });

  return page('about', 'About INFOStorage | Company history', 'Learn how INFOStorage grew from enterprise storage roots into a Philippine technology solutions integrator.', {
    afterHero: [header, hero],
    afterApproach: [history, facts],
    afterSolutions: [mission],
    afterServices: [milestones],
    afterContent: [contact, footer],
  });
}

function solutionsPage(): BuilderPage {
  const { header, footer } = chrome('solutions');
  const hero = block('solutions-page-hero', 'brand_hero', {
    variant: 'partners',
    eyebrow: 'Enterprise solutions',
    title: 'Build a complete foundation for',
    accent: 'data computing.',
    body: 'INFOStorage brings systems, network security, data protection, and workplace technology together around business requirements—not isolated products.',
    primaryLabel: 'View solution areas',
    primaryHref: '#solution-areas',
    logo: '/infostorage-logo.png',
  });
  const intro = block('solutions-page-intro', 'split_intro', {
    kicker: 'Connected by design',
    heading: 'Technology that works',
    accent: 'as one environment.',
    body: 'Solutions are selected and integrated to support the objective behind each workload. That means matching infrastructure, protection, connectivity, security, and user technology to the organisation’s actual operating needs.',
    linkLabel: 'See how we support delivery',
    linkHref: '/services',
  });
  const solutions = block('solutions-page-grid', 'solution_grid', {
    kicker: 'Solution areas',
    heading: 'From platform to protection.',
    body: 'Explore the four core areas INFOStorage uses to design complete enterprise environments.',
  }, { elementId: 'solution-areas' });
  const cards = [
    ['Systems & platforms', 'Enterprise infrastructure aligned to the business objectives behind every workload.', 'Enterprise storage systems;Oracle Cloud Infrastructure and engineered systems;Server and storage virtualization;Hyper-converged infrastructure'],
    ['Network & security', 'Secure and reliable connectivity for collaboration, visibility, compliance, and continuity.', 'Cybersecurity and next-generation firewall;Load balancing and web application firewall;Data loss prevention and identity access governance;Performance monitoring and web isolation'],
    ['Data protection', 'Protection mechanisms shaped around data requirements, recovery objectives, and risk.', 'Business continuity and disaster recovery;Enterprise backup and restore;Digital archiving;Protection strategy and implementation'],
    ['Mobile & peripherals', 'Workplace computing and peripherals integrated into the wider technology environment.', 'Desktop and laptop computing;Mobile device integration;Business peripherals;Enterprise-ready deployment'],
  ] as const;
  solutions.children = cards.map(([title, body, features], index) => {
    const card = block(`solutions-page-card-${index + 1}`, 'solution_card', {
      title,
      body,
      features,
      href: '/contact',
    });
    card.sortIndex = index;
    return card;
  });
  const integration = block('solutions-page-integration', 'feature_grid', {
    kicker: 'Ecosystem integration',
    heading: 'The value is in how the pieces connect.',
    body: 'INFOStorage combines technologies into an environment that is practical to deploy, operate, protect, and support.',
    items: 'Requirements first|Start with workloads, objectives, constraints, and risk before selecting technology.\nArchitecture fit|Connect hardware, software, cloud, network, and protection into a coherent design.\nOperational continuity|Plan implementation, handover, and support so the environment remains useful after launch.',
  }, { tone: 'muted', width: 'wide', padding: 'spacious' });
  const contact = block('solutions-page-contact', 'partner_contact', {
    eyebrow: 'Plan the right environment',
    heading: 'Turn a technology requirement into a practical next step.',
    body: 'Talk with INFOStorage about your workloads, infrastructure, security, protection, or integration needs.',
    ctaLabel: 'Discuss your requirements',
    ctaHref: '/contact',
  });

  return page('solutions', 'Solutions | INFOStorage', 'Explore INFOStorage solutions for systems, platforms, network security, data protection, mobile computing, and peripherals.', {
    afterHero: [header, hero],
    afterApproach: [intro],
    afterSolutions: [solutions],
    afterServices: [integration],
    afterContent: [contact, footer],
  });
}

function servicesPage(): BuilderPage {
  const { header, footer } = chrome('services');
  const hero = block('services-page-hero', 'brand_hero', {
    variant: 'partners',
    eyebrow: 'INFOStorage Value Added Services',
    title: 'Keep technology working',
    accent: 'in practice.',
    body: 'IVAS adds the professional work around every solution—from installation and implementation through ongoing assistance and systems integration.',
    primaryLabel: 'Explore services',
    primaryHref: '#service-areas',
    logo: '/infostorage-logo.png',
  });
  const intro = block('services-page-intro', 'split_intro', {
    kicker: 'Beyond product supply',
    heading: 'Delivery support across',
    accent: 'the technology lifecycle.',
    body: 'INFOStorage’s experienced professionals support data centres, data management, security, and related enterprise environments. The aim is to make each solution easier to implement, operate, maintain, and improve.',
    linkLabel: 'Meet INFOStorage',
    linkHref: '/about',
  });
  const services = block('services-page-list', 'service_list', {
    kicker: 'Service areas',
    heading: 'Specialist help where it matters.',
    body: 'Choose a focused engagement or connect services across a wider implementation.',
  }, { elementId: 'service-areas' });
  const serviceNames = [
    'Hardware installation, maintenance and onsite support',
    'Helpdesk',
    'Consulting and implementation',
    'Project management and systems integration',
  ];
  services.children = serviceNames.map((text, index) => {
    const row = block(`services-page-row-${index + 1}`, 'service_row', { text, href: '/contact' });
    row.sortIndex = index;
    return row;
  });
  const approach = block('services-page-approach', 'feature_grid', {
    kicker: 'How engagements work',
    heading: 'A clear path from requirement to operation.',
    body: 'Service work stays connected to the technical and business outcome the organisation needs.',
    items: 'Understand|Clarify the environment, workload, objectives, dependencies, and risk.\nImplement|Coordinate technology, people, milestones, testing, and operational handover.\nSupport|Stay available for maintenance, helpdesk assistance, and the next stage of improvement.',
  }, { tone: 'muted', width: 'wide', padding: 'spacious' });
  const contact = block('services-page-contact', 'partner_contact', {
    eyebrow: 'Need specialist support?',
    heading: 'Let’s shape the right service engagement.',
    body: 'Tell us what you are deploying, maintaining, integrating, or improving, and we will help define the next step.',
    ctaLabel: 'Talk to the team',
    ctaHref: '/contact',
  });

  return page('services', 'Services | INFOStorage', 'Explore INFOStorage Value Added Services for installation, maintenance, helpdesk, consulting, implementation, and systems integration.', {
    afterHero: [header, hero],
    afterApproach: [intro],
    afterSolutions: [services],
    afterServices: [approach],
    afterContent: [contact, footer],
  });
}

function contactPage(): BuilderPage {
  const { header, footer } = chrome('contact');
  const hero = block('contact-page-hero', 'brand_hero', {
    variant: 'partners',
    eyebrow: 'Contact INFOStorage',
    title: 'Give your business what it needs',
    accent: 'to grow.',
    body: 'Start with the challenge, the workload, or the outcome you need. Our team can help identify a practical enterprise technology path.',
    primaryLabel: 'View contact details',
    primaryHref: '#contact-details',
    logo: '/infostorage-logo.png',
  });
  const details = block('contact-page-details', 'split_intro', {
    kicker: 'Contact details',
    heading: 'Start a conversation',
    accent: 'with our team.',
    body: 'Call +63 2 8899 4878 or visit INFOStorage at 1101 AIC Burgundy Empire Tower, ADB Avenue corner Sapphire and Garnet Roads, Ortigas Center, Pasig City, Philippines.',
    linkLabel: 'Get directions',
    linkHref: 'https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City',
  }, { elementId: 'contact-details' });
  const channels = block('contact-page-channels', 'feature_grid', {
    kicker: 'How to reach us',
    heading: 'Choose the channel that suits the conversation.',
    body: 'Share the context you already have. A requirement, issue, project stage, or desired outcome is enough to begin.',
    items: 'Call|Speak with INFOStorage at +63 2 8899 4878.\nVisit|Find the team at AIC Burgundy Empire Tower in Ortigas Center, Pasig City.\nLive chat|Use the chat button on this page to start a conversation with the site administrator.',
  }, { width: 'wide', padding: 'spacious' });
  const contact = block('contact-page-panel', 'contact_panel', {
    eyebrow: 'INFOStorage Corporation',
    heading: 'Let’s discuss the work ahead.',
    body: 'Talk with the team about systems, security, protection, workplace technology, implementation, integration, or support.',
  });

  return page('contact', 'Contact | INFOStorage', 'Contact INFOStorage Corporation in Ortigas Center, Pasig City for enterprise technology solutions and services.', {
    afterHero: [header, hero],
    afterApproach: [details],
    afterSolutions: [channels],
    afterContent: [contact, footer],
  });
}

export const CONTENT_PAGES: Record<ContentPageSlug, ContentPageDefinition> = {
  about: {
    slug: 'about',
    title: 'About INFOStorage',
    description: 'Company history, mission, values, and selected milestones.',
    page: aboutPage(),
  },
  solutions: {
    slug: 'solutions',
    title: 'Solutions',
    description: 'Enterprise systems, security, protection, and workplace technology.',
    page: solutionsPage(),
  },
  services: {
    slug: 'services',
    title: 'Services',
    description: 'INFOStorage Value Added Services across the technology lifecycle.',
    page: servicesPage(),
  },
  contact: {
    slug: 'contact',
    title: 'Contact INFOStorage',
    description: 'Start a conversation with the INFOStorage team.',
    page: contactPage(),
  },
};
