'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { fetchVoterProfile, updateVoterProfile } from '@/lib/voter-intelligence';

const PREFS = ['Supporter', 'Neutral', 'Opponent', 'Swing', 'Unknown'];

export default function VoterProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('voterintelligence'));
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['voter-profile', id],
    queryFn: () => fetchVoterProfile(id),
  });

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => updateVoterProfile(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-profile', id] }),
  });

  if (isLoading || !profile) return <div className="p-6">Loading…</div>;

  return (
    <>
      <PageHeader title={profile.citizen.name} description={`Voter ID: ${profile.citizen.voterId ?? 'N/A'}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Intelligence Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={profile.preference} />
              <span className="text-sm">Priority score: <strong>{profile.priorityScore}</strong></span>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                {PREFS.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={profile.preference === p ? 'default' : 'outline'}
                    onClick={() => mutation.mutate({ preference: p, isSwing: p === 'Swing' })}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {profile.isKeyVoter && <StatusBadge status="Key Voter" />}
              {profile.isInfluencer && <StatusBadge status="Influencer" />}
              {profile.isSwing && <StatusBadge status="Swing" />}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => mutation.mutate({ isKeyVoter: !profile.isKeyVoter })}>
                  Toggle Key Voter
                </Button>
                <Button size="sm" variant="outline" onClick={() => mutation.mutate({ isInfluencer: !profile.isInfluencer })}>
                  Toggle Influencer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Geo & Family</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Mandal: {profile.citizen.mandal?.name ?? '—'}</p>
            <p>Village: {profile.citizen.village?.name ?? '—'}</p>
            <p>Booth: {profile.citizen.booth?.number ?? '—'}</p>
            <p>Family: {profile.citizen.family?.headName ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent D2D</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(profile.d2dResponses ?? []).map((r: { id: string; sentiment?: string; submittedAt: string }) => (
              <div key={r.id} className="rounded border px-2 py-1">{r.sentiment ?? '—'} · {new Date(r.submittedAt).toLocaleDateString()}</div>
            ))}
            {!profile.d2dResponses?.length && <p className="text-muted-foreground">No D2D history</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Election Outreach</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(profile.electionOutreach ?? []).map((o: { id: string; stance: string; channel: string; outreachDate: string }) => (
              <div key={o.id} className="rounded border px-2 py-1">{o.stance} via {o.channel}</div>
            ))}
            {!profile.electionOutreach?.length && <p className="text-muted-foreground">No outreach history</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
