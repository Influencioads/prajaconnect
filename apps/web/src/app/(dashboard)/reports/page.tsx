'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileText,
  MessageSquareWarning,
  Users,
  UserCog,
  HandCoins,
  CalendarDays,
  HardHat,
  FileType2,
  Boxes,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { KpiCard } from '@/components/ui/kpi-card';
import { useToast } from '@/components/ui/toast';
import { fetchReportsSummary, downloadReportCsv } from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const REPORT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  grievances: MessageSquareWarning,
  citizens: Users,
  cadre: UserCog,
  beneficiaries: HandCoins,
  events: CalendarDays,
  projects: HardHat,
  assets: Boxes,
};

export default function ReportsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['reports-summary'], queryFn: fetchReportsSummary });
  const [busy, setBusy] = React.useState<string | null>(null);

  async function handleExport(type: string, label: string) {
    setBusy(type);
    try {
      await downloadReportCsv(type);
      toast({ title: 'Export ready', description: `${label} CSV downloaded.`, variant: 'success' });
    } catch {
      toast({ title: 'Export failed', description: `Could not export ${label}.`, variant: 'error' });
    } finally {
      setBusy(null);
    }
  }

  function handlePdf(label: string) {
    toast({
      title: 'PDF export coming soon',
      description: `${label} PDF rendering is not yet available. Use CSV for now.`,
      variant: 'warning',
    });
  }

  return (
    <>
      <PageHeader title="Reports" description="Export constituency data sets as CSV. PDF rendering is on the roadmap." />

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {data && (
        <div className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <KpiCard label="Grievances" value={formatNumber(data.counts.grievances ?? 0)} icon={MessageSquareWarning} />
            <KpiCard label="Citizens" value={formatNumber(data.counts.citizens ?? 0)} icon={Users} />
            <KpiCard label="Cadre" value={formatNumber(data.counts.cadre ?? 0)} icon={UserCog} />
            <KpiCard label="Beneficiaries" value={formatNumber(data.counts.beneficiaries ?? 0)} icon={HandCoins} />
            <KpiCard label="Events" value={formatNumber(data.counts.events ?? 0)} icon={CalendarDays} />
            <KpiCard label="Projects" value={formatNumber(data.counts.projects ?? 0)} icon={HardHat} />
            <KpiCard label="Assets" value={formatNumber(data.counts.assets ?? 0)} icon={Boxes} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.reports.map((r) => {
              const Icon = REPORT_ICONS[r.type] ?? FileText;
              const count = data.counts[r.type];
              return (
                <Card key={r.type}>
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{r.label}</p>
                        {count !== undefined && (
                          <p className="text-xs text-muted-foreground">{formatNumber(count)} records</p>
                        )}
                      </div>
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground">{r.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busy === r.type}
                        onClick={() => handleExport(r.type, r.label)}
                      >
                        {busy === r.type ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <>
                            <Download className="mr-1.5 h-4 w-4" /> CSV
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePdf(r.label)}>
                        <FileType2 className="mr-1.5 h-4 w-4" /> PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
