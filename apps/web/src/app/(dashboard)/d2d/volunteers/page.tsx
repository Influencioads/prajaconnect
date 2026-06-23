'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { fetchCadre, fetchGeoOptions } from '@/lib/crm';
import { assignD2DSurvey, fetchD2DAssignments, fetchD2DSurveys } from '@/lib/d2d';

export default function D2DVolunteersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [surveyId, setSurveyId] = React.useState('');
  const [cadreId, setCadreId] = React.useState('');
  const [mandalId, setMandalId] = React.useState('');
  const [villageId, setVillageId] = React.useState('');
  const [boothId, setBoothId] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [dailyTarget, setDailyTarget] = React.useState(10);

  const { data: surveys } = useQuery({
    queryKey: ['d2d-surveys', { limit: 50 }],
    queryFn: () => fetchD2DSurveys({ limit: 50 }),
  });
  const { data: geo } = useQuery({ queryKey: ['geo-options'], queryFn: fetchGeoOptions });
  const { data: cadres } = useQuery({
    queryKey: ['cadre-list-assign'],
    queryFn: () => fetchCadre({ limit: 100 }),
  });
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['d2d-assignments'],
    queryFn: () => fetchD2DAssignments({ limit: 50 }),
  });

  const assignMut = useMutation({
    mutationFn: () =>
      assignD2DSurvey(surveyId, { cadreId, mandalId, villageId, boothId, street, dailyTarget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['d2d-assignments'] });
      toast({ title: 'Volunteer assigned', variant: 'success' });
    },
    onError: () => toast({ title: 'Assignment failed', variant: 'error' }),
  });

  const villages = (geo?.villages ?? []).filter((v) => !mandalId || v.mandalId === mandalId);
  const booths = (geo?.booths ?? []).filter((b) => !villageId || b.villageId === villageId);

  return (
    <>
      <PageHeader title="Volunteer Assignment" description="Assign surveys to cadre by mandal, village, booth and street with daily targets." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Assign Survey</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Survey</Label>
              <Select value={surveyId} onValueChange={setSurveyId}>
                <SelectTrigger><SelectValue placeholder="Select survey" /></SelectTrigger>
                <SelectContent>
                  {(surveys?.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cadre / Volunteer</Label>
              <Select value={cadreId} onValueChange={setCadreId}>
                <SelectTrigger><SelectValue placeholder="Select cadre" /></SelectTrigger>
                <SelectContent>
                  {(cadres?.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.designation}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mandal</Label>
                <Select value={mandalId} onValueChange={setMandalId}>
                  <SelectTrigger><SelectValue placeholder="Mandal" /></SelectTrigger>
                  <SelectContent>
                    {(geo?.mandals ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Village</Label>
                <Select value={villageId} onValueChange={setVillageId}>
                  <SelectTrigger><SelectValue placeholder="Village" /></SelectTrigger>
                  <SelectContent>
                    {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Booth</Label>
                <Select value={boothId} onValueChange={setBoothId}>
                  <SelectTrigger><SelectValue placeholder="Booth" /></SelectTrigger>
                  <SelectContent>
                    {booths.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Street / Ward</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ward 1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daily Target (houses)</Label>
              <Input type="number" value={dailyTarget} onChange={(e) => setDailyTarget(Number(e.target.value))} />
            </div>
            <Button variant="gold" onClick={() => assignMut.mutate()} disabled={!surveyId || !cadreId || assignMut.isPending}>
              Assign Volunteer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-gold" /> Field Team Leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(assignments?.leaderboard ?? []).map((v, i) => (
              <div key={v.userId} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="font-medium">#{i + 1} {v.name}</span>
                <span className="text-sm text-navy">{v.completed} completed</span>
              </div>
            ))}
            {!assignments?.leaderboard?.length && <p className="text-sm text-muted-foreground">No performance data yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Current Assignments</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
            <div className="space-y-3">
              {((assignments?.data ?? []) as { id: string; survey?: { name: string }; cadre?: { name: string }; user?: { name: string }; dailyTarget: number; street?: string }[]).map((a) => (
                <div key={a.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-4 text-sm">
                  <div>
                    <p className="font-medium">{a.survey?.name}</p>
                    <p className="text-muted-foreground">{a.cadre?.name ?? a.user?.name} — {a.street ?? 'All streets'}</p>
                  </div>
                  <span className="font-semibold text-navy">Target: {a.dailyTarget}/day</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
