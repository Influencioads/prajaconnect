'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchPrReport, type MustCoverItem, type NegativePrItem } from '@/lib/pr-management';

export default function PrReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['pr-report', id],
    queryFn: () => fetchPrReport(id),
    enabled: !!id,
  });

  const mustCover = (data?.mustCoverJson ?? []) as MustCoverItem[];
  const negativePr = (data?.negativePrJson ?? []) as NegativePrItem[];
  const stats = data?.statsJson as Record<string, number> | undefined;

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading report…</p>;
  if (!data) return <p className="p-6 text-sm text-muted-foreground">Report not found.</p>;

  return (
    <>
      <PageHeader
        title="PR Report Detail"
        description={`${new Date(data.periodStart).toLocaleString()} — ${new Date(data.periodEnd).toLocaleString()}`}
        actions={
          <Button variant="outline" asChild><Link href="/media/pr/reports">Back to reports</Link></Button>
        }
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{data.summary ?? 'No summary available.'}</p></CardContent>
      </Card>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="rounded-lg border px-3 py-2 text-center">
              <p className="text-lg font-semibold">{val}</p>
              <p className="text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Must Cover</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mustCover.map((item) => (
              <div key={item.articleId} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.importanceScore}/100</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
            {mustCover.length === 0 && <p className="text-sm text-muted-foreground">None flagged.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Negative PR</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {negativePr.map((item) => (
              <div key={item.articleId} className="rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{item.title}</span>
                <p className="mt-1 text-xs text-muted-foreground">{item.action}</p>
              </div>
            ))}
            {negativePr.length === 0 && <p className="text-sm text-muted-foreground">None flagged.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
