'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Minus, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  fetchLeaderboard,
  fetchMandalScorecards,
  runScorecards,
  type LeaderboardEntry,
  type MandalScorecardRow,
} from '@/lib/scorecards';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

function TrendArrow({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {Math.abs(delta)}
      </span>
    );
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function MoverList({
  title,
  icon: Icon,
  tone,
  rows,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  rows: MandalScorecardRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${tone}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No rank changes since the previous run.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
            <span className="font-medium">{r.mandal.name}</span>
            <span className="flex items-center gap-3 text-muted-foreground">
              <span>
                #{r.previousRank} → #{r.rank}
              </span>
              <TrendArrow delta={r.rankDelta} />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ScorecardsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [date, setDate] = React.useState('');
  const [period, setPeriod] = React.useState<string>('daily');

  const mandals = useQuery({
    queryKey: ['scorecards-mandals', date],
    queryFn: () => fetchMandalScorecards(date || undefined),
  });
  const leaderboard = useQuery({
    queryKey: ['scorecards-leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
  });

  const run = useMutation({
    mutationFn: () => runScorecards(date || undefined),
    onSuccess: (res: { mandals: number; cadres: number }) => {
      toast({
        title: 'Scorecards recomputed',
        description: `${res.mandals} mandals and ${res.cadres} cadres scored.`,
        variant: 'success',
      });
      qc.invalidateQueries({ queryKey: ['scorecards-mandals'] });
      qc.invalidateQueries({ queryKey: ['scorecards-leaderboard'] });
    },
    onError: () => toast({ title: 'Could not recompute scorecards', variant: 'error' }),
  });

  const rows = mandals.data?.data ?? [];
  const scoredDate = mandals.data?.date ? new Date(mandals.data.date).toLocaleDateString() : null;
  const entries = leaderboard.data?.data ?? [];
  const me = leaderboard.data?.me ?? null;

  return (
    <>
      <PageHeader
        title="Scorecards & Leaderboard"
        description="Daily mandal performance ranking and cadre field-work leaderboard."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            {date && (
              <Button variant="outline" onClick={() => setDate('')}>
                Latest
              </Button>
            )}
            <Button variant="gold" onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending ? 'Running…' : 'Recompute'}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="mandals" className="mt-4">
        <TabsList>
          <TabsTrigger value="mandals">Mandal Ranking</TabsTrigger>
          <TabsTrigger value="leaderboard">Cadre Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="mandals">
          {rows.length === 0 ? (
            <EmptyState
              title="No scorecards yet"
              description="Scorecards are computed daily at 05:30. Use Recompute to generate them now."
            />
          ) : (
            <>
              <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <MoverList title="Best movers" icon={TrendingUp} tone="text-green-600" rows={mandals.data?.movers.best ?? []} />
                <MoverList title="Worst movers" icon={TrendingDown} tone="text-red-600" rows={mandals.data?.movers.worst ?? []} />
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Mandal</TableHead>
                      <TableHead>Composite</TableHead>
                      <TableHead>Grievance Resolved</TableHead>
                      <TableHead>SLA Breaches</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>D2D Coverage</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Open Crises</TableHead>
                      <TableHead className="w-20">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold">#{r.rank}</TableCell>
                        <TableCell className="font-medium">{r.mandal.name}</TableCell>
                        <TableCell className="font-semibold">{r.composite.toFixed(1)}</TableCell>
                        <TableCell>{r.grievanceResolutionPct.toFixed(1)}%</TableCell>
                        <TableCell>{r.slaBreaches}</TableCell>
                        <TableCell>{r.attendanceRate.toFixed(1)}%</TableCell>
                        <TableCell>{r.d2dCoverage.toFixed(1)}%</TableCell>
                        <TableCell>{r.activityCount}</TableCell>
                        <TableCell>{r.openCrises}</TableCell>
                        <TableCell>
                          <TrendArrow delta={r.rankDelta} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {scoredDate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Scored for {scoredDate}. Trend arrows compare against{' '}
                  {mandals.data?.previousDate
                    ? new Date(mandals.data.previousDate).toLocaleDateString()
                    : 'the previous run'}
                  .
                </p>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {me && (
            <Card className="mb-4 border-primary/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-semibold">Your rank: #{me.rank}</p>
                    <p className="text-xs text-muted-foreground">
                      {me.cadre.name} · {me.cadre.mandal?.name ?? 'Unassigned'}
                    </p>
                  </div>
                </div>
                <Badge>{me.points} pts</Badge>
              </CardContent>
            </Card>
          )}

          {entries.length === 0 ? (
            <EmptyState title="No leaderboard data yet" description="Cadre points are computed with the daily scorecard run." />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Cadre</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Check-ins</TableHead>
                    <TableHead>D2D Visits</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>30d Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e: LeaderboardEntry) => (
                    <TableRow key={e.cadre.id} className={me?.cadre.id === e.cadre.id ? 'bg-primary/5' : undefined}>
                      <TableCell className="font-semibold">#{e.rank}</TableCell>
                      <TableCell>
                        <span className="font-medium">{e.cadre.name}</span>
                        <span className="block text-xs text-muted-foreground">{e.cadre.designation}</span>
                      </TableCell>
                      <TableCell>{e.cadre.mandal?.name ?? '—'}</TableCell>
                      <TableCell>{e.checkIns}</TableCell>
                      <TableCell>{e.d2dVisits}</TableCell>
                      <TableCell>{e.activities}</TableCell>
                      <TableCell>{e.tasksCompleted}</TableCell>
                      <TableCell className="font-semibold">{e.points}</TableCell>
                      <TableCell className="text-muted-foreground">{e.cadre.performance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
