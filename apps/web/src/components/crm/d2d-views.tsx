'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Users, Home, CheckCircle2 } from 'lucide-react';
import { D2DSurveyStatus, D2DSurveyType } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { fetchD2DStats, fetchD2DSurveys } from '@/lib/d2d';
import { StatusPieChart } from '@/components/charts';

export function D2DDashboardView() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['d2d-stats'],
    queryFn: fetchD2DStats,
  });
  const { data: active } = useQuery({
    queryKey: ['d2d-surveys', { status: D2DSurveyStatus.Active }],
    queryFn: () => fetchD2DSurveys({ status: D2DSurveyStatus.Active, limit: 5 }),
  });

  if (statsLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const sentimentData = [
    { status: 'Supporter', count: stats?.supporter ?? 0 },
    { status: 'Neutral', count: stats?.neutral ?? 0 },
    { status: 'Opponent', count: stats?.opponent ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="D2D Survey Dashboard"
        description="Door-to-door survey operations, coverage, sentiment and field team performance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Surveys" value={stats?.totalSurveys ?? 0} icon={ClipboardList} accent="bg-navy/10 text-navy" />
        <KpiCard label="Active Surveys" value={stats?.activeSurveys ?? 0} icon={CheckCircle2} accent="bg-gold/20 text-navy" />
        <KpiCard label="Houses Covered" value={stats?.totalHousesCovered ?? 0} icon={Home} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Assigned Volunteers" value={stats?.assignedVolunteers ?? 0} icon={Users} accent="bg-green-100 text-green-700" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Voters Surveyed" value={stats?.totalVotersSurveyed ?? 0} icon={Users} />
        <KpiCard label="Pending Houses" value={stats?.pendingHouses ?? 0} icon={Home} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Sentiment Score" value={stats?.sentimentScore ?? 0} icon={ClipboardList} accent="bg-navy/10 text-navy" />
        <KpiCard label="Grievances from Survey" value={stats?.grievancesFromSurvey ?? 0} icon={ClipboardList} accent="bg-red-100 text-red-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Supporter / Neutral / Opponent</CardTitle></CardHeader>
          <CardContent><StatusPieChart data={sentimentData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Citizen Issues</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(stats?.topIssues ?? []).map((item) => (
              <div key={item.issue} className="flex items-center justify-between text-sm">
                <span>{item.issue}</span>
                <span className="font-semibold text-navy">{item.count}</span>
              </div>
            ))}
            {!stats?.topIssues?.length && <p className="text-sm text-muted-foreground">No issues recorded yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Active Surveys</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(active?.data ?? []).map((s) => (
              <Link key={s.id} href={`/d2d/active?survey=${s.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    {s.nameTe && <p className="text-sm text-muted-foreground font-[family-name:var(--font-telugu)]">{s.nameTe}</p>}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${s.progressPct ?? 0}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.completedHouseholds ?? 0} / {s.targetHouseholds} households</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mandal-wise Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(stats?.mandalProgress ?? []).map((m) => (
              <div key={m.mandalId ?? 'unknown'} className="flex justify-between text-sm">
                <span>Mandal {m.mandalId?.slice(-6)}</span>
                <span className="font-medium">{m.covered} houses</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function D2DSurveyTable({
  type,
  status,
  title,
  description,
}: {
  type?: D2DSurveyType;
  status?: D2DSurveyStatus;
  title: string;
  description: string;
}) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['d2d-surveys', { type, status, page }],
    queryFn: () => fetchD2DSurveys({ type, status, page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="space-y-4">
              {(data?.data ?? []).map((s) => (
                <div key={s.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      {s.nameTe && <p className="text-sm text-muted-foreground">{s.nameTe}</p>}
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={s.type} />
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${s.progressPct ?? 0}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Target: {s.targetHouseholds}</span>
                    <span>Completed: {s.completedHouseholds ?? 0}</span>
                    <span>Pending: {s.pendingHouseholds ?? 0}</span>
                    <span>Volunteers: {s._count?.assignments ?? 0}</span>
                  </div>
                </div>
              ))}
              {data?.meta && (
                <div className="flex justify-center pt-2">
                  <button type="button" className="text-sm text-navy" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                  <span className="mx-4 text-sm">Page {page} of {data.meta.totalPages}</span>
                  <button type="button" className="text-sm text-navy" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
