'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import {
  fetchAdminSettings,
  updateAdminSettings,
  uploadBrandingLogo,
} from '@/lib/admin';
import { PARTIES, PARTY_REGION_LABELS, type PartyRegion } from '@/lib/parties';
import { Logo } from '@/components/layout/logo';

const FIELD_CATEGORY: Record<string, string> = {
  app_name: 'general',
  party: 'org',
  party_full_name: 'branding',
  primary_color: 'branding',
  secondary_color: 'branding',
  accent_color: 'branding',
  logo_url: 'branding',
};

interface BrandingForm {
  app_name: string;
  party: string;
  party_full_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
}

const EMPTY: BrandingForm = {
  app_name: 'Praja Connect',
  party: '',
  party_full_name: '',
  primary_color: '#003366',
  secondary_color: '#FFD600',
  accent_color: '#FFD600',
  logo_url: '',
};

const REGIONS: PartyRegion[] = ['National', 'AP', 'TS', 'KA'];

export function BrandingTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings });
  const [form, setForm] = React.useState<BrandingForm>(EMPTY);

  React.useEffect(() => {
    if (data?.settings) {
      const map = Object.fromEntries(data.settings.map((s) => [s.key, s.value]));
      setForm((prev) => ({
        app_name: map.app_name ?? prev.app_name,
        party: map.party ?? prev.party,
        party_full_name: map.party_full_name ?? prev.party_full_name,
        primary_color: map.primary_color || prev.primary_color,
        secondary_color: map.secondary_color || prev.secondary_color,
        accent_color: map.accent_color || prev.accent_color,
        logo_url: map.logo_url ?? prev.logo_url,
      }));
    }
  }, [data]);

  const set = <K extends keyof BrandingForm>(k: K, v: BrandingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onPickParty = (code: string) => {
    const party = PARTIES.find((p) => p.code === code);
    if (!party) return;
    setForm((f) => ({
      ...f,
      party: party.code,
      party_full_name: party.fullName,
      primary_color: party.colors.primary,
      secondary_color: party.colors.secondary,
      accent_color: party.colors.accent,
    }));
  };

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadBrandingLogo(file),
    onSuccess: (res) => {
      set('logo_url', res.url);
      toast({ title: 'Logo uploaded', description: 'Remember to save changes.', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Upload failed', description: apiError(e), variant: 'error' }),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      updateAdminSettings(
        (Object.keys(form) as (keyof BrandingForm)[]).map((key) => ({
          key,
          value: String(form[key]),
          category: FIELD_CATEGORY[key] ?? 'branding',
        })),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['branding'] });
      toast({ title: 'Branding saved', description: 'Theme updated across the app.', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Branding & Party</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="app_name">Application name</Label>
              <Input id="app_name" value={form.app_name} disabled={!canEdit}
                onChange={(e) => set('app_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Party</Label>
              <Select value={form.party} onValueChange={onPickParty} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select a party" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => {
                    const items = PARTIES.filter((p) => p.regions.includes(region));
                    if (!items.length) return null;
                    return (
                      <SelectGroup key={region}>
                        <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {PARTY_REGION_LABELS[region]}
                        </div>
                        {items.map((p) => (
                          <SelectItem key={`${region}-${p.code}`} value={p.code}>
                            {p.name} — {p.fullName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="party_full_name">Party full name</Label>
              <Input id="party_full_name" value={form.party_full_name} disabled={!canEdit}
                onChange={(e) => set('party_full_name', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField label="Primary" value={form.primary_color} disabled={!canEdit}
              onChange={(v) => set('primary_color', v)} />
            <ColorField label="Secondary" value={form.secondary_color} disabled={!canEdit}
              onChange={(v) => set('secondary_color', v)} />
            <ColorField label="Accent" value={form.accent_color} disabled={!canEdit}
              onChange={(v) => set('accent_color', v)} />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f); }} />
              <Button type="button" variant="outline" disabled={!canEdit || uploadMut.isPending}
                onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMut.isPending ? 'Uploading…' : 'Upload logo'}
              </Button>
              {form.logo_url && canEdit && (
                <Button type="button" variant="ghost" onClick={() => set('logo_url', '')}>Remove</Button>
              )}
            </div>
          </div>

          {canEdit && (
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : 'Save branding'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Live preview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border p-4">
            <Logo />
          </div>
          <div className="flex flex-wrap gap-2">
            <Swatch label="Primary" color={form.primary_color} />
            <Swatch label="Secondary" color={form.secondary_color} />
            <Swatch label="Accent" color={form.accent_color} />
          </div>
          <div className="space-y-2">
            <button className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: form.primary_color }}>Primary button</button>
            <button className="w-full rounded-lg px-3 py-2 text-sm font-semibold"
              style={{ backgroundColor: form.secondary_color }}>Secondary button</button>
          </div>
          <p className="text-xs text-muted-foreground">
            Saving applies these colors across the whole CRM and the login screen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorField({ label, value, onChange, disabled }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded border bg-transparent" />
        <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
      <span className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
