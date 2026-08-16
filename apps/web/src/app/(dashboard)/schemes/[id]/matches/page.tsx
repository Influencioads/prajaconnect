'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Play, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions, fetchSchemeDetail } from '@/lib/crm';
import {
  MATCH_STATUSES,
  downloadMatchesCsv,
  fetchSchemeMatches,
  runSchemeMatcher,
  updateSchemeMatch,
} from '@/lib/camps';

const ALL = '__all__';

export default function SchemeMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('schemes'));
  const { toast } = useToast();
  const qc = useQueryClient();

  const [status, setStatus] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [villageId, setVillageId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);

  const { data: scheme, isLoading: schemeLoading } = useQuery({
    queryKey: ['scheme-detail', id],
    queryFn: () => fetchSchemeDetail(id),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const filters = {
    status: status === ALL ? undefined : status,
    mandalId: mandalId === ALL ? undefined : mandalId,
    villageId: villageId === ALL ? undefined : villageId,
  };
  const { data, isLoading } = useQuery({
    queryKey: ['scheme-matches', id, status, mandalId, villageId, page],
    queryFn: () => fetchSchemeMatches(id, { ...filters, page, limit: 20 }),
  });

  const statusMut = useMutation({
    mutationFn: ({ matchId, newStatus }: { matchId: string; newStatus: string }) =>
      updateSchemeMatch(matchId, { status: newStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheme-matches', id] });
      toast({ title: 'Match updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const runMut = useMutation({
    mutationFn: runSchemeMatcher,
    onSuccess: (r: { created: number; updated: number }) => {
      qc.invalidateQueries({ queryKey: ['scheme-matches'] });
      toast({
        title: 'Matcher finished',
        description: `${r.created} new matches, ${r.updated} refreshed`,
        variant: 'success',
      });
    },
    onError: (e) => toast({ title: 'Matcher failed', description: apiError(e), variant: 'error' }),
  });

  if (schemeLoading) return <PageLoader label="Loading matches…" />;
  if (!scheme) return <EmptyState title="Scheme not found" />;

  const villages = geo?.villages.filter((v) => mandalId === ALL || v.mandalId === mandalId) ?? [];

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/schemes/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Back to scheme
        </Button>
      </div>

      <PageHeader
        title={`Matches · ${scheme.name}`}
        description="Citizens whose demographics match this scheme's eligibility rules."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadMatchesCsv(id, filters)}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            {canEdit && (
              <Button disabled={runMut.isPending} onClick={() => runMut.mutate()}>
                <Play className="h-4 w-4" /> {runMut.isPending ? 'Running…' : 'Run matcher'}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(data?.byStatus ?? []).map((s) => (
          <Badge key={s.status} variant="muted">
            {s.status}: {s.count}
          </Badge>
        ))}
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {MATCH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={mandalId} onValueChange={(v) => { setMandalId(v); setVillageId(ALL); setPage(1); }}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All mandals</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={villageId} onValueChange={(v) => { setVillageId(v); setPage(1); }}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Village" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All villages</SelectItem>
                {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState
              title="No matches yet"
              description="Run the matcher to scan citizens against this scheme's eligibility rules."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Village / Mandal</TableHead>
                    <TableHead>Matched on</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Cadre</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead>Update</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{m.citizen.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.citizen.mobile ?? '—'}{m.citizen.age ? ` · ${m.citizen.age} yrs` : ''}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.citizen.village?.name ?? '—'}
                        <span className="text-muted-foreground"> / {m.citizen.mandal?.name ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(m.matchedOn?.criteria ?? []).map((c) => (
                            <Badge key={c} variant="muted"><Sparkles className="h-3 w-3" /> {c}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{m.score}%</TableCell>
                      <TableCell className="text-sm">{m.assignedCadre?.name ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                      {canEdit && (
                        <TableCell>
                          <Select
                            value={m.status}
                            onValueChange={(v) => statusMut.mutate({ matchId: m.id, newStatus: v })}
                          >
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MATCH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.meta && (
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
