'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { fetchCitizens, fetchGrievances } from '@/lib/crm';
import {
  createLetter,
  draftLetter,
  fetchLetterOptions,
  LETTER_TYPE_LABELS,
} from '@/lib/letters';

const NONE = '__none__';

export default function NewLetterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [type, setType] = React.useState('department');
  const [language, setLanguage] = React.useState('en');
  const [addresseeName, setAddresseeName] = React.useState('');
  const [addresseeDesignation, setAddresseeDesignation] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState(NONE);
  const [officialId, setOfficialId] = React.useState(NONE);
  const [citizen, setCitizen] = React.useState<{ id: string; name: string } | null>(null);
  const [grievance, setGrievance] = React.useState<{ id: string; code: string; title: string } | null>(null);
  const [pointsText, setPointsText] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [bodyTe, setBodyTe] = React.useState('');

  const { data: opts } = useQuery({ queryKey: ['letter-options'], queryFn: fetchLetterOptions });

  const points = pointsText
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const linkedIds = {
    departmentId: departmentId === NONE ? undefined : departmentId,
    officialId: officialId === NONE ? undefined : officialId,
    citizenId: citizen?.id,
    grievanceId: grievance?.id,
  };

  const draftMutation = useMutation({
    mutationFn: () =>
      draftLetter({
        type,
        language,
        points,
        addresseeName,
        addresseeDesignation: addresseeDesignation || undefined,
        ...linkedIds,
      }),
    onSuccess: (d) => {
      setSubject(d.subject);
      setBody(d.body);
      setBodyTe(d.bodyTe ?? '');
      toast({
        title: d.aiGenerated ? 'Draft generated with AI' : 'Template draft generated',
        description: d.aiGenerated ? undefined : 'AI is not configured; a structured template was used.',
      });
    },
    onError: (e) => toast({ title: 'Draft failed', description: apiError(e), variant: 'destructive' }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createLetter({
        type,
        language,
        subject,
        body,
        bodyTe: bodyTe || undefined,
        addresseeName,
        addresseeDesignation: addresseeDesignation || undefined,
        ...linkedIds,
      }),
    onSuccess: (letter) => {
      toast({ title: 'Letter saved', description: `Reference ${letter.refNo}` });
      router.push(`/letters/${letter.id}`);
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'destructive' }),
  });

  const selectOfficial = (id: string) => {
    setOfficialId(id);
    if (id === NONE) return;
    const official = opts?.officials.find((o) => o.id === id);
    if (official) {
      setAddresseeName(official.name);
      setAddresseeDesignation(official.designation);
      if (official.departmentId) setDepartmentId(official.departmentId);
    }
  };

  const canDraft = points.length > 0 && addresseeName.trim().length >= 2;
  const canSave = subject.trim().length >= 3 && body.trim().length >= 10 && addresseeName.trim().length >= 2;

  return (
    <>
      <PageHeader
        title="New Letter"
        description="Pick a type, link real records, list your points and let AI draft the letter."
        actions={
          <Button variant="outline" onClick={() => router.push('/letters')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Letter setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="te">English + Telugu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Official (from directory)</Label>
              <Select value={officialId} onValueChange={selectOfficial}>
                <SelectTrigger><SelectValue placeholder="Pick an official (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(opts?.officials ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name} — {o.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Addressee name *</Label>
                <Input value={addresseeName} onChange={(e) => setAddresseeName(e.target.value)} placeholder="e.g. Sri K. Ramarao" />
              </div>
              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Input value={addresseeDesignation} onChange={(e) => setAddresseeDesignation(e.target.value)} placeholder="e.g. District Collector" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Department (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(opts?.departments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <RecordPicker
              label="Linked citizen"
              placeholder="Search citizens by name…"
              selected={citizen ? citizen.name : null}
              onClear={() => setCitizen(null)}
              search={async (q) => {
                const res = await fetchCitizens({ search: q, limit: 5 });
                return res.data.map((c) => ({ id: c.id, label: c.name, sub: c.mobile ?? undefined }));
              }}
              onSelect={(r) => setCitizen({ id: r.id, name: r.label })}
            />

            <RecordPicker
              label="Linked grievance"
              placeholder="Search grievances by code or title…"
              selected={grievance ? `${grievance.code} — ${grievance.title}` : null}
              onClear={() => setGrievance(null)}
              search={async (q) => {
                const res = await fetchGrievances({ search: q, limit: 5 });
                return res.data.map((g) => ({ id: g.id, label: `${g.code} — ${g.title}`, sub: g.status }));
              }}
              onSelect={(r) => {
                const [code, ...rest] = r.label.split(' — ');
                setGrievance({ id: r.id, code, title: rest.join(' — ') });
              }}
            />

            <div className="space-y-1.5">
              <Label>Key points (one per line) *</Label>
              <Textarea
                rows={5}
                value={pointsText}
                onChange={(e) => setPointsText(e.target.value)}
                placeholder={'Request road repair on the main village stretch\nPending since June despite complaints\nMonsoon is worsening the damage'}
              />
            </div>

            <Button
              className="w-full"
              disabled={!canDraft || draftMutation.isPending}
              onClick={() => draftMutation.mutate()}
            >
              <Sparkles className="h-4 w-4" />
              {draftMutation.isPending ? 'Drafting…' : 'Draft with AI'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Preview & edit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Letter subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Draft with AI, or write the letter body yourself…"
              />
            </div>
            {language === 'te' ? (
              <div className="space-y-1.5">
                <Label>Telugu body</Label>
                <Textarea
                  rows={8}
                  value={bodyTe}
                  onChange={(e) => setBodyTe(e.target.value)}
                  placeholder="Telugu translation (filled automatically when AI is configured)"
                />
              </div>
            ) : null}
            <Button
              className="w-full"
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving…' : 'Save letter'}
            </Button>
            <p className="text-xs text-muted-foreground">
              After saving you can finalize the letter to generate the official PDF on the letterhead.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface PickerResult {
  id: string;
  label: string;
  sub?: string;
}

function RecordPicker({
  label,
  placeholder,
  selected,
  onClear,
  onSelect,
  search,
}: {
  label: string;
  placeholder: string;
  selected: string | null;
  onClear: () => void;
  onSelect: (r: PickerResult) => void;
  search: (q: string) => Promise<PickerResult[]>;
}) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<PickerResult[]>([]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await search(query.trim());
        if (!cancelled) setResults(r);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (selected) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="truncate">{selected}</span>
          <button type="button" onClick={onClear} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
      {results.length > 0 ? (
        <div className="rounded-md border">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(r);
                setQuery('');
                setResults([]);
              }}
            >
              <span className="truncate">{r.label}</span>
              {r.sub ? <span className="ml-2 shrink-0 text-xs text-muted-foreground">{r.sub}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
