'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWarRoomDashboard, generateWarRoomBriefing, downloadWarRoomReport } from '@/lib/war-room';
import { useAuth } from '@/lib/auth';

export default function WarRoomPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('warroom'));
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['war-room-dashboard'],
    queryFn: fetchWarRoomDashboard,
    refetchInterval: 30000,
  });

  const briefing = useMutation({
    mutationFn: generateWarRoomBriefing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['war-room-dashboard'] }),
  });

  return (
    <>
      <PageHeader
        title="War Room Command Center"
        description="Live campaign dashboard, alerts, escalations, and leader briefing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/war-room/alerts">Alerts</Link></Button>
            <Button variant="outline" asChild><Link href="/war-room/escalations">Escalations</Link></Button>
            <Button variant="outline" asChild><Link href="/war-room/readiness">Readiness</Link></Button>
            {canEdit && <Button variant="outline" onClick={() => briefing.mutate()}>Generate briefing</Button>}
            <Button variant="gold" onClick={() => downloadWarRoomReport('alerts')}>Export</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Open Alerts" value={data?.openAlerts ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Escalations" value={data?.openEscalations ?? 0} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Open Grievances" value={data?.grievancesOpen ?? 0} accent="bg-navy/10 text-navy" />
        <KpiCard label="Pending Tasks" value={data?.tasksPending ?? 0} accent="bg-slate-100 text-slate-700" />
      </div>
      {data?.briefing && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Latest Briefing</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{data.briefing.summary}</p></CardContent>
        </Card>
      )}
      <Card className="mt-4">
        <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.recentFeed ?? []).map((f: { id: string; summary: string; user?: { name: string }; createdAt: string }) => (
            <div key={f.id} className="rounded border px-3 py-2 text-sm">
              <span className="font-medium">{f.summary}</span>
              <span className="text-muted-foreground"> · {f.user?.name ?? 'System'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
