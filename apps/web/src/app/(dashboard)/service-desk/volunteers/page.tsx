'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  assignVolunteerTask,
  fetchVolunteerLeaderboard,
  fetchVolunteerProfiles,
  logVolunteerHours,
  type VolunteerProfile,
} from '@/lib/service-desk';
import { useAuth } from '@/lib/auth';

export default function VolunteersPage() {
  const [skills, setSkills] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [taskFor, setTaskFor] = React.useState<VolunteerProfile | null>(null);
  const [hoursFor, setHoursFor] = React.useState<VolunteerProfile | null>(null);
  const [task, setTask] = React.useState({ title: '', description: '', dueAt: '' });
  const [hours, setHours] = React.useState({ hours: '', note: '' });
  const [message, setMessage] = React.useState<string | null>(null);

  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('servicedesk'));
  const qc = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['volunteer-profiles', skills, search],
    queryFn: () => fetchVolunteerProfiles({ skills: skills || undefined, search: search || undefined, limit: 50 }),
  });
  const { data: leaderboard } = useQuery({
    queryKey: ['volunteer-leaderboard'],
    queryFn: () => fetchVolunteerLeaderboard(20),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['volunteer-profiles'] });
    qc.invalidateQueries({ queryKey: ['volunteer-leaderboard'] });
  };

  const assign = useMutation({
    mutationFn: () =>
      assignVolunteerTask(taskFor!.id, {
        title: task.title,
        description: task.description || undefined,
        dueAt: task.dueAt || undefined,
      }),
    onSuccess: (res) => {
      setMessage(res.note ?? 'Task assigned.');
      setTaskFor(null);
      setTask({ title: '', description: '', dueAt: '' });
      refresh();
    },
  });

  const log = useMutation({
    mutationFn: () => logVolunteerHours(hoursFor!.id, { hours: Number(hours.hours), note: hours.note || undefined }),
    onSuccess: (p) => {
      setMessage(`${p.registration.name} now has ${p.totalHours}h and ${p.points} points.`);
      setHoursFor(null);
      setHours({ hours: '', note: '' });
      refresh();
    },
  });

  const rows = profiles?.data ?? [];

  return (
    <>
      <PageHeader
        title="Volunteers"
        description="Approved volunteers, their skills, logged hours and points."
      />
      {message && <p className="mb-4 text-xs text-muted-foreground">{message}</p>}

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              className="w-64"
              placeholder="Search name, mobile, village…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              className="w-64"
              placeholder="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No volunteer profiles yet — approve a registration in Public Portal to create one.
                    </TableCell>
                  </TableRow>
                ) : rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.registration.name}
                      <span className="block text-xs text-muted-foreground">{p.registration.mobile}</span>
                    </TableCell>
                    <TableCell className="text-sm">{p.registration.village ?? '—'}</TableCell>
                    <TableCell className="text-sm">{p.skills.length ? p.skills.join(', ') : '—'}</TableCell>
                    <TableCell className="text-sm">{p.totalHours}</TableCell>
                    <TableCell className="text-sm font-semibold">{p.points}</TableCell>
                    <TableCell><StatusBadge status={p.active ? 'Active' : 'Inactive'} /></TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setTaskFor(p)}>Assign task</Button>
                          <Button size="sm" variant="outline" onClick={() => setHoursFor(p)}>Log hours</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leaderboard ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.rank}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-sm">{r.village ?? '—'}</TableCell>
                    <TableCell className="text-sm">{r.totalHours}</TableCell>
                    <TableCell className="font-semibold">{r.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!taskFor} onOpenChange={(o) => !o && setTaskFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign task</DialogTitle>
            <DialogDescription>{taskFor?.registration.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={task.dueAt} onChange={(e) => setTask({ ...task, dueAt: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={task.title.length < 2 || assign.isPending} onClick={() => assign.mutate()}>
              {assign.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hoursFor} onOpenChange={(o) => !o && setHoursFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log hours</DialogTitle>
            <DialogDescription>{hoursFor?.registration.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Hours</Label><Input type="number" min="0.1" step="0.5" value={hours.hours} onChange={(e) => setHours({ ...hours, hours: e.target.value })} /></div>
            <div><Label>Note (also logs a completed activity)</Label><Textarea rows={2} value={hours.note} onChange={(e) => setHours({ ...hours, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!Number(hours.hours) || log.isPending} onClick={() => log.mutate()}>
              {log.isPending ? 'Saving…' : 'Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
