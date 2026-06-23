'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ListTodo } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchOfflineSyncDashboard } from '@/lib/offline-sync';

export default function OfflineSyncDashboardPage() {
  const { data } = useQuery({
    queryKey: ['offline-sync-dashboard'],
    queryFn: fetchOfflineSyncDashboard,
    refetchInterval: 30000,
  });

  return (
    <>
      <PageHeader
        title="Offline Field Sync"
        description="Pending sync queue, conflict resolution, and device status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/offline-sync/pending">Pending Queue</Link></Button>
            <Button variant="outline" asChild><Link href="/offline-sync/conflicts">Conflicts</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Pending" value={data?.pending ?? 0} icon={ListTodo} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Synced" value={data?.synced ?? 0} accent="bg-green-100 text-green-800" />
        <KpiCard label="Failed" value={data?.failed ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Conflicts" value={data?.conflicts ?? 0} icon={AlertTriangle} accent="bg-navy/10 text-navy" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending by Device</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/offline-sync/pending">View queue</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.byDevice ?? []).map((d: { deviceId: string; _count: { _all: number } }) => (
              <div key={d.deviceId} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{d.deviceId}</span>
                <span className="font-semibold">{d._count._all} pending</span>
              </div>
            ))}
            {!data?.byDevice?.length && <p className="text-sm text-muted-foreground">No pending items</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Queue Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/offline-sync/pending">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentQueue ?? []).map((q: { id: string; deviceId: string; entityType: string; status: string; error?: string; createdAt: string }) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{q.entityType}</span>
                  <p className="text-xs text-muted-foreground">{q.deviceId}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
