'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, ShieldAlert, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadCrisisReport, fetchCrisisDashboard } from '@/lib/crisis';

export default function CrisisDashboardPage() {
  const { data } = useQuery({ queryKey: ['crisis-dashboard'], queryFn: fetchCrisisDashboard });

  return (
    <>
      <PageHeader
        title="Issue Heatmap & Crisis"
        description="Critical issues, escalations, and rapid response teams."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/crisis/issues">Issues</Link></Button>
            <Button variant="outline" asChild><Link href="/crisis/heatmap">Heatmap</Link></Button>
            <Button variant="outline" asChild><Link href="/crisis/escalations">Escalations</Link></Button>
            <Button variant="gold" onClick={() => downloadCrisisReport('issues')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Open Issues" value={data?.openIssues ?? 0} icon={AlertTriangle} accent="bg-red-100 text-red-700" />
        <KpiCard label="Active Issues" value={data?.activeIssues ?? 0} icon={ShieldAlert} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Escalations" value={data?.escalationCount ?? 0} accent="bg-navy/10 text-navy" />
        <KpiCard label="RRT Teams" value={data?.rrtCount ?? 0} icon={Users} accent="bg-green-100 text-green-800" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Issues</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/crisis/issues">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentIssues ?? []).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{i.title}</span>
                  <p className="text-xs text-muted-foreground">{i.village?.name ?? i.mandal?.name ?? '—'}</p>
                </div>
                <StatusBadge status={i.severity} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentTimeline ?? []).map((t) => (
              <div key={t.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">{t.issue?.title ?? 'Issue'}</p>
                <p className="text-muted-foreground">{t.note}</p>
                <p className="text-xs text-muted-foreground">{t.user?.name ?? 'System'} · {new Date(t.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
