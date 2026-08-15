'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Play, Settings } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchBulletins, runBulletin } from '@/lib/bulletin';
import { useAuth } from '@/lib/auth';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function BulletinArchivePage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('bulletin'));
  const qc = useQueryClient();
  const [month, setMonth] = React.useState(currentMonth());
  const [edition, setEdition] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bulletins', month, edition],
    queryFn: () => fetchBulletins(month, edition || undefined),
  });

  const run = useMutation({
    mutationFn: () => runBulletin({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  return (
    <>
      <PageHeader
        title="Daily Bulletin"
        description="Your 5 AM constituency briefing — what changed, what needs attention."
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="gold" onClick={() => run.mutate()} disabled={run.isPending}>
                <Play className="mr-2 h-4 w-4" /> {run.isPending ? 'Generating…' : 'Generate Now'}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/bulletin/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        />
        <select
          value={edition}
          onChange={(e) => setEdition(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All editions</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Edition</TableHead>
              <TableHead>Headline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No bulletins for this month"
                    description="Bulletins are generated automatically at 5 AM daily."
                    icon={Newspaper}
                  />
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap text-sm font-medium">
                    {new Date(b.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{b.edition}</TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {b.narrative?.split('\n')[0] ?? '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild><Link href={`/bulletin/${b.id}`}>View</Link></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
