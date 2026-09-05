'use client';

import { ArrowRight, ArrowUpRight, Menu } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import SiteChatbot from '@/app/site-chatbot';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { DEFAULT_PARTNERS, designVariables, loadPartnersContent, type PartnersContent } from '@/lib/site-content';

const partnersHref =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/partners.html' : '/partners';

function navHref(href: string): string {
  if (href === '/partners') return partnersHref;
  return href.startsWith('#') ? `/${href}` : href;
}

export function PartnersPage() {
  const [content, setContent] = useState<PartnersContent>(DEFAULT_PARTNERS);

  useEffect(() => {
    let cancelled = false;
    void loadPartnersContent().then((loaded) => {
      if (!cancelled) setContent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { design, navItems, headerCta, site, footer, partners, clients, hero, directory, clientsHead } = content;
  const valuedClientRows = Array.from(
    { length: Math.ceil(clients.length / 4) },
    (_, rowIndex) => clients.slice(rowIndex * 4, rowIndex * 4 + 4),
  );

  return (
    <>
    <main className="partner-page" style={designVariables(design) as CSSProperties}>
      <section className="partner-hero">
        <nav className="nav-wrap" aria-label="Main navigation">
          <a href="/" className="brand brand-image" aria-label="INFOStorage home">
            <span className="brand-logo-frame partner-brand-logo-frame">
              <img className="brand-logo" src={site.logo} alt="INFOStorage Corporation" />
            </span>
          </a>

          <div className="desktop-links">
            {navItems.map((item) => (
              <a className={item.href === '/partners' ? 'nav-active' : undefined} href={navHref(item.href)} key={item.id}>
                {item.label}
              </a>
            ))}
          </div>

          <a className="nav-cta" href={headerCta.href === '#contact' ? '/#contact' : headerCta.href}>
            {headerCta.label} <ArrowUpRight size={16} strokeWidth={2.1} />
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={22} />
            </summary>
            <div className="mobile-menu-panel">
              {navItems.map((item) => (
                <a href={navHref(item.href)} key={item.id}>{item.label}</a>
              ))}
            </div>
          </details>
        </nav>

        <div className="partner-hero-inner section-pad">
          <div className="partner-hero-copy">
            <p className="eyebrow hero-reveal">{hero.eyebrow}</p>
            <h1 className="partner-title hero-reveal">
              {hero.titleA} <span>{hero.titleAccent}</span>
            </h1>
            <p className="partner-description hero-reveal">
              {hero.description}
            </p>
            <a className="button button-primary hero-reveal" href={hero.ctaHref}>
              {hero.ctaLabel} <ArrowRight size={18} />
            </a>
          </div>

          <div className="partner-logo-stage">
            <div className="logo-stage-orbit orbit-a" />
            <div className="logo-stage-orbit orbit-b" />
            <div className="partner-logo-plaque">
              <img src={site.logo} alt="INFOStorage Corporation" />
            </div>
          </div>
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterHero" />

      <section className="partner-directory section-pad" id="partner-directory">
        <div className="partner-directory-heading reveal">
          <div>
            <p className="section-kicker">{directory.kicker}</p>
            <h2 className="display-heading">{directory.heading}</h2>
          </div>
          <p>
            {directory.body}
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
          {directory.note}
        </p>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterApproach" />

      <section className="partner-clients section-pad" id="valued-clients">
        <div className="partner-clients-heading reveal">
          <div>
            <p className="section-kicker">{clientsHead.kicker}</p>
            <h2>{clientsHead.heading}</h2>
          </div>
          <p>
            {clientsHead.body}
          </p>
        </div>

        <div className="partner-clients-grid" aria-label="Selected valued clients">
          {valuedClientRows.map((row, rowIndex) => (
            <div
              className={`partner-clients-row ${row.length === 3 ? 'partner-clients-row--proportional' : ''}`}
              key={row[0].name}
            >
              {row.map((client, clientIndex) => {
                const index = rowIndex * 4 + clientIndex;

                return (
                  <article className={`partner-client-card reveal ${client.logoClass ?? ''}`} key={client.name}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <img src={client.logo} alt={`${client.name} logo`} loading="lazy" />
                    <small>{client.name}</small>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <PageBuilderRenderer page={content.builder} slot="afterSolutions" />

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

      <PageBuilderRenderer page={content.builder} slot="afterServices" />

      <PageBuilderRenderer page={content.builder} slot="beforeContact" />

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

      <PageBuilderRenderer page={content.builder} slot="afterContent" />

      <footer className="site-footer">
        <a href="/" className="brand footer-brand partner-footer-brand" aria-label="INFOStorage home">
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
