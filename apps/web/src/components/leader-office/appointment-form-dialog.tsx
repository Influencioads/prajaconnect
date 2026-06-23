'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppointmentRequest, AppointmentStatus } from '@praja/types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { createAppointment, updateAppointment, toLocalDatetime } from '@/lib/leader-office';

const STATUSES: AppointmentStatus[] = ['Pending', 'Approved', 'Rejected', 'Completed'];

interface FormState {
  visitorName: string;
  mobile: string;
  purpose: string;
  scheduledAt: string;
  status: AppointmentStatus;
}

function toForm(a?: AppointmentRequest | null): FormState {
  return {
    visitorName: a?.visitorName ?? '',
    mobile: a?.mobile ?? '',
    purpose: a?.purpose ?? '',
    scheduledAt: toLocalDatetime(a?.scheduledAt),
    status: a?.status ?? 'Pending',
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  defaultScheduledAt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: AppointmentRequest | null;
  defaultScheduledAt?: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = Boolean(appointment?.id);
  const [form, setForm] = React.useState<FormState>(toForm(appointment));

  React.useEffect(() => {
    if (open) {
      const base = toForm(appointment);
      if (!appointment && defaultScheduledAt) {
        base.scheduledAt = toLocalDatetime(defaultScheduledAt);
      }
      setForm(base);
    }
  }, [open, appointment, defaultScheduledAt]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid = form.visitorName.trim().length >= 2 && form.purpose.trim().length >= 3;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        visitorName: form.visitorName.trim(),
        mobile: form.mobile.trim() || undefined,
        purpose: form.purpose.trim(),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        ...(isEdit ? { status: form.status } : {}),
      };
      if (isEdit && appointment) {
        return updateAppointment(appointment.id, payload);
      }
      return createAppointment(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leader-appointments'] });
      qc.invalidateQueries({ queryKey: ['leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['leader-office-dashboard'] });
      if (appointment?.id) {
        qc.invalidateQueries({ queryKey: ['leader-appointment', appointment.id] });
      }
      toast({ title: isEdit ? 'Appointment updated' : 'Appointment created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Save failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit appointment' : 'New appointment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitorName">Visitor name</Label>
            <Input
              id="visitorName"
              value={form.visitorName}
              onChange={(e) => set('visitorName', e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              value={form.mobile}
              onChange={(e) => set('mobile', e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={form.purpose}
              onChange={(e) => set('purpose', e.target.value)}
              placeholder="Reason for visit"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled date & time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
            />
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
