import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Database,
  Laptop,
  Network,
  Phone,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

const solutions = [
  { number: '01', icon: ServerCog, title: 'Systems & platforms', description: 'A dependable foundation for the applications and workloads that carry your business forward.', items: ['Enterprise storage systems', 'Cloud and engineered systems', 'Virtualised infrastructure'] },
  { number: '02', icon: Network, title: 'Network & security', description: 'Network architecture and security controls designed to keep teams connected and risk in view.', items: ['Secure network infrastructure', 'Firewall, WAF and DLP', 'Performance monitoring'] },
  { number: '03', icon: Database, title: 'Data protection', description: 'Continuity planning that protects the information your operations depend on every day.', items: ['Backup and recovery', 'Disaster recovery', 'Digital archiving'] },
  { number: '04', icon: Laptop, title: 'Workplace technology', description: 'Devices and peripherals that work as one with the rest of your technology environment.', items: ['Desktop and mobile computing', 'Business peripherals', 'Device integration'] },
];

const services = [
  'Hardware installation, maintenance & onsite support',
  'Helpdesk and ongoing assistance',
  'Consulting and implementation',
  'Project management and systems integration',
];

const principles = [
  ['01', 'See the whole system', 'Every recommendation begins with the work, people, and risk it needs to support.'],
  ['02', 'Design for real operations', 'We turn capable technology into systems that make sense in day-to-day use.'],
  ['03', 'Stay accountable', 'From planning through handover and support, we remain close to the outcome.'],
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f8fc] text-[#0c1930]">
      <SiteHeader active="home" />
      <main>
        <section className="relative isolate overflow-hidden bg-[#07101f] px-4 pb-12 pt-14 text-white sm:px-8 sm:pb-16 lg:pt-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_30%,rgba(42,193,173,0.22),transparent_24%),radial-gradient(circle_at_18%_95%,rgba(70,101,192,0.32),transparent_31%)]" />
          <div className="absolute -right-24 top-12 -z-10 h-[31rem] w-[31rem] rounded-full border border-[#81edd8]/20" />
          <div className="absolute -right-8 top-28 -z-10 h-[23rem] w-[23rem] rounded-full border border-white/10" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#81edd8]/20 bg-[#81edd8]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#9df4e3]">Enterprise technology partner</p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-7xl">Technology that keeps your enterprise <span className="text-[#81edd8]">moving.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/70">INFOStorage connects systems, security, and data protection into practical technology foundations built around the way your organisation works.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a className="inline-flex items-center gap-2 rounded-full bg-[#81edd8] px-5 py-3.5 text-sm font-bold text-[#07101f] transition-transform hover:-translate-y-0.5" href="#solutions">Explore solutions <ArrowRight size={17} strokeWidth={2.5} /></a>
                <a className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10" href="#contact">Talk to an expert <ArrowUpRight size={17} strokeWidth={2.3} /></a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
              <div className="absolute -left-7 top-14 hidden h-32 w-32 rounded-full bg-[#ffca71]/20 blur-2xl sm:block" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-white/50"><span>Connected by design</span><span className="rounded-full bg-[#81edd8]/15 px-2.5 py-1 text-[#9df4e3]">Active</span></div>
                <div className="mt-8 rounded-2xl bg-[#e9f3ff] p-5 text-[#0c1930] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                  <div className="flex items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#4665a9]">Your environment</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Ready for the work ahead.</h2></div><ShieldCheck className="shrink-0 text-[#157d73]" size={30} strokeWidth={1.8} /></div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold text-[#24365e]">{['Systems', 'Security', 'Continuity'].map((item) => <span className="rounded-xl bg-white px-2 py-3 shadow-sm" key={item}>{item}</span>)}</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Systems', 'Built to scale'], ['Security', 'Built to protect'], ['Support', 'Built to last']].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-black/10 p-4" key={label}><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9df4e3]">{label}</p><p className="mt-2 text-sm font-medium text-white/80">{value}</p></div>)}</div>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-16 grid w-full max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{['Systems & platforms', 'Network & security', 'Data protection', 'Professional services'].map((item) => <div className="bg-[#0a172b]/75 px-5 py-4 text-sm font-semibold text-white/75" key={item}>{item}</div>)}</div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-28" id="approach">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#157d73]">The INFOStorage approach</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Less complexity. More confidence in every technology decision.</h2></div><p className="max-w-xl text-lg leading-8 text-[#52627f]">We bring enterprise technology into one clear conversation—from the infrastructure beneath your applications to the protection around your data and the support behind your team.</p></div>
          <div className="mx-auto mt-14 grid w-full max-w-6xl divide-y divide-[#d9e0ec] border-y border-[#d9e0ec] md:grid-cols-3 md:divide-x md:divide-y-0">{principles.map(([number, title, description]) => <article className="px-0 py-8 md:px-7 md:py-3 lg:px-10" key={number}><p className="text-sm font-bold tracking-[0.14em] text-[#157d73]">{number}</p><h3 className="mt-8 text-xl font-semibold tracking-[-0.04em]">{title}</h3><p className="mt-3 leading-7 text-[#52627f]">{description}</p></article>)}</div>
        </section>

        <section className="bg-[#e9f3ff] px-4 py-20 sm:px-8 lg:py-28" id="solutions">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-7 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#157d73]">Solutions</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">One partner for the technology your business depends on.</h2></div><p className="max-w-sm leading-7 text-[#52627f]">Choose the capability you need today, with an environment that stays connected as your priorities evolve.</p></div>
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-4 md:grid-cols-2">{solutions.map(({ number, icon: Icon, title, description, items }) => <article className="group flex min-h-80 flex-col rounded-[1.75rem] bg-white p-6 shadow-[0_18px_50px_rgba(27,67,116,0.08)] transition-all hover:-translate-y-1 hover:bg-[#0d1c35] hover:text-white sm:p-8" key={title}><div className="flex items-center justify-between"><span className="text-sm font-bold tracking-[0.15em] text-[#157d73] group-hover:text-[#81edd8]">{number}</span><span className="grid h-11 w-11 place-items-center rounded-full bg-[#e9f3ff] text-[#19345e] group-hover:bg-white/10 group-hover:text-[#81edd8]"><Icon size={23} strokeWidth={1.8} /></span></div><h3 className="mt-12 text-2xl font-semibold tracking-[-0.045em]">{title}</h3><p className="mt-3 max-w-md leading-7 text-[#52627f] group-hover:text-white/65">{description}</p><ul className="mt-6 space-y-2.5 text-sm text-[#24365e] group-hover:text-white/75">{items.map((item) => <li className="flex items-center gap-2" key={item}><Check size={15} className="text-[#157d73] group-hover:text-[#81edd8]" strokeWidth={2.5} />{item}</li>)}</ul><a className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[#157d73] group-hover:text-[#81edd8]" href="#contact">Discuss this solution <ArrowUpRight size={17} /></a></article>)}</div>
        </section>

        <section className="bg-[#0c1930] px-4 py-20 text-white sm:px-8 lg:py-28" id="services">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81edd8]">Value added services</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Technology works better when support stays close.</h2><p className="mt-6 leading-7 text-white/65">Bring experienced people into the moments that shape reliability, from implementation through daily operations.</p><a className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#81edd8]" href="#contact">Plan your next step <ArrowRight size={17} /></a></div><div className="divide-y divide-white/10 border-y border-white/10">{services.map((service, index) => <a className="group flex items-center gap-5 py-6 sm:gap-8" href="#contact" key={service}><span className="text-sm font-bold text-[#81edd8]">{String(index + 1).padStart(2, '0')}</span><strong className="flex-1 text-lg font-medium tracking-[-0.025em] text-white/80 group-hover:text-white">{service}</strong><ArrowUpRight className="text-white/40 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#81edd8]" size={22} /></a>)}</div></div>
        </section>

        <section className="relative overflow-hidden bg-[#f8fbff] px-4 py-20 sm:px-8 lg:py-28" id="contact">
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-[#157d73]/15" /><div className="absolute right-10 top-10 h-60 w-60 rounded-full bg-[#81edd8]/20 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 rounded-[2rem] bg-[#14315e] p-8 text-white shadow-[0_28px_80px_rgba(13,41,81,0.28)] md:grid-cols-[1fr_auto] md:items-end sm:p-12"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81edd8]">Make the next move clearer</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Let’s connect the technology to the work ahead.</h2><p className="mt-6 max-w-xl leading-7 text-white/70">Tell us about the environment you are building, improving, or protecting. We will help shape a practical path forward.</p></div><div className="flex flex-col gap-3 sm:flex-row md:flex-col"><a className="inline-flex items-center justify-center gap-2 rounded-full bg-[#81edd8] px-5 py-3.5 text-sm font-bold text-[#07101f]" href="tel:+63288994878"><Phone size={17} /> +63 2 8899 4878</a><a className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-bold text-white" href="https://maps.google.com/?q=AIC+Burgundy+Empire+Tower+Ortigas+Center+Pasig+City" target="_blank" rel="noreferrer">Visit our office <ArrowUpRight size={16} /></a></div></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
