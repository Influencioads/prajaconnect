'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCallQueue, deleteCallQueue, fetchCallQueues } from '@/lib/call-center';
import { useAuth } from '@/lib/auth';

export default function CallCenterQueuePage() {
  const [name, setName] = React.useState('');
  const [priority, setPriority] = React.useState('0');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('callcenter'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['call-queues'], queryFn: fetchCallQueues });

  const create = useMutation({
    mutationFn: () => createCallQueue({ name, priority: Number(priority) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); setName(''); },
  });

  const remove = useMutation({
    mutationFn: deleteCallQueue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['call-queues'] }),
  });

  return (
    <>
      <PageHeader title="Call Queues" description="Manage helpline queues and priorities." />
      {canEdit && (
        <div className="mb-4 flex max-w-lg gap-2">
          <div className="flex-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div className="w-24"><Label>Priority</Label><Input value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1" /></div>
          <Button className="mt-6" disabled={!name || create.isPending} onClick={() => create.mutate()}>Add</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Priority</TableHead><TableHead>Calls</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data ?? []).map((q: { id: string; name: string; priority: number; _count: { callLogs: number } }) => (
              <TableRow key={q.id}>
                <TableCell>{q.name}</TableCell>
                <TableCell>{q.priority}</TableCell>
                <TableCell>{q._count.callLogs}</TableCell>
                <TableCell>{canEdit && <Button size="sm" variant="outline" onClick={() => remove.mutate(q.id)}>Delete</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
