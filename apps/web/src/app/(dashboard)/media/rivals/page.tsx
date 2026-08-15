'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createRival,
  deleteRival,
  fetchRivalMentions,
  fetchRivals,
  fetchRivalTimeline,
  updateRival,
} from '@/lib/social';
import { useAuth } from '@/lib/auth';

export default function MediaRivalsPage() {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', party: '', aliases: '' });
  const [selected, setSelected] = React.useState<string | null>(null);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data: rivals, isLoading } = useQuery({ queryKey: ['rivals'], queryFn: fetchRivals });

  const { data: timeline } = useQuery({
    queryKey: ['rival-timeline', selected],
    queryFn: () => fetchRivalTimeline(selected as string),
    enabled: Boolean(selected),
  });

  const { data: mentions } = useQuery({
    queryKey: ['rival-mentions', selected],
    queryFn: () => fetchRivalMentions({ page: 1, limit: 10, rivalId: selected ?? undefined }),
    enabled: Boolean(selected),
  });

  const create = useMutation({
    mutationFn: () =>
      createRival({
        name: form.name,
        party: form.party || undefined,
        aliases: form.aliases.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rivals'] });
      setShowForm(false);
      setForm({ name: '', party: '', aliases: '' });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateRival(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rivals'] }),
  });

  const remove = useMutation({
    mutationFn: deleteRival,
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['rivals'] });
      if (selected === id) setSelected(null);
    },
  });

  const maxTotal = Math.max(1, ...(timeline?.weeks ?? []).map((w) => w.total));

  return (
    <>
      <PageHeader
        title="Rival Tracking"
        description="Rival leaders detected in every news cycle, with weekly sentiment timelines."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/media">Media Dashboard</Link></Button>
            {canEdit && <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Rival'}</Button>}
          </div>
        }
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Party (optional)</Label><Input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} /></div>
          <div>
            <Label>Aliases (comma separated)</Label>
            <Input value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder="e.g. nicknames, initials" />
          </div>
          <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>Save</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Mentions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
              ) : (rivals ?? []).map((r) => (
                <TableRow
                  key={r.id}
                  className={selected === r.id ? 'bg-muted/50' : 'cursor-pointer'}
                  onClick={() => setSelected(r.id)}
                >
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    {r.aliases.length > 0 && (
                      <p className="text-xs text-muted-foreground">aka {r.aliases.join(', ')}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{r.party ?? '—'}</TableCell>
                  <TableCell className="text-sm">{r._count?.mentions ?? 0}</TableCell>
                  <TableCell><StatusBadge status={r.active ? 'Active' : 'Inactive'} /></TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: r.id, active: !r.active })}>
                          {r.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove.mutate(r.id)}>Delete</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold">
              {timeline ? `Sentiment timeline — ${timeline.rival.name} (last 12 weeks)` : 'Select a rival to see the timeline'}
            </h3>
            {timeline && timeline.weeks.length === 0 && (
              <p className="text-sm text-muted-foreground">No mentions recorded yet.</p>
            )}
            <div className="space-y-2">
              {(timeline?.weeks ?? []).map((w) => (
                <div key={w.weekStart} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 text-muted-foreground">{w.weekStart}</span>
                  <div className="flex h-3 flex-1 overflow-hidden rounded bg-muted">
                    <div className="bg-green-500" style={{ width: `${(w.positive / maxTotal) * 100}%` }} />
                    <div className="bg-gray-400" style={{ width: `${(w.neutral / maxTotal) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(w.negative / maxTotal) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-muted-foreground">
                    +{w.positive} / {w.neutral} / -{w.negative}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Recent mentions</h3>
              <div className="space-y-2">
                {(mentions?.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No mentions yet.</p>
                )}
                {(mentions?.data ?? []).map((m) => (
                  <div key={m.id} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{m.article.title}</span>
                      <StatusBadge status={m.sentiment} />
                    </div>
                    {m.quote && <p className="mt-1 text-xs italic text-muted-foreground">“{m.quote}”</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.article.source ?? 'Unknown source'} · {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
