'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Truck,
  Hammer,
  Users,
  MapPin,
  TrendingUp,
  Activity,
  IndianRupee,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchElectionDashboard } from '@/lib/election';
import { formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function ElectionDashboardView() {
  const { data, isLoading } = useQuery({ queryKey: ['election-dashboard'], queryFn: () => fetchElectionDashboard() });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return null;

  const { election, kpis, mandalProgress, boothPerformance, dailyExpenseSummary, activityTimeline } = data;

  return (
    <>
      <PageHeader
        title="Election Dashboard"
        description={`${election.name} · ${election.status}${election.electionDate ? ` · Poll date ${formatDate(election.electionDate)}` : ''}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Budget" value={`₹${(kpis.totalBudget / 100000).toFixed(1)}L`} icon={IndianRupee} accent="bg-gold/20 text-navy" />
        <KpiCard label="Total Expenses" value={`₹${(kpis.totalExpenses / 1000).toFixed(0)}K`} icon={Wallet} accent="bg-red-100 text-red-700" />
        <KpiCard label="Remaining" value={`₹${(kpis.remainingBudget / 100000).toFixed(1)}L`} icon={TrendingUp} accent="bg-green-100 text-green-700" />
        <KpiCard label="Booths Covered" value={kpis.boothsCovered} icon={MapPin} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Readiness Score" value={`${kpis.pollingDayReadinessScore}%`} icon={Activity} accent="bg-navy/10 text-navy" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Vehicles Active" value={kpis.vehiclesActive} icon={Truck} />
        <KpiCard label="Works Done" value={kpis.worksCompleted} icon={Hammer} />
        <KpiCard label="Pending Works" value={kpis.pendingWorks} icon={Hammer} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Volunteers" value={kpis.volunteerStrength} icon={Users} />
        <KpiCard label="Voter Outreach" value={kpis.voterOutreachCount} icon={Users} accent="bg-gold/20 text-navy" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Daily Expense Summary</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpenseSummary.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="amount" fill="#003366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mandal-wise Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mandalProgress.map((m) => (
                <div key={m.mandalId} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{m.mandalName}</p>
                    <p className="text-sm text-muted-foreground">{m.boothsCovered} booths · {m.worksCount} works</p>
                  </div>
                  <StatusBadge status={`${m.avgReadiness}% ready`} />
                </div>
              ))}
              {!mandalProgress.length && <p className="text-sm text-muted-foreground">No booth plans yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Booth Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boothPerformance.slice(0, 8).map((b) => (
                <div key={b.boothId} className="flex items-center justify-between text-sm">
                  <span>Booth {b.boothNumber} · {b.mandalName}</span>
                  <span className="font-semibold text-navy">{b.readinessScore}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityTimeline.map((item, i) => (
                <div key={i} className="border-l-2 border-gold pl-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.meta} · {formatDate(item.at)}</p>
                </div>
              ))}
              {!activityTimeline.length && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function ElectionListShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      <Card><CardContent className="pt-6">{children}</CardContent></Card>
    </>
  );
}

export function ElectionTableLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-medium text-navy hover:underline">{children}</Link>;
}
