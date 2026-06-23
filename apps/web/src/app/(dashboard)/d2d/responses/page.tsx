'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { D2DSentiment } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import {
  convertD2DToCitizen,
  convertD2DToGrievance,
  createD2DFollowup,
  fetchD2DResponse,
  fetchD2DResponses,
} from '@/lib/d2d';

export default function D2DResponsesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['d2d-responses', { page, search: debounced }],
    queryFn: () => fetchD2DResponses({ page, limit: 20, search: debounced || undefined }),
  });

  const { data: detail } = useQuery({
    queryKey: ['d2d-response', selectedId],
    queryFn: () => fetchD2DResponse(selectedId!),
    enabled: !!selectedId,
  });

  const grievanceMut = useMutation({
    mutationFn: (id: string) => convertD2DToGrievance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['d2d-responses'] });
      toast({ title: 'Grievance created', variant: 'success' });
    },
  });

  const citizenMut = useMutation({
    mutationFn: (id: string) => convertD2DToCitizen(id),
    onSuccess: () => toast({ title: 'Citizen profile created', variant: 'success' }),
  });

  const followupMut = useMutation({
    mutationFn: (id: string) => createD2DFollowup(id, { note: 'Follow-up from survey response' }),
    onSuccess: () => toast({ title: 'Follow-up task created', variant: 'success' }),
  });

  return (
    <>
      <PageHeader title="Survey Responses" description="Search, review and convert door-to-door survey responses." />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, mobile, house, voter ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Citizen / House</TableHead>
                    <TableHead>Survey</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Surveyor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.household?.headName}</div>
                        <div className="text-xs text-muted-foreground">#{r.household?.houseNumber} · {r.household?.village?.name}</div>
                      </TableCell>
                      <TableCell>{r.survey?.name}</TableCell>
                      <TableCell>{r.sentiment ? <StatusBadge status={r.sentiment} /> : '—'}</TableCell>
                      <TableCell>{r.surveyorUser?.name ?? '—'}</TableCell>
                      <TableCell>{formatDate(r.submittedAt)}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data?.meta && <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
            </>
          )}
        </CardContent>
      </Card>

      {selectedId && detail && (
        <Card className="mt-6">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-navy">{detail.household?.headName}</h3>
                <p className="text-sm text-muted-foreground">{detail.household?.address}</p>
                <p className="text-sm">Time taken: {detail.timeTakenSec ?? 0}s · Photos: {detail.photos?.length ?? 0}</p>
                {detail.latitude && <p className="text-xs text-muted-foreground">GPS: {detail.latitude}, {detail.longitude}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => grievanceMut.mutate(selectedId)}>Convert to Grievance</Button>
                <Button size="sm" variant="outline" onClick={() => citizenMut.mutate(selectedId)}>Create Citizen Profile</Button>
                <Button size="sm" variant="gold" onClick={() => followupMut.mutate(selectedId)}>Add Follow-up</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(detail.answers ?? []).map((a: { id: string; question: { label: string; labelTe?: string }; value: unknown }) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{a.question.label}</p>
                  {a.question.labelTe && <p className="text-muted-foreground">{a.question.labelTe}</p>}
                  <p className="mt-1 text-navy">{String(typeof a.value === 'object' ? JSON.stringify(a.value) : a.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
