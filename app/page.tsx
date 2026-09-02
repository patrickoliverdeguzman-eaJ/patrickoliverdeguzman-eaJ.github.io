import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Database,
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
      'A resilient foundation for your applications, workloads, and growth.',
    items: [
      'Enterprise storage systems',
      'Cloud & engineered systems',
      'Virtualization & hyperconverged infrastructure',
    ],
  },
  {
    number: '02',
    icon: Network,
    title: 'Network & security',
    description:
      'Protection that keeps your organisation connected, visible, and in control.',
    items: [
      'Cybersecurity & next-gen firewall',
      'Application & infrastructure monitoring',
      'Web application firewall & load balancing',
    ],
  },
  {
    number: '03',
    icon: Database,
    title: 'Data protection',
    description:
      'Practical continuity planning for the information your business depends on.',
    items: [
      'Backup, restore & digital archiving',
      'Business continuity & disaster recovery',
      'Data management for cloud environments',
    ],
  },
];

const services = [
  'Hardware installation, maintenance & onsite support',
  'Helpdesk and technical assistance',
  'Consulting and implementation',
  'Project management and systems integration',
];

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <img
          className="hero-photo"
          src="https://columbusdedicated.com/images/hero-datacenter.png"
          alt="Blue-lit enterprise data center server racks"
        />
        <div className="hero-scanline" aria-hidden="true" />

        <nav className="nav-wrap" aria-label="Main navigation">
          <a href="#top" className="brand" aria-label="INFOStorage home">
            <span className="brand-mark">I</span>
            <span className="brand-type">
              <strong>INFO</strong>storage
            </span>
          </a>

          <div className="desktop-links">
            <a href="#solutions">Solutions</a>
            <a href="#services">Services</a>
            <a href="#approach">Why INFOStorage</a>
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
              <a href="#contact">Contact</a>
            </div>
          </details>
        </nav>

        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-reveal">Enterprise technology, made dependable</p>
            <h1 className="hero-title hero-reveal">
              Build what stays <span>available.</span>
            </h1>
            <p className="hero-description hero-reveal">
              INFOStorage brings together the systems, security, and hands-on expertise
              that help organisations work with confidence.
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

          <aside className="hero-status" aria-label="INFOStorage focus areas">
            <div className="status-line">
              <span className="status-pulse" />
              Built for continuity
            </div>
            <div className="status-rule" />
            <p>
              From the data center to the edge, we design for the parts of your
              business that cannot pause.
            </p>
            <a href="#approach">
              Our approach <ArrowUpRight size={15} />
            </a>
          </aside>
        </div>

        <div className="hero-footer" aria-label="Capabilities">
          <span>Storage</span>
          <span>Compute</span>
          <span>Security</span>
          <span>Continuity</span>
        </div>
      </section>

      <section className="intro section-pad" id="approach">
        <div className="section-kicker reveal">Designed around the real work</div>
        <div className="intro-grid">
          <h2 className="display-heading reveal">
            Complex infrastructure.<br />
            <em>Clear next steps.</em>
          </h2>
          <div className="intro-copy reveal">
            <p>
              Your IT environment has to make room for ambition without introducing
              more uncertainty. Our role is to simplify that decision—then stay close
              through implementation and support.
            </p>
            <a className="text-link" href="#services">
              See how we work <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="principles reveal">
          <div>
            <span>01</span>
            <h3>Enterprise-minded</h3>
            <p>Solutions built for critical workloads, not one-size-fits-all stacks.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Integrated by people</h3>
            <p>Specialists who connect the technology choices to your operating reality.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Support that stays close</h3>
            <p>Local expertise through planning, implementation, and the work after go-live.</p>
          </div>
        </div>
      </section>

      <section className="solutions-section section-pad" id="solutions">
        <div className="solutions-heading reveal">
          <div>
            <p className="section-kicker">Solutions, in context</p>
            <h2 className="display-heading">The layers your business needs to trust.</h2>
          </div>
          <p>
            Build a more adaptable environment with specialist advice and a technology
            foundation that is ready for what is next.
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
          <p className="eyebrow">Continuity, by design</p>
          <h2>Every connection should have a way forward.</h2>
          <p>
            From business continuity planning to backup, recovery, and archive strategy,
            we help make resilience part of the architecture—not an afterthought.
          </p>
          <a className="button button-sand" href="#contact">
            Plan for resilience <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="services-section section-pad" id="services">
        <div className="services-head reveal">
          <p className="section-kicker">INFOStorage Value Added Services</p>
          <h2 className="display-heading">Technology works better with a team behind it.</h2>
          <p>
            The right platform is only the beginning. Our services connect your project
            with the experience needed to make it work in practice.
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
          <h2 className="display-heading">Infrastructure for the work that keeps the country moving.</h2>
        </div>
        <div className="sector-tags reveal" aria-label="Sectors served">
          <span>Financial services</span>
          <span>Telecommunications</span>
          <span>Utilities</span>
          <span>Government</span>
          <span>Local enterprise</span>
        </div>
      </section>

      <section className="contact-panel" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="contact-content reveal">
          <p className="eyebrow">Start the right conversation</p>
          <h2>Make your next infrastructure decision a confident one.</h2>
          <p>
            Tell us what needs to work better. We will help you map a practical path forward.
          </p>
          <div className="contact-actions">
            <a className="button button-primary" href="tel:+63288994878">
              <Phone size={17} /> +63 2 8899 4878
            </a>
            <a className="contact-address" href="https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City" target="_blank" rel="noreferrer">
              Ortigas Center, Pasig City <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <a href="#top" className="brand footer-brand" aria-label="Back to top">
          <span className="brand-mark">I</span>
          <span className="brand-type">
            <strong>INFO</strong>storage
          </span>
        </a>
        <p>Enterprise-class solutions for data computing operations.</p>
        <span>© {new Date().getFullYear()} INFOStorage Corporation</span>
      </footer>
    </main>
  );
}
