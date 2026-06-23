'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Wrench, Hammer, Layers } from 'lucide-react';
import { ASSET_CATEGORY_LABELS } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusPieChart } from '@/components/charts';
import { AssetMap } from '@/components/crm/asset-map';
import { ASSET_CONFIG_LIST } from '@/lib/asset-config';
import { fetchAssetGisPoints, fetchAssetStats } from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const ALL = '__all__';

export default function AssetsOverviewPage() {
  const [mapCategory, setMapCategory] = React.useState(ALL);

  const { data: stats, isLoading } = useQuery({ queryKey: ['asset-stats', undefined], queryFn: () => fetchAssetStats() });
  const { data: points } = useQuery({
    queryKey: ['asset-gis', mapCategory],
    queryFn: () => fetchAssetGisPoints(mapCategory === ALL ? undefined : mapCategory),
  });

  const byCategory = stats?.byCategory ?? {};
  const pieData = Object.entries(byCategory).map(([category, count]) => ({
    status: ASSET_CATEGORY_LABELS[category as keyof typeof ASSET_CATEGORY_LABELS] ?? category,
    count,
  }));

  return (
    <>
      <PageHeader title="Assets Management" description="Constituency infrastructure, public facilities and welfare assets in one system." />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Assets" value={formatNumber(stats?.total ?? 0)} icon={Boxes} accent="bg-blue-100 text-blue-700" />
            <KpiCard label="Active" value={formatNumber(stats?.byStatus?.Active ?? 0)} icon={Layers} accent="bg-emerald-100 text-emerald-700" />
            <KpiCard label="Under Maintenance" value={formatNumber(stats?.underMaintenance ?? 0)} icon={Wrench} accent="bg-amber-100 text-amber-700" />
            <KpiCard label="Under Development" value={formatNumber(stats?.underDevelopment ?? 0)} icon={Hammer} accent="bg-purple-100 text-purple-700" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Asset distribution</CardTitle></CardHeader>
              <CardContent>
                {pieData.length ? <StatusPieChart data={pieData} /> : <p className="text-sm text-muted-foreground">No data yet.</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Asset map</CardTitle>
                <Select value={mapCategory} onValueChange={setMapCategory}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {ASSET_CONFIG_LIST.map((c) => <SelectItem key={c.category} value={c.category}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <AssetMap points={points ?? []} height={380} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 font-display text-lg font-bold">Categories</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {ASSET_CONFIG_LIST.map((c) => {
                const Icon = c.icon;
                const count = byCategory[c.category] ?? 0;
                return (
                  <Link key={c.category} href={`/assets/${c.slug}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{c.label}</p>
                          <p className="mt-1 text-2xl font-bold text-foreground">{formatNumber(count)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
