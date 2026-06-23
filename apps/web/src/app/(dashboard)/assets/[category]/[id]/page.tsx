'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { AssetFormDialog } from '@/components/crm/asset-form-dialog';
import { AssetPhotos, AssetDocuments } from '@/components/crm/asset-attachments';
import { AssetTimeline } from '@/components/crm/asset-timeline';
import { AssetMap } from '@/components/crm/asset-map';
import { configBySlug } from '@/lib/asset-config';
import { deleteAsset, fetchAsset } from '@/lib/crm';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? '—'}</p>
    </div>
  );
}

export default function AssetDetailPage() {
  const params = useParams<{ category: string; id: string }>();
  const config = configBySlug(params.category);
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const level = accessLevel('assets');
  const canEdit = level === 'edit' || level === 'full';
  const canDelete = level === 'full';
  const [editing, setEditing] = React.useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', params.id],
    queryFn: () => fetchAsset(params.id),
  });

  const del = useMutation({
    mutationFn: () => deleteAsset(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset deleted', variant: 'success' });
      router.push(`/assets/${params.category}`);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  if (!config) {
    notFound();
    return null;
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!asset) return <EmptyAsset slug={config.slug} />;

  const detailRecord = (config.detailKey ? (asset as unknown as Record<string, Record<string, unknown> | null>)[config.detailKey] : null) ?? {};
  const attributes = asset.attributes ?? {};
  const hasCoords = asset.latitude != null && asset.longitude != null;

  return (
    <>
      <div className="mb-3">
        <Link href={`/assets/${config.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {config.label}
        </Link>
      </div>

      <PageHeader
        title={asset.name}
        description={`${config.singular} · ${asset.code}`}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" onClick={() => { if (confirm(`Delete ${asset.name}?`)) del.mutate(); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={asset.status} />
        {asset.condition && <StatusBadge status={asset.condition} />}
        {asset.mandal && <span className="text-sm text-muted-foreground"><MapPin className="mr-1 inline h-3.5 w-3.5" />{asset.mandal.name}{asset.village ? ` · ${asset.village.name}` : ''}</span>}
      </div>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos ({asset.photos.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({asset.documents.length})</TabsTrigger>
          <TabsTrigger value="history">History ({asset.logs.length})</TabsTrigger>
          <TabsTrigger value="grievances">Grievances ({asset.grievances.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">{config.singular} details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {config.fields.map((f) => {
                  const raw = f.store === 'detail' ? detailRecord[f.key] : attributes[f.key];
                  let display: React.ReactNode = '—';
                  if (raw != null && raw !== '') {
                    if (f.type === 'boolean') display = raw ? 'Yes' : 'No';
                    else if (f.type === 'date') display = formatDate(String(raw));
                    else display = String(raw);
                  }
                  return <Detail key={f.key} label={f.label} value={display} />;
                })}
                <Detail label="Contractor" value={asset.contractor} />
                <Detail label="Ward" value={asset.wardNumber} />
                <Detail label="Department" value={asset.department?.name} />
                {asset.project && <Detail label="Linked Project" value={asset.project.name} />}
                <Detail label="Address" value={asset.address} />
                <Detail label="Created" value={formatDate(asset.createdAt)} />
                {asset.description && (
                  <div className="sm:col-span-2">
                    <Detail label="Description" value={asset.description} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
              <CardContent>
                {hasCoords ? (
                  <AssetMap
                    height={300}
                    points={[{ id: asset.id, name: asset.name, code: asset.code, category: asset.category, status: asset.status, condition: asset.condition, lat: asset.latitude as number, lng: asset.longitude as number, mandal: asset.mandal?.name ?? null }]}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No GPS coordinates recorded for this asset.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card><CardContent className="pt-6"><AssetPhotos assetId={asset.id} photos={asset.photos} canEdit={canEdit} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card><CardContent className="pt-6"><AssetDocuments assetId={asset.id} documents={asset.documents} canEdit={canEdit} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="history">
          <Card><CardContent className="pt-6"><AssetTimeline assetId={asset.id} logs={asset.logs} canEdit={canEdit} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="grievances">
          <Card>
            <CardContent className="pt-6">
              {!asset.grievances.length ? (
                <p className="text-sm text-muted-foreground">No grievances linked to this asset.</p>
              ) : (
                <div className="space-y-2">
                  {asset.grievances.map((g) => (
                    <Link key={g.id} href={`/grievances/${g.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40">
                      <div>
                        <p className="text-sm font-medium">{g.title}</p>
                        <p className="text-xs text-muted-foreground">{g.code}</p>
                      </div>
                      <StatusBadge status={g.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssetFormDialog open={editing} onOpenChange={setEditing} config={config} asset={asset} />
    </>
  );
}

function EmptyAsset({ slug }: { slug: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">Asset not found.</p>
      <Link href={`/assets/${slug}`} className="mt-2 inline-block text-sm text-primary hover:underline">Back to list</Link>
    </div>
  );
}
