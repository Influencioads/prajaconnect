'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/lib/auth';
import {
  createFundraisingEvent,
  deleteFundraisingEvent,
  fetchFundraisingEvents,
  formatCurrency,
} from '@/lib/fundraising';

export default function FundraisingEventsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('fundraising'));
  const canFull = accessLevel('fundraising') === 'full';
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', eventDate: '', targetAmount: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['fundraising-events', page],
    queryFn: () => fetchFundraisingEvents({ page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: () => createFundraisingEvent({
      name: form.name,
      eventDate: form.eventDate || undefined,
      targetAmount: form.targetAmount ? Number(form.targetAmount) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundraising-events'] });
      setShowForm(false);
      setForm({ name: '', eventDate: '', targetAmount: '' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFundraisingEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fundraising-events'] }),
  });

  return (
    <>
      <PageHeader
        title="Fundraising Events"
        description="Campaign fundraisers and donation drives."
        actions={canEdit ? <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add event'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 grid gap-2 rounded-lg border p-4 md:grid-cols-3">
          <Input placeholder="Event name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
          <Input type="number" placeholder="Target amount" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} />
          <Button disabled={!form.name.trim() || createMut.isPending} onClick={() => createMut.mutate()}>Save event</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Raised / Target</TableHead>
              <TableHead>Donations</TableHead>
              {canFull && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={canFull ? 5 : 4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.eventDate ? new Date(e.eventDate).toLocaleDateString() : '—'}</TableCell>
                <TableCell>{formatCurrency(e.raisedAmount)} / {formatCurrency(e.targetAmount)}</TableCell>
                <TableCell>{e.donationCount}</TableCell>
                {canFull && (
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(e.id)}>Delete</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
