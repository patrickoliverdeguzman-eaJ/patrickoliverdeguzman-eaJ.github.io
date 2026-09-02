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
            <span className="brand-logo-frame">
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
              Technology gets <span>stronger</span> together.
            </h1>
            <p className="partner-description hero-reveal">
              We bring specialised technology together with local integration expertise
              so every piece of your environment can work as one.
            </p>
            <a className="button button-primary hero-reveal" href="#partner-directory">
              Explore the ecosystem <ArrowRight size={18} />
            </a>
          </div>

          <div className="partner-logo-stage" aria-hidden="true">
            <div className="logo-stage-orbit orbit-a" />
            <div className="logo-stage-orbit orbit-b" />
            <img src="/infostorage-logo.png" alt="" />
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
        <a href="/" className="brand footer-brand" aria-label="INFOStorage home">
          <img className="footer-logo" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
        </a>
        <p>Enterprise-class solutions for data computing operations.</p>
        <span>© {new Date().getFullYear()} INFOStorage Corporation</span>
      </footer>
    </main>
  );
}
