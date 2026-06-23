import { FEATURES, type Feature } from './content';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';

export function FeatureCard({ feature, delay = 0 }: { feature: Feature; delay?: number }) {
  const Icon = feature.icon;
  return (
    <Reveal
      delay={delay}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300',
        'hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-navy/5',
      )}
    >
      {/* gold top-accent on hover */}
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors group-hover:bg-gold group-hover:text-navy dark:bg-white/10 dark:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-navy dark:text-white">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
    </Reveal>
  );
}

export function FeatureGrid({ features = FEATURES }: { features?: Feature[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, i) => (
        <FeatureCard key={feature.title} feature={feature} delay={(i % 3) * 70} />
      ))}
    </div>
  );
}
