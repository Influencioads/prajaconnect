import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/marketing/section';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { ModuleShowcase } from '@/components/marketing/module-showcase';
import { CtaBand } from '@/components/marketing/cta-band';
import { Reveal } from '@/components/marketing/reveal';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore every module of Praja Connect: RBAC, executive dashboard, cadre & citizen CRM, grievances with SLA, service delivery, engagement, door-to-door surveys, AI Command Center, reports and mobile.',
};

export default function FeaturesPage() {
  return (
    <>
      {/* page hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/20 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Features</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              One command center for the whole organisation
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              From RBAC and live dashboards to offline field surveys and AI signals — here is
              everything Praja Connect brings together.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild variant="gold" size="lg" className="shadow-xl shadow-gold/20">
                <Link href="/login">
                  Login to explore
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* full feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading
          eyebrow="Capabilities"
          title="Ten areas, one source of truth"
          lead="Each capability is a real, persisted module — not a placeholder."
        />
        <div className="mt-14">
          <FeatureGrid />
        </div>
      </section>

      {/* deep dive on all modules */}
      <section className="bg-white py-20 dark:bg-card lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Module spotlights"
            title="How the core modules work"
            lead="A deeper look at the workflows that carry the platform."
          />
          <div className="mt-16">
            <ModuleShowcase />
          </div>
        </div>
      </section>

      <CtaBand title="See it with your own data" />
    </>
  );
}
