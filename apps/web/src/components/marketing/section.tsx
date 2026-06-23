import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

/** Centered eyebrow + title + lead used across marketing sections. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'center',
  invert = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  align?: 'center' | 'left';
  invert?: boolean;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-widest',
            invert ? 'text-gold' : 'text-gold-600',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl',
          invert ? 'text-white' : 'text-navy dark:text-white',
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed sm:text-lg',
            invert ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}
