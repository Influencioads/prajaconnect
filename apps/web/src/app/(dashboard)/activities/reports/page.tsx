'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileBarChart } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatNumber } from '@/lib/utils';
import { fetchActivityReports, downloadActivityReportCsv } from '@/lib/crm';

export default function ActivityReportsPage() {
  const { toast } = useToast();
  const [pending, setPending] = React.useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['activity-reports'], queryFn: fetchActivityReports });

  const download = async (type: string) => {
    setPending(type);
    try {
      await downloadActivityReportCsv(type);
      toast({ title: 'Report downloaded', variant: 'success' });
    } catch {
      toast({ title: 'Download failed', variant: 'error' });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Activity Reports"
        description="Generate daily, weekly, monthly, volunteer, cadre, constituency, campaign and communication reports."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total" value={formatNumber(data?.counts.total ?? 0)} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Calls" value={formatNumber(data?.counts.calls ?? 0)} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard label="Tasks" value={formatNumber(data?.counts.tasks ?? 0)} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Meetings" value={formatNumber(data?.counts.meetings ?? 0)} accent="bg-green-100 text-green-700" />
        <KpiCard label="Campaigns" value={formatNumber(data?.counts.campaigns ?? 0)} accent="bg-purple-100 text-purple-700" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.reports.map((r) => (
            <Card key={r.type}>
              <CardContent className="flex h-full flex-col gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileBarChart className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{r.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                </div>
                <Button variant="outline" disabled={pending === r.type} onClick={() => download(r.type)}>
                  <Download className="h-4 w-4" /> {pending === r.type ? 'Preparing…' : 'Export CSV'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
