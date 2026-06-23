'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCog,
  MessageSquareWarning,
  HandCoins,
  CalendarDays,
  HardHat,
  MessageCircle,
  CheckCircle2,
  AlarmClock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchDashboard } from '@/lib/queries';
import { formatNumber, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

// Charts pull in recharts (large). Load them lazily so KPIs paint immediately
// and recharts stays out of the dashboard route's initial JS / dev compile.
function ChartFallback({ height }: { height: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />;
}
const MandalBarChart = dynamic(() => import('@/components/charts').then((m) => m.MandalBarChart), {
  ssr: false,
  loading: () => <ChartFallback height={280} />,
});
const StatusPieChart = dynamic(() => import('@/components/charts').then((m) => m.StatusPieChart), {
  ssr: false,
  loading: () => <ChartFallback height={280} />,
});
const TrendAreaChart = dynamic(() => import('@/components/charts').then((m) => m.TrendAreaChart), {
  ssr: false,
  loading: () => <ChartFallback height={260} />,
});

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    // Server caches this for ~30–60s; keep it fresh in the client for a few
    // minutes so returning to the dashboard is instant (cache kept by gcTime).
    staleTime: 3 * 60_000,
    gcTime: 10 * 60_000,
  });

  if (isLoading) return <PageLoader label="Loading dashboard…" />;
  if (isError || !data)
    return (
      <EmptyState
        title="Couldn't load dashboard"
        description="Please refresh or check the API connection."
      />
    );

  const k = data.kpis;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'Leader'}`}
        description="Real-time governance overview for your constituency."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Citizens" value={formatNumber(k.citizens)} icon={Users} accent="bg-blue-100 text-blue-700" />
        <KpiCard
          label="Cadre"
          value={formatNumber(k.cadre)}
          sub={`${k.activeCadre} active`}
          icon={UserCog}
          accent="bg-amber-100 text-amber-700"
        />
        <KpiCard
          label="Open Grievances"
          value={formatNumber(k.grievancesOpen)}
          sub={`${k.grievancesTotal} total`}
          icon={MessageSquareWarning}
          accent="bg-red-100 text-red-700"
        />
        <KpiCard
          label="Resolved"
          value={`${k.resolutionRate}%`}
          sub={`${k.grievancesResolved} grievances`}
          icon={CheckCircle2}
          accent="bg-green-100 text-green-700"
        />
        <KpiCard label="Beneficiaries" value={formatNumber(k.beneficiaries)} icon={HandCoins} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard label="WhatsApp Chats" value={formatNumber(k.whatsappConversations)} icon={MessageCircle} accent="bg-teal-100 text-teal-700" />
        <KpiCard label="Events" value={formatNumber(k.events)} icon={CalendarDays} accent="bg-purple-100 text-purple-700" />
        <KpiCard label="Dev Projects" value={formatNumber(k.projects)} icon={HardHat} accent="bg-orange-100 text-orange-700" />
      </div>

      {(k.slaTotalBreached ?? 0) > 0 && (
        <Link href="/grievances/sla-tracker" className="block">
          <Card className="border-red-200 bg-red-50/50 transition-colors hover:bg-red-50">
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2 text-red-700">
                  <AlarmClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">SLA breaches need attention</p>
                  <p className="text-sm text-red-800">
                    {k.slaResolutionBreached ?? 0} resolution and {k.slaValidationBreached ?? 0} validation grievances are overdue.
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-red-700">View SLA tracker →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mandal-wise Grievances</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byMandal.length ? (
              <MandalBarChart data={data.byMandal} />
            ) : (
              <EmptyState title="No mandal data" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Grievance Status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.grievanceByStatus.length ? (
              <StatusPieChart data={data.grievanceByStatus} />
            ) : (
              <EmptyState title="No grievances" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grievance Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendAreaChart data={data.grievanceTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Grievances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentGrievances.length ? (
              data.recentGrievances.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.code} · {g.mandal ?? '—'} · {g.citizen ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              ))
            ) : (
              <EmptyState title="No grievances yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length ? (
              data.recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{a.action}</span> · {a.grievanceCode}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.note ?? a.grievanceTitle} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No activity" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
