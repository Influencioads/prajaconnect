'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import {
  createCommunication,
  createFollowUp,
  fetchDonor,
  formatCurrency,
  updateFollowUp,
} from '@/lib/fundraising';

export default function DonorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('fundraising'));
  const qc = useQueryClient();

  const { data: donor, isLoading } = useQuery({
    queryKey: ['fundraising-donor', id],
    queryFn: () => fetchDonor(id),
  });

  const [followUp, setFollowUp] = React.useState({ dueDate: '', notes: '' });
  const [comm, setComm] = React.useState({ channel: 'Phone', message: '' });

  const followMut = useMutation({
    mutationFn: () => createFollowUp({ donorId: id, dueDate: followUp.dueDate, notes: followUp.notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundraising-donor', id] });
      setFollowUp({ dueDate: '', notes: '' });
    },
  });

  const commMut = useMutation({
    mutationFn: () => createCommunication({ donorId: id, channel: comm.channel, message: comm.message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundraising-donor', id] });
      setComm({ channel: 'Phone', message: '' });
    },
  });

  const completeMut = useMutation({
    mutationFn: (followUpId: string) => updateFollowUp(followUpId, { completed: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fundraising-donor', id] }),
  });

  if (isLoading || !donor) return <div className="p-6">Loading…</div>;

  return (
    <>
      <PageHeader
        title={donor.name}
        description={[donor.mobile, donor.email].filter(Boolean).join(' · ') || 'Donor profile'}
        actions={<Button variant="outline" asChild><Link href="/fundraising/donors">Back to donors</Link></Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total donated</p><p className="text-2xl font-bold text-navy">{formatCurrency(donor.totalDonated)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Donations</p><p className="text-2xl font-bold">{donor._count.donations}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Follow-ups</p><p className="text-2xl font-bold">{donor._count.followUps}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Communications</p><p className="text-2xl font-bold">{donor._count.communications}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Donation History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {donor.donations.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <Link href={`/fundraising/donations/${d.id}`} className="font-medium text-navy hover:underline">
                  {formatCurrency(d.amount)} · {d.paymentMode}
                </Link>
                <span className="text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {!donor.donations.length && <p className="text-sm text-muted-foreground">No donations</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Follow-ups</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {donor.followUps.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div>
                  <p>{new Date(f.dueDate).toLocaleDateString()}</p>
                  {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                </div>
                {f.completed ? (
                  <StatusBadge status="Completed" />
                ) : canEdit ? (
                  <Button size="sm" variant="outline" onClick={() => completeMut.mutate(f.id)}>Mark done</Button>
                ) : (
                  <StatusBadge status="Pending" />
                )}
              </div>
            ))}
            {canEdit && (
              <div className="space-y-2 border-t pt-3">
                <Input type="date" value={followUp.dueDate} onChange={(e) => setFollowUp((f) => ({ ...f, dueDate: e.target.value }))} />
                <Input placeholder="Notes" value={followUp.notes} onChange={(e) => setFollowUp((f) => ({ ...f, notes: e.target.value }))} />
                <Button size="sm" disabled={!followUp.dueDate || followMut.isPending} onClick={() => followMut.mutate()}>Add follow-up</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Communication Log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {donor.communications.map((c) => (
              <div key={c.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <StatusBadge status={c.channel} />
                  <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1">{c.message}</p>
              </div>
            ))}
            {canEdit && (
              <div className="grid gap-2 border-t pt-3 md:grid-cols-3">
                <select className="rounded-md border px-3 py-2 text-sm" value={comm.channel} onChange={(e) => setComm((c) => ({ ...c, channel: e.target.value }))}>
                  {['Phone', 'WhatsApp', 'Email', 'In-person', 'SMS'].map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                </select>
                <Input className="md:col-span-2" placeholder="Message" value={comm.message} onChange={(e) => setComm((c) => ({ ...c, message: e.target.value }))} />
                <Button size="sm" disabled={!comm.message.trim() || commMut.isPending} onClick={() => commMut.mutate()}>Log communication</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
