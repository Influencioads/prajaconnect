'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, Megaphone, Newspaper, ShieldAlert, TrendingUp, BellRing, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadMediaReport, fetchMediaDashboard } from '@/lib/media';

export default function MediaDashboardPage() {
  const { data } = useQuery({ queryKey: ['media-dashboard'], queryFn: fetchMediaDashboard });

  return (
    <>
      <PageHeader
        title="Media Monitoring"
        description="News coverage, press clippings, opposition attacks, and reputation tracking."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/media/pr">PR Command</Link></Button>
            <Button variant="outline" asChild><Link href="/media/news">News</Link></Button>
            <Button variant="outline" asChild><Link href="/media/attacks">Attacks</Link></Button>
            <Button variant="outline" asChild><Link href="/media/responses">Responses</Link></Button>
            <Button variant="gold" onClick={() => downloadMediaReport('news')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
        <KpiCard label="News Articles" value={data?.totalNews ?? 0} icon={Newspaper} accent="bg-navy/10 text-navy" />
        <KpiCard label="Pending Attacks" value={data?.pendingAttacks ?? 0} icon={ShieldAlert} accent="bg-red-100 text-red-700" />
        <KpiCard label="Draft Responses" value={data?.draftResponses ?? 0} icon={Megaphone} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Open PR Alerts" value={data?.openPrAlerts ?? 0} icon={BellRing} accent="bg-orange-100 text-orange-800" />
        <KpiCard label="SLA Breaches" value={data?.slaBreaches ?? 0} icon={Clock} accent="bg-red-50 text-red-600" />
        <KpiCard label="Reputation Score" value={data?.reputationScore ?? 0} icon={TrendingUp} accent="bg-green-100 text-green-800" />
        <KpiCard label="Press Clippings" value={data?.clippingCount ?? 0} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent News</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/media/news">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentNews ?? []).map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{n.title}</span>
                  <p className="text-xs text-muted-foreground">{n.source ?? 'Unknown source'}</p>
                </div>
                {n.sentiment && <StatusBadge status={n.sentiment} />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Opposition Attacks</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/media/attacks">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentAttacks ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{a.title}</span>
                <StatusBadge status={a.responseStatus} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
