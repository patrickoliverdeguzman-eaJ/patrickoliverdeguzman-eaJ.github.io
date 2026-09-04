import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, BadgeCheck, Handshake, Network, ShieldCheck } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export const metadata: Metadata = {
  title: 'Partners | INFOStorage',
  description: 'Explore the INFOStorage ecosystem of technology partners and valued clients.',
};

const technologyPartners = [
  { name: 'A10 Networks', focus: 'Application delivery & security' },
  { name: 'Hitachi Data Systems', focus: 'Enterprise data infrastructure' },
  { name: 'Oracle', focus: 'Cloud & engineered systems' },
  { name: 'Lenovo', focus: 'Servers & workplace computing' },
  { name: 'UltraBac', focus: 'Backup & recovery' },
  { name: 'EMC Data Domain', focus: 'Data protection storage' },
  { name: 'StorageTek', focus: 'Enterprise tape & storage' },
];

const valuedClients = [
  { name: 'Government Service Insurance System', logo: '/client-logos/gsis-reference.png' },
  { name: 'League One Finance and Leasing Corporation', logo: '/client-logos/league-one-reference.png' },
  { name: 'Bangko Sentral ng Pilipinas', logo: '/client-logos/bsp-reference.png' },
  { name: 'Securities and Exchange Commission', logo: '/client-logos/sec-reference.png' },
  { name: 'Office of the President of the Philippines', logo: '/client-logos/op-malacanang-reference.png' },
  { name: 'Global Payments', logo: '/client-logos/global-payments-reference.png' },
  { name: 'Credit Information Corporation', logo: '/client-logos/credit-information-reference.png' },
  { name: 'SYSTRA Philippines', logo: 'https://images.seeklogo.com/logo-png/50/1/systra-logo-png_seeklogo-505360.png' },
  { name: 'NextVAS', logo: '/client-logos/nextvas-reference.png' },
  { name: 'Home Credit', logo: 'https://static.wixstatic.com/media/58bb01_f895c5145c0b4edfa4bfa8b83b0ff5a9~mv2.png/v1/fill/w_152%2Ch_95%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/Home_Credit_Logo_Grey.png' },
  { name: 'ADP Pharma', logo: 'https://www.adppharma.com/wp-content/uploads/2022/05/adp-logo.png' },
  { name: 'San-Yang Furniture', logo: 'https://pbs.twimg.com/profile_images/704835910391599104/Brmm68EG.jpg' },
  { name: 'JINS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/JINS_Logo.svg/3840px-JINS_Logo.svg.png' },
  { name: 'DENR Biodiversity Management Bureau', logo: '/client-logos/denr-reference.png' },
  { name: 'One Cainta', logo: 'https://static.wixstatic.com/media/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png/v1/fit/w_2500%2Ch_1330%2Cal_c/4c5595_7b90b770099845418576b7ff1bb463db~mv2.png' },
  { name: 'Hitachi Digital Services', logo: '/client-logos/hitachi-digital-services-reference.png' },
  { name: 'Amdocs', logo: '/client-logos/amdocs-reference.png' },
  { name: '7-Eleven', logo: 'https://www.clipartmax.com/png/middle/58-586690_7-eleven-brand-logo-7-11-logo.png' },
  { name: 'Cathay United Bank', logo: 'https://www.singaporeair.com/content/dam/sia/web-assets/images/ppsclub-krisflyer/earn-miles/earnontheground/financial-services-partners/cathayunitedbanktaiwan/CathayUnitedBanklogo_1240x%20400.png' },
];

