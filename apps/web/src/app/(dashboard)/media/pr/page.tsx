'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BrainCircuit, Clock, Play, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  acknowledgePrAlert,
  fetchPrDashboard,
  runPrCycle,
  type MustCoverItem,
  type NegativePrItem,
} from '@/lib/pr-management';
import { useAuth } from '@/lib/auth';

export default function PrCommandCenterPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pr-dashboard'],
    queryFn: fetchPrDashboard,
  });

  const runNow = useMutation({
    mutationFn: runPrCycle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pr-dashboard'] });
      qc.invalidateQueries({ queryKey: ['media-dashboard'] });
    },
  });

  const ack = useMutation({
    mutationFn: acknowledgePrAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr-dashboard'] }),
  });

  const mustCover = (data?.latestReport?.mustCoverJson ?? []) as MustCoverItem[];
  const negativePr = (data?.latestReport?.negativePrJson ?? []) as NegativePrItem[];

  return (
    <>
      <PageHeader
        title="PR Command Center"
        description="AI-powered political news monitoring, 4-hour digests, and critical alert management."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            {canEdit && (
              <Button variant="gold" onClick={() => runNow.mutate()} disabled={runNow.isPending}>
                <Play className="mr-2 h-4 w-4" /> Run Now
              </Button>
            )}
            <Button variant="outline" asChild><Link href="/media/pr/alerts">All Alerts</Link></Button>
            <Button variant="outline" asChild><Link href="/media/pr/reports">Reports</Link></Button>
          </div>
        }
      />

      {(data?.criticalAlerts ?? 0) > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {data?.criticalAlerts} critical PR alert(s) require admin attention.
          <Button variant="link" className="ml-auto h-auto p-0 text-red-800" asChild>
            <Link href="/media/pr/alerts?severity=Critical">View</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Open Alerts" value={data?.openAlerts ?? 0} icon={AlertTriangle} accent="bg-orange-100 text-orange-800" />
        <KpiCard label="Critical Alerts" value={data?.criticalAlerts ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="SLA Breaches" value={data?.slaBreaches ?? 0} icon={Clock} accent="bg-amber-100 text-amber-800" />
        <KpiCard
          label="Cron Status"
          value={data?.cronEnabled ? 'Active' : 'Paused'}
          icon={BrainCircuit}
          accent={data?.cronEnabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Last Ingestion Run</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data?.lastRun ? (
              <>
                <p><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.lastRun.status} /></p>
                <p><span className="text-muted-foreground">Sources:</span> {data.lastRun.sourcesChecked}</p>
                <p><span className="text-muted-foreground">Fetched:</span> {data.lastRun.articlesFetched}</p>
                <p><span className="text-muted-foreground">New articles:</span> {data.lastRun.articlesNew}</p>
                <p><span className="text-muted-foreground">Started:</span> {new Date(data.lastRun.startedAt).toLocaleString()}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No runs yet. Trigger a manual run or wait for the 4-hour schedule.</p>
            )}
            {data?.nextScheduledRun && (
              <p className="pt-2 text-xs text-muted-foreground">
                Next scheduled run: {new Date(data.nextScheduledRun).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest 4-Hour Report</CardTitle>
            {data?.latestReport && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/media/pr/reports/${data.latestReport.id}`}>Full report</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {data?.latestReport?.summary ? (
              <p className="text-sm">{data.latestReport.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No report generated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Must Cover</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mustCover.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-priority coverage items in the latest report.</p>
            ) : (
              mustCover.slice(0, 8).map((item) => (
                <div key={item.articleId} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.importanceScore}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Negative PR Queue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {negativePr.length === 0 ? (
              <p className="text-sm text-muted-foreground">No negative PR flagged in the latest report.</p>
            ) : (
              negativePr.slice(0, 8).map((item) => (
                <div key={item.articleId} className="rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{item.title}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{item.action}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Open Alerts</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/media/pr/alerts">View all</Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.openAlertsList ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No open alerts.</p>
          ) : (
            (data?.openAlertsList ?? []).map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <StatusBadge status={alert.type} />
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  {alert.body && <p className="mt-1 text-xs text-muted-foreground">{alert.body}</p>}
                </div>
                {canEdit && (
                  <Button size="sm" variant="outline" disabled={ack.isPending} onClick={() => ack.mutate(alert.id)}>
                    Acknowledge
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
