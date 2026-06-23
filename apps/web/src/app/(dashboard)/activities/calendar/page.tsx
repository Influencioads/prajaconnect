'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ACTIVITY_TYPE_LABELS, ActivityType } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchActivityCalendar } from '@/lib/crm';

function monthRange(d: Date) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString() };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ActivityCalendarPage() {
  const [cursor, setCursor] = React.useState(() => new Date());
  const range = React.useMemo(() => monthRange(cursor), [cursor]);

  const { data, isLoading } = useQuery({
    queryKey: ['activity-calendar', range],
    queryFn: () => fetchActivityCalendar(range),
  });

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof items>();
    const items = data?.items ?? [];
    for (const it of items) {
      if (!it.date) continue;
      const key = it.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  return (
    <>
      <PageHeader
        title="Activity Calendar"
        description="Daily, weekly and monthly view of scheduled activities, meetings, tasks and events."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center text-sm font-semibold">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !grouped.length ? (
            <EmptyState title="Nothing scheduled" description="No activities or events for this month." />
          ) : (
            grouped.map(([day, items]) => (
              <div key={day} className="space-y-2">
                <p className="text-sm font-bold text-foreground">
                  {new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                </p>
                <div className="space-y-1.5">
                  {items.map((it) => {
                    const inner = (
                      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{it.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {it.kind === 'event' ? 'Event' : ACTIVITY_TYPE_LABELS[it.type as ActivityType] ?? it.type}
                          </p>
                        </div>
                        <StatusBadge status={it.status} />
                      </div>
                    );
                    return it.kind === 'activity' ? (
                      <Link key={it.id} href={`/activities/${it.id}`} className="block hover:opacity-90">{inner}</Link>
                    ) : (
                      <div key={it.id}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
