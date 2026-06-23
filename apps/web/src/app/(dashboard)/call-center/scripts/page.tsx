'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCallScript, fetchCallScripts } from '@/lib/call-center';
import { useAuth } from '@/lib/auth';

export default function CallCenterScriptsPage() {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('callcenter'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['call-scripts'], queryFn: fetchCallScripts });

  const create = useMutation({
    mutationFn: () => createCallScript({ title, content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-scripts'] }); setTitle(''); setContent(''); },
  });

  return (
    <>
      <PageHeader title="Call Scripts" description="Agent scripts for grievance intake and outreach." />
      {canEdit && (
        <div className="mb-6 max-w-2xl space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
          <div><Label>Content</Label><textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 min-h-32 w-full rounded-md border px-3 py-2 text-sm" /></div>
          <Button disabled={!title || !content || create.isPending} onClick={() => create.mutate()}>Add script</Button>
        </div>
      )}
      {isLoading ? <p>Loading…</p> : (data ?? []).map((s: { id: string; title: string; content: string }) => (
        <div key={s.id} className="mb-4 rounded-lg border p-4">
          <h3 className="font-semibold">{s.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{s.content}</p>
        </div>
      ))}
    </>
  );
}
