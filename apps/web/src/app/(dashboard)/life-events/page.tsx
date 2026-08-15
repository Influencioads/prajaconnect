'use client';

import * as React from 'react';
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
import {
  GREETING_OCCASIONS,
  approveGreeting,
  bulkSendGreetings,
  createCondolence,
  createGreetingTemplate,
  deleteCondolence,
  deleteGreetingTemplate,
  fetchCondolences,
  fetchGreetingTemplates,
  fetchLifeEventsToday,
  fetchLifeEventsUpcoming,
  runLifeEventsScan,
  sendGreeting,
  skipGreeting,
  updateGreetingTemplate,
} from '@/lib/life-events';

export default function LifeEventsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('lifeevents'));
  const qc = useQueryClient();
  const invalidateToday = () => qc.invalidateQueries({ queryKey: ['life-events-today'] });

  const { data: today, isLoading } = useQuery({
    queryKey: ['life-events-today'],
    queryFn: fetchLifeEventsToday,
  });
  const { data: upcoming } = useQuery({
    queryKey: ['life-events-upcoming'],
    queryFn: () => fetchLifeEventsUpcoming(7),
  });
  const { data: templates } = useQuery({
    queryKey: ['life-events-templates'],
    queryFn: () => fetchGreetingTemplates(),
  });
  const [condolencePage, setCondolencePage] = React.useState(1);
  const { data: condolences } = useQuery({
    queryKey: ['life-events-condolences', condolencePage],
    queryFn: () => fetchCondolences({ page: condolencePage, limit: 20 }),
  });

  const approve = useMutation({ mutationFn: approveGreeting, onSuccess: invalidateToday });
  const skip = useMutation({ mutationFn: skipGreeting, onSuccess: invalidateToday });
  const send = useMutation({ mutationFn: sendGreeting, onSuccess: invalidateToday });
  const bulkSend = useMutation({ mutationFn: () => bulkSendGreetings(), onSuccess: invalidateToday });
  const runScan = useMutation({ mutationFn: runLifeEventsScan, onSuccess: invalidateToday });

  const [templateForm, setTemplateForm] = React.useState({ occasion: 'birthday', language: 'en', body: '' });
  const createTemplate = useMutation({
    mutationFn: createGreetingTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['life-events-templates'] });
      setTemplateForm({ occasion: 'birthday', language: 'en', body: '' });
    },
  });
  const toggleTemplate = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateGreetingTemplate(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-events-templates'] }),
  });
  const removeTemplate = useMutation({
    mutationFn: deleteGreetingTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-events-templates'] }),
  });

  const [condolenceForm, setCondolenceForm] = React.useState({ name: '', date: '', notes: '', mobile: '' });
  const addCondolence = useMutation({
    mutationFn: createCondolence,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['life-events-condolences'] });
      invalidateToday();
      setCondolenceForm({ name: '', date: '', notes: '', mobile: '' });
    },
  });
  const removeCondolence = useMutation({
    mutationFn: deleteCondolence,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-events-condolences'] }),
  });

  const actionable = (today?.items ?? []).filter((i) => i.status === 'Pending' || i.status === 'Approved');

  return (
    <>
      <PageHeader
        title="Life Events"
        description="Birthdays, anniversaries and important dates with auto-generated wishes."
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Button variant="outline" disabled={runScan.isPending} onClick={() => runScan.mutate()}>
                {runScan.isPending ? 'Scanning…' : 'Run scan now'}
              </Button>
              <Button disabled={bulkSend.isPending || actionable.length === 0} onClick={() => bulkSend.mutate()}>
                {bulkSend.isPending ? 'Sending…' : `Approve & send all (${actionable.length})`}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Pending" value={today?.counts.pending ?? 0} />
        <KpiCard label="Approved" value={today?.counts.approved ?? 0} />
        <KpiCard label="Sent" value={today?.counts.sent ?? 0} />
        <KpiCard label="Skipped" value={today?.counts.skipped ?? 0} />
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today&apos;s Queue</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming 7 Days</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="condolences">Condolence Log</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Occasion</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
                ) : (today?.items ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No life events in today&apos;s queue. Run a scan to refresh.</TableCell></TableRow>
                ) : (
                  (today?.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.targetName}</TableCell>
                      <TableCell><StatusBadge status={item.occasion} /></TableCell>
                      <TableCell>{item.targetType}</TableCell>
                      <TableCell>{item.mobile ?? '—'}</TableCell>
                      <TableCell className="max-w-xs truncate" title={item.message}>{item.message}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        {canEdit && (item.status === 'Pending' || item.status === 'Approved') && (
                          <div className="flex gap-1">
                            {item.status === 'Pending' && (
                              <Button size="sm" variant="outline" onClick={() => approve.mutate(item.id)}>Approve</Button>
                            )}
                            <Button size="sm" disabled={send.isPending} onClick={() => send.mutate(item.id)}>Send</Button>
                            <Button size="sm" variant="outline" onClick={() => skip.mutate(item.id)}>Skip</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="space-y-6">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Occasion</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mobile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(upcoming?.events ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No birthdays or anniversaries in the next {upcoming?.days ?? 7} days.</TableCell></TableRow>
                  ) : (
                    (upcoming?.events ?? []).map((e) => (
                      <TableRow key={`${e.targetType}-${e.targetId}-${e.occasion}`}>
                        <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell><StatusBadge status={e.occasion} /></TableCell>
                        <TableCell className="font-medium">{e.targetName}</TableCell>
                        <TableCell>{e.targetType}</TableCell>
                        <TableCell>{e.mobile ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Deadlines (schemes & permissions)</h3>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Reminder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(upcoming?.deadlines ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No scheme deadlines or permission expiries in the next {upcoming?.days ?? 7} days.</TableCell></TableRow>
                    ) : (
                      (upcoming?.deadlines ?? []).map((d) => (
                        <TableRow key={`${d.targetType}-${d.targetId}`}>
                          <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                          <TableCell>{d.targetType}</TableCell>
                          <TableCell className="font-medium">{d.targetName}</TableCell>
                          <TableCell>{d.message}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          {canEdit && (
            <div className="mb-4 max-w-lg space-y-3 rounded-lg border p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Occasion</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={templateForm.occasion}
                    onChange={(e) => setTemplateForm({ ...templateForm, occasion: e.target.value })}
                  >
                    {GREETING_OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <Label>Language</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={templateForm.language}
                    onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Body (use {'{name}'} as placeholder)</Label>
                <Textarea
                  rows={3}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="Dear {name}, wishing you a very happy birthday!"
                />
              </div>
              <Button disabled={!templateForm.body || createTemplate.isPending} onClick={() => createTemplate.mutate(templateForm)}>
                Add Template
              </Button>
            </div>
          )}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Occasion</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(templates ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5}>No templates yet — built-in defaults are used until you add one.</TableCell></TableRow>
                ) : (
                  (templates ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><StatusBadge status={t.occasion} /></TableCell>
                      <TableCell>{t.language === 'te' ? 'Telugu' : 'English'}</TableCell>
                      <TableCell className="max-w-md truncate" title={t.body}>{t.body}</TableCell>
                      <TableCell>{t.active ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => toggleTemplate.mutate({ id: t.id, active: !t.active })}>
                              {t.active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeTemplate.mutate(t.id)}>Delete</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="condolences">
          {canEdit && (
            <div className="mb-4 max-w-lg space-y-3 rounded-lg border p-4">
              <div><Label>Name</Label><Input value={condolenceForm.name} onChange={(e) => setCondolenceForm({ ...condolenceForm, name: e.target.value })} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><Label>Date</Label><Input type="date" value={condolenceForm.date} onChange={(e) => setCondolenceForm({ ...condolenceForm, date: e.target.value })} /></div>
                <div className="flex-1"><Label>Mobile (optional)</Label><Input value={condolenceForm.mobile} onChange={(e) => setCondolenceForm({ ...condolenceForm, mobile: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={condolenceForm.notes} onChange={(e) => setCondolenceForm({ ...condolenceForm, notes: e.target.value })} /></div>
              <Button
                disabled={!condolenceForm.name || addCondolence.isPending}
                onClick={() =>
                  addCondolence.mutate({
                    name: condolenceForm.name,
                    date: condolenceForm.date || undefined,
                    notes: condolenceForm.notes || undefined,
                    mobile: condolenceForm.mobile || undefined,
                  })
                }
              >
                Log Condolence
              </Button>
            </div>
          )}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Citizen</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(condolences?.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5}>No condolence entries.</TableCell></TableRow>
                ) : (
                  (condolences?.data ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.citizen?.name ?? '—'}</TableCell>
                      <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-md truncate" title={c.notes ?? ''}>{c.notes ?? '—'}</TableCell>
                      <TableCell>
                        {canEdit && <Button size="sm" variant="outline" onClick={() => removeCondolence.mutate(c.id)}>Delete</Button>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {condolences?.meta && condolences.meta.totalPages > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={condolencePage <= 1} onClick={() => setCondolencePage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {condolences.meta.page} of {condolences.meta.totalPages}</span>
              <Button size="sm" variant="outline" disabled={condolencePage >= condolences.meta.totalPages} onClick={() => setCondolencePage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
