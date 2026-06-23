import { Check } from 'lucide-react';
import { MODULES, type ModuleHighlight } from './content';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';

function ModuleRow({ module, index }: { module: ModuleHighlight; index: number }) {
  const Icon = module.icon;
  const flip = index % 2 === 1;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <Reveal className={cn(flip && 'lg:order-2')}>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
          {module.eyebrow}
        </p>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy dark:text-white sm:text-3xl">
          {module.title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{module.description}</p>
        <ul className="mt-6 space-y-3">
          {module.points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-600">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={120} className={cn(flip && 'lg:order-1')}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-navy to-navy-900 p-8 shadow-lg">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl"
          />
          <div className="relative flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg">
              <Icon className="h-8 w-8" />
            </div>
            <p className="mt-5 font-display text-lg font-semibold text-white">{module.eyebrow}</p>
            <p className="mt-1 text-sm text-white/55">Praja Connect module</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export function ModuleShowcase({ modules = MODULES }: { modules?: ModuleHighlight[] }) {
  return (
    <div className="space-y-16 lg:space-y-24">
      {modules.map((module, i) => (
        <ModuleRow key={module.title} module={module} index={i} />
      ))}
    </div>
  );
}
