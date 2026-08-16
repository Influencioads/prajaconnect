'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KpiCard } from '@/components/ui/kpi-card';
import { useAuth } from '@/lib/auth';
import { fetchCadre } from '@/lib/crm';
import {
  INVITATION_CATEGORIES,
  createInvitation,
  decideInvitation,
  deleteInvitation,
  fetchInvitationCalendar,
  fetchInvitations,
  updateInvitation,
  uploadInvitationCard,
  type Invitation,
  type InvitationDecision,
} from '@/lib/protocol';

const DECISION_LABELS: Record<string, string> = {
  Pending: 'Pending',
  Attend: 'Attend',
  SendRepresentative: 'Send representative',
  SendWishes: 'Send wishes',
  Decline: 'Decline',
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ProtocolPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('protocol'));
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['invitations'] });
    qc.invalidateQueries({ queryKey: ['invitation-calendar'] });
  };

  const [decisionFilter, setDecisionFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [month, setMonth] = React.useState(currentMonth);

  const { data: list, isLoading } = useQuery({
    queryKey: ['invitations', decisionFilter, categoryFilter, search, page],
    queryFn: () =>
      fetchInvitations({ decision: decisionFilter, category: categoryFilter, search, page, limit: 20 }),
  });
  const { data: calendar } = useQuery({
    queryKey: ['invitation-calendar', month],
    queryFn: () => fetchInvitationCalendar(month),
  });
  const { data: cadres } = useQuery({
    queryKey: ['protocol-cadre-options'],
    queryFn: () => fetchCadre({ page: 1, limit: 100, status: 'Active' }),
    enabled: canEdit,
  });

  const [repFor, setRepFor] = React.useState<Invitation | null>(null);
  const [repCadreId, setRepCadreId] = React.useState('');

  const decide = useMutation({
    mutationFn: ({ id, decision, cadreId }: { id: string; decision: InvitationDecision; cadreId?: string }) =>
      decideInvitation(id, { decision, cadreId }),
    onSuccess: () => {
      setRepFor(null);
      setRepCadreId('');
      invalidate();
    },
  });
  const remove = useMutation({ mutationFn: deleteInvitation, onSuccess: invalidate });
  const saveGift = useMutation({
    mutationFn: ({ id, giftNotes }: { id: string; giftNotes: string }) => updateInvitation(id, { giftNotes }),
    onSuccess: invalidate,
  });

  const emptyForm = {
    eventName: '',
    host: '',
    eventDate: '',
    venue: '',
    category: 'Other',
    giftNotes: '',
    notes: '',
    cardPhotoUrl: '',
  };
  const [form, setForm] = React.useState(emptyForm);
  const [uploading, setUploading] = React.useState(false);
  const create = useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      setForm(emptyForm);
      invalidate();
    },
  });

  const onPickCard = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadInvitationCard(file);
      setForm((f) => ({ ...f, cardPhotoUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const rows = list?.data ?? [];
  const counts = React.useMemo(() => {
    const items = (calendar?.days ?? []).flatMap((d) => d.items);
    return {
      month: items.length,
      pending: items.filter((i) => i.decision === 'Pending').length,
      attending: items.filter((i) => i.decision === 'Attend').length,
      wishes: items.filter((i) => i.wishSent).length,
    };
  }, [calendar]);

  const [gift, setGift] = React.useState<Record<string, string>>({});

  return (
    <>
      <PageHeader
        title="Invitations & Protocol"
        description="Wedding, function and festival invitations with decisions, representatives and the gift log."
        actions={
          <Button variant="outline" asChild>
            <Link href="/leader-office/appointments">Appointments queue</Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="This month" value={counts.month} />
        <KpiCard label="Awaiting decision" value={counts.pending} />
        <KpiCard label="Attending" value={counts.attending} />
        <KpiCard label="Wishes sent" value={counts.wishes} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Invitations</TabsTrigger>
          <TabsTrigger value="calendar">Month Calendar</TabsTrigger>
          {canEdit && <TabsTrigger value="new">Add Invitation</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="Search event, host or venue…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All decisions</option>
              {Object.entries(DECISION_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {INVITATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Gift log</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Loading…</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>No invitations logged yet.</TableCell>
                  </TableRow>
                ) : (
                  rows.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.eventName}
                        {inv.venue ? <span className="block text-xs text-muted-foreground">{inv.venue}</span> : null}
                      </TableCell>
                      <TableCell>
                        {inv.host}
                        {inv.citizen?.mobile ? (
                          <span className="block text-xs text-muted-foreground">{inv.citizen.mobile}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{new Date(inv.eventDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.category} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.decision} />
                        {inv.decision === 'SendWishes' ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {inv.wishSent ? 'sent' : 'follow-up'}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{inv.representative?.name ?? '—'}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <div className="flex gap-1">
                            <Input
                              className="h-8 w-36"
                              placeholder="Gift / notes"
                              value={gift[inv.id] ?? inv.giftNotes ?? ''}
                              onChange={(e) => setGift({ ...gift, [inv.id]: e.target.value })}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveGift.mutate({ id: inv.id, giftNotes: gift[inv.id] ?? '' })}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          (inv.giftNotes ?? '—')
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit && (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              disabled={decide.isPending}
                              onClick={() => decide.mutate({ id: inv.id, decision: 'Attend' })}
                            >
                              Attend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRepFor(inv);
                                setRepCadreId('');
                              }}
                            >
                              Representative
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={decide.isPending}
                              onClick={() => decide.mutate({ id: inv.id, decision: 'SendWishes' })}
                            >
                              Wishes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={decide.isPending}
                              onClick={() => decide.mutate({ id: inv.id, decision: 'Decline' })}
                            >
                              Decline
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => remove.mutate(inv.id)}>
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {repFor && (
            <div className="mt-4 max-w-lg space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Send a representative to {repFor.eventName}</h3>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={repCadreId}
                onChange={(e) => setRepCadreId(e.target.value)}
              >
                <option value="">Select cadre…</option>
                {(cadres?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.designation}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  disabled={!repCadreId || decide.isPending}
                  onClick={() =>
                    decide.mutate({ id: repFor.id, decision: 'SendRepresentative', cadreId: repCadreId })
                  }
                >
                  Assign & notify
                </Button>
                <Button variant="outline" onClick={() => setRepFor(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {list?.meta && list.meta.totalPages > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {list.meta.page} of {list.meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= list.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="mb-3 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
              Previous
            </Button>
            <span className="text-sm font-semibold">{calendar?.month ?? month}</span>
            <Button size="sm" variant="outline" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
              Next
            </Button>
            <span className="text-sm text-muted-foreground">{calendar?.total ?? 0} invitations</span>
          </div>
          {(calendar?.days ?? []).length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">
              No invitations in this month.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(calendar?.days ?? []).map((day) => (
                <div key={day.date} className="rounded-lg border p-3">
                  <div className="mb-2 text-sm font-semibold">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  {day.items.map((inv) => (
                    <div key={inv.id} className="mb-2 text-sm">
                      <div className="font-medium">{inv.eventName}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.host}
                        {inv.venue ? ` · ${inv.venue}` : ''}
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={inv.decision} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {canEdit && (
          <TabsContent value="new">
            <div className="max-w-lg space-y-3 rounded-lg border p-4">
              <div>
                <Label>Event name</Label>
                <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Host</Label>
                  <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Category</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {INVITATION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Event date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Label>Venue</Label>
                  <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Invitation card photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickCard(e.target.files?.[0] ?? undefined)}
                />
                {uploading ? <p className="mt-1 text-xs text-muted-foreground">Uploading…</p> : null}
                {form.cardPhotoUrl ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{form.cardPhotoUrl}</p>
                ) : null}
              </div>
              <div>
                <Label>Gift notes</Label>
                <Input value={form.giftNotes} onChange={(e) => setForm({ ...form, giftNotes: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button
                disabled={!form.eventName || !form.host || !form.eventDate || create.isPending}
                onClick={() =>
                  create.mutate({
                    eventName: form.eventName,
                    host: form.host,
                    eventDate: new Date(form.eventDate).toISOString(),
                    venue: form.venue || undefined,
                    category: form.category,
                    cardPhotoUrl: form.cardPhotoUrl || undefined,
                    giftNotes: form.giftNotes || undefined,
                    notes: form.notes || undefined,
                  })
                }
              >
                Log Invitation
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
