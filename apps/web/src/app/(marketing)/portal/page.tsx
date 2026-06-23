'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { t, type PublicLocale } from '@/lib/i18n/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicPortalPage() {
  const [locale, setLocale] = React.useState<PublicLocale>('en');
  const [ref, setRef] = React.useState('');
  const [trackResult, setTrackResult] = React.useState<Record<string, unknown> | null>(null);
  const [grievanceForm, setGrievanceForm] = React.useState({ reportedByName: '', reportedByMobile: '', title: '', description: '' });
  const [feedbackForm, setFeedbackForm] = React.useState({ name: '', mobile: '', message: '' });
  const [volunteerForm, setVolunteerForm] = React.useState({ name: '', mobile: '', village: '' });
  const [eventForm, setEventForm] = React.useState({ eventId: '', name: '', mobile: '' });
  const [otpMobile, setOtpMobile] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [eligibility, setEligibility] = React.useState({ age: '', income: '', occupation: '', hasSchoolChild: false, ownsHouse: false });
  const [submittedRef, setSubmittedRef] = React.useState('');
  const [eligibilityResult, setEligibilityResult] = React.useState<{ schemes: Array<{ name: string; eligible: boolean; reasons: string[] }> } | null>(null);

  const { data: events } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => (await api.get('/public-portal/events')).data,
  });

  const submitGrievance = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/public-portal/grievances', grievanceForm);
      return data;
    },
    onSuccess: (data) => setSubmittedRef(data.code ?? data.id),
  });

  const submitFeedback = useMutation({
    mutationFn: async () => (await api.post('/public-portal/feedback', feedbackForm)).data,
  });

  const registerVolunteer = useMutation({
    mutationFn: async () => (await api.post('/public-portal/volunteers', volunteerForm)).data,
  });

  const registerEvent = useMutation({
    mutationFn: async () => (await api.post('/public-portal/event-registrations', eventForm)).data,
  });

  const requestOtp = useMutation({
    mutationFn: async () => (await api.post('/public-portal/auth/otp-request', { mobile: otpMobile })).data,
  });

  const verifyOtp = useMutation({
    mutationFn: async () => (await api.post('/public-portal/auth/otp-verify', { mobile: otpMobile, code: otpCode })).data,
  });

  const track = async () => {
    const { data } = await api.get(`/public-portal/grievances/${ref}`);
    setTrackResult(data);
  };

  const checkEligibility = async () => {
    const { data } = await api.get('/public-portal/schemes/eligibility-check', {
      params: {
        age: eligibility.age || undefined,
        income: eligibility.income || undefined,
        occupation: eligibility.occupation || undefined,
        hasSchoolChild: eligibility.hasSchoolChild,
        ownsHouse: eligibility.ownsHouse,
      },
    });
    setEligibilityResult(data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12 px-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center gap-2">
          <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('en')}>English</Button>
          <Button variant={locale === 'te' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('te')}>తెలుగు</Button>
        </div>
        <h1 className="text-3xl font-bold text-navy">{t(locale, 'title')}</h1>
        <p className="mt-2 text-muted-foreground">{t(locale, 'subtitle')}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'otpRequest')} / {t(locale, 'otpVerify')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'mobile')} value={otpMobile} onChange={(e) => setOtpMobile(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => requestOtp.mutate()} disabled={requestOtp.isPending}>{t(locale, 'otpRequest')}</Button>
            <Input placeholder={t(locale, 'otpCode')} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="max-w-[140px]" />
            <Button onClick={() => verifyOtp.mutate()} disabled={verifyOtp.isPending}>{t(locale, 'otpVerify')}</Button>
          </div>
          {requestOtp.data?.devCode && <p className="text-xs text-amber-700">Dev OTP: {requestOtp.data.devCode}</p>}
          {verifyOtp.data?.verified && <p className="text-sm text-green-700">Verified session: {verifyOtp.data.sessionId}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'grievance')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'name')} value={grievanceForm.reportedByName} onChange={(e) => setGrievanceForm({ ...grievanceForm, reportedByName: e.target.value })} />
          <Input placeholder={t(locale, 'mobile')} value={grievanceForm.reportedByMobile} onChange={(e) => setGrievanceForm({ ...grievanceForm, reportedByMobile: e.target.value })} />
          <Input placeholder={t(locale, 'subject')} value={grievanceForm.title} onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })} />
          <Input placeholder={t(locale, 'description')} value={grievanceForm.description} onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })} />
          <Button className="bg-gold text-navy" onClick={() => submitGrievance.mutate()} disabled={submitGrievance.isPending}>{t(locale, 'submit')}</Button>
          {submittedRef && <p className="text-sm text-green-700">{t(locale, 'reference')}: <strong>{submittedRef}</strong></p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'track')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'reference')} value={ref} onChange={(e) => setRef(e.target.value)} />
          <Button variant="outline" onClick={track}>{t(locale, 'trackBtn')}</Button>
          {trackResult && <pre className="rounded bg-slate-50 p-3 text-xs">{JSON.stringify(trackResult, null, 2)}</pre>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'feedback')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'name')} value={feedbackForm.name} onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })} />
          <Input placeholder={t(locale, 'mobile')} value={feedbackForm.mobile} onChange={(e) => setFeedbackForm({ ...feedbackForm, mobile: e.target.value })} />
          <Input placeholder={t(locale, 'message')} value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} />
          <Button onClick={() => submitFeedback.mutate()} disabled={submitFeedback.isPending}>{t(locale, 'submit')}</Button>
          {submitFeedback.isSuccess && <p className="text-sm text-green-700">Submitted</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'volunteer')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'name')} value={volunteerForm.name} onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })} />
          <Input placeholder={t(locale, 'mobile')} value={volunteerForm.mobile} onChange={(e) => setVolunteerForm({ ...volunteerForm, mobile: e.target.value })} />
          <Input placeholder={t(locale, 'village')} value={volunteerForm.village} onChange={(e) => setVolunteerForm({ ...volunteerForm, village: e.target.value })} />
          <Button onClick={() => registerVolunteer.mutate()} disabled={registerVolunteer.isPending}>{t(locale, 'submit')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'event')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={eventForm.eventId} onChange={(e) => setEventForm({ ...eventForm, eventId: e.target.value })}>
            <option value="">{t(locale, 'selectEvent')}</option>
            {(events ?? []).map((ev: { id: string; title: string }) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <Input placeholder={t(locale, 'name')} value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} />
          <Input placeholder={t(locale, 'mobile')} value={eventForm.mobile} onChange={(e) => setEventForm({ ...eventForm, mobile: e.target.value })} />
          <Button onClick={() => registerEvent.mutate()} disabled={registerEvent.isPending}>{t(locale, 'submit')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t(locale, 'eligibility')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t(locale, 'age')} value={eligibility.age} onChange={(e) => setEligibility({ ...eligibility, age: e.target.value })} />
          <Input placeholder={t(locale, 'income')} value={eligibility.income} onChange={(e) => setEligibility({ ...eligibility, income: e.target.value })} />
          <Input placeholder={t(locale, 'occupation')} value={eligibility.occupation} onChange={(e) => setEligibility({ ...eligibility, occupation: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eligibility.hasSchoolChild} onChange={(e) => setEligibility({ ...eligibility, hasSchoolChild: e.target.checked })} />{t(locale, 'hasSchoolChild')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eligibility.ownsHouse} onChange={(e) => setEligibility({ ...eligibility, ownsHouse: e.target.checked })} />{t(locale, 'ownsHouse')}</label>
          <Button variant="outline" onClick={checkEligibility}>{t(locale, 'checkEligibility')}</Button>
          {eligibilityResult && (
            <ul className="space-y-2 text-sm">
              {eligibilityResult.schemes.map((s) => (
                <li key={s.name} className={s.eligible ? 'text-green-700' : 'text-muted-foreground'}>
                  <strong>{s.name}</strong> — {s.eligible ? 'Eligible' : s.reasons.join(', ')}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
