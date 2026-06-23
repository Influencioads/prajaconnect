'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, MapPin, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { fetchPollingDayLive } from '@/lib/election';

export default function PollingDayPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['election-polling-day-live'],
    queryFn: () => fetchPollingDayLive(),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return null;

  const { boothPlans, stats, recentUpdates, issueCount } = data;

  return (
    <>
      <PageHeader
        title="Polling Day Live"
        description="Real-time booth status — auto-refreshes every 30 seconds."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Booths" value={stats.totalBooths} icon={MapPin} accent="bg-navy/10 text-navy" />
        <KpiCard label="Reporting" value={stats.boothsReporting} icon={Activity} accent="bg-green-100 text-green-700" />
        <KpiCard label="Open Issues" value={issueCount} icon={AlertTriangle} accent="bg-red-100 text-red-700" />
        <KpiCard label="Latest Turnout" value={stats.latestTurnout} icon={Users} accent="bg-gold/20 text-navy" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boothPlans.map((booth: {
          id: string;
          boothNumber: string;
          boothName?: string | null;
          mandalName: string;
          readinessScore?: number;
          latestUpdate?: { status: string; turnoutCount?: number | null; createdAt: string } | null;
        }) => (
          <Link key={booth.id} href={`/election/polling-day/${booth.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-navy">
                  Booth {booth.boothNumber}
                  {booth.boothName ? ` · ${booth.boothName}` : ''}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{booth.mandalName}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Readiness</span>
                  <span className="font-semibold text-navy">{booth.readinessScore ?? 0}%</span>
                </div>
                {booth.latestUpdate ? (
                  <>
                    <StatusBadge status={booth.latestUpdate.status} />
                    {booth.latestUpdate.turnoutCount != null && (
                      <p className="text-sm">Turnout: <span className="font-medium">{booth.latestUpdate.turnoutCount}</span></p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDateTime(booth.latestUpdate.createdAt)}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No updates yet</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!boothPlans.length && (
          <p className="col-span-full text-sm text-muted-foreground">No booth plans configured.</p>
        )}
      </div>

      {recentUpdates?.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Recent updates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUpdates.slice(0, 10).map((u: {
                id: string; status: string; turnoutCount?: number | null; createdAt: string;
                boothPlan?: { booth?: { number: string } };
                createdBy?: { name: string };
              }) => (
                <div key={u.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                  <div>
                    <p className="font-medium">Booth {u.boothPlan?.booth?.number ?? '—'} · {u.status}</p>
                    <p className="text-xs text-muted-foreground">{u.createdBy?.name} · {formatDateTime(u.createdAt)}</p>
                  </div>
                  {u.turnoutCount != null && <span className="font-semibold text-navy">{u.turnoutCount}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
