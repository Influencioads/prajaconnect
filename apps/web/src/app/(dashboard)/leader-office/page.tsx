'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Crown, Download, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { AppointmentFormDialog } from '@/components/leader-office/appointment-form-dialog';
import { useAuth } from '@/lib/auth';
import { downloadLeaderVisitorsExport, fetchLeaderOfficeDashboard } from '@/lib/leader-office';

export default function LeaderOfficeDashboardPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('leaderoffice'));
  const [formOpen, setFormOpen] = React.useState(false);

  const { data } = useQuery({
    queryKey: ['leader-office-dashboard'],
    queryFn: fetchLeaderOfficeDashboard,
  });

  return (
    <>
      <PageHeader
        title="Leader Personal Office"
        description="Appointments, visitors, VIP contacts, and daily schedule."
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New appointment
              </Button>
            )}
            <Button variant="outline" asChild><Link href="/leader-office/appointments">Appointments</Link></Button>
            <Button variant="outline" asChild><Link href="/leader-office/visitors">Visitors</Link></Button>
            <Button variant="outline" asChild><Link href="/leader-office/vip">VIP Contacts</Link></Button>
            <Button variant="outline" asChild><Link href="/leader-office/calendar">Calendar</Link></Button>
            <Button variant="gold" onClick={() => downloadLeaderVisitorsExport()}>
              <Download className="mr-2 h-4 w-4" /> Export Visitors
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Pending Appointments" value={data?.pendingAppointments ?? 0} icon={CalendarDays} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Today's Appointments" value={data?.todayAppointments ?? 0} icon={Crown} accent="bg-navy/10 text-navy" />
        <KpiCard label="Visitors Today" value={data?.visitorsToday ?? 0} icon={Users} accent="bg-green-100 text-green-800" />
        <KpiCard label="Active Visitors" value={data?.activeVisitors ?? 0} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/leader-office/calendar">View calendar</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.upcomingSchedule ?? []).map((s) => (
              <div key={s.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-medium">{s.title}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.startAt).toLocaleString()} – {new Date(s.endAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {!data?.upcomingSchedule?.length && <p className="text-sm text-muted-foreground">No upcoming blocks</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/leader-office/appointments">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentAppointments ?? []).map((a) => (
              <Link
                key={a.id}
                href={`/leader-office/appointments/${a.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <div>
                  <span className="font-medium">{a.visitorName}</span>
                  <p className="text-xs text-muted-foreground">{a.purpose}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
            {!data?.recentAppointments?.length && <p className="text-sm text-muted-foreground">No recent appointments</p>}
          </CardContent>
        </Card>
      </div>

      <AppointmentFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
