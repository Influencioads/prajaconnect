'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PollingDayStatus } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { createPollingDayUpdate, fetchElectionBooth } from '@/lib/election';

const POLLING_STATUSES = Object.values(PollingDayStatus);

export default function PollingDayBoothPage() {
  const { boothId } = useParams<{ boothId: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [status, setStatus] = React.useState<PollingDayStatus>(PollingDayStatus.BoothOpened);
  const [turnoutCount, setTurnoutCount] = React.useState('');
  const [hour, setHour] = React.useState('');
  const [issueText, setIssueText] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [resolved, setResolved] = React.useState(false);

  const { data: boothPlan, isLoading } = useQuery({
    queryKey: ['election-booth-plan', boothId],
    queryFn: () => fetchElectionBooth(boothId),
  });

  const submitMut = useMutation({
    mutationFn: () =>
      createPollingDayUpdate({
        boothPlanId: boothId,
        status,
        turnoutCount: turnoutCount ? Number(turnoutCount) : undefined,
        hour: hour ? Number(hour) : undefined,
        issueText: issueText || undefined,
        notes: notes || undefined,
        resolved: status === PollingDayStatus.IssueReported ? resolved : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-polling-day-live'] });
      qc.invalidateQueries({ queryKey: ['election-booth-plan', boothId] });
      toast({ title: 'Update submitted', variant: 'success' });
      setIssueText('');
      setNotes('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading booth…" />;

  const booth = boothPlan?.booth;

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/election/polling-day"><ArrowLeft className="h-4 w-4" /> Back to live dashboard</Link>
        </Button>
      </div>

      <PageHeader
        title={booth ? `Booth ${booth.number}${booth.name ? ` · ${booth.name}` : ''}` : 'Booth update'}
        description={boothPlan ? `Readiness ${boothPlan.readinessScore ?? 0}%` : 'Submit polling day status'}
      />

      {canEdit ? (
        <Card>
          <CardHeader><CardTitle>Submit update</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PollingDayStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POLLING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turnout count</Label>
                <Input type="number" min={0} value={turnoutCount} onChange={(e) => setTurnoutCount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hour (0–23)</Label>
                <Input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(e.target.value)} />
              </div>
            </div>
            {status === PollingDayStatus.IssueReported && (
              <>
                <div className="space-y-2">
                  <Label>Issue description</Label>
                  <Textarea value={issueText} onChange={(e) => setIssueText(e.target.value)} rows={3} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)} />
                  Mark as resolved
                </label>
              </>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <Button
              className="bg-gold text-navy hover:bg-gold/90"
              disabled={submitMut.isPending}
              onClick={() => submitMut.mutate()}
            >
              Submit update
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">View-only access.</CardContent></Card>
      )}

      {boothPlan?.pollingDayUpdates?.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Previous updates</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {boothPlan.pollingDayUpdates.map((u: {
                id: string; status: string; turnoutCount?: number | null; createdAt: string;
              }) => (
                <li key={u.id} className="border-b pb-2 last:border-0">
                  <span className="font-medium text-navy">{u.status}</span>
                  {u.turnoutCount != null && <span> · turnout {u.turnoutCount}</span>}
                  <span className="text-muted-foreground"> · {new Date(u.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
