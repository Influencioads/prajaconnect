'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadDataQualityReport, fetchDataQualityDashboard, normalizeAddress, validateMobile } from '@/lib/data-quality';
import { useAuth } from '@/lib/auth';

export default function DataQualityNormalizationPage() {
  const [citizenId, setCitizenId] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('dataquality'));

  const { data: dash } = useQuery({ queryKey: ['data-quality-dashboard'], queryFn: fetchDataQualityDashboard });

  const norm = useMutation({ mutationFn: () => normalizeAddress({ citizenId, address }) });
  const mob = useMutation({ mutationFn: () => validateMobile({ mobile, citizenId: citizenId || undefined }) });

  return (
    <>
      <PageHeader
        title="Normalization & Validation"
        description="Address normalization and mobile validation tools."
        actions={<Button variant="outline" onClick={() => downloadDataQualityReport('quality')}>Export metrics</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Quality score</p><p className="text-2xl font-bold">{dash?.metrics?.qualityScore ?? '—'}%</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Open issues</p><p className="text-2xl font-bold">{dash?.openIssues ?? '—'}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Address normalizations</p><p className="text-2xl font-bold">{dash?.metrics?.addressNormalizations ?? '—'}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Invalid mobiles</p><p className="text-2xl font-bold">{dash?.metrics?.invalidMobiles ?? '—'}</p></div>
      </div>
      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">Normalize address</h3>
            <div><Label>Citizen ID</Label><Input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} className="mt-1" /></div>
            <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" /></div>
            <Button disabled={!citizenId || !address || norm.isPending} onClick={() => norm.mutate()}>Normalize</Button>
            {norm.data && <p className="text-sm text-green-700">Normalized: {norm.data.normalized}</p>}
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">Validate mobile</h3>
            <div><Label>Mobile</Label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1" /></div>
            <Button disabled={!mobile || mob.isPending} onClick={() => mob.mutate()}>Validate</Button>
            {mob.data && (
              <p className="text-sm">{mob.data.valid ? 'Valid mobile' : 'Invalid or duplicate'}
                {mob.data.duplicate ? ` — matches ${mob.data.duplicate.name}` : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
