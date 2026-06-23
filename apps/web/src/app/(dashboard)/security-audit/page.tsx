'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, KeyRound, ShieldAlert, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchSecurityAuditDashboard } from '@/lib/security-audit';

export default function SecurityAuditDashboardPage() {
  const { data } = useQuery({
    queryKey: ['security-audit-dashboard'],
    queryFn: fetchSecurityAuditDashboard,
    refetchInterval: 60000,
  });

  return (
    <>
      <PageHeader
        title="Security & Audit"
        description="Login history, sessions, export logs, and suspicious activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/security-audit/logins">Login History</Link></Button>
            <Button variant="outline" asChild><Link href="/security-audit/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/security-audit/alerts">Alerts</Link></Button>
            <Button variant="outline" asChild><Link href="/security-audit/exports">Export Logs</Link></Button>
            <Button variant="outline" asChild><Link href="/security-audit/file-access">File Access</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Logins Today" value={data?.loginAttemptsToday ?? 0} icon={KeyRound} accent="bg-navy/10 text-navy" />
        <KpiCard label="Failed Today" value={data?.failedLoginsToday ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Active Sessions" value={data?.activeSessions ?? 0} icon={Users} accent="bg-green-100 text-green-800" />
        <KpiCard label="Total Exports" value={data?.exportCount ?? 0} icon={Download} accent="bg-slate-100 text-slate-700" />
        <KpiCard label="Open Alerts" value={data?.suspiciousAlerts ?? 0} icon={ShieldAlert} accent="bg-amber-100 text-amber-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Logins</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/security-audit/logins">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentLogins ?? []).map((l: { id: string; success: boolean; ip?: string; user?: { name: string; email: string }; createdAt: string }) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{l.user?.name ?? 'Unknown'}</span>
                  <p className="text-xs text-muted-foreground">{l.user?.email ?? l.ip ?? '—'}</p>
                </div>
                <StatusBadge status={l.success ? 'Success' : 'Failed'} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Exports</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/security-audit/exports">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentExports ?? []).map((e: { id: string; exportType: string; user?: { name: string }; createdAt: string }) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{e.exportType}</span>
                  <p className="text-xs text-muted-foreground">{e.user?.name ?? 'System'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
