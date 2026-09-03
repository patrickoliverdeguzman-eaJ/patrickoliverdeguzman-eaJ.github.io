import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Database,
  Laptop,
  Menu,
  Network,
  Phone,
  ServerCog,
} from 'lucide-react';

const solutions = [
  {
    number: '01',
    icon: ServerCog,
    title: 'Systems & platforms',
    description:
      'Integrated systems designed to support the business objectives behind every workload.',
    items: [
      'Enterprise storage systems',
      'Oracle Cloud Infrastructure & engineered systems',
      'Server and storage virtualization',
      'Hyper-converged infrastructure solutions',
    ],
  },
  {
    number: '02',
    icon: Network,
    title: 'Network & security',
    description:
      'A secure, reliable network foundation for collaboration and business continuity.',
    items: [
      'Cybersecurity, IAG & next-generation firewall',
      'Load balancing, WAF & DLP compliance',
      'Performance monitoring & web isolation',
    ],
  },
  {
    number: '03',
    icon: Database,
    title: 'Data protection',
    description:
      'Protection strategies tailored to your organisation’s data, requirements, and risk profile.',
    items: [
      'Business continuity & disaster recovery',
      'Enterprise backup and restore',
      'Digital archiving',
    ],
  },
  {
    number: '04',
    icon: Laptop,
    title: 'Mobile & peripherals',
    description:
      'Workplace technology integrated into the wider IT environment for seamless operation.',
    items: [
      'Desktop and laptop computing',
      'Mobile device integration',
      'Business peripherals',
    ],
  },
];

const services = [
  'Hardware installation, maintenance & onsite support',
  'Helpdesk',
  'Consulting and implementation',
  'Project management and systems integration',
];

