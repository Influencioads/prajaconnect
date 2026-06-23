'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, Phone, PhoneCall, PhoneIncoming, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadCallCenterReport, fetchCallCenterDashboard } from '@/lib/call-center';

export default function CallCenterDashboardPage() {
  const { data } = useQuery({
    queryKey: ['call-center-dashboard'],
    queryFn: fetchCallCenterDashboard,
    refetchInterval: 30000,
  });

  return (
    <>
      <PageHeader
        title="Call Center / Helpline"
        description="Agent dashboard, call logs, scripts, and disposition reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/call-center/console">Console</Link></Button>
            <Button variant="outline" asChild><Link href="/call-center/calls">Call Logs</Link></Button>
            <Button variant="outline" asChild><Link href="/call-center/queue">Queues</Link></Button>
            <Button variant="outline" asChild><Link href="/call-center/analytics">Analytics</Link></Button>
            <Button variant="gold" onClick={() => downloadCallCenterReport('calls')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Calls" value={data?.totalCalls ?? 0} icon={Phone} accent="bg-navy/10 text-navy" />
        <KpiCard label="Inbound Today" value={data?.inboundToday ?? 0} icon={PhoneIncoming} accent="bg-green-100 text-green-800" />
        <KpiCard label="Outbound Today" value={data?.outboundToday ?? 0} icon={PhoneCall} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Active Agents" value={data?.agents?.length ?? 0} icon={Users} accent="bg-slate-100 text-slate-700" />
        <KpiCard label="Pending Follow-ups" value={data?.pendingFollowUps ?? 0} accent="bg-red-100 text-red-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Calls</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/call-center/calls">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentCalls ?? []).map((c: { id: string; callerNumber: string; direction: string; disposition?: string; agent?: { user?: { name: string } }; queue?: { name: string }; createdAt: string }) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{c.callerNumber}</span>
                  <p className="text-xs text-muted-foreground">
                    {c.agent?.user?.name ?? 'Unassigned'} · {c.queue?.name ?? 'No queue'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.direction} />
                  {c.disposition && <span className="text-xs text-muted-foreground">{c.disposition}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Agents</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/call-center/console">Open console</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.agents ?? []).map((a: { id: string; status: string; user?: { name: string } }) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{a.user?.name ?? 'Agent'}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {!data?.agents?.length && <p className="text-sm text-muted-foreground">No agents configured</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
