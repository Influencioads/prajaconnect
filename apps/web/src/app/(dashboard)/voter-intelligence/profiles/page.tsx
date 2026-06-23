'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { fetchVoterProfiles, fetchVoterSegments } from '@/lib/voter-intelligence';

export default function VoterProfilesPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const [preference, setPreference] = React.useState('');
  const [segmentId, setSegmentId] = React.useState('');
  const { data: segments } = useQuery({ queryKey: ['voter-segments'], queryFn: fetchVoterSegments });

  const { data, isLoading } = useQuery({
    queryKey: ['voter-profiles', page, debounced, preference, segmentId],
    queryFn: () => fetchVoterProfiles({ page, limit: 20, search: debounced, preference: preference || undefined, segmentId: segmentId || undefined }),
  });

  return (
    <>
      <PageHeader title="Voter Profiles" description="Search and manage voter intelligence profiles." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search name, mobile, voter ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="rounded-md border px-3 py-2 text-sm" value={preference} onChange={(e) => { setPreference(e.target.value); setPage(1); }}>
          <option value="">All preferences</option>
          {['Supporter', 'Neutral', 'Opponent', 'Swing', 'Unknown'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={segmentId} onChange={(e) => { setSegmentId(e.target.value); setPage(1); }}>
          <option value="">All segments</option>
          {(segments ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Voter ID</TableHead>
              <TableHead>Preference</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Segment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/voter-intelligence/profiles/${p.id}`} className="font-medium text-navy hover:underline">
                    {p.citizen.name}
                  </Link>
                </TableCell>
                <TableCell>{p.citizen.voterId ?? '—'}</TableCell>
                <TableCell><StatusBadge status={p.preference} /></TableCell>
                <TableCell>{p.priorityScore}</TableCell>
                <TableCell className="text-xs">
                  {p.isKeyVoter && <span className="mr-1 text-gold">Key</span>}
                  {p.isInfluencer && <span className="mr-1 text-green-600">Influencer</span>}
                  {p.isSwing && <span className="text-amber-600">Swing</span>}
                </TableCell>
                <TableCell>{p.segment?.name ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
      )}
    </>
  );
}
