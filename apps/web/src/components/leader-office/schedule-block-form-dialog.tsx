'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LeaderScheduleBlock } from '@praja/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { createScheduleBlock, updateScheduleBlock, toLocalDatetime } from '@/lib/leader-office';

interface FormState {
  title: string;
  startAt: string;
  endAt: string;
}

function toForm(block?: LeaderScheduleBlock | null): FormState {
  return {
    title: block?.title ?? '',
    startAt: toLocalDatetime(block?.startAt),
    endAt: toLocalDatetime(block?.endAt),
  };
}

export function ScheduleBlockFormDialog({
  open,
  onOpenChange,
  block,
  defaultStartAt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block?: LeaderScheduleBlock | null;
  defaultStartAt?: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = Boolean(block?.id);
  const [form, setForm] = React.useState<FormState>(toForm(block));

  React.useEffect(() => {
    if (open) {
      const base = toForm(block);
      if (!block && defaultStartAt) {
        base.startAt = toLocalDatetime(defaultStartAt);
        const end = new Date(defaultStartAt);
        end.setHours(end.getHours() + 1);
        base.endAt = toLocalDatetime(end.toISOString());
      }
      setForm(base);
    }
  }, [open, block, defaultStartAt]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid = form.title.trim().length >= 2 && form.startAt && form.endAt;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      };
      if (isEdit && block) {
        return updateScheduleBlock(block.id, payload);
      }
      return createScheduleBlock(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-schedule'] });
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      toast({ title: isEdit ? 'Schedule block updated' : 'Schedule block created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Save failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit schedule block' : 'New schedule block'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Meeting, travel, event…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startAt">Start</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => set('startAt', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => set('endAt', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
