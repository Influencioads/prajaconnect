'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Spinner } from '@/components/ui/spinner';
import { StatusPieChart } from '@/components/charts';
import { fetchD2DAnalytics } from '@/lib/d2d';

export default function D2DAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['d2d-analytics'],
    queryFn: () => fetchD2DAnalytics(),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const sentimentData = Object.entries(data?.sentiment ?? {}).map(([status, count]) => ({ status, count }));

  return (
    <>
      <PageHeader title="Survey Analytics" description="Booth-wise sentiment, demographic feedback, scheme gaps and leader popularity." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Supporter %" value={`${data?.supporterPct ?? 0}%`} accent="bg-gold/20 text-navy" />
        <KpiCard label="Neutral %" value={`${data?.neutralPct ?? 0}%`} />
        <KpiCard label="Opponent %" value={`${data?.opponentPct ?? 0}%`} accent="bg-red-100 text-red-700" />
        <KpiCard label="Leader Score" value={data?.leaderPopularityScore ?? 0} accent="bg-navy/10 text-navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sentiment Distribution</CardTitle></CardHeader>
          <CardContent><StatusPieChart data={sentimentData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Complaints</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topComplaints ?? []).map((c) => (
              <div key={c.issue} className="flex justify-between text-sm">
                <span>{c.issue}</span><strong>{c.count}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Women Voter Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.demographicFeedback?.women ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Youth Voter Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.demographicFeedback?.youth ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scheme Gaps</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.schemeGaps ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
