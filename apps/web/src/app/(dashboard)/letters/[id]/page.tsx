'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, FileCheck2, Save, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  downloadLetterPdf,
  fetchLetter,
  finalizeLetter,
  LETTER_TYPE_LABELS,
  sendLetter,
  updateLetter,
} from '@/lib/letters';

export default function LetterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('letters'));

  const { data: letter, isLoading } = useQuery({
    queryKey: ['letter', id],
    queryFn: () => fetchLetter(id),
    enabled: !!id,
  });

  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [bodyTe, setBodyTe] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [whatsappTo, setWhatsappTo] = React.useState('');

  React.useEffect(() => {
    if (letter) {
      setSubject(letter.subject);
      setBody(letter.body);
      setBodyTe(letter.bodyTe ?? '');
    }
  }, [letter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['letter', id] });
    qc.invalidateQueries({ queryKey: ['letters'] });
    qc.invalidateQueries({ queryKey: ['letter-stats'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => updateLetter(id, { subject, body, bodyTe: bodyTe || undefined }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Letter updated' });
    },
    onError: (e) => toast({ title: 'Update failed', description: apiError(e), variant: 'destructive' }),
  });

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeLetter(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Letter finalized', description: 'Official PDF generated on the letterhead.' });
    },
    onError: (e) => toast({ title: 'Finalize failed', description: apiError(e), variant: 'destructive' }),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const channels: string[] = [];
      if (emailTo.trim()) channels.push('email');
      if (whatsappTo.trim()) channels.push('whatsapp');
      return sendLetter(id, {
        channels,
        emailTo: emailTo.trim() || undefined,
        whatsappTo: whatsappTo.trim() || undefined,
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Letter dispatched', description: 'Unconfigured channels are simulated and logged.' });
    },
    onError: (e) => toast({ title: 'Send failed', description: apiError(e), variant: 'destructive' }),
  });

  if (isLoading) return <PageLoader />;
  if (!letter) return <EmptyState title="Letter not found" description="It may have been deleted." />;

  const dirty =
    subject !== letter.subject || body !== letter.body || (bodyTe || '') !== (letter.bodyTe ?? '');

  return (
    <>
      <PageHeader
        title={letter.refNo}
        description={LETTER_TYPE_LABELS[letter.type] ?? letter.type}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={letter.status} />
            <Button variant="outline" onClick={() => router.push('/letters')}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Letter content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} disabled={!canEdit} />
              </div>
              {letter.language === 'te' || bodyTe ? (
                <div className="space-y-1.5">
                  <Label>Telugu body</Label>
                  <Textarea rows={8} value={bodyTe} onChange={(e) => setBodyTe(e.target.value)} disabled={!canEdit} />
                </div>
              ) : null}
              {canEdit ? (
                <div className="flex items-center gap-3">
                  <Button disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                    <Save className="h-4 w-4" /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                  {letter.status !== 'Draft' && dirty ? (
                    <p className="text-xs text-muted-foreground">
                      Saving edits moves the letter back to Draft and clears the old PDF.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Dispatch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Email to</Label>
                    <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="official@example.gov.in" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp number</Label>
                    <Input value={whatsappTo} onChange={(e) => setWhatsappTo(e.target.value)} placeholder="+91 9xxxxxxxxx" />
                  </div>
                </div>
                <Button
                  disabled={!letter.pdfUrl || (!emailTo.trim() && !whatsappTo.trim()) || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                >
                  <Send className="h-4 w-4" /> {sendMutation.isPending ? 'Sending…' : 'Send letter'}
                </Button>
                {!letter.pdfUrl ? (
                  <p className="text-xs text-muted-foreground">Finalize the letter first to attach the PDF.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit ? (
                <Button
                  className="w-full"
                  disabled={letter.status !== 'Draft' || finalizeMutation.isPending}
                  onClick={() => finalizeMutation.mutate()}
                >
                  <FileCheck2 className="h-4 w-4" />
                  {finalizeMutation.isPending ? 'Generating PDF…' : 'Finalize → PDF'}
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="w-full"
                disabled={!letter.pdfUrl}
                onClick={() => downloadLetterPdf(letter.id, letter.refNo)}
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Addressee" value={`${letter.addresseeName}${letter.addresseeDesignation ? `, ${letter.addresseeDesignation}` : ''}`} />
              <DetailRow label="Language" value={letter.language === 'te' ? 'English + Telugu' : 'English'} />
              <DetailRow label="Department" value={letter.department?.name} />
              <DetailRow label="Official" value={letter.official ? `${letter.official.name} — ${letter.official.designation}` : undefined} />
              {letter.citizen ? (
                <DetailRow
                  label="Citizen"
                  value={
                    <Link href={`/citizens/${letter.citizen.id}`} className="text-primary hover:underline">
                      {letter.citizen.name}
                    </Link>
                  }
                />
              ) : null}
              {letter.grievance ? (
                <DetailRow
                  label="Grievance"
                  value={
                    <Link href={`/grievances/${letter.grievance.id}`} className="text-primary hover:underline">
                      {letter.grievance.code} — {letter.grievance.status}
                    </Link>
                  }
                />
              ) : null}
              <DetailRow label="Created by" value={letter.createdBy?.name} />
              <DetailRow label="Created" value={formatDateTime(letter.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(letter.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  );
}
