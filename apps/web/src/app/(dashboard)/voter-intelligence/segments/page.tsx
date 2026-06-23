'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createVoterSegment,
  deleteVoterSegment,
  fetchVoterSegments,
  updateVoterSegment,
} from '@/lib/voter-intelligence';
import { useAuth } from '@/lib/auth';

export default function VoterSegmentsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('voterintelligence'));
  const canDelete = accessLevel('voterintelligence') === 'full';
  const qc = useQueryClient();
  const [form, setForm] = React.useState({ name: '', description: '', color: '#003366' });
  const [editId, setEditId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['voter-segments'], queryFn: fetchVoterSegments });

  const save = useMutation({
    mutationFn: () =>
      editId ? updateVoterSegment(editId, form) : createVoterSegment(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voter-segments'] });
      setForm({ name: '', description: '', color: '#003366' });
      setEditId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteVoterSegment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-segments'] }),
  });

  return (
    <>
      <PageHeader title="Voter Segments" description="Create and manage voter segmentation definitions." />
      {canEdit && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Color (#003366)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={() => save.mutate()} disabled={!form.name.trim()}>{editId ? 'Update' : 'Create'}</Button>
              {editId && <Button variant="ghost" onClick={() => { setEditId(null); setForm({ name: '', description: '', color: '#003366' }); }}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p>Loading…</p> : (data ?? []).map((s: {
          id: string; name: string; description?: string | null; color: string; _count?: { profiles: number };
        }) => (
          <Card key={s.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-navy">
                  <span className="h-4 w-4 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(s.id); setForm({ name: s.name, description: s.description ?? '', color: s.color }); }}>Edit</Button>
                    {canDelete && <Button size="sm" variant="ghost" onClick={() => remove.mutate(s.id)}>Delete</Button>}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.description ?? '—'}</p>
              <p className="mt-2 text-sm font-medium">{s._count?.profiles ?? 0} profiles</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
