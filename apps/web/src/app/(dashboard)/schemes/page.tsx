'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, HandCoins, Users, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  fetchSchemes,
  fetchSchemeStats,
  checkEligibility,
  type EligibilityResult,
} from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const ALL = '__all__';

export default function SchemesPage() {
  return (
    <>
      <PageHeader title="Welfare Schemes" description="Government scheme catalogue, beneficiaries and eligibility." />
      <Tabs defaultValue="catalogue">
        <TabsList>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility Checker</TabsTrigger>
        </TabsList>
        <TabsContent value="catalogue"><Catalogue /></TabsContent>
        <TabsContent value="eligibility"><EligibilityChecker /></TabsContent>
      </Tabs>
    </>
  );
}

function Catalogue() {
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({ queryKey: ['scheme-stats'], queryFn: fetchSchemeStats });
  const { data, isLoading } = useQuery({
    queryKey: ['schemes', debounced, status],
    queryFn: () => fetchSchemes({ search: debounced || undefined, status: status === ALL ? undefined : status, limit: 50 }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Schemes" value={stats?.schemes ?? 0} icon={HandCoins} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Beneficiaries" value={stats?.beneficiaries ?? 0} icon={Users} accent="bg-purple-100 text-purple-700" />
        <KpiCard label="Disbursed" value={`₹${formatNumber(stats?.disbursedTotal ?? 0)}`} icon={Wallet} accent="bg-emerald-100 text-emerald-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search schemes…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {['Active', 'Upcoming', 'Closed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No schemes found" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((s) => (
                <Link key={s.id} href={`/schemes/${s.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold-600">
                          <HandCoins className="h-5 w-5" />
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="font-display text-base font-bold">{s.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="muted">{s.category ?? '—'}</Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {s.benefitAmount ? `₹${formatNumber(s.benefitAmount)}` : '—'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s._count?.beneficiaries ?? 0} beneficiaries</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EligibilityChecker() {
  const [form, setForm] = React.useState({ age: '', income: '', occupation: '', hasSchoolChild: false, ownsHouse: false });
  const [results, setResults] = React.useState<EligibilityResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await checkEligibility({
        age: form.age ? Number(form.age) : undefined,
        income: form.income ? Number(form.income) : undefined,
        occupation: form.occupation || undefined,
        hasSchoolChild: form.hasSchoolChild,
        ownsHouse: form.ownsHouse,
      });
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Applicant details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Annual income (₹)</Label><Input type="number" value={form.income} onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} placeholder="Farmer, Labour…" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={form.hasSchoolChild} onChange={(e) => setForm((f) => ({ ...f, hasSchoolChild: e.target.checked }))} />
            Has school-going child
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={form.ownsHouse} onChange={(e) => setForm((f) => ({ ...f, ownsHouse: e.target.checked }))} />
            Owns a pucca house
          </label>
          <Button className="w-full" onClick={run} disabled={loading}>{loading ? 'Checking…' : 'Check eligibility'}</Button>
        </CardContent>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {!results ? (
          <EmptyState title="Enter details and run the checker" description="We match the applicant against active scheme rules." />
        ) : (
          results.map((r) => (
            <Card key={r.schemeId}>
              <CardContent className="flex items-start gap-3 pt-5">
                {r.eligible ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.name}</p>
                    <Badge variant={r.eligible ? 'success' : 'danger'}>{r.eligible ? 'Eligible' : 'Not eligible'}</Badge>
                  </div>
                  <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                    {r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
