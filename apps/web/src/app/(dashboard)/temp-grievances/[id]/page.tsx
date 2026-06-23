'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, MapPin, MessageCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  addTempGrievanceNote,
  archiveTempGrievance,
  fetchGrievanceOptions,
  fetchTempGrievanceDetail,
  fetchTempGrievanceDuplicates,
  rejectTempGrievance,
  requestTempGrievanceMoreInfo,
  validateTempGrievance,
} from '@/lib/crm';

const CHECKLIST_ITEMS = [
  { key: 'citizenNameConfirmed', label: 'Citizen name confirmed' },
  { key: 'mobileConfirmed', label: 'Mobile number confirmed' },
  { key: 'locationConfirmed', label: 'Location confirmed' },
  { key: 'categoryConfirmed', label: 'Issue category confirmed' },
  { key: 'descriptionVerified', label: 'Issue description verified' },
  { key: 'departmentIdentified', label: 'Department identified' },
  { key: 'prioritySelected', label: 'Priority selected' },
  { key: 'duplicateChecked', label: 'Duplicate checked' },
  { key: 'mediaReviewed', label: 'Supporting media reviewed' },
  { key: 'consentReceived', label: 'Consent / confirmation received' },
];

export default function TempGrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = ['edit', 'full'].includes(accessLevel('tempgrievances'));

  const [note, setNote] = React.useState('');
  const [rejectReason, setRejectReason] = React.useState('');
  const [moreInfoMsg, setMoreInfoMsg] = React.useState('');
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['temp-grievance-detail', id],
    queryFn: () => fetchTempGrievanceDetail(id),
  });

  const { data: dupData } = useQuery({
    queryKey: ['temp-grievance-duplicates', id],
    queryFn: () => fetchTempGrievanceDuplicates(id),
    enabled: !!id,
  });

  const { data: opts } = useQuery({ queryKey: ['grievance-options'], queryFn: fetchGrievanceOptions });

  React.useEffect(() => {
    if (item?.validationChecklist) setChecklist(item.validationChecklist as Record<string, boolean>);
  }, [item]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['temp-grievance-detail', id] });
    qc.invalidateQueries({ queryKey: ['temp-grievances'] });
    qc.invalidateQueries({ queryKey: ['temp-grievance-analytics'] });
  };

  const noteMut = useMutation({
    mutationFn: () => addTempGrievanceNote(id, note),
    onSuccess: () => { setNote(''); invalidate(); toast({ title: 'Note added', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const validateMut = useMutation({
    mutationFn: () => validateTempGrievance(id, checklist, 'Validation checklist completed'),
    onSuccess: () => { invalidate(); toast({ title: 'Validated', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectTempGrievance(id, rejectReason),
    onSuccess: () => { invalidate(); toast({ title: 'Rejected', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const archiveMut = useMutation({
    mutationFn: () => archiveTempGrievance(id, rejectReason || 'Archived'),
    onSuccess: () => { invalidate(); toast({ title: 'Archived', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const moreInfoMut = useMutation({
    mutationFn: () => requestTempGrievanceMoreInfo(id, moreInfoMsg),
    onSuccess: () => { setMoreInfoMsg(''); invalidate(); toast({ title: 'More info requested', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading temp grievance…" />;
  if (isError || !item) return <EmptyState title="Temp grievance not found" />;

  const matches = dupData?.matches ?? item.duplicates ?? [];
  const canConvert = !['Converted', 'Rejected', 'Archived', 'Duplicate'].includes(item.validationStatus);

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={item.tempTicketId}
        description={item.issueSummary ?? item.issueCategory ?? 'Temporary grievance'}
        actions={
          canEdit && canConvert ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => validateMut.mutate()} disabled={validateMut.isPending}>Mark Validated</Button>
              <Button asChild><Link href={`/temp-grievances/${id}/convert`}>Convert to Grievance</Link></Button>
            </div>
          ) : item.convertedGrievance ? (
            <Button variant="outline" asChild><Link href={`/grievances/${item.convertedGrievance.id}`}>View {item.convertedGrievance.code}</Link></Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={item.validationStatus} />
        <StatusBadge status={item.priority} />
        <Badge variant="outline">{item.source}</Badge>
        {item.duplicateRisk !== 'None' && <Badge variant="danger"><AlertTriangle className="mr-1 h-3 w-3" />{item.duplicateRisk} risk</Badge>}
      </div>

      {matches.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50/50">
          <CardHeader><CardTitle className="text-amber-800">Duplicate Warning</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {matches.slice(0, 3).map((m: { ticketId: string; matchScore: number; matchReason: string; grievanceId?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
                <span>{m.ticketId} — {m.matchReason} ({m.matchScore}%)</span>
                {m.grievanceId && <Button size="sm" variant="outline" asChild><Link href={`/grievances/${m.grievanceId}`}>Open</Link></Button>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Issue Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Category:</strong> {item.issueCategory ?? '—'}</p>
              <p><strong>Description:</strong> {item.issueDescription ?? '—'}</p>
              {item.originalMessage && <p><strong>Original message:</strong> {item.originalMessage}</p>}
              {item.voiceRecordingUrl && <p><a href={item.voiceRecordingUrl} className="text-primary hover:underline">Voice recording</a></p>}
              {item.whatsappChatUrl && <p><a href={item.whatsappChatUrl} className="text-primary hover:underline">WhatsApp chat</a></p>}
              {item.media?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.media.map((m) => <a key={m.id} href={m.mediaUrl} className="text-primary underline">{m.fileName ?? m.mediaType}</a>)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Validation Checklist</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {CHECKLIST_ITEMS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!checklist[c.key]}
                    disabled={!canEdit}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                  />
                  {c.label}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {item.validationLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-muted pl-3 text-sm">
                  <p className="font-medium">{log.validationAction}</p>
                  <p className="text-muted-foreground">{log.remarks}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)} · {log.createdBy?.name ?? 'System'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Citizen & Location</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{item.citizenName ?? '—'} · {item.mobileNumber ?? item.whatsappNumber ?? '—'}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{item.village?.name ?? '—'}, {item.mandal?.name ?? '—'}</p>
              <p>Created: {formatDateTime(item.createdAt)}</p>
              <p>By: {item.createdBy?.name ?? 'Auto'}</p>
              <p>Validator: {item.assignedValidator?.name ?? 'Unassigned'}</p>
            </CardContent>
          </Card>

          {canEdit && canConvert && (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Label>Internal note</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  <Button size="sm" disabled={!note.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>Add note</Button>
                </div>
                <div className="grid gap-2">
                  <Label>Request more info</Label>
                  <Input value={moreInfoMsg} onChange={(e) => setMoreInfoMsg(e.target.value)} />
                  <Button size="sm" variant="outline" disabled={!moreInfoMsg.trim() || moreInfoMut.isPending} onClick={() => moreInfoMut.mutate()}>Request info</Button>
                </div>
                <div className="grid gap-2">
                  <Label>Reject / archive reason</Label>
                  <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || rejectMut.isPending} onClick={() => rejectMut.mutate()}>Reject</Button>
                    <Button size="sm" variant="outline" disabled={!rejectReason.trim() || archiveMut.isPending} onClick={() => archiveMut.mutate()}>Archive</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {item.notes.length ? item.notes.map((n) => (
                <div key={n.id} className="rounded border p-2 text-sm">
                  <p>{n.note}</p>
                  <p className="text-xs text-muted-foreground">{n.createdBy?.name} · {formatDateTime(n.createdAt)}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
