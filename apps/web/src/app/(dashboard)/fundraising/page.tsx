'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Wallet, Bell, CalendarDays, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  downloadFundraisingReport,
  fetchFundraisingDashboard,
  formatCurrency,
} from '@/lib/fundraising';

export default function FundraisingDashboardPage() {
  const { data } = useQuery({ queryKey: ['fundraising-dashboard'], queryFn: fetchFundraisingDashboard });

  return (
    <>
      <PageHeader
        title="Fundraising & Donors"
        description="Donor database, donations ledger, receipts, events, and follow-up reminders."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/fundraising/donors">Donors</Link></Button>
            <Button variant="outline" asChild><Link href="/fundraising/donations">Donations</Link></Button>
            <Button variant="gold" onClick={() => downloadFundraisingReport('donations')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Donors" value={data?.totalDonors ?? 0} icon={Users} accent="bg-navy/10 text-navy" />
        <KpiCard label="Donations" value={data?.totalDonations ?? 0} icon={Wallet} accent="bg-gold/20 text-navy" />
        <KpiCard label="Total Raised" value={formatCurrency(data?.totalAmount ?? 0)} accent="bg-green-100 text-green-800" />
        <KpiCard label="Overdue Follow-ups" value={data?.pendingFollowUps ?? 0} icon={Bell} accent="bg-orange-100 text-orange-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Donations</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/fundraising/donations">View ledger</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentDonations ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <Link href={`/fundraising/donations/${d.id}`} className="font-medium text-navy hover:underline">
                    {d.donor?.name ?? 'Donor'}
                  </Link>
                  <p className="text-xs text-muted-foreground">{d.event?.name ?? d.paymentMode}</p>
                </div>
                <span className="font-semibold">{formatCurrency(d.amount)}</span>
              </div>
            ))}
            {!data?.recentDonations?.length && <p className="text-sm text-muted-foreground">No donations yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Donors</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/fundraising/donors">All donors</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.topDonors ?? []).map((t, i) => (
              <div key={t.donor?.id ?? i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                {t.donor ? (
                  <Link href={`/fundraising/donors/${t.donor.id}`} className="font-medium text-navy hover:underline">
                    {t.donor.name}
                  </Link>
                ) : (
                  <span>—</span>
                )}
                <span className="font-semibold">{formatCurrency(t.totalAmount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fundraising Events</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/fundraising/events">Manage</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.events ?? []).map((e) => (
              <div key={e.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.name}</span>
                  <span>{formatCurrency(e.raisedAmount)} / {formatCurrency(e.targetAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{e.donationCount} donations</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Upcoming Reminders</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/fundraising/follow-ups">All follow-ups</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.upcomingReminders ?? []).map((f) => (
              <div key={f.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <Link href={`/fundraising/donors/${f.donor?.id}`} className="font-medium text-navy hover:underline">
                    {f.donor?.name}
                  </Link>
                  <span className="text-muted-foreground">{new Date(f.dueDate).toLocaleDateString()}</span>
                </div>
                {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
              </div>
            ))}
            {!data?.upcomingReminders?.length && <p className="text-sm text-muted-foreground">No upcoming reminders</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
