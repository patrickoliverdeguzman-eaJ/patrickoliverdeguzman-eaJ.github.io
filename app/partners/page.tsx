import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, Menu } from 'lucide-react';

export const dynamic = 'force-static';

const partners = [
  { name: 'A10 Networks', focus: 'Application delivery & security' },
  { name: 'Hitachi Data Systems', focus: 'Enterprise data infrastructure' },
  { name: 'Oracle', focus: 'Cloud & engineered systems' },
  { name: 'Lenovo', focus: 'Servers & workplace computing' },
  { name: 'UltraBac', focus: 'Backup & recovery' },
  { name: 'EMC Data Domain', focus: 'Data protection storage' },
  { name: 'StorageTek', focus: 'Enterprise tape & storage' },
];

type ValuedClient = {
  name: string;
  logo: string;
  logoClass?: string;
};

const valuedClients: ValuedClient[] = [
  {
    name: 'Government Service Insurance System',
    logo: '/client-logos/gsis-reference.png',
    logoClass: 'client-logo-gsis',
  },
  {
    name: 'League One Finance and Leasing Corporation',
    logo: '/client-logos/league-one-reference.png',
    logoClass: 'client-logo-league',
  },
  {
    name: 'Bangko Sentral ng Pilipinas',
    logo: '/client-logos/bsp-reference.png',
  },
  {
    name: 'Securities and Exchange Commission',
    logo: '/client-logos/sec-reference.png',
  },
  {
    name: 'Office of the President of the Philippines',
    logo: '/client-logos/op-malacanang-reference.png',
  },
  {
    name: 'Global Payments',
    logo: '/client-logos/global-payments-reference.png',
    logoClass: 'client-logo-wide-white',
  },
  {
    name: 'Credit Information Corporation',
    logo: '/client-logos/credit-information-reference.png',
    logoClass: 'client-logo-wide-white',
  },
  {
    name: 'SYSTRA Philippines',
    logo: '/client-logos/systra-reference.png',
    logoClass: 'client-logo-systra',
  },
  {
    name: 'NextVAS',
    logo: '/client-logos/nextvas-reference.png',
  },
  {
    name: 'Home Credit',
    logo: 'https://static.wixstatic.com/media/58bb01_f895c5145c0b4edfa4bfa8b83b0ff5a9~mv2.png/v1/fill/w_152%2Ch_95%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/Home_Credit_Logo_Grey.png',
  },
  {
    name: 'ADP Pharma',
    logo: 'https://www.adppharma.com/wp-content/uploads/2022/05/adp-logo.png',
  },
  {
    name: 'San-Yang Furniture',
    logo: 'https://pbs.twimg.com/profile_images/704835910391599104/Brmm68EG.jpg',
  },
  {
    name: 'JINS',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/JINS_Logo.svg/3840px-JINS_Logo.svg.png',
  },
  {
    name: 'DENR Biodiversity Management Bureau',
    logo: '/client-logos/denr-reference.png',
    logoClass: 'client-logo-denr',
  },
  {
    name: 'One Cainta',
    logo: 'https://static.wixstatic.com/media/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png/v1/fit/w_2500%2Ch_1330%2Cal_c/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png',
  },
  {
    name: 'Hitachi Digital Services',
    logo: 'https://partnerfinder.sap.com/sap/details/api/media/storage/0003054642/86f70a3e-f8f8-4ebf-8399-c149c6e484cf.png',
  },
  {
    name: 'Amdocs',
    logo: '/client-logos/amdocs-reference.png',
    logoClass: 'client-logo-amdocs',
  },
  {
    name: '7-Eleven',
    logo: 'https://www.clipartmax.com/png/middle/58-586690_7-eleven-brand-logo-7-11-logo.png',
  },
  {
    name: 'Cathay United Bank',
    logo: 'https://www.singaporeair.com/content/dam/sia/web-assets/images/ppsclub-krisflyer/earn-miles/earnontheground/financial-services-partners/cathayunitedbanktaiwan/CathayUnitedBanklogo_1240x%20400.png',
  },
];

export const metadata: Metadata = {
  title: 'Partners | INFOStorage',
  description: 'Explore the INFOStorage technology partner ecosystem.',
  openGraph: {
    title: 'Partners | INFOStorage',
    description: 'Explore the INFOStorage technology partner ecosystem.',
    images: [],
  },
  twitter: {
    images: [],
  },
};

const partnersHref =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/partners.html' : '/partners';

