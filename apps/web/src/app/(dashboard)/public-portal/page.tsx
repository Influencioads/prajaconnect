'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareWarning, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchPublicPortalDashboard } from '@/lib/public-portal';

export default function PublicPortalDashboardPage() {
  const { data } = useQuery({
    queryKey: ['public-portal-dashboard'],
    queryFn: fetchPublicPortalDashboard,
  });

  return (
    <>
      <PageHeader
        title="Public Portal"
        description="Citizen grievances, feedback, volunteer registrations, and portal activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/public-portal/grievances">Grievances</Link></Button>
            <Button variant="outline" asChild><Link href="/public-portal/volunteers">Volunteers</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Portal Grievances" value={data?.grievanceCount ?? 0} icon={MessageSquareWarning} accent="bg-navy/10 text-navy" />
        <KpiCard label="Feedback Submissions" value={data?.feedbackCount ?? 0} accent="bg-slate-100 text-slate-700" />
        <KpiCard label="Volunteer Registrations" value={data?.volunteerCount ?? 0} icon={Users} accent="bg-green-100 text-green-800" />
        <KpiCard label="Pending Volunteers" value={data?.pendingVolunteers ?? 0} icon={UserPlus} accent="bg-amber-100 text-amber-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentFeedback ?? []).map((f: { id: string; message: string; rating?: number; createdAt: string }) => (
              <div key={f.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="line-clamp-2">{f.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.rating ? `${f.rating}/5 · ` : ''}{new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {!data?.recentFeedback?.length && <p className="text-sm text-muted-foreground">No feedback yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Volunteers</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/public-portal/volunteers">Review all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentVolunteers ?? []).map((v: { id: string; name: string; mobile: string; status: string }) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{v.name}</span>
                  <p className="text-xs text-muted-foreground">{v.mobile}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
