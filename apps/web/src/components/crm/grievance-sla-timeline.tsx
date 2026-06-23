'use client';

import * as React from 'react';
import { AlarmClock, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const SLA_DAY_PRESETS = [1, 2, 3, 5, 7, 14, 30] as const;

export function priorityDefaultSlaDays(priority: string): number {
  switch (priority) {
    case 'High':
      return 1;
    case 'Low':
      return 7;
    default:
      return 3;
  }
}

export function seriousnessFromDays(days: number): {
  label: string;
  level: 'critical' | 'urgent' | 'standard' | 'routine' | 'low';
  description: string;
} {
  if (days <= 1) {
    return {
      label: 'Critical',
      level: 'critical',
      description: 'Life/safety risk or major public disruption — resolve within 24 hours.',
    };
  }
  if (days <= 3) {
    return {
      label: 'Urgent',
      level: 'urgent',
      description: 'High impact on citizens — resolve within 2–3 days.',
    };
  }
  if (days <= 7) {
    return {
      label: 'Standard',
      level: 'standard',
      description: 'Normal service delivery timeline — resolve within a week.',
    };
  }
  if (days <= 14) {
    return {
      label: 'Routine',
      level: 'routine',
      description: 'Moderate issue — allow up to two weeks for resolution.',
    };
  }
  return {
    label: 'Low urgency',
    level: 'low',
    description: 'Non-urgent administrative matter — extended timeline acceptable.',
  };
}

const LEVEL_STYLES = {
  critical: 'border-red-300 bg-red-50 text-red-800',
  urgent: 'border-orange-300 bg-orange-50 text-orange-800',
  standard: 'border-amber-300 bg-amber-50 text-amber-900',
  routine: 'border-blue-200 bg-blue-50 text-blue-800',
  low: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

const LEVEL_ICONS = {
  critical: ShieldAlert,
  urgent: AlertTriangle,
  standard: AlarmClock,
  routine: Clock,
  low: Clock,
} as const;

function formatDuePreview(days: number): string {
  const due = new Date(Date.now() + days * 86400000);
  return due.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function GrievanceSlaTimelinePicker({
  slaDays,
  onSlaDaysChange,
  priority,
  departmentSlaHours,
  className,
}: {
  slaDays: number;
  onSlaDaysChange: (days: number) => void;
  priority?: string;
  departmentSlaHours?: number | null;
  className?: string;
}) {
  const seriousness = seriousnessFromDays(slaDays);
  const Icon = LEVEL_ICONS[seriousness.level];
  const deptDays = departmentSlaHours ? Math.max(1, Math.ceil(departmentSlaHours / 24)) : null;

  return (
    <div className={cn('space-y-3 rounded-lg border bg-muted/20 p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-semibold">Resolution timeline</Label>
          <p className="text-xs text-muted-foreground">
            Set how many days to solve this grievance. Leaders and admins track breaches on the SLA tracker.
          </p>
        </div>
        {priority && (
          <span className="shrink-0 text-xs text-muted-foreground">
            Priority: {priority}
          </span>
        )}
      </div>

      <div className={cn('flex items-start gap-3 rounded-lg border p-3', LEVEL_STYLES[seriousness.level])}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{seriousness.label}</p>
          <p className="text-xs opacity-90">{seriousness.description}</p>
          <p className="mt-1 text-xs font-medium">
            Target: resolve by {formatDuePreview(slaDays)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SLA_DAY_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onSlaDaysChange(d)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              slaDays === d
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted',
            )}
          >
            {d}d
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="sla-days-custom" className="shrink-0 text-sm">
          Custom days
        </Label>
        <Input
          id="sla-days-custom"
          type="number"
          min={1}
          max={90}
          value={slaDays}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 90) onSlaDaysChange(n);
          }}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground">Max 90 days</span>
      </div>

      {deptDays != null && (
        <p className="text-xs text-muted-foreground">
          Department default: {deptDays} day{deptDays !== 1 ? 's' : ''} ({departmentSlaHours}h).
          {slaDays !== deptDays && ' You are using a custom timeline.'}
        </p>
      )}
    </div>
  );
}

/** Sync SLA days when priority changes unless user manually picked a preset. */
export function useSlaDaysWithPriority(
  priority: string,
  departmentSlaHours?: number | null,
): [number, React.Dispatch<React.SetStateAction<number>>, boolean] {
  const [slaDays, setSlaDays] = React.useState(() => priorityDefaultSlaDays(priority));
  const [manual, setManual] = React.useState(false);

  React.useEffect(() => {
    if (manual) return;
    if (departmentSlaHours) {
      setSlaDays(Math.max(1, Math.ceil(departmentSlaHours / 24)));
    } else {
      setSlaDays(priorityDefaultSlaDays(priority));
    }
  }, [priority, departmentSlaHours, manual]);

  const setSlaDaysTracked = React.useCallback((value: React.SetStateAction<number>) => {
    setManual(true);
    setSlaDays(value);
  }, []);

  return [slaDays, setSlaDaysTracked, manual];
}
