import { ROLES } from './content';
import { Reveal } from './reveal';

export function RoleLadder() {
  return (
    <div className="mx-auto max-w-3xl">
      <ol className="relative space-y-2.5">
        {ROLES.map((tier, i) => (
          <Reveal
            key={tier.rank}
            delay={i * 50}
            as="li"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-gold/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-sm font-bold text-white transition-colors group-hover:bg-gold group-hover:text-navy">
              {tier.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-navy dark:text-white">{tier.role}</p>
              <p className="truncate text-sm text-muted-foreground">{tier.scope}</p>
            </div>
            {/* visual rank meter */}
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${Math.round(((ROLES.length - i) / ROLES.length) * 100)}%` }}
              />
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
