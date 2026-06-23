'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  createCall,
  createTempGrievanceFromCall,
  fetchCallAgents,
  fetchCallQueues,
  fetchCalls,
} from '@/lib/call-center';
import { useAuth } from '@/lib/auth';

export default function CallCenterCallsPage() {
  const [page, setPage] = React.useState(1);
  const [form, setForm] = React.useState({ callerNumber: '', disposition: '', notes: '', queueId: '', agentId: '' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('callcenter'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['call-center-calls', page], queryFn: () => fetchCalls({ page, limit: 20 }) });
  const { data: queues } = useQuery({ queryKey: ['call-queues-select'], queryFn: fetchCallQueues });
  const { data: agents } = useQuery({ queryKey: ['call-agents-select'], queryFn: fetchCallAgents });

  const logCall = useMutation({
    mutationFn: () => createCall({ ...form, direction: 'Inbound' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-center-calls'] }); setForm({ callerNumber: '', disposition: '', notes: '', queueId: '', agentId: '' }); },
  });

  const toGrievance = useMutation({
    mutationFn: (id: string) => createTempGrievanceFromCall(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['call-center-calls'] }),
  });

  return (
    <>
      <PageHeader title="Call Logs" description="Record and manage helpline calls." />
      {canEdit && (
        <div className="mb-4 grid max-w-2xl gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div><Label>Caller number</Label><Input value={form.callerNumber} onChange={(e) => setForm({ ...form, callerNumber: e.target.value })} className="mt-1" /></div>
          <div><Label>Disposition</Label><Input value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
          <div>
            <Label>Queue</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.queueId} onChange={(e) => setForm({ ...form, queueId: e.target.value })}>
              <option value="">Select…</option>
              {(queues ?? []).map((q: { id: string; name: string }) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Agent</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
              <option value="">Select…</option>
              {(agents ?? []).map((a: { id: string; user: { name: string } }) => <option key={a.id} value={a.id}>{a.user.name}</option>)}
            </select>
          </div>
          <Button className="sm:col-span-2" disabled={logCall.isPending} onClick={() => logCall.mutate()}>Log call</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Caller</TableHead><TableHead>Disposition</TableHead><TableHead>Agent</TableHead><TableHead>When</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((c: { id: string; callerNumber?: string; disposition?: string; createdAt: string; agent?: { user: { name: string } } }) => (
              <TableRow key={c.id}>
                <TableCell>{c.callerNumber ?? '—'}</TableCell>
                <TableCell>{c.disposition ?? '—'}</TableCell>
                <TableCell>{c.agent?.user.name ?? '—'}</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                <TableCell>{canEdit && <Button size="sm" variant="outline" onClick={() => toGrievance.mutate(c.id)}>Create temp grievance</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPage={setPage} />}
    </>
  );
}
