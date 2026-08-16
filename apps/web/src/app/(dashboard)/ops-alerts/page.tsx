'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlarmClock, MapPinOff, ShieldAlert, UserX } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import {
  fetchOpsDarkZones,
  fetchOpsInactiveCadre,
  fetchOpsSla,
} from '@/lib/ops-alerts';

type Tab = 'sla' | 'inactive' | 'dark';

function SeverityChip({ label, tone }: { label: string; tone: 'red' | 'amber' | 'orange' | 'purple' | 'slate' }) {
  const tones: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{label}</span>
  );
}

export default function OpsAlertsPage() {
  const [tab, setTab] = React.useState<Tab>('sla');

  const { data: sla, isLoading: slaLoading } = useQuery({
    queryKey: ['ops-alerts-sla'],
    queryFn: fetchOpsSla,
  });
  const { data: inactive, isLoading: inactiveLoading } = useQuery({
    queryKey: ['ops-alerts-inactive-cadre'],
    queryFn: fetchOpsInactiveCadre,
  });
  const { data: dark, isLoading: darkLoading } = useQuery({
    queryKey: ['ops-alerts-dark-zones'],
    queryFn: fetchOpsDarkZones,
  });

  return (
    <>
      <PageHeader
        title="Ops Alerts"
        description="SLA breach escalation, inactive cadre and coverage dark zones — the daily operations watchlist."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="SLA breached"
          value={sla?.counts.breached ?? 0}
          icon={ShieldAlert}
          accent="bg-red-100 text-red-700"
        />
        <KpiCard
          label="SLA at risk"
          value={sla?.counts.atRisk ?? 0}
          sub="80%+ of SLA elapsed"
          icon={AlarmClock}
          accent="bg-amber-100 text-amber-700"
        />
        <KpiCard
          label="Inactive cadre"
          value={inactive?.count ?? 0}
          sub={`No activity in ${inactive?.days ?? 3} days`}
          icon={UserX}
          accent="bg-orange-100 text-orange-700"
        />
        <KpiCard
          label="Dark zones"
          value={(dark?.counts.villages ?? 0) + (dark?.counts.booths ?? 0)}
          sub={`${dark?.counts.villages ?? 0} villages · ${dark?.counts.booths ?? 0} booths`}
          icon={MapPinOff}
          accent="bg-slate-100 text-slate-700"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Button variant={tab === 'sla' ? 'default' : 'outline'} size="sm" onClick={() => setTab('sla')}>
              SLA
            </Button>
            <Button variant={tab === 'inactive' ? 'default' : 'outline'} size="sm" onClick={() => setTab('inactive')}>
              Inactive cadre
            </Button>
            <Button variant={tab === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTab('dark')}>
              Dark zones
            </Button>
          </div>

          {tab === 'sla' && (
            slaLoading ? (
              <Spinner className="mx-auto" />
            ) : !sla?.breached.length && !sla?.atRisk.length ? (
              <EmptyState title="All within SLA" description="No grievances are breached or at risk right now." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Escalation</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(sla?.breached ?? []), ...(sla?.atRisk ?? [])].map((g) => {
                    const isBreached = g.daysOverdue !== undefined;
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs">
                          <Link href={`/grievances/${g.id}`} className="text-primary hover:underline">
                            {g.code}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">{g.title}</TableCell>
                        <TableCell>
                          {isBreached ? (
                            <SeverityChip label={`${g.daysOverdue}d overdue`} tone="red" />
                          ) : (
                            <SeverityChip label={`${g.hoursLeft}h left`} tone="amber" />
                          )}
                        </TableCell>
                        <TableCell>
                          {g.escalationLevel ? (
                            <SeverityChip label={`Level ${g.escalationLevel}`} tone="purple" />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(g.slaDueAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.assignee ?? 'Unassigned'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.mandal ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={g.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {tab === 'inactive' && (
            inactiveLoading ? (
              <Spinner className="mx-auto" />
            ) : !inactive?.data.length ? (
              <EmptyState title="No inactive cadre" description={`Every active cadre logged attendance, activity or a D2D response in the last ${inactive?.days ?? 3} days.`} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Booth</TableHead>
                    <TableHead>Reports to</TableHead>
                    <TableHead>Mobile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactive.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.designation}</TableCell>
                      <TableCell>
                        <SeverityChip label={`${inactive.days}d silent`} tone="orange" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.level}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.mandal ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.booth ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.parentName ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{c.mobile}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}

          {tab === 'dark' && (
            darkLoading ? (
              <Spinner className="mx-auto" />
            ) : !dark?.villages.length && !dark?.booths.length ? (
              <EmptyState title="No dark zones" description={`Every village and booth had at least one touchpoint in the last ${dark?.days ?? 14} days.`} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Parent area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dark?.villages ?? []).map((v) => (
                    <TableRow key={`v-${v.id}`}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">Village</TableCell>
                      <TableCell>
                        <SeverityChip label={`${dark?.days ?? 14}d no touchpoint`} tone="red" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.mandal ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  {(dark?.booths ?? []).map((b) => (
                    <TableRow key={`b-${b.id}`}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">Booth</TableCell>
                      <TableCell>
                        <SeverityChip label={`${dark?.days ?? 14}d no touchpoint`} tone="slate" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.village ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
    </>
  );
}
