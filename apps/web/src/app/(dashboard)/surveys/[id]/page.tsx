'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchSurveyDetail, type SurveyAggregate } from '@/lib/crm';
import { formatDateTime } from '@/lib/utils';

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => fetchSurveyDetail(id),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!survey) return <EmptyState title="Survey not found" />;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/surveys')}>
        <ArrowLeft className="h-4 w-4" /> Back to surveys
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{survey.title}</h1>
            <StatusBadge status={survey.status} />
          </div>
          {survey.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{survey.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{survey._count.responses} total responses</p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {survey.aggregates.map((agg) => (
          <Card key={agg.id}>
            <CardHeader><CardTitle className="text-base">{agg.text}</CardTitle></CardHeader>
            <CardContent><AggregateView agg={agg} /></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent responses</CardTitle></CardHeader>
        <CardContent>
          {!survey.responses.length ? (
            <EmptyState title="No responses yet" />
          ) : (
            <div className="space-y-2">
              {survey.responses.slice(0, 15).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{r.respondentName ?? 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(r.submittedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AggregateView({ agg }: { agg: SurveyAggregate }) {
  if (agg.type === 'text') {
    if (!agg.samples?.length) return <p className="text-sm text-muted-foreground">No responses.</p>;
    return (
      <div className="space-y-2">
        {agg.samples.map((s, i) => (
          <p key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{s}</p>
        ))}
      </div>
    );
  }

  if (agg.type === 'rating') {
    const dist = agg.distribution ?? {};
    const max = Math.max(1, ...Object.values(dist));
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <span className="text-2xl font-bold">{(agg.average ?? 0).toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/ 5 average</span>
        </div>
        <div className="space-y-1.5">
          {['5', '4', '3', '2', '1'].map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-6 text-xs text-muted-foreground">{k}★</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold" style={{ width: `${((dist[k] ?? 0) / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-muted-foreground">{dist[k] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const dist = agg.distribution ?? {};
  const total = Object.values(dist).reduce((s, n) => s + n, 0) || 1;
  return (
    <div className="space-y-2">
      {Object.entries(dist).map(([opt, count]) => (
        <div key={opt} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm">{opt}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-navy" style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className="w-16 text-right text-xs text-muted-foreground">
            {count} ({Math.round((count / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
