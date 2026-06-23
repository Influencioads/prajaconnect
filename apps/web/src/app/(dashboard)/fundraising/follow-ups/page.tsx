'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { fetchFollowUpReminders, fetchFollowUps, updateFollowUp } from '@/lib/fundraising';

export default function FollowUpsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('fundraising'));
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('pending');

  const { data: reminders } = useQuery({
    queryKey: ['fundraising-reminders'],
    queryFn: fetchFollowUpReminders,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['fundraising-follow-ups', page, filter],
    queryFn: () => fetchFollowUps({
      page,
      limit: 20,
      completed: filter === 'all' ? undefined : filter === 'completed',
    }),
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => updateFollowUp(id, { completed: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundraising-follow-ups'] });
      qc.invalidateQueries({ queryKey: ['fundraising-reminders'] });
    },
  });

  return (
    <>
      <PageHeader title="Donor Follow-ups" description="Scheduled reminders and overdue donor outreach." />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-red-700">Overdue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(reminders?.overdue ?? []).map((f) => (
              <div key={f.id} className="flex justify-between rounded border px-3 py-2 text-sm">
                <Link href={`/fundraising/donors/${f.donor?.id}`} className="font-medium text-navy hover:underline">{f.donor?.name}</Link>
                <span>{new Date(f.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
            {!reminders?.overdue?.length && <p className="text-sm text-muted-foreground">None overdue</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming (7 days)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(reminders?.upcoming ?? []).map((f) => (
              <div key={f.id} className="flex justify-between rounded border px-3 py-2 text-sm">
                <Link href={`/fundraising/donors/${f.donor?.id}`} className="font-medium text-navy hover:underline">{f.donor?.name}</Link>
                <span>{new Date(f.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        {(['pending', 'completed', 'all'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => { setFilter(f); setPage(1); }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={canEdit ? 5 : 4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <Link href={`/fundraising/donors/${f.donor?.id}`} className="font-medium text-navy hover:underline">{f.donor?.name}</Link>
                </TableCell>
                <TableCell>{new Date(f.dueDate).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-xs truncate">{f.notes ?? '—'}</TableCell>
                <TableCell><StatusBadge status={f.completed ? 'Completed' : 'Pending'} /></TableCell>
                {canEdit && !f.completed && (
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => completeMut.mutate(f.id)}>Done</Button>
                  </TableCell>
                )}
                {canEdit && f.completed && <TableCell />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
