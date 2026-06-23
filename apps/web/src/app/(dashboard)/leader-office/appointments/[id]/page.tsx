'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Check, X, CircleCheck } from 'lucide-react';
import type { AppointmentStatus } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { AppointmentFormDialog } from '@/components/leader-office/appointment-form-dialog';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { deleteAppointment, fetchLeaderAppointment, updateAppointment } from '@/lib/leader-office';
import { formatDate } from '@/lib/utils';

export default function LeaderAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('leaderoffice'));
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = React.useState(false);

  const { data: a, isLoading, isError } = useQuery({
    queryKey: ['leader-appointment', id],
    queryFn: () => fetchLeaderAppointment(id),
  });

  const statusMut = useMutation({
    mutationFn: (next: AppointmentStatus) => updateAppointment(id, { status: next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-appointment', id] });
      qc.invalidateQueries({ queryKey: ['leader-appointments'] });
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Update failed', description: apiError(err), variant: 'error' }),
  });

  const del = useMutation({
    mutationFn: () => deleteAppointment(id),
    onSuccess: () => {
      toast({ title: 'Appointment removed', variant: 'success' });
      router.push('/leader-office/appointments');
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading appointment…" />;
  if (isError || !a) return <EmptyState title="Appointment not found" />;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/leader-office/appointments')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={a.visitorName}
        description={a.purpose}
        actions={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              {a.status === 'Pending' && (
                <>
                  <Button variant="outline" onClick={() => statusMut.mutate('Approved')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => statusMut.mutate('Rejected')}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </>
              )}
              {a.status === 'Approved' && (
                <Button variant="outline" onClick={() => statusMut.mutate('Completed')}>
                  <CircleCheck className="h-4 w-4" /> Mark completed
                </Button>
              )}
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Remove appointment for ${a.visitorName}?`)) del.mutate();
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" /> Delete
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Details <StatusBadge status={a.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Visitor" value={a.visitorName} />
          <Row label="Mobile" value={a.mobile ?? '—'} />
          <Row label="Purpose" value={a.purpose} />
          <Row
            label="Scheduled"
            value={a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : 'Not scheduled'}
          />
          <Row label="Requested" value={formatDate(a.createdAt)} />
        </CardContent>
      </Card>

      <AppointmentFormDialog open={editOpen} onOpenChange={setEditOpen} appointment={a} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-border/50 py-2 last:border-0">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
