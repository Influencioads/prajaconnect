'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, GitMerge, MapPin, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchVoterDashboard, downloadVoterReport, syncVoterFromSources } from '@/lib/voter-intelligence';
import { useAuth } from '@/lib/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function VoterIntelligenceDashboardPage() {
  const { accessLevel } = useAuth();
  const canFull = accessLevel('voterintelligence') === 'full';
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['voter-dashboard'], queryFn: fetchVoterDashboard });
  const sync = useMutation({
    mutationFn: syncVoterFromSources,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-dashboard'] }),
  });

  return (
    <>
      <PageHeader
        title="Voter Intelligence"
        description="Unified voter segmentation, preference tracking, booth strength, and duplicate detection."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/voter-intelligence/profiles">All Profiles</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/voter-intelligence/import">Import roll</Link>
            </Button>
            {canFull && (
              <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                Sync from D2D/Election
              </Button>
            )}
            <Button variant="gold" onClick={() => downloadVoterReport('profiles')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Profiles" value={data?.totalProfiles ?? 0} icon={Users} accent="bg-navy/10 text-navy" />
        <KpiCard label="Supporters" value={data?.supporters ?? 0} accent="bg-gold/20 text-navy" />
        <KpiCard label="Neutral" value={data?.neutrals ?? 0} accent="bg-slate-100 text-slate-700" />
        <KpiCard label="Opponents" value={data?.opponents ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Swing" value={data?.swings ?? 0} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Key Voters" value={data?.keyVoters ?? 0} icon={UserCheck} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard label="Influencers" value={data?.influencers ?? 0} accent="bg-green-100 text-green-700" />
        <KpiCard label="Dup. Pending" value={data?.pendingDuplicates ?? 0} icon={GitMerge} accent="bg-orange-100 text-orange-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Segment Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.bySegment ?? []).map((s) => (
              <div key={s.segmentId ?? 'none'} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.segment?.color ?? '#999' }} />
                  {s.segment?.name ?? 'Unassigned'}
                </span>
                <span className="text-sm text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Priority Booths</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/voter-intelligence/booths">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.topPriorityBooths ?? []).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Booth {b.booth.number} {b.booth.name ? `— ${b.booth.name}` : ''}
                </span>
                <span className="font-medium text-navy">{b.priorityBoothScore} · {b.strengthLabel}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/voter-intelligence/families">Family Preferences</Link></Button>
        <Button variant="outline" asChild><Link href="/voter-intelligence/duplicates">Duplicate Review</Link></Button>
        <Button variant="outline" asChild><Link href="/voter-intelligence/segments">Segments</Link></Button>
      </div>
    </>
  );
}
