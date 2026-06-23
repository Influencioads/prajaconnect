'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { apiError } from '@/lib/api';
import { fetchAdminSettings, updateAdminSettings } from '@/lib/admin';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
];
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'UTC'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const CHANNELS: { key: string; label: string }[] = [
  { key: 'notify_sms', label: 'SMS' },
  { key: 'notify_whatsapp', label: 'WhatsApp' },
  { key: 'notify_email', label: 'Email' },
];

interface FormState {
  default_language: string;
  timezone: string;
  date_format: string;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  notify_email: boolean;
}

const EMPTY: FormState = {
  default_language: 'en', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY',
  notify_sms: true, notify_whatsapp: true, notify_email: true,
};

export function LocalizationTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings });
  const [form, setForm] = React.useState<FormState>(EMPTY);

  React.useEffect(() => {
    if (data?.settings) {
      const m = Object.fromEntries(data.settings.map((s) => [s.key, s.value]));
      setForm((prev) => ({
        default_language: m.default_language ?? prev.default_language,
        timezone: m.timezone ?? prev.timezone,
        date_format: m.date_format ?? prev.date_format,
        notify_sms: (m.notify_sms ?? 'true') === 'true',
        notify_whatsapp: (m.notify_whatsapp ?? 'true') === 'true',
        notify_email: (m.notify_email ?? 'true') === 'true',
      }));
    }
  }, [data]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () =>
      updateAdminSettings([
        { key: 'default_language', value: form.default_language, category: 'localization' },
        { key: 'timezone', value: form.timezone, category: 'localization' },
        { key: 'date_format', value: form.date_format, category: 'localization' },
        { key: 'notify_sms', value: String(form.notify_sms), category: 'notifications' },
        { key: 'notify_whatsapp', value: String(form.notify_whatsapp), category: 'notifications' },
        { key: 'notify_email', value: String(form.notify_email), category: 'notifications' },
      ]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Preferences saved', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Localization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Default language</Label>
            <Select value={form.default_language} onValueChange={(v) => set('default_language', v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={(v) => set('timezone', v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date format</Label>
            <Select value={form.date_format} onValueChange={(v) => set('date_format', v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification channels</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {CHANNELS.map((ch) => {
            const on = form[ch.key as keyof FormState] as boolean;
            return (
              <div key={ch.key} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">{ch.label}</span>
                <button type="button" disabled={!canEdit}
                  onClick={() => set(ch.key as keyof FormState, !on as never)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    on ? 'bg-primary' : 'bg-muted',
                    !canEdit && 'opacity-60',
                  )}>
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    on ? 'translate-x-5' : 'translate-x-0.5',
                  )} />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="lg:col-span-2">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
