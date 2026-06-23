import type { Metadata } from 'next';
import { Layers, ShieldCheck, Server, Smartphone, Database, Activity } from 'lucide-react';
import { SectionHeading } from '@/components/marketing/section';
import { Reveal } from '@/components/marketing/reveal';
import { CtaBand } from '@/components/marketing/cta-band';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Praja Connect is a Docker-first, full-stack governance CRM for Andhra Pradesh — modelling the organisation from State down to the polling booth.',
};

const HIERARCHY = ['State', 'District', 'Constituency', 'Mandal', 'Village', 'Booth'];

const STACK = [
  { icon: Server, title: 'NestJS API', desc: 'Prisma · PostgreSQL · Redis · JWT with refresh rotation' },
  { icon: Layers, title: 'Next.js 15 web', desc: 'App Router · TypeScript · Tailwind · Recharts' },
  { icon: Smartphone, title: 'Expo mobile', desc: 'React Native · NativeWind · offline-first sync' },
  { icon: Database, title: '72 data models', desc: 'A typed schema spanning every module' },
  { icon: ShieldCheck, title: 'Hardened', desc: 'Security headers · rate limiting · full audit trail' },
  { icon: Activity, title: 'Live intelligence', desc: 'Rule-based scoring over real activity' },
];

export default function AboutPage() {
  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gold/15 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Our mission</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Governance, connected to every citizen
            </h1>
            <p className="mt-3 font-telugu text-lg text-gold/90">ప్రజలతో, ప్రతి అడుగులో.</p>
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              Praja Connect is a Docker-first, full-stack CRM for Andhra Pradesh political leaders,
              cadre and government coordination. It replaces scattered spreadsheets and WhatsApp
              groups with one accountable system — so a grievance raised at a booth and a decision
              taken at the State office live in the same place.
            </p>
          </Reveal>
        </div>
      </section>

      {/* hierarchy */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="The model"
          title="From the State office to the polling booth"
          lead="Every cadre member, citizen and grievance is anchored to a place in a six-tier geography — so accountability always rolls up and drills down."
        />
        <div className="mt-14 flex flex-wrap items-stretch justify-center gap-3">
          {HIERARCHY.map((level, i) => (
            <Reveal key={level} delay={i * 70} className="flex items-center gap-3">
              <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                <span className="font-display text-xs font-bold text-gold-600">
                  L{i + 1}
                </span>
                <span className="mt-1 font-display font-semibold text-navy dark:text-white">
                  {level}
                </span>
              </div>
              {i < HIERARCHY.length - 1 && (
                <span className="hidden text-gold sm:inline" aria-hidden>
                  →
                </span>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* stack */}
      <section className="bg-white py-20 dark:bg-card lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Under the hood"
            title="Engineered to be deployed and trusted"
            lead="A modern monorepo that ships with Docker Compose, healthchecks and production hardening out of the box."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((item, i) => (
              <Reveal
                key={item.title}
                delay={(i % 3) * 70}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy dark:bg-white/10 dark:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Bring your organisation onto one platform" />
    </>
  );
}
