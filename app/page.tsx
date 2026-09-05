'use client';

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
import { useEffect, useState } from 'react';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import SiteChatbot from './site-chatbot';
import { DEFAULT_HOME, loadHomeContent, type HomeContent } from '@/lib/site-content';

const solutionIcons = [ServerCog, Network, Database, Laptop];

const partnersHref =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/partners.html' : '/partners';

function partnerHref(href: string): string {
  if (href === '/partners') return partnersHref;
  return href;
}

export default function Home() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME);

  useEffect(() => {
    let cancelled = false;
    void loadHomeContent().then((loaded) => {
      if (!cancelled) setContent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { navItems, hero, approach, solutionsHeading, solutions, continuity, servicesHead, services, sectors, contact, site, footer } = content;

  return (
    <>
    <main className="site-shell">
      <section className="hero" id="top">
        <div className="hero-scanline" aria-hidden="true" />

        <nav className="nav-wrap" aria-label="Main navigation">
          <a href="#top" className="brand brand-image" aria-label="INFOStorage home">
            <span className="brand-logo-frame">
              <img className="brand-logo" src={site.logo} alt="INFOStorage Corporation" />
            </span>
          </a>

          <div className="desktop-links">
            {navItems.map((item) => (
              <a key={item.id} href={partnerHref(item.href)}>{item.label}</a>
            ))}
          </div>

          <a className="nav-cta" href="#contact">
            Start a conversation <ArrowUpRight size={16} strokeWidth={2.1} />
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={22} />
            </summary>
            <div className="mobile-menu-panel">
              {navItems.map((item) => (
                <a key={item.id} href={partnerHref(item.href)}>{item.label}</a>
              ))}
            </div>
          </details>
        </nav>

        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-reveal">{hero.eyebrow}</p>
            <h1 className="hero-title hero-reveal">
              {hero.titleA} <span>{hero.titleAccent}</span>
            </h1>
            <p className="hero-description hero-reveal">
              {hero.description}
            </p>
            <div className="hero-actions hero-reveal">
              <a className="button button-primary" href={hero.primaryHref}>
                {hero.primaryLabel} <ArrowRight size={18} />
              </a>
              <a className="button button-quiet" href={hero.secondaryHref}>
                {hero.secondaryLabel} <ChevronRight size={18} />
              </a>
            </div>
          </div>

          <div className="hero-brand-stage">
            <div className="hero-brand-orbit hero-brand-orbit-one" aria-hidden="true" />
            <div className="hero-brand-orbit hero-brand-orbit-two" aria-hidden="true" />
            <div className="hero-logo-plaque">
              <img src={site.logo} alt="INFOStorage Corporation" />
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

      <PageBuilderRenderer page={content.builder} slot="afterHero" />

      <section className="intro section-pad" id="approach">
        <div className="section-kicker reveal">{approach.kicker}</div>
        <div className="intro-grid">
          <h2 className="display-heading reveal">
            {approach.headingA}<br />
            <em>{approach.headingAccent}</em>
          </h2>
          <div className="intro-copy reveal">
            <p>
              {approach.body}
            </p>
            <a className="text-link" href={approach.linkHref}>
              {approach.linkLabel} <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="principles reveal">
          {approach.principles.map((principle) => (
            <div key={principle.n}>
              <span>{principle.n}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </div>
          ))}
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterApproach" />

      <section className="solutions-section section-pad" id="solutions">
        <div className="solutions-heading reveal">
          <div>
            <p className="section-kicker">{solutionsHeading.kicker}</p>
            <h2 className="display-heading">{solutionsHeading.heading}</h2>
          </div>
          <p>
            {solutionsHeading.body}
          </p>
        </div>

        <div className="solutions-grid">
          {solutions.map(({ title, description, items }, index) => {
            const Icon = solutionIcons[index % solutionIcons.length];
            const number = String(index + 1).padStart(2, '0');
            return (
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
            );
          })}
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterSolutions" />

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
          <p className="eyebrow">{continuity.eyebrow}</p>
          <h2>{continuity.heading}</h2>
          <p>
            {continuity.body}
          </p>
          <a className="button button-sand" href={continuity.ctaHref}>
            {continuity.ctaLabel} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="services-section section-pad" id="services">
        <div className="services-head reveal">
          <p className="section-kicker">{servicesHead.kicker}</p>
          <h2 className="display-heading">{servicesHead.heading}</h2>
          <p>
            {servicesHead.body}
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

      <PageBuilderRenderer page={content.builder} slot="afterServices" />

      <section className="sectors section-pad">
        <div className="sectors-copy reveal">
          <p className="section-kicker">{sectors.kicker}</p>
          <h2 className="display-heading">{sectors.heading}</h2>
        </div>
        <div className="sector-tags reveal" aria-label="Sectors served">
          {sectors.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="beforeContact" />

      <section className="contact-panel" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="contact-content reveal">
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2>{contact.heading}</h2>
          <p>
            {contact.body}
          </p>
          <div className="contact-actions">
            <a className="button button-primary" href={site.phoneHref}>
              <Phone size={17} /> {site.phone}
            </a>
            <a className="contact-address" href={site.addressUrl} target="_blank" rel="noreferrer">
              {site.address} <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterContent" />

      <footer className="site-footer">
        <a href="#top" className="brand footer-brand" aria-label="Back to top">
          <img className="footer-logo" src={site.logo} alt="INFOStorage Corporation" />
        </a>
        <p>{footer.address}</p>
        <span>{footer.copyright}</span>
      </footer>
    </main>
    <SiteChatbot />
    </>
  );
}
