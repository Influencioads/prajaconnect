'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { CampaignWorkStatus } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { fetchElectionWork, updateElectionWork } from '@/lib/election';

const WORK_STATUSES = Object.values(CampaignWorkStatus);

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));
  const [status, setStatus] = React.useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['election-work', id],
    queryFn: () => fetchElectionWork(id),
  });

  React.useEffect(() => {
    if (data?.status) setStatus(data.status);
  }, [data?.status]);

  const updateMut = useMutation({
    mutationFn: () => updateElectionWork(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-work', id] });
      qc.invalidateQueries({ queryKey: ['election-works'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading work…" />;
  if (isError || !data) return <EmptyState title="Work not found" />;

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/election/works')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={data.title}
        description={`${data.type}${data.deadline ? ` · due ${formatDate(data.deadline)}` : ''}`}
        actions={<StatusBadge status={data.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Priority</p><p className="font-medium">{data.priority ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Mandal</p><p>{data.mandal?.name ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Village</p><p>{data.village?.name ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Booth</p><p>{data.booth ? `Booth ${data.booth.number}` : '—'}</p></div>
            {data.description && (
              <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">Description</p><p>{data.description}</p></div>
            )}
            {data.assignments?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Assignments</p>
                <ul className="space-y-1 text-sm">
                  {data.assignments.map((a: { id: string; cadre?: { name: string } | null; team?: { name: string } | null }) => (
                    <li key={a.id}>{a.cadre?.name ?? a.team?.name ?? 'Unassigned'}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {canEdit && (
          <Card>
            <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WORK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-gold text-navy hover:bg-gold/90"
                disabled={status === data.status || updateMut.isPending}
                onClick={() => updateMut.mutate()}
              >
                Save status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
