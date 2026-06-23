'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users2,
  Eye,
  Crown,
  Megaphone,
  Newspaper,
  Network,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { fetchCommitteeAnalytics } from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const SECTIONS = [
  { key: 'mandal-committee', label: 'Mandal Committee', icon: Users2 },
  { key: 'village-committee', label: 'Village Committee', icon: Users2 },
  { key: 'coordination-committee', label: 'Coordination Committee', icon: Users2 },
  { key: 'mandal-coordination-committee', label: 'Mandal Coordination', icon: Users2 },
  { key: 'observers', label: 'Mandal Observers', icon: Eye },
  { key: 'imp-leaders', label: 'IMP Leaders', icon: Crown },
  { key: 'influencers', label: 'Influencers', icon: Megaphone },
  { key: 'press', label: 'Press', icon: Newspaper },
];

export default function CommitteesHubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['committee-analytics'],
    queryFn: fetchCommitteeAnalytics,
  });

  return (
    <>
      <PageHeader
        title="Committees & Network"
        description="Manage committees, observers, IMP leaders, influencers and press across the network."
      />

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Network" value={formatNumber(data.totals.totalNetwork)} icon={Network} accent="bg-navy/10 text-navy" />
            <KpiCard label="Committee Members" value={formatNumber(data.totals.committeeMembers)} icon={Users2} accent="bg-blue-100 text-blue-700" />
            <KpiCard label="Active" value={formatNumber(data.activeVsInactive.active)} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
            <KpiCard label="Inactive" value={formatNumber(data.activeVsInactive.inactive)} icon={XCircle} accent="bg-red-100 text-red-700" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Mandal Committee" value={formatNumber(data.totals.mandalCommittee)} icon={Users2} />
            <KpiCard label="Village Committee" value={formatNumber(data.totals.villageCommittee)} icon={Users2} />
            <KpiCard label="Coordination" value={formatNumber(data.totals.coordinationCommittee)} icon={Users2} />
            <KpiCard label="Mandal Coordination" value={formatNumber(data.totals.mandalCoordinationCommittee)} icon={Users2} />
            <KpiCard label="Observers" value={formatNumber(data.totals.observers)} icon={Eye} accent="bg-amber-100 text-amber-700" />
            <KpiCard label="IMP Leaders" value={formatNumber(data.totals.impLeaders)} icon={Crown} accent="bg-purple-100 text-purple-700" />
            <KpiCard label="Influencers" value={formatNumber(data.totals.influencers)} icon={Megaphone} accent="bg-pink-100 text-pink-700" />
            <KpiCard label="Press" value={formatNumber(data.totals.press)} icon={Newspaper} accent="bg-teal-100 text-teal-700" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.key}
                      href={`/committees/${s.key}`}
                      className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-navy hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy dark:bg-gold/20 dark:text-gold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{s.label}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mandal-wise Network Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mandal</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Observers</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.mandalStrength.map((m) => (
                        <TableRow key={m.mandal}>
                          <TableCell className="font-medium">{m.mandal}</TableCell>
                          <TableCell className="text-right">{formatNumber(m.committeeMembers)}</TableCell>
                          <TableCell className="text-right">{formatNumber(m.observers)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatNumber(m.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Village-wise Committee Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Village</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Committees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.villageCoverage.slice(0, 50).map((v) => (
                        <TableRow key={v.village}>
                          <TableCell className="font-medium">{v.village}</TableCell>
                          <TableCell className="text-right">{formatNumber(v.members)}</TableCell>
                          <TableCell className="text-right">{formatNumber(v.committees)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Influence Score Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfluenceTile
                  title="IMP Leaders"
                  rows={[
                    ['Avg Voter Influence', data.influenceScore.impLeaders.avgVoterInfluence],
                    ['Avg Community Reach', formatNumber(data.influenceScore.impLeaders.avgCommunityReach)],
                    ['Count', data.influenceScore.impLeaders.count],
                  ]}
                />
                <InfluenceTile
                  title="Influencers"
                  rows={[
                    ['Avg Engagement %', data.influenceScore.influencers.avgEngagementRate],
                    ['Total Reach', formatNumber(data.influenceScore.influencers.totalReach)],
                    ['Count', data.influenceScore.influencers.count],
                  ]}
                />
                <InfluenceTile
                  title="Committee Members"
                  rows={[
                    ['Avg Task Score', data.influenceScore.committeeMembers.avgTaskScore],
                    ['Avg Attendance', data.influenceScore.committeeMembers.avgAttendance],
                    ['Count', data.influenceScore.committeeMembers.count],
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function InfluenceTile({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-navy dark:text-gold" />
        <p className="font-semibold text-foreground">{title}</p>
      </div>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
