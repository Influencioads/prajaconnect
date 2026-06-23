'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { fetchCallCenterDashboard, fetchCallFollowUps, fetchCalls } from '@/lib/call-center';

export default function CallCenterConsolePage() {
  const { data: dash } = useQuery({ queryKey: ['call-center-dashboard'], queryFn: fetchCallCenterDashboard });
  const { data: recent } = useQuery({ queryKey: ['call-center-recent'], queryFn: () => fetchCalls({ page: 1, limit: 5 }) });
  const { data: followUps } = useQuery({
    queryKey: ['call-center-follow-ups-pending'],
    queryFn: () => fetchCallFollowUps({ page: 1, limit: 5, completed: 'false' }),
  });

  return (
    <>
      <PageHeader
        title="Call Center Console"
        description="Live helpline operations dashboard."
        actions={
          <div className="flex gap-2">
            <Button asChild><Link href="/call-center/calls">Log call</Link></Button>
            <Button variant="outline" asChild><Link href="/call-center/analytics">Analytics</Link></Button>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Total calls</p><p className="text-2xl font-bold">{dash?.totalCalls ?? '—'}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Inbound today</p><p className="text-2xl font-bold">{dash?.inboundToday ?? '—'}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Outbound today</p><p className="text-2xl font-bold">{dash?.outboundToday ?? '—'}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Pending follow-ups</p><p className="text-2xl font-bold">{dash?.pendingFollowUps ?? '—'}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Recent calls</h3>
          {(recent?.data ?? []).map((c: { id: string; callerNumber?: string; disposition?: string }) => (
            <div key={c.id} className="border-b py-2 text-sm last:border-0">
              {c.callerNumber ?? 'Unknown'} · {c.disposition ?? 'No disposition'}
            </div>
          ))}
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Upcoming follow-ups</h3>
          {(followUps?.data ?? []).map((f: { id: string; dueAt: string; callLog?: { callerNumber?: string } }) => (
            <div key={f.id} className="border-b py-2 text-sm last:border-0">
              {f.callLog?.callerNumber ?? 'Call'} · due {new Date(f.dueAt).toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
