import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Request a demo', href: '/contact' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <span className="dark">
            <Logo />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Governance, connected to every citizen. A full-stack CRM for Andhra Pradesh leaders,
            cadre and government coordination.
          </p>
          <p className="mt-4 font-telugu text-sm text-gold/90">ప్రజలతో, ప్రతి అడుగులో.</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Praja Connect CRM. All rights reserved.</p>
          <p>
            Demo accounts use password{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-gold">Praja@123</code>
          </p>
        </div>
      </div>
    </footer>
  );
}
