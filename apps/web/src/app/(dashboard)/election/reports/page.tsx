'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { downloadElectionReport, fetchElectionReportTypes } from '@/lib/election';

export default function ElectionReportsPage() {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<string | null>(null);

  const { data: types, isLoading } = useQuery({
    queryKey: ['election-report-types'],
    queryFn: fetchElectionReportTypes,
  });

  async function handleDownload(type: string, format: 'csv' | 'xlsx' | 'pdf', label: string) {
    const key = `${type}-${format}`;
    setBusy(key);
    try {
      await downloadElectionReport(type, format);
      toast({ title: 'Download started', description: `${label} (${format.toUpperCase()})`, variant: 'success' });
    } catch {
      toast({ title: 'Export failed', description: `Could not download ${label}.`, variant: 'error' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Election Reports"
        description="Export campaign data as CSV, Excel or PDF."
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(types as { type: string; label: string }[] | undefined)?.map((report) => (
            <Card key={report.type}>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-lg bg-gold/20 p-2 text-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy">{report.label}</p>
                    <p className="text-xs text-muted-foreground">{report.type}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === `${report.type}-csv`}
                    onClick={() => handleDownload(report.type, 'csv', report.label)}
                  >
                    <Download className="h-3 w-3" /> CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === `${report.type}-xlsx`}
                    onClick={() => handleDownload(report.type, 'xlsx', report.label)}
                  >
                    <FileSpreadsheet className="h-3 w-3" /> Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === `${report.type}-pdf`}
                    onClick={() => handleDownload(report.type, 'pdf', report.label)}
                  >
                    <FileText className="h-3 w-3" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
