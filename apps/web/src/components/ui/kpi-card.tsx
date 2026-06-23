import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './card';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  good?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
  sub?: string;
}

export function KpiCard({ label, value, delta, trend, good, icon: Icon, accent, sub }: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              accent ?? 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-xs font-semibold',
            good === false ? 'text-red-600' : 'text-green-600',
          )}
        >
          {trend === 'down' ? (
            <ArrowDownRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" />
          )}
          {delta}
        </div>
      )}
    </Card>
  );
}
