'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchVoterFamilies } from '@/lib/voter-intelligence';

export default function VoterFamiliesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['voter-families'],
    queryFn: () => fetchVoterFamilies({ page: 1, limit: 50 }),
  });

  return (
    <>
      <PageHeader title="Family Voter Preferences" description="Household-level preference aggregation." />
      <div className="grid gap-3 md:grid-cols-2">
        {isLoading ? <p>Loading…</p> : (data?.data ?? []).map((f: {
          id: string;
          dominantPreference: string;
          supporterCount: number;
          neutralCount: number;
          opponentCount: number;
          swingCount: number;
          memberCount: number;
          family: { headName: string; booth?: { number: string } | null; village?: { name: string } | null };
        }) => (
          <Card key={f.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.family.headName}</span>
                <StatusBadge status={f.dominantPreference} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {f.family.village?.name ?? '—'} · Booth {f.family.booth?.number ?? '—'}
              </p>
              <p className="mt-2 text-xs">
                S:{f.supporterCount} N:{f.neutralCount} O:{f.opponentCount} Swing:{f.swingCount} · {f.memberCount} members
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
