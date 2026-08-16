'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Network, Radio, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchGeoOptions } from '@/lib/crm';
import {
  fetchCoverage,
  fetchOppositionFeed,
  fetchOppositionHeat,
  fetchVisitPlan,
  type BoothCoverageRow,
} from '@/lib/ground-intel';

const ALL = '__all__';

export default function GroundIntelPage() {
  const [mandalId, setMandalId] = React.useState<string>(ALL);
  const mandal = mandalId === ALL ? undefined : mandalId;
  const { data: geo } = useQuery({ queryKey: ['geo-options'], queryFn: fetchGeoOptions });

  return (
    <>
      <PageHeader
        title="Ground Intel"
        description="Booth influence coverage, opposition ground activity and village visit planning."
        actions={
          <Select value={mandalId} onValueChange={setMandalId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All mandals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All mandals</SelectItem>
              {(geo?.mandals ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="influence">
        <TabsList>
          <TabsTrigger value="influence">Influence Coverage</TabsTrigger>
          <TabsTrigger value="opposition">Opposition Heat</TabsTrigger>
          <TabsTrigger value="visits">Visit Planner</TabsTrigger>
        </TabsList>
        <TabsContent value="influence">
          <InfluenceTab mandalId={mandal} />
        </TabsContent>
        <TabsContent value="opposition">
          <OppositionTab mandalId={mandal} />
        </TabsContent>
        <TabsContent value="visits">
          <VisitTab mandalId={mandal} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ============================================================
// Influence coverage
// ============================================================
function InfluenceTab({ mandalId }: { mandalId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['gi-coverage', mandalId],
    queryFn: () => fetchCoverage({ mandalId }),
  });

  if (isLoading) return <Spinner />;
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Booths" value={totals?.booths ?? 0} icon={Network} />
        <KpiCard label="With Friendly Link" value={totals?.boothsWithFriendlyLink ?? 0} icon={Users} accent="bg-green-100 text-green-800" />
        <KpiCard label="Zero Friendly Links" value={totals?.zeroFriendlyBooths ?? 0} icon={AlertTriangle} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Urgent (weak/swing)" value={totals?.urgentBooths ?? 0} icon={AlertTriangle} accent="bg-red-100 text-red-700" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Urgent — no friendly influencer in a weak or swing booth</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.urgent?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booth</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Mandal</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead className="text-right">Voters</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.urgent.map((b) => (
                  <TableRow key={b.boothId}>
                    <TableCell className="font-medium">{boothLabel(b)}</TableCell>
                    <TableCell>{b.villageName ?? '—'}</TableCell>
                    <TableCell>{b.mandalName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="danger">{b.strengthLabel ?? 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{b.voterCount}</TableCell>
                    <TableCell className="text-right">{b.priorityBoothScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No urgent booths"
              description="Every weak or swing booth has at least one friendly influencer linked."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booth influence coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.booths?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booth</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead className="text-right">Friendly</TableHead>
                  <TableHead className="text-right">Neutral</TableHead>
                  <TableHead className="text-right">Rival</TableHead>
                  <TableHead className="text-right">Avg strength</TableHead>
                  <TableHead>Communities covered</TableHead>
                  <TableHead>Uncovered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.booths.map((b) => (
                  <TableRow key={b.boothId} className={b.zeroFriendly ? 'bg-amber-50/60' : undefined}>
                    <TableCell className="font-medium">{boothLabel(b)}</TableCell>
                    <TableCell>{b.villageName ?? '—'}</TableCell>
                    <TableCell className="text-right">{b.friendlyLinks}</TableCell>
                    <TableCell className="text-right">{b.neutralLinks}</TableCell>
                    <TableCell className="text-right">{b.rivalLinks}</TableCell>
                    <TableCell className="text-right">{b.avgFriendlyStrength || '—'}</TableCell>
                    <TableCell className="text-xs">{b.communitiesCovered.join(', ') || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.communitiesUncovered.join(', ') || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No booths" description="No booths match this filter." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function boothLabel(b: BoothCoverageRow) {
  return b.boothName ? `${b.boothNumber} · ${b.boothName}` : `Booth ${b.boothNumber}`;
}

// ============================================================
// Opposition heat
// ============================================================
function OppositionTab({ mandalId }: { mandalId?: string }) {
  const { data: heat, isLoading } = useQuery({
    queryKey: ['gi-opp-heat', mandalId],
    queryFn: () => fetchOppositionHeat(mandalId),
  });
  const { data: feed } = useQuery({
    queryKey: ['gi-opp-feed', mandalId],
    queryFn: () => fetchOppositionFeed({ mandalId, limit: 20 }),
  });

  if (isLoading) return <Spinner />;
  const types = Object.keys(heat?.totals.byType ?? {}).sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Reports (30d)" value={heat?.totals.last30 ?? 0} icon={Radio} />
        <KpiCard label="Previous 30d" value={heat?.totals.prev30 ?? 0} accent="bg-muted text-muted-foreground" />
        <KpiCard
          label="Trend"
          value={formatTrend((heat?.totals.last30 ?? 0) - (heat?.totals.prev30 ?? 0))}
          icon={AlertTriangle}
          accent="bg-amber-100 text-amber-700"
        />
        <KpiCard label="Crowd counted (30d)" value={heat?.totals.headcount30 ?? 0} icon={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mandal heat — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {heat?.mandals?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mandal</TableHead>
                  <TableHead className="text-right">Last 30d</TableHead>
                  <TableHead className="text-right">Prev 30d</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                  {types.map((t) => (
                    <TableHead key={t} className="text-right">
                      {t}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heat.mandals.map((m) => (
                  <TableRow key={m.mandalId ?? 'unassigned'}>
                    <TableCell className="font-medium">{m.mandalName}</TableCell>
                    <TableCell className="text-right">{m.last30}</TableCell>
                    <TableCell className="text-right">{m.prev30}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={m.trend > 0 ? 'danger' : m.trend < 0 ? 'success' : 'muted'}>
                        {formatTrend(m.trend)}
                      </Badge>
                    </TableCell>
                    {types.map((t) => (
                      <TableCell key={t} className="text-right">
                        {m.byType[t] ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No opposition reports" description="Nothing logged in the last 60 days." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent field reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(feed?.data ?? []).map((a) => (
            <div key={a.id} className="rounded-lg border px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {a.rivalName}
                  {a.party ? ` · ${a.party}` : ''}
                </span>
                <Badge variant="info">{a.activityType}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{a.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[a.booth ? `Booth ${a.booth.number}` : null, a.village?.name, a.mandal?.name]
                  .filter(Boolean)
                  .join(' · ') || 'Location not set'}
                {a.headcount ? ` · ~${a.headcount} people` : ''} · {new Date(a.occurredAt).toLocaleString()} ·{' '}
                {a.reportedBy?.name ?? 'Unknown'}
              </p>
            </div>
          ))}
          {!feed?.data?.length && (
            <EmptyState title="Nothing reported yet" description="Field cadre log opposition activity from the mobile app." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTrend(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

// ============================================================
// Visit planner
// ============================================================
const BUCKET_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  amber: 'warning',
  red: 'danger',
};

function VisitTab({ mandalId }: { mandalId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['gi-visit-plan', mandalId],
    queryFn: () => fetchVisitPlan(mandalId),
  });

  if (isLoading) return <Spinner />;
  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Villages" value={s?.villages ?? 0} icon={CalendarClock} />
        <KpiCard label="Visited < 30d" value={s?.green ?? 0} accent="bg-green-100 text-green-800" />
        <KpiCard label="30–90d" value={s?.amber ?? 0} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="90d+ / never" value={s?.red ?? 0} accent="bg-red-100 text-red-700" sub={`${s?.neverVisited ?? 0} never visited`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit plan — stalest villages first</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.villages?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Village</TableHead>
                  <TableHead>Mandal</TableHead>
                  <TableHead>Last visit</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Open grievances</TableHead>
                  <TableHead className="text-right">Scheme backlog</TableHead>
                  <TableHead className="text-right">Active camps</TableHead>
                  <TableHead className="text-right">Uncovered booths</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.villages.map((v) => (
                  <TableRow key={v.villageId}>
                    <TableCell className="font-medium">
                      <span className="mr-2">
                        <Badge variant={BUCKET_VARIANT[v.bucket]}>{v.bucket}</Badge>
                      </span>
                      {v.villageName}
                    </TableCell>
                    <TableCell>{v.mandalName ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.lastVisitAt ? new Date(v.lastVisitAt).toLocaleDateString() : 'Never'}
                      {v.lastVisitSource ? ` · ${v.lastVisitSource}` : ''}
                    </TableCell>
                    <TableCell className="text-right">{v.daysSince ?? '—'}</TableCell>
                    <TableCell className="text-right">{v.pending.openGrievances}</TableCell>
                    <TableCell className="text-right">{v.pending.pendingSchemeMatches}</TableCell>
                    <TableCell className="text-right">{v.pending.activeCamps}</TableCell>
                    <TableCell className="text-right">
                      {v.pending.uncoveredBooths}/{v.pending.totalBooths}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No villages" description="No villages match this filter." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