const partnersHref =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/partners.html' : '/partners';

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <div className="hero-scanline" aria-hidden="true" />

        <nav className="nav-wrap" aria-label="Main navigation">
          <a href="#top" className="brand brand-image" aria-label="INFOStorage home">
            <span className="brand-logo-frame">
              <img className="brand-logo" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
            </span>
          </a>

          <div className="desktop-links">
            <a href="#solutions">Solutions</a>
            <a href="#services">Services</a>
            <a href="#approach">Why INFOStorage</a>
            <a href={partnersHref}>Partners</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="nav-cta" href="#contact">
            Start a conversation <ArrowUpRight size={16} strokeWidth={2.1} />
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={22} />
            </summary>
            <div className="mobile-menu-panel">
              <a href="#solutions">Solutions</a>
              <a href="#services">Services</a>
              <a href="#approach">Why INFOStorage</a>
              <a href={partnersHref}>Partners</a>
              <a href="#contact">Contact</a>
            </div>
          </details>
        </nav>

        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-reveal">Premium solutions integrator</p>
            <h1 className="hero-title hero-reveal">
              Enterprise-class solutions for <span>what comes next.</span>
            </h1>
            <p className="hero-description hero-reveal">
              INFOStorage Corporation provides comprehensive data computing solutions—from
              systems and security to protection and specialist services.
            </p>
            <div className="hero-actions hero-reveal">
              <a className="button button-primary" href="#solutions">
                Explore our solutions <ArrowRight size={18} />
              </a>
              <a className="button button-quiet" href="#contact">
                Talk to an expert <ChevronRight size={18} />
              </a>
            </div>
          </div>

          <div className="hero-brand-stage">
            <div className="hero-brand-orbit hero-brand-orbit-one" aria-hidden="true" />
            <div className="hero-brand-orbit hero-brand-orbit-two" aria-hidden="true" />
            <div className="hero-logo-plaque">
              <img src="/infostorage-logo.png" alt="INFOStorage Corporation" />
            </div>
          </div>
        </div>

        <div className="hero-footer" aria-label="Capabilities">
          <span>Systems & platforms</span>
          <span>Network & security</span>
          <span>Data protection</span>
          <span>IVAS</span>
        </div>
      </section>

      <section className="intro section-pad" id="approach">
        <div className="section-kicker reveal">The INFOStorage difference</div>
        <div className="intro-grid">
          <h2 className="display-heading reveal">
            Manage your data<br />
            <em>more efficiently.</em>
          </h2>
          <div className="intro-copy reveal">
            <p>
              INFOStorage is a leading IT consultant providing enterprise-class data
              center solutions. Our experience spans servers, DAS/SAN/NAS storage,
              automated tape, data protection and disaster recovery, and network implementation.
              Our vision is to be the vendor of choice for IT enterprise-class solutions and services.
            </p>
            <a className="text-link" href="#services">
              Explore IVAS <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="principles reveal">
          <div>
            <span>01</span>
            <h3>Specialized</h3>
            <p>Focused expertise across a chosen set of enterprise IT solutions.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Recognized</h3>
            <p>A commitment to deliver on the work we take on with every client.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Respected</h3>
            <p>Professional service delivered with integrity from planning through support.</p>
          </div>
        </div>
      </section>

      <section className="solutions-section section-pad" id="solutions">
        <div className="solutions-heading reveal">
          <div>
            <p className="section-kicker">Our solutions</p>
            <h2 className="display-heading">A complete foundation for data computing.</h2>
          </div>
          <p>
            Hardware, software, and infrastructure components brought together around
            your organisation’s operating needs and objectives.
          </p>
        </div>

        <div className="solutions-grid">
          {solutions.map(({ number, icon: Icon, title, description, items }) => (
            <article className="solution-card reveal" key={title}>
              <div className="solution-topline">
                <span>{number}</span>
                <Icon size={25} strokeWidth={1.6} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <ul>
                {items.map((item) => (
                  <li key={item}>
                    <Check size={15} strokeWidth={2.4} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#contact" aria-label={`Discuss ${title}`}>
                Discuss this solution <ArrowUpRight size={18} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="continuity-panel section-pad">
        <div className="continuity-art" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="circuit-line line-one" />
          <div className="circuit-line line-two" />
          <span>01</span>
          <span>10</span>
          <span>11</span>
        </div>
        <div className="continuity-copy reveal">
          <p className="eyebrow">Data protection</p>
          <h2>Protect the information your operations depend on.</h2>
          <p>
            We design, deploy, and maintain data protection mechanisms that fit your
            requirements—from business continuity and disaster recovery to backup, restore,
            and digital archiving.
          </p>
          <a className="button button-sand" href="#contact">
            Discuss data protection <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="services-section section-pad" id="services">
        <div className="services-head reveal">
          <p className="section-kicker">INFOStorage Value Added Services</p>
          <h2 className="display-heading">Services that keep technology working in practice.</h2>
          <p>
            INFOStorage Value Added Services bring professional support around every
            solution, from installation and implementation to ongoing assistance.
          </p>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <a className="service-row reveal" href="#contact" key={service}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{service}</strong>
              <ArrowUpRight size={22} strokeWidth={1.7} />
            </a>
          ))}
        </div>
      </section>

      <section className="sectors section-pad">
        <div className="sectors-copy reveal">
          <p className="section-kicker">Built across industries</p>
          <h2 className="display-heading">Trusted by multinational and local enterprises.</h2>
        </div>
        <div className="sector-tags reveal" aria-label="Sectors served">
          <span>Financial services</span>
          <span>Telecommunications</span>
          <span>Utilities</span>
          <span>Government</span>
        </div>
      </section>

      <section className="contact-panel" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="contact-content reveal">
          <p className="eyebrow">Contact INFOStorage</p>
          <h2>Give your business what it needs to grow.</h2>
          <p>
            Let’s discuss your data storage and computing needs, and identify the right
            enterprise solution for your environment.
          </p>
          <div className="contact-actions">
            <a className="button button-primary" href="tel:+63288994878">
              <Phone size={17} /> +63 2 8899 4878
            </a>
            <a className="contact-address" href="https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City" target="_blank" rel="noreferrer">
              1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <a href="#top" className="brand footer-brand" aria-label="Back to top">
          <img className="footer-logo" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
        </a>
        <p>1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City</p>
        <span>© 2025 INFOStorage Corporation</span>
      </footer>
    </main>
  );
}
