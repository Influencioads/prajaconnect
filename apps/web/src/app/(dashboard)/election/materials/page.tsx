'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { ElectionMaterialType } from '@praja/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ElectionListShell } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { createElectionMaterial, fetchElectionMaterials } from '@/lib/election';

const ALL = '__all__';
const MATERIAL_TYPES = Object.values(ElectionMaterialType);

export default function ElectionMaterialsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [type, setType] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [name, setName] = React.useState('');
  const [materialType, setMaterialType] = React.useState<ElectionMaterialType>(ElectionMaterialType.Pamphlets);
  const [stockTotal, setStockTotal] = React.useState('');
  const [unitCost, setUnitCost] = React.useState('');
  const [vendorName, setVendorName] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, type]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    type: type === ALL ? undefined : type,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-materials', filters],
    queryFn: () => fetchElectionMaterials(filters),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createElectionMaterial({
        name,
        type: materialType,
        stockTotal: stockTotal ? Number(stockTotal) : undefined,
        unitCost: unitCost ? Number(unitCost) : undefined,
        vendorName: vendorName || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-materials'] });
      toast({ title: 'Material added', variant: 'success' });
      setDialog(false);
      setName('');
      setStockTotal('');
      setUnitCost('');
      setVendorName('');
      setNotes('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Campaign Materials"
      description="Pamphlets, banners, caps and booth supplies inventory."
      actions={
        <div className="flex gap-2">
          <Link href="/election/materials/distribution"><Button variant="outline">Distribution</Button></Link>
          {canEdit && <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Add material</Button>}
        </div>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search materials…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {MATERIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No materials" description="Add campaign materials to track stock." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Distributed</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Unit cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string; name: string; type: string;
                stockTotal?: number; stockDistributed?: number; stockRemaining?: number; unitCost?: number | null;
              }) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-navy">{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.stockTotal ?? 0}</TableCell>
                  <TableCell>{row.stockDistributed ?? 0}</TableCell>
                  <TableCell>{row.stockRemaining ?? 0}</TableCell>
                  <TableCell>{row.unitCost != null ? `₹${row.unitCost}` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add material</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={materialType} onValueChange={(v) => setMaterialType(v as ElectionMaterialType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MATERIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Stock total</Label>
                <Input type="number" min={0} value={stockTotal} onChange={(e) => setStockTotal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unit cost (₹)</Label>
                <Input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!name || createMut.isPending} onClick={() => createMut.mutate()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
