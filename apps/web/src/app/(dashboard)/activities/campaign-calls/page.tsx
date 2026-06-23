'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, PhoneCall, Target, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CampaignFormDialog } from '@/components/crm/campaign-form-dialog';
import { useAuth } from '@/lib/auth';
import { formatNumber } from '@/lib/utils';
import { fetchCampaigns } from '@/lib/crm';

export default function CampaignCallsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('activities'));
  const [formOpen, setFormOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { limit: 100 }],
    queryFn: () => fetchCampaigns({ limit: 100 }),
  });

  const campaigns = data?.data ?? [];
  const totals = campaigns.reduce(
    (acc, c) => {
      acc.target += c.targetCount;
      acc.reached += c.reachedCount;
      acc.conversions += c.conversionCount;
      acc.budget += c.budget;
      return acc;
    },
    { target: 0, reached: 0, conversions: 0, budget: 0 },
  );

  return (
    <>
      <PageHeader
        title="Campaign Calls"
        description="Bulk calling, voter and survey campaigns with volunteer assignment, scripts and conversion tracking."
        actions={
          canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Target" value={formatNumber(totals.target)} icon={Target} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Reached" value={formatNumber(totals.reached)} icon={PhoneCall} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard label="Conversions" value={formatNumber(totals.conversions)} icon={TrendingUp} accent="bg-green-100 text-green-700" />
        <KpiCard label="Budget" value={`₹${formatNumber(totals.budget)}`} icon={Wallet} accent="bg-amber-100 text-amber-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !campaigns.length ? (
            <EmptyState title="No campaigns yet" description="Create a calling, SMS or voice broadcast campaign." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reached</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const rate = c.targetCount ? Math.round((c.conversionCount / c.targetCount) * 100) : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.type}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-sm">{formatNumber(c.targetCount)}</TableCell>
                      <TableCell className="text-sm">{formatNumber(c.reachedCount)}</TableCell>
                      <TableCell className="text-sm">
                        {formatNumber(c.conversionCount)} <span className="text-xs text-muted-foreground">({rate}%)</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c._count?.activities ?? 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} defaultType="CampaignCall" />
    </>
  );
}
