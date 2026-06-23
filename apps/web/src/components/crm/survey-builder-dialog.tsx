'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
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
import { createSurvey } from '@/lib/crm';

type QType = 'single' | 'rating' | 'text';
interface DraftQuestion {
  id: string;
  type: QType;
  text: string;
  options: string;
}

function newQuestion(): DraftQuestion {
  return { id: `q${Date.now()}${Math.floor(Math.random() * 1000)}`, type: 'single', text: '', options: '' };
}

export function SurveyBuilderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('Draft');
  const [questions, setQuestions] = React.useState<DraftQuestion[]>([newQuestion()]);

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setStatus('Draft');
      setQuestions([newQuestion()]);
    }
  }, [open]);

  const updateQ = (id: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const mutation = useMutation({
    mutationFn: () =>
      createSurvey({
        title,
        description: description || undefined,
        status,
        questions: questions
          .filter((q) => q.text.trim())
          .map((q) => ({
            id: q.id,
            type: q.type,
            text: q.text.trim(),
            ...(q.type === 'single'
              ? { options: q.options.split(',').map((o) => o.trim()).filter(Boolean) }
              : {}),
          })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] });
      qc.invalidateQueries({ queryKey: ['survey-stats'] });
      toast({ title: 'Survey created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid =
    title.trim().length >= 3 &&
    questions.some((q) => q.text.trim()) &&
    questions.every((q) => (q.type === 'single' ? q.options.trim().length > 0 : true) || !q.text.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create survey</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Constituency development priorities" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Draft', 'Active', 'Closed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
                <Plus className="h-4 w-4" /> Add question
              </Button>
            </div>
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                  <Select value={q.type} onValueChange={(v) => updateQ(q.id, { type: v as QType })}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single choice</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-red-600"
                      onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input value={q.text} onChange={(e) => updateQ(q.id, { text: e.target.value })} placeholder="Question text" />
                {q.type === 'single' && (
                  <Input
                    value={q.options}
                    onChange={(e) => updateQ(q.id, { options: e.target.value })}
                    placeholder="Comma-separated options (Roads, Water, Health)"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Creating…' : 'Create survey'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