export default function PartnersPage() {
  return (
    <main className="partner-page">
      <section className="partner-hero">
        <nav className="nav-wrap" aria-label="Main navigation">
          <a href="/" className="brand brand-image" aria-label="INFOStorage home">
            <span className="brand-logo-frame partner-brand-logo-frame">
              <img className="brand-logo" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
            </span>
          </a>

          <div className="desktop-links">
            <a href="/#solutions">Solutions</a>
            <a href="/#services">Services</a>
            <a href="/#approach">Why INFOStorage</a>
            <a className="nav-active" href={partnersHref}>Partners</a>
            <a href="/#contact">Contact</a>
          </div>

          <a className="nav-cta" href="/#contact">
            Start a conversation <ArrowUpRight size={16} strokeWidth={2.1} />
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={22} />
            </summary>
            <div className="mobile-menu-panel">
              <a href="/#solutions">Solutions</a>
              <a href="/#services">Services</a>
              <a href="/#approach">Why INFOStorage</a>
              <a href={partnersHref}>Partners</a>
              <a href="/#contact">Contact</a>
            </div>
          </details>
        </nav>

        <div className="partner-hero-inner section-pad">
          <div className="partner-hero-copy">
            <p className="eyebrow hero-reveal">Partner ecosystem</p>
            <h1 className="partner-title hero-reveal">
              Integration starts with the <span>right ecosystem.</span>
            </h1>
            <p className="partner-description hero-reveal">
              INFOStorage works with global product brands and enterprise solution providers
              to deliver technology stacks that fit the way your organisation operates.
            </p>
            <a className="button button-primary hero-reveal" href="#partner-directory">
              Explore the ecosystem <ArrowRight size={18} />
            </a>
          </div>

          <div className="partner-logo-stage">
            <div className="logo-stage-orbit orbit-a" />
            <div className="logo-stage-orbit orbit-b" />
            <div className="partner-logo-plaque">
              <img src="/infostorage-logo.png" alt="INFOStorage Corporation" />
            </div>
          </div>
        </div>
      </section>

      <section className="partner-directory section-pad" id="partner-directory">
        <div className="partner-directory-heading reveal">
          <div>
            <p className="section-kicker">Selected technology partners</p>
            <h2 className="display-heading">Built around the systems you rely on.</h2>
          </div>
          <p>
            A focused ecosystem of infrastructure, security, cloud, and protection
            technologies—brought together around your operating needs.
          </p>
        </div>

        <div className="partner-grid">
          {partners.map((partner, index) => (
            <article className="partner-card reveal" key={partner.name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{partner.name}</h3>
              <p>{partner.focus}</p>
              <div className="partner-card-line" />
              <small>Technology ecosystem</small>
            </article>
          ))}
        </div>

        <p className="partner-note reveal">
          Technology availability and solution fit can vary by requirement. Talk with
          INFOStorage to identify the most suitable current option for your environment.
        </p>
      </section>

      <section className="partner-clients section-pad" id="valued-clients">
        <div className="partner-clients-heading reveal">
          <div>
            <p className="section-kicker">Valued clients (partial)</p>
            <h2>Trusted where the work matters most.</h2>
          </div>
          <p>
            A selection of organisations that have chosen INFOStorage for enterprise
            technology, integration, and support.
          </p>
        </div>

        <div className="partner-clients-grid" aria-label="Selected valued clients">
          {valuedClients.map((client, index) => (
            <article className={`partner-client-card reveal ${client.logoClass ?? ''}`} key={client.name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <img src={client.logo} alt={`${client.name} logo`} loading="lazy" />
              <small>{client.name}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-method section-pad">
        <div className="partner-method-copy reveal">
          <p className="section-kicker">More than product selection</p>
          <h2 className="display-heading">The value is in the connection.</h2>
        </div>
        <div className="partner-method-list">
          <div className="reveal">
            <span>01</span>
            <h3>Context first</h3>
            <p>Start with the workload, risk, and operating reality—not a catalogue.</p>
          </div>
          <div className="reveal">
            <span>02</span>
            <h3>Integrated design</h3>
            <p>Bring the right technologies into an architecture that makes sense together.</p>
          </div>
          <div className="reveal">
            <span>03</span>
            <h3>Local stewardship</h3>
            <p>Stay close through implementation, operational handover, and ongoing support.</p>
          </div>
        </div>
      </section>

      <section className="partner-contact">
        <div className="partner-contact-content reveal">
          <p className="eyebrow">Find the right fit</p>
          <h2>Let’s match the technology to the work ahead.</h2>
          <p>
            Bring us the challenge. We will help you turn it into an integrated,
            practical next step.
          </p>
          <a className="button button-sand" href="/#contact">
            Start a conversation <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <a href="/" className="brand footer-brand partner-footer-brand" aria-label="INFOStorage home">
          <img className="footer-logo" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
        </a>
        <p>1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City</p>
        <span>© 2025 INFOStorage Corporation</span>
      </footer>
    </main>
  );
}
