'use client';

import { cn } from '@/lib/utils';
import { useBranding } from '@/lib/branding';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { branding } = useBranding();
  const name = branding.appName || 'Praja Connect';
  const subtitle = branding.party || 'CRM';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={name} className="h-full w-full object-contain" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.4">
            <circle cx="12" cy="5" r="2.2" />
            <circle cx="5" cy="18" r="2.2" />
            <circle cx="19" cy="18" r="2.2" />
            <path d="M12 7.2v4.2M11 12.5l-4.2 3.4M13 12.5l4.2 3.4" />
          </svg>
        )}
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-foreground">{name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground/70">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
