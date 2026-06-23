import Link from 'next/link';
import { ArrowRight, PlayCircle, ShieldCheck, Activity, FileWarning, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

/** Static, data-free mock of the executive dashboard — pure presentation. */
function DashboardPreview() {
  const bars = [38, 62, 49, 74, 58, 88, 67, 95];
  const kpis = [
    { icon: Users, label: 'Active cadre', value: '12,480', tint: 'text-gold' },
    { icon: FileWarning, label: 'Open grievances', value: '326', tint: 'text-red-300' },
    { icon: Activity, label: 'Readiness score', value: '82%', tint: 'text-emerald-300' },
  ];
  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-md sm:p-5">
      {/* window chrome */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs font-medium text-white/50">Executive dashboard</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <kpi.icon className={`h-4 w-4 ${kpi.tint}`} />
            <p className="mt-2 font-display text-lg font-bold leading-none text-white sm:text-xl">
              {kpi.value}
            </p>
            <p className="mt-1 text-[11px] text-white/55">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white/70">Grievances resolved · weekly</p>
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">
            +18%
          </span>
        </div>
        <div className="mt-4 flex h-24 items-end gap-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-gold/40 to-gold"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* ambient glows + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gold/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-gold/10 blur-[100px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              Governance CRM for Andhra Pradesh
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Every citizen,
              <br />
              <span className="text-gold">connected to governance.</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-3 font-telugu text-lg text-gold/90">ప్రజలతో, ప్రతి అడుగులో.</p>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Praja Connect unifies your cadre hierarchy, citizen master, grievances, field surveys
              and service delivery into one command center — from the State office down to the
              polling booth.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="gold" size="lg" className="shadow-xl shadow-gold/20">
                <Link href="/login">
                  Login to your dashboard
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/features">
                  <PlayCircle />
                  Explore the platform
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="mt-5 text-sm text-white/50">
              9 roles · module-level RBAC · web admin + mobile field app
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:pl-4">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-gold/10 via-transparent to-transparent"
            />
            <DashboardPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
