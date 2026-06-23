'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  D2DQuestionType,
  D2D_SURVEY_TYPE_LABELS,
  D2DSurveyType,
  D2D_QUESTION_TYPE_LABELS,
} from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
import { fetchGeoOptions } from '@/lib/crm';
import { createD2DSurvey, saveD2DQuestions } from '@/lib/d2d';

type QuestionDraft = {
  order: number;
  type: D2DQuestionType;
  label: string;
  labelTe: string;
  required: boolean;
  options: { order: number; label: string; labelTe: string; value: string }[];
};

const CHOICE_TYPES = [
  D2DQuestionType.SingleChoice,
  D2DQuestionType.MultiChoice,
  D2DQuestionType.Dropdown,
];

export function D2DCreateSurveyView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: geo } = useQuery({ queryKey: ['geo-options'], queryFn: fetchGeoOptions });

  const [name, setName] = React.useState('');
  const [nameTe, setNameTe] = React.useState('');
  const [type, setType] = React.useState<D2DSurveyType>(D2DSurveyType.Household);
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [targetMandalId, setTargetMandalId] = React.useState('');
  const [targetVillageId, setTargetVillageId] = React.useState('');
  const [targetBoothId, setTargetBoothId] = React.useState('');
  const [targetHouseholds, setTargetHouseholds] = React.useState(100);
  const [questions, setQuestions] = React.useState<QuestionDraft[]>([
    {
      order: 1,
      type: D2DQuestionType.YesNo,
      label: 'Are you satisfied with civic services?',
      labelTe: 'పౌర సేవలతో మీరు సంతృప్తిగా ఉన్నారా?',
      required: true,
      options: [],
    },
  ]);

  const villages = (geo?.villages ?? []).filter((v) => !targetMandalId || v.mandalId === targetMandalId);
  const booths = (geo?.booths ?? []).filter((b) => !targetVillageId || b.villageId === targetVillageId);

  const createMut = useMutation({
    mutationFn: async () => {
      const survey = await createD2DSurvey({
        name,
        nameTe,
        type,
        description,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        targetMandalId: targetMandalId || undefined,
        targetVillageId: targetVillageId || undefined,
        targetBoothId: targetBoothId || undefined,
        targetHouseholds,
      });
      await saveD2DQuestions(survey.id, questions);
      return survey;
    },
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: ['d2d-surveys'] });
      toast({ title: 'Survey created', variant: 'success' });
      router.push(`/d2d/active?survey=${survey.id}`);
    },
    onError: () => toast({ title: 'Failed to create survey', variant: 'error' }),
  });

  const addQuestion = () => {
    setQuestions((q) => [
      ...q,
      {
        order: q.length + 1,
        type: D2DQuestionType.Text,
        label: '',
        labelTe: '',
        required: false,
        options: [],
      },
    ]);
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionDraft>) => {
    setQuestions((q) => q.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((q) => q.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 })));
  };

  return (
    <>
      <PageHeader
        title="Create D2D Survey"
        description="Build a door-to-door survey with Telugu + English questions and geo targets."
        actions={
          <Button variant="gold" onClick={() => createMut.mutate()} disabled={!name || createMut.isPending}>
            {createMut.isPending ? 'Saving…' : 'Create Survey'}
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Survey Name (English)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Household Sentiment Survey" />
          </div>
          <div className="space-y-2">
            <Label>Survey Name (Telugu)</Label>
            <Input value={nameTe} onChange={(e) => setNameTe(e.target.value)} className="font-[family-name:var(--font-telugu)]" />
          </div>
          <div className="space-y-2">
            <Label>Survey Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as D2DSurveyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.values(D2DSurveyType) as D2DSurveyType[]).map((t) => (
                  <SelectItem key={t} value={t}>{D2D_SURVEY_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Households</Label>
            <Input type="number" value={targetHouseholds} onChange={(e) => setTargetHouseholds(Number(e.target.value))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Target Mandal</Label>
            <Select value={targetMandalId} onValueChange={setTargetMandalId}>
              <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
              <SelectContent>
                {(geo?.mandals ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Village</Label>
            <Select value={targetVillageId} onValueChange={setTargetVillageId}>
              <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
              <SelectContent>
                {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Booth</Label>
            <Select value={targetBoothId} onValueChange={setTargetBoothId}>
              <SelectTrigger><SelectValue placeholder="Select booth" /></SelectTrigger>
              <SelectContent>
                {booths.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Question Builder</h2>
        <Button variant="outline" onClick={addQuestion}><Plus className="h-4 w-4" /> Add Question</Button>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-2">
                <GripVertical className="mt-2 h-4 w-4 text-muted-foreground" />
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Question (English)</Label>
                    <Input value={q.label} onChange={(e) => updateQuestion(idx, { label: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Question (Telugu)</Label>
                    <Input value={q.labelTe} onChange={(e) => updateQuestion(idx, { labelTe: e.target.value })} className="font-[family-name:var(--font-telugu)]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={q.type} onValueChange={(v) => updateQuestion(idx, { type: v as D2DQuestionType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.values(D2DQuestionType) as D2DQuestionType[]).map((t) => (
                          <SelectItem key={t} value={t}>{D2D_QUESTION_TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(idx, { required: e.target.checked })} />
                      Required
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              {CHOICE_TYPES.includes(q.type) && (
                <div className="space-y-2 rounded-lg bg-canvas p-4">
                  <Label>Options</Label>
                  {(q.options.length ? q.options : [{ order: 1, label: 'Option 1', labelTe: '', value: 'opt1' }]).map((opt, oi) => (
                    <div key={oi} className="grid gap-2 md:grid-cols-3">
                      <Input placeholder="Label EN" value={opt.label} onChange={(e) => {
                        const opts = [...(q.options.length ? q.options : [{ order: 1, label: '', labelTe: '', value: 'opt1' }])];
                        opts[oi] = { ...opts[oi], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                        updateQuestion(idx, { options: opts });
                      }} />
                      <Input placeholder="Label TE" value={opt.labelTe} onChange={(e) => {
                        const opts = [...q.options];
                        opts[oi] = { ...opts[oi], labelTe: e.target.value };
                        updateQuestion(idx, { options: opts });
                      }} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateQuestion(idx, { options: [...q.options, { order: q.options.length + 1, label: '', labelTe: '', value: `opt${q.options.length + 1}` }] })}>Add Option</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
