'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchAttendanceDashboard, downloadAttendanceReport } from '@/lib/attendance';

export default function AttendancePage() {
  const { data } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: fetchAttendanceDashboard,
    refetchInterval: 30000,
  });

  return (
    <>
      <PageHeader
        title="Volunteer Attendance & GPS"
        description="Check-in/out tracking, geo verification, field reports, and corrections."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/attendance/records">Records</Link></Button>
            <Button variant="outline" asChild><Link href="/attendance/corrections">Corrections</Link></Button>
            <Button variant="outline" asChild><Link href="/attendance/field-reports">Field Reports</Link></Button>
            <Button variant="outline" asChild><Link href="/attendance/geo-zones">Geo Zones</Link></Button>
            <Button variant="gold" onClick={() => downloadAttendanceReport('records')}>Export</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Today Check-ins" value={data?.todayCheckIns ?? 0} accent="bg-green-100 text-green-700" />
        <KpiCard label="Active Sessions" value={data?.activeSessions ?? 0} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Pending Corrections" value={data?.pendingCorrections ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Field Reports Today" value={data?.todayFieldReports ?? 0} accent="bg-navy/10 text-navy" />
        <KpiCard label="Geo Zones" value={data?.geoZoneCount ?? 0} accent="bg-slate-100 text-slate-700" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Mandals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topMandals ?? []).map((m: { mandalId: string; mandal: { name: string }; totalRecords: number; geoVerifiedCount: number }) => (
              <div key={m.mandalId} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span className="font-medium">{m.mandal.name}</span>
                <span className="text-muted-foreground">{m.totalRecords} records · {m.geoVerifiedCount} verified</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Booths</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topBooths ?? []).map((b: { boothId: string; booth: { number: string }; totalRecords: number; activeSessions: number }) => (
              <div key={b.boothId} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span className="font-medium">Booth {b.booth.number}</span>
                <span className="text-muted-foreground">{b.totalRecords} records · {b.activeSessions} active</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Recent Check-ins</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.recentRecords ?? []).map((r: { id: string; checkInAt: string; geoVerified: boolean; cadre: { name: string; mandal?: { name: string } } }) => (
            <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{r.cadre.name}</span>
                <span className="text-muted-foreground"> · {r.cadre.mandal?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.geoVerified ? 'Verified' : 'Unverified'} />
                <Button variant="link" size="sm" asChild><Link href={`/attendance/records?id=${r.id}`}>View</Link></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
