'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api, API_URL } from '@/lib/api';
import { d2dReportExportUrl, fetchD2DReports } from '@/lib/d2d';

async function downloadReport(type: string) {
  const url = d2dReportExportUrl(type);
  const res = await api.get(url.replace(API_URL, ''), {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `d2d-${type}.csv`;
  a.click();
}

export default function D2DReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['d2d-reports'],
    queryFn: fetchD2DReports,
  });

  return (
    <>
      <PageHeader title="Survey Reports" description="Generate and export daily, volunteer, coverage, sentiment and grievance reports." />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(data ?? []).map((r: { type: string; label: string; description: string }) => (
                <div key={r.type} className="flex items-start justify-between gap-4 rounded-xl border p-5">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-navy">
                      <FileSpreadsheet className="h-4 w-4 text-gold" />
                      {r.label}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadReport(r.type)}>
                    <Download className="h-4 w-4" /> CSV
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
