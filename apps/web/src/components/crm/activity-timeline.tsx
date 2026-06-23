'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { addNetworkActivity, type NetworkActivity, type NetworkResource } from '@/lib/crm';
import { formatDateTime } from '@/lib/utils';

export function ActivityTimeline({
  resource,
  id,
  activity,
  canEdit,
}: {
  resource: NetworkResource;
  id: string;
  activity: NetworkActivity[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [action, setAction] = React.useState('');
  const [note, setNote] = React.useState('');

  const mutation = useMutation({
    mutationFn: () => addNetworkActivity(resource, id, { action, note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['network-detail', resource, id] });
      setAction('');
      setNote('');
      toast({ title: 'Activity logged', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to log activity', description: apiError(err), variant: 'error' }),
  });

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Action (e.g. Called, Met)" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button disabled={action.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>
            <Plus className="h-4 w-4" /> Log
          </Button>
        </div>
      )}

      {!activity.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l pl-5">
          {activity.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[23px] flex h-4 w-4 items-center justify-center rounded-full bg-navy text-white dark:bg-gold">
                <History className="h-2.5 w-2.5" />
              </span>
              <p className="text-sm font-semibold text-foreground">{a.action}</p>
              {a.note && <p className="text-sm text-muted-foreground">{a.note}</p>}
              <p className="text-xs text-muted-foreground">
                {a.byName ? `${a.byName} · ` : ''}
                {formatDateTime(a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
