import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/hero';
import { StatBand } from '@/components/marketing/stat-band';
import { SectionHeading } from '@/components/marketing/section';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { ModuleShowcase } from '@/components/marketing/module-showcase';
import { RoleLadder } from '@/components/marketing/role-ladder';
import { MobileSection } from '@/components/marketing/mobile-section';
import { CtaBand } from '@/components/marketing/cta-band';
import { MODULES } from '@/components/marketing/content';

export const metadata: Metadata = {
  title: { absolute: 'Praja Connect — Governance CRM for Andhra Pradesh' },
  description:
    'Unify cadre hierarchy, citizen master, grievances, field surveys and service delivery in one command center — from the State office to the polling booth.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatBand />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="One platform"
          title="Everything a constituency runs on"
          lead="Ten capability areas, one login, one source of truth — designed for the way political organisations and government coordination actually work."
        />
        <div className="mt-14">
          <FeatureGrid />
        </div>
      </section>

      {/* Module deep-dive */}
      <section className="bg-white py-20 dark:bg-card lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Inside the platform"
            title="Built for the booth, the mandal and the State"
            lead="A closer look at the modules that do the heavy lifting."
          />
          <div className="mt-16">
            <ModuleShowcase modules={MODULES.slice(0, 4)} />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Role-based access"
          title="Nine roles, the right access for each"
          lead="From Super Admin to Citizen, module-level RBAC means every person sees exactly what they should — no more, no less."
        />
        <div className="mt-14">
          <RoleLadder />
        </div>
      </section>

      <MobileSection />
      <CtaBand />
    </>
  );
}
