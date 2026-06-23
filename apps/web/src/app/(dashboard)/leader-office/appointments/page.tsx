'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Check, X, CircleCheck } from 'lucide-react';
import type { AppointmentRequest, AppointmentStatus } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { AppointmentFormDialog } from '@/components/leader-office/appointment-form-dialog';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { deleteAppointment, fetchLeaderAppointments, updateAppointment } from '@/lib/leader-office';

const ALL = '__all__';
const STATUSES: AppointmentStatus[] = ['Pending', 'Approved', 'Rejected', 'Completed'];

export default function LeaderAppointmentsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('leaderoffice'));
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AppointmentRequest | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => setPage(1), [debounced, status]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['leader-appointments', filters],
    queryFn: () => fetchLeaderAppointments(filters),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: AppointmentStatus }) =>
      updateAppointment(id, { status: next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-appointments'] });
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Update failed', description: apiError(err), variant: 'error' }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-appointments'] });
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      toast({ title: 'Appointment removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Visitor appointment requests and schedule."
        actions={
          canEdit ? (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New appointment
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search visitor, purpose, mobile…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : !data?.data.length ? (
            <EmptyState title="No appointments" description="Create a new appointment or adjust filters." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          href={`/leader-office/appointments/${a.id}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {a.visitorName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{a.mobile ?? '—'}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{a.purpose}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : '—'}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {a.status === 'Pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Approve"
                                  onClick={() => statusMut.mutate({ id: a.id, next: 'Approved' })}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reject"
                                  onClick={() => statusMut.mutate({ id: a.id, next: 'Rejected' })}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {a.status === 'Approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Mark completed"
                                onClick={() => statusMut.mutate({ id: a.id, next: 'Completed' })}
                              >
                                <CircleCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditing(a); setFormOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Remove appointment for ${a.visitorName}?`)) del.mutate(a.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.meta && (
                <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AppointmentFormDialog open={formOpen} onOpenChange={setFormOpen} appointment={editing} />
    </>
  );
}
