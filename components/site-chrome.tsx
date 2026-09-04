import { ArrowUpRight, Menu } from 'lucide-react';

type SiteHeaderProps = {
  active?: 'home' | 'partners';
};

const navigation = [
  { href: '/#solutions', label: 'Solutions', key: 'solutions' },
  { href: '/#services', label: 'Services', key: 'services' },
  { href: '/#approach', label: 'Our approach', key: 'approach' },
  { href: '/partners', label: 'Partners', key: 'partners' },
];

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="relative z-30 border-b border-white/10 bg-[#07101f]/80 text-white backdrop-blur-xl">
      <nav className="mx-auto flex min-h-20 w-[min(100%-2rem,78rem)] items-center justify-between gap-5" aria-label="Main navigation">
        <a className="flex items-center gap-3" href="/" aria-label="INFOStorage home">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
            <img className="h-full w-full object-contain" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
          </span>
          <span className="hidden text-xs font-bold tracking-[0.22em] text-white/75 sm:block">INFOSTORAGE</span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <a
              className={`text-sm font-medium transition-colors hover:text-[#81edd8] ${active === item.key ? 'text-[#81edd8]' : 'text-white/70'}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <a className="hidden items-center gap-2 rounded-full bg-[#81edd8] px-4 py-2.5 text-sm font-bold text-[#06101c] transition-transform hover:-translate-y-0.5 lg:inline-flex" href="/#contact">
          Start a conversation <ArrowUpRight size={16} strokeWidth={2.4} />
        </a>

        <details className="group relative lg:hidden">
          <summary className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-white/15 text-white marker:content-none">
            <Menu size={20} />
            <span className="sr-only">Open navigation</span>
          </summary>
          <div className="absolute right-0 top-13 hidden w-56 rounded-2xl border border-white/10 bg-[#0b1830] p-2 shadow-2xl group-open:block">
            {navigation.map((item) => (
              <a className="block rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            <a className="mt-1 block rounded-xl bg-[#81edd8] px-4 py-3 text-sm font-bold text-[#06101c]" href="/#contact">
              Start a conversation
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07101f] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <a className="inline-flex items-center gap-3" href="/" aria-label="INFOStorage home">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5">
              <img className="h-full w-full object-contain" src="/infostorage-logo.png" alt="INFOStorage Corporation" />
            </span>
            <span className="text-xs font-bold tracking-[0.22em] text-white/75">INFOSTORAGE</span>
          </a>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/50">1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City</p>
        </div>
        <div className="text-sm text-white/45 md:text-right">
          <p>Enterprise technology, thoughtfully connected.</p>
          <p className="mt-2">© 2025 INFOStorage Corporation</p>
        </div>
      </div>
    </footer>
  );
}
