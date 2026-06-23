'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import type { LeaderCalendarItem, LeaderScheduleBlock } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { AppointmentFormDialog } from '@/components/leader-office/appointment-form-dialog';
import { ScheduleBlockFormDialog } from '@/components/leader-office/schedule-block-form-dialog';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { deleteScheduleBlock, fetchLeaderCalendar } from '@/lib/leader-office';

function monthRange(d: Date) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString() };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LeaderCalendarPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('leaderoffice'));
  const { toast } = useToast();
  const qc = useQueryClient();

  const [cursor, setCursor] = React.useState(() => new Date());
  const range = React.useMemo(() => monthRange(cursor), [cursor]);

  const [apptOpen, setApptOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [editingBlock, setEditingBlock] = React.useState<LeaderScheduleBlock | null>(null);
  const [defaultStart, setDefaultStart] = React.useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['leader-calendar', range],
    queryFn: () => fetchLeaderCalendar(range),
  });

  const delBlock = useMutation({
    mutationFn: (id: string) => deleteScheduleBlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-schedule'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      toast({ title: 'Schedule block removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  const grouped = React.useMemo(() => {
    const map = new Map<string, LeaderCalendarItem[]>();
    for (const it of data?.items ?? []) {
      const key = it.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const openNewAppt = (day?: string) => {
    setDefaultStart(day ? `${day}T10:00:00.000Z` : undefined);
    setApptOpen(true);
  };

  const openEditBlock = (item: LeaderCalendarItem) => {
    setEditingBlock({
      id: item.id,
      title: item.title,
      startAt: item.startAt,
      endAt: item.endAt ?? item.startAt,
      createdAt: '',
    });
    setBlockOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Leader Calendar"
        description="Appointments and schedule blocks for the month."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center text-sm font-semibold">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => openNewAppt()}>
                  <Plus className="h-4 w-4" /> Appointment
                </Button>
                <Button onClick={() => { setEditingBlock(null); setDefaultStart(undefined); setBlockOpen(true); }}>
                  <Plus className="h-4 w-4" /> Schedule block
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !grouped.length ? (
            <EmptyState
              title="Nothing scheduled"
              description="No appointments or schedule blocks for this month."
              action={
                canEdit ? (
                  <Button onClick={() => openNewAppt()}>Add appointment</Button>
                ) : undefined
              }
            />
          ) : (
            grouped.map(([day, items]) => (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    {new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                  </p>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openNewAppt(day)}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {items.map((it) => {
                    const isAppt = it.kind === 'appointment';
                    const inner = (
                      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{it.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {isAppt ? 'Appointment' : 'Schedule block'}
                            {' · '}
                            {new Date(it.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            {!isAppt && it.endAt
                              ? ` – ${new Date(it.endAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                              : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAppt && it.status ? (
                            <StatusBadge status={it.status} />
                          ) : (
                            <Badge variant="muted">Block</Badge>
                          )}
                          {!isAppt && canEdit && (
                            <>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); openEditBlock(it); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (confirm(`Remove "${it.title}"?`)) delBlock.mutate(it.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                    return isAppt ? (
                      <Link key={it.id} href={`/leader-office/appointments/${it.id}`} className="block hover:opacity-90">
                        {inner}
                      </Link>
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

      <AppointmentFormDialog
        open={apptOpen}
        onOpenChange={setApptOpen}
        defaultScheduledAt={defaultStart}
      />
      <ScheduleBlockFormDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        block={editingBlock}
        defaultStartAt={defaultStart}
      />
    </>
  );
}
