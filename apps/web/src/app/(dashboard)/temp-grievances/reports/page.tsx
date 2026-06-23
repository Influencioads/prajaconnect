'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Spinner } from '@/components/ui/spinner';
import { BarChart3, GitMerge, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { fetchTempGrievanceReport } from '@/lib/crm';

export default function TempGrievanceReportsPage() {
  const { data: conversion, isLoading: cLoad } = useQuery({
    queryKey: ['temp-grievance-conversion-report'],
    queryFn: () => fetchTempGrievanceReport('conversion-rate'),
  });
  const { data: daily } = useQuery({
    queryKey: ['temp-grievance-daily-report'],
    queryFn: () => fetchTempGrievanceReport('daily'),
  });
  const { data: mandal } = useQuery({
    queryKey: ['temp-grievance-mandal-report'],
    queryFn: () => fetchTempGrievanceReport('mandal-wise'),
  });
  const { data: village } = useQuery({
    queryKey: ['temp-grievance-village-report'],
    queryFn: () => fetchTempGrievanceReport('village-wise'),
  });

  if (cLoad) return <Spinner className="mx-auto mt-20" />;

  return (
    <>
      <PageHeader title="Temp Grievance Reports" description="Daily, conversion, duplicate, and geography reports." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Conversion Rate" value={`${conversion?.conversionRate ?? 0}%`} icon={ArrowRightLeft} accent="bg-green-100 text-green-700" />
        <KpiCard label="Rejection Rate" value={`${conversion?.rejectionRate ?? 0}%`} icon={ShieldAlert} accent="bg-red-100 text-red-700" />
        <KpiCard label="Converted" value={conversion?.converted ?? 0} icon={BarChart3} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Pending" value={conversion?.pending ?? 0} icon={GitMerge} accent="bg-amber-100 text-amber-700" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Daily Report (last 7 days)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(daily?.byDay ?? {}).map(([day, stats]) => {
              const s = stats as { created: number; converted: number; rejected: number };
              return (
              <div key={day} className="flex justify-between border-b py-1">
                <span>{day}</span>
                <span>+{s.created} / ✓{s.converted} / ✗{s.rejected}</span>
              </div>
            );})}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mandal-wise</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(mandal?.mandals ?? []).slice(0, 8).map((m: { name: string; count: number }) => (
              <div key={m.name} className="flex justify-between py-1"><span>{m.name}</span><span>{m.count}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Village-wise</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(village?.villages ?? []).slice(0, 8).map((v: { name: string; count: number }) => (
              <div key={v.name} className="flex justify-between py-1"><span>{v.name}</span><span>{v.count}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
