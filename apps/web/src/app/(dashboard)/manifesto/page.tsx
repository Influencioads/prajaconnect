'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Download, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadManifestoReport, fetchManifestoDashboard, formatCurrency } from '@/lib/manifesto';

export default function ManifestoDashboardPage() {
  const { data } = useQuery({ queryKey: ['manifesto-dashboard'], queryFn: fetchManifestoDashboard });

  return (
    <>
      <PageHeader
        title="Manifesto & Promise Tracker"
        description="Election promises, budget status, and public updates."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/manifesto/promises">Promises</Link></Button>
            <Button variant="outline" asChild><Link href="/manifesto/categories">Categories</Link></Button>
            <Button variant="outline" asChild><Link href="/manifesto/departments">Departments</Link></Button>
            <Button variant="gold" onClick={() => downloadManifestoReport('promises')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Promises" value={data?.totalPromises ?? 0} icon={ClipboardList} accent="bg-navy/10 text-navy" />
        <KpiCard label="Avg Completion" value={`${data?.avgCompletionPct ?? 0}%`} accent="bg-green-100 text-green-800" />
        <KpiCard label="Budget Total" value={formatCurrency(data?.budgetTotal ?? 0)} icon={Wallet} accent="bg-gold/20 text-navy" />
        <KpiCard label="Budget Spent" value={formatCurrency(data?.budgetSpent ?? 0)} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data?.byStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <StatusBadge status={status} />
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Promises</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/manifesto/promises">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentPromises ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <Link href={`/manifesto/promises/${p.id}`} className="font-medium text-navy hover:underline">{p.title}</Link>
                <span>{p.completionPct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
