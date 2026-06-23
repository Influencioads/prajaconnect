'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, GitMerge, ShieldAlert, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadDataQualityReport, fetchDataQualityDashboard } from '@/lib/data-quality';

export default function DataQualityDashboardPage() {
  const { data } = useQuery({
    queryKey: ['data-quality-dashboard'],
    queryFn: fetchDataQualityDashboard,
  });

  return (
    <>
      <PageHeader
        title="AI Data Cleaning"
        description="Duplicate detection, merge workflow, and data quality scores."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/data-quality/issues">Issues</Link></Button>
            <Button variant="outline" asChild><Link href="/data-quality/merges">Merges</Link></Button>
            <Button variant="outline" asChild><Link href="/data-quality/normalization">Normalization</Link></Button>
            <Button variant="gold" onClick={() => downloadDataQualityReport('issues')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Open Issues" value={data?.openIssues ?? 0} icon={ShieldAlert} accent="bg-red-100 text-red-700" />
        <KpiCard label="Resolved Issues" value={data?.resolvedIssues ?? 0} accent="bg-green-100 text-green-800" />
        <KpiCard label="Pending Merges" value={data?.pendingMerges ?? 0} icon={GitMerge} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Approved Merges" value={data?.approvedMerges ?? 0} accent="bg-navy/10 text-navy" />
        <KpiCard label="Quality Score" value={`${data?.metrics?.qualityScore ?? 100}%`} icon={TrendingUp} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Issues by Type</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/data-quality/issues">View issues</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.byType ?? []).map((t: { issueType: string; _count: { _all: number } }) => (
              <div key={t.issueType} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <StatusBadge status={t.issueType} />
                <span className="font-semibold">{t._count._all}</span>
              </div>
            ))}
            {!data?.byType?.length && <p className="text-sm text-muted-foreground">No open issues</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Issues</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/data-quality/issues">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentIssues ?? []).map((i: { id: string; entityType: string; issueType: string; score: number; resolved: boolean }) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{i.issueType}</span>
                  <p className="text-xs text-muted-foreground">{i.entityType}</p>
                </div>
                <span className="text-muted-foreground">{Math.round(i.score * 100)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