const waysOfWorking = [
  { icon: Network, title: 'Connected capability', text: 'Bring infrastructure, security, continuity, and services into one coherent environment.' },
  { icon: ShieldCheck, title: 'Practical judgement', text: 'Choose technology with the operating context, risk profile, and next step in view.' },
  { icon: Handshake, title: 'Closer partnership', text: 'Stay connected from initial architecture through implementation and ongoing support.' },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f8fc] text-[#0c1930]">
      <SiteHeader active="partners" />
      <main>
        <section className="relative isolate overflow-hidden bg-[#0c1930] px-4 py-20 text-white sm:px-8 lg:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_24%,rgba(129,237,216,0.18),transparent_21%),radial-gradient(circle_at_20%_95%,rgba(70,101,192,0.28),transparent_31%)]" />
          <div className="absolute -right-32 -top-20 -z-10 h-[34rem] w-[34rem] rounded-full border border-[#81edd8]/20" />
          <div className="absolute right-12 top-24 -z-10 h-[25rem] w-[25rem] rounded-full border border-white/10" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-[#81edd8]/20 bg-[#81edd8]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#9df4e3]">Partner ecosystem</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-7xl">The right ecosystem turns complexity into <span className="text-[#81edd8]">momentum.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/70">INFOStorage works with respected technology providers to build enterprise environments that are more considered, more connected, and ready to evolve.</p>
              <a className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#81edd8] px-5 py-3.5 text-sm font-bold text-[#07101f] transition-transform hover:-translate-y-0.5" href="#technology-partners">Explore the ecosystem <ArrowRight size={17} strokeWidth={2.5} /></a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 backdrop-blur-sm sm:col-span-2 lg:col-span-1"><BadgeCheck className="text-[#81edd8]" size={28} strokeWidth={1.8} /><p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-white/50">Partnership with purpose</p><h2 className="mt-3 max-w-sm text-2xl font-semibold tracking-[-0.045em]">Technology selected around the work it needs to serve.</h2></div>
              <div className="rounded-2xl bg-[#e9f3ff] p-5 text-[#0c1930]"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4665a9]">Start with</p><p className="mt-2 font-semibold tracking-[-0.03em]">Your operating reality</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9df4e3]">Build toward</p><p className="mt-2 font-semibold tracking-[-0.03em] text-white">A dependable next step</p></div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-28" id="technology-partners">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-7 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#157d73]">Technology partners</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Built around the systems your teams rely on.</h2></div><p className="max-w-sm leading-7 text-[#52627f]">A focused mix of infrastructure, security, cloud, and data protection capabilities—brought together around your priorities.</p></div>
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">{technologyPartners.map((partner, index) => <article className="group min-h-52 rounded-[1.5rem] border border-[#dce5f2] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#81edd8] hover:shadow-[0_18px_50px_rgba(27,67,116,0.10)]" key={partner.name}><p className="text-xs font-bold tracking-[0.15em] text-[#157d73]">{String(index + 1).padStart(2, '0')}</p><h3 className="mt-12 text-xl font-semibold tracking-[-0.04em]">{partner.name}</h3><p className="mt-2 text-sm leading-6 text-[#52627f]">{partner.focus}</p></article>)}</div>
        </section>

        <section className="bg-[#e9f3ff] px-4 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-3">{waysOfWorking.map(({ icon: Icon, title, text }) => <article className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_50px_rgba(27,67,116,0.07)] sm:p-8" key={title}><span className="grid h-12 w-12 place-items-center rounded-full bg-[#d9fbf3] text-[#157d73]"><Icon size={24} strokeWidth={1.8} /></span><h3 className="mt-10 text-2xl font-semibold tracking-[-0.045em]">{title}</h3><p className="mt-4 leading-7 text-[#52627f]">{text}</p></article>)}</div>
        </section>

        <section className="bg-[#07101f] px-4 py-20 text-white sm:px-8 lg:py-28" id="valued-clients">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-7 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81edd8]">Valued clients</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Trusted where the work matters most.</h2></div><p className="max-w-sm leading-7 text-white/65">A selection of organisations that have chosen INFOStorage for enterprise technology, integration, and support.</p></div>
          <div className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-12 gap-3">{valuedClients.map((client, index) => <article className={`group relative flex min-h-52 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 transition-colors hover:bg-white/[0.12] ${index >= valuedClients.length - 3 ? 'col-span-12 md:col-span-4' : 'col-span-12 md:col-span-6 xl:col-span-3'}`} key={client.name}><span className="text-xs font-bold tracking-[0.14em] text-[#81edd8]">{String(index + 1).padStart(2, '0')}</span><img className="mx-auto my-auto max-h-16 max-w-[78%] object-contain grayscale brightness-0 invert" src={client.logo} alt={`${client.name} logo`} loading="lazy" /><p className="text-xs font-bold uppercase tracking-[0.09em] text-white/50">{client.name}</p></article>)}</div>
        </section>

        <section className="relative overflow-hidden bg-[#f8fbff] px-4 py-20 sm:px-8 lg:py-28">
          <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-[#81edd8]/20 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 rounded-[2rem] bg-[#14315e] p-8 text-white shadow-[0_28px_80px_rgba(13,41,81,0.28)] md:grid-cols-[1fr_auto] md:items-end sm:p-12"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81edd8]">Find the right fit</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">Let’s match the technology to the work ahead.</h2><p className="mt-6 max-w-xl leading-7 text-white/70">Bring us the challenge. We will help turn it into an integrated, practical next step.</p></div><a className="inline-flex items-center justify-center gap-2 rounded-full bg-[#81edd8] px-5 py-3.5 text-sm font-bold text-[#07101f]" href="/#contact">Start a conversation <ArrowUpRight size={17} /></a></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
