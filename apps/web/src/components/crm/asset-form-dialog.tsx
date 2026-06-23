'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetCondition, AssetStatus } from '@praja/types';
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
import {
  createAsset,
  fetchAssetOptions,
  fetchGeoOptions,
  updateAsset,
  type AssetDetail,
} from '@/lib/crm';
import type { AssetCategoryConfig, AssetField } from '@/lib/asset-config';

const NONE = '__none__';
const STATUSES = Object.values(AssetStatus);
const CONDITIONS = Object.values(AssetCondition);

interface CommonForm {
  name: string;
  code: string;
  description: string;
  status: string;
  condition: string;
  contractor: string;
  address: string;
  latitude: string;
  longitude: string;
  wardNumber: string;
  mandalId: string;
  villageId: string;
  departmentId: string;
  projectId: string;
}

function emptyCommon(): CommonForm {
  return {
    name: '', code: '', description: '', status: 'Active', condition: '', contractor: '',
    address: '', latitude: '', longitude: '', wardNumber: '', mandalId: '', villageId: '',
    departmentId: '', projectId: '',
  };
}

function fieldInitial(asset: AssetDetail | null | undefined, field: AssetField): string {
  if (!asset) return '';
  if (field.store === 'detail' && field.detailKey) {
    const detail = (asset as unknown as Record<string, Record<string, unknown> | null>)[field.detailKey];
    const v = detail?.[field.key];
    if (v == null) return '';
    if (field.type === 'date') return String(v).slice(0, 10);
    if (field.type === 'boolean') return v ? 'true' : 'false';
    return String(v);
  }
  const v = (asset.attributes ?? {})[field.key];
  if (v == null) return '';
  if (field.type === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

export function AssetFormDialog({
  open,
  onOpenChange,
  config,
  asset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AssetCategoryConfig;
  asset?: AssetDetail | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [common, setCommon] = React.useState<CommonForm>(emptyCommon());
  const [extra, setExtra] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setCommon({
      name: asset?.name ?? '',
      code: asset?.code ?? '',
      description: asset?.description ?? '',
      status: asset?.status ?? 'Active',
      condition: asset?.condition ?? '',
      contractor: asset?.contractor ?? '',
      address: asset?.address ?? '',
      latitude: asset?.latitude != null ? String(asset.latitude) : '',
      longitude: asset?.longitude != null ? String(asset.longitude) : '',
      wardNumber: asset?.wardNumber ?? '',
      mandalId: asset?.mandalId ?? asset?.mandal?.id ?? '',
      villageId: asset?.villageId ?? asset?.village?.id ?? '',
      departmentId: asset?.departmentId ?? '',
      projectId: asset?.projectId ?? '',
    });
    const e: Record<string, string> = {};
    for (const f of config.fields) e[f.key] = fieldInitial(asset, f);
    setExtra(e);
  }, [open, asset, config]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const { data: options } = useQuery({ queryKey: ['asset-options'], queryFn: fetchAssetOptions, enabled: open });

  const setC = (k: keyof CommonForm, v: string) => setCommon((f) => ({ ...f, [k]: v }));
  const setE = (k: string, v: string) => setExtra((f) => ({ ...f, [k]: v }));

  const villages = geo?.villages.filter((v) => !common.mandalId || v.mandalId === common.mandalId) ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      const detail: Record<string, Record<string, unknown>> = {};
      const attributes: Record<string, unknown> = {};
      for (const f of config.fields) {
        const raw = extra[f.key];
        if (raw === undefined || raw === '') continue;
        let value: unknown = raw;
        if (f.type === 'number') value = Number(raw);
        else if (f.type === 'boolean') value = raw === 'true';
        if (f.store === 'detail' && f.detailKey) {
          detail[f.detailKey] = detail[f.detailKey] ?? {};
          detail[f.detailKey][f.key] = value;
        } else {
          attributes[f.key] = value;
        }
      }
      const payload: Record<string, unknown> = {
        category: config.category,
        name: common.name,
        description: common.description || undefined,
        status: common.status,
        condition: config.showCondition && common.condition ? common.condition : undefined,
        contractor: common.contractor || undefined,
        address: common.address || undefined,
        latitude: common.latitude ? Number(common.latitude) : undefined,
        longitude: common.longitude ? Number(common.longitude) : undefined,
        wardNumber: common.wardNumber || undefined,
        mandalId: common.mandalId || undefined,
        villageId: common.villageId || undefined,
        departmentId: common.departmentId || undefined,
        projectId: common.projectId || undefined,
        ...detail,
      };
      if (Object.keys(attributes).length) payload.attributes = attributes;
      if (!asset && common.code) payload.code = common.code;
      return asset ? updateAsset(asset.id, payload) : createAsset(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      if (asset) qc.invalidateQueries({ queryKey: ['asset', asset.id] });
      toast({ title: asset ? 'Asset updated' : 'Asset created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = common.name.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={common.name} onChange={(e) => setC('name', e.target.value)} placeholder={`${config.singular} name`} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={common.status} onValueChange={(v) => setC('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {config.showCondition && (
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={common.condition || NONE} onValueChange={(v) => setC('condition', v === NONE ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category-specific fields */}
          {config.fields.map((f) => (
            <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2 space-y-1.5' : 'space-y-1.5'}>
              <Label>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea value={extra[f.key] ?? ''} onChange={(e) => setE(f.key, e.target.value)} />
              ) : f.type === 'select' ? (
                <Select value={extra[f.key] || NONE} onValueChange={(v) => setE(f.key, v === NONE ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder={`Select ${f.label.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === 'boolean' ? (
                <Select value={extra[f.key] || 'false'} onValueChange={(v) => setE(f.key, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={extra[f.key] ?? ''}
                  onChange={(e) => setE(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Mandal</Label>
            <Select value={common.mandalId || NONE} onValueChange={(v) => { setC('mandalId', v === NONE ? '' : v); setC('villageId', ''); }}>
              <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Village</Label>
            <Select value={common.villageId || NONE} onValueChange={(v) => setC('villageId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ward No.</Label>
            <Input value={common.wardNumber} onChange={(e) => setC('wardNumber', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contractor</Label>
            <Input value={common.contractor} onChange={(e) => setC('contractor', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Latitude</Label>
            <Input type="number" value={common.latitude} onChange={(e) => setC('latitude', e.target.value)} placeholder="16.43" />
          </div>
          <div className="space-y-1.5">
            <Label>Longitude</Label>
            <Input type="number" value={common.longitude} onChange={(e) => setC('longitude', e.target.value)} placeholder="80.55" />
          </div>

          {config.category === 'DevelopmentWorks' && (
            <div className="space-y-1.5">
              <Label>Linked Project</Label>
              <Select value={common.projectId || NONE} onValueChange={(v) => setC('projectId', v === NONE ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {options?.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={common.departmentId || NONE} onValueChange={(v) => setC('departmentId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {options?.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label>Address</Label>
            <Input value={common.address} onChange={(e) => setC('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description / Notes</Label>
            <Textarea value={common.description} onChange={(e) => setC('description', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : asset ? 'Save changes' : `Create ${config.singular}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
