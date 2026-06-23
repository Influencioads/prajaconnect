import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

export function CtaBand({
  title = 'Ready to run your constituency from one screen?',
  lead = 'Sign in to the dashboard or request a guided walkthrough with demo data.',
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:py-24">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-navy px-6 py-14 text-center text-white shadow-xl sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">{lead}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold" size="lg" className="shadow-xl shadow-gold/20">
              <Link href="/login">
                Login
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Request a demo</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
