'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { apiError } from '@/lib/api';
import {
  createGeoNode,
  deleteGeoNode,
  fetchGeoTree,
  updateGeoNode,
  type GeoLevel,
} from '@/lib/geo';

// ----- level metadata -----
const CHILD_OF: Record<string, { level: GeoLevel; key: string; parentField: string } | null> = {
  state: { level: 'district', key: 'districts', parentField: 'stateId' },
  district: { level: 'constituency', key: 'constituencies', parentField: 'districtId' },
  constituency: { level: 'mandal', key: 'mandals', parentField: 'constituencyId' },
  mandal: { level: 'village', key: 'villages', parentField: 'mandalId' },
  village: { level: 'booth', key: 'booths', parentField: 'villageId' },
  booth: null,
};

const LEVEL_LABEL: Record<GeoLevel, string> = {
  state: 'State',
  district: 'District',
  constituency: 'Constituency',
  mandal: 'Mandal',
  village: 'Village',
  booth: 'Booth',
};

interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number';
  required?: boolean;
}
const FIELDS: Record<GeoLevel, FieldDef[]> = {
  state: [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code', required: true },
  ],
  district: [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code', required: true },
  ],
  constituency: [
    { name: 'name', label: 'Name', required: true },
    { name: 'number', label: 'Number', type: 'number' },
    { name: 'type', label: 'Type (Assembly/Parliament)' },
  ],
  mandal: [{ name: 'name', label: 'Name', required: true }],
  village: [
    { name: 'name', label: 'Name', required: true },
    { name: 'pincode', label: 'Pincode' },
  ],
  booth: [
    { name: 'number', label: 'Booth number', required: true },
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'voterCount', label: 'Voter count', type: 'number' },
  ],
};

type AnyNode = Record<string, any>;

interface DialogState {
  open: boolean;
  level: GeoLevel;
  parentField?: string;
  parentId?: string;
  node?: AnyNode | null;
}

function nodeLabel(level: GeoLevel, n: AnyNode) {
  if (level === 'booth') return n.name ? `${n.number} · ${n.name}` : `Booth ${n.number}`;
  return n.name;
}

function dependentCount(n: AnyNode): number {
  if (!n._count) return 0;
  return Object.values(n._count).reduce((a: number, b) => a + (b as number), 0);
}

export function LocationsTab({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  const { data, isLoading } = useQuery({ queryKey: ['geo-tree'], queryFn: fetchGeoTree });
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, level: 'state' });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openCreate = (level: GeoLevel, parentField?: string, parentId?: string) =>
    setDialog({ open: true, level, parentField, parentId, node: null });
  const openEdit = (level: GeoLevel, node: AnyNode) =>
    setDialog({ open: true, level, node });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Locations</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => openCreate('state')}>
            <Plus className="mr-1.5 h-4 w-4" /> Add state
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data?.length ? (
          <EmptyState title="No locations yet" description="Add a state to start building the geography." />
        ) : (
          <div className="divide-y rounded-lg border">
            {data.map((state) => (
              <TreeNode
                key={state.id}
                level="state"
                node={state}
                depth={0}
                expanded={expanded}
                toggle={toggle}
                canEdit={canEdit}
                canDelete={canDelete}
                onAddChild={openCreate}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Adding or editing a location instantly updates every dropdown across the app.
        </p>
      </CardContent>

      {dialog.open && (
        <NodeDialog state={dialog} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
      )}
    </Card>
  );
}

function TreeNode({
  level,
  node,
  depth,
  expanded,
  toggle,
  canEdit,
  canDelete,
  onAddChild,
  onEdit,
}: {
  level: GeoLevel;
  node: AnyNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  onAddChild: (level: GeoLevel, parentField?: string, parentId?: string) => void;
  onEdit: (level: GeoLevel, node: AnyNode) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const child = CHILD_OF[level];
  const children: AnyNode[] = child ? node[child.key] ?? [] : [];
  const isOpen = expanded.has(node.id);
  const deps = dependentCount(node);

  const delMut = useMutation({
    mutationFn: () => deleteGeoNode(level, node.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-tree'] });
      qc.invalidateQueries({ queryKey: ['geo'] });
      toast({ title: `${LEVEL_LABEL[level]} deleted`, variant: 'success' });
    },
    onError: (e) => toast({ title: 'Delete failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40"
        style={{ paddingLeft: 12 + depth * 18 }}
      >
        {child ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}

        <span className="text-sm font-medium">{nodeLabel(level, node)}</span>
        <Badge variant="outline" className="text-[10px] uppercase">{level}</Badge>
        {child && (
          <span className="text-xs text-muted-foreground">{children.length} {child.key}</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {canEdit && child && (
            <Button
              variant="ghost"
              size="icon"
              title={`Add ${CHILD_OF[level]!.level}`}
              onClick={() => onAddChild(child.level, child.parentField, node.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(level, node)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              title={deps > 0 ? 'Has linked records' : 'Delete'}
              onClick={() => {
                if (deps > 0) {
                  toast({
                    title: 'Cannot delete',
                    description: `Remove the ${deps} linked record(s) first.`,
                    variant: 'error',
                  });
                  return;
                }
                if (confirm(`Delete ${nodeLabel(level, node)}?`)) delMut.mutate();
              }}
            >
              <Trash2 className={cn('h-4 w-4', deps > 0 ? 'text-muted-foreground' : 'text-red-600')} />
            </Button>
          )}
        </div>
      </div>

      {isOpen && child && (
        <div>
          {children.length === 0 ? (
            <p
              className="px-3 py-1.5 text-xs italic text-muted-foreground"
              style={{ paddingLeft: 12 + (depth + 1) * 18 + 24 }}
            >
              No {child.key} yet.
            </p>
          ) : (
            children.map((c) => (
              <TreeNode
                key={c.id}
                level={child.level}
                node={c}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                canEdit={canEdit}
                canDelete={canDelete}
                onAddChild={onAddChild}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NodeDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { level, node, parentField, parentId } = state;
  const editing = !!node;
  const fields = FIELDS[level];

  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, node?.[f.name] != null ? String(node[f.name]) : ''])),
  );

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = values[f.name]?.trim();
        if (raw === '' || raw == null) continue;
        payload[f.name] = f.type === 'number' ? Number(raw) : raw;
      }
      if (!editing && parentField && parentId) payload[parentField] = parentId;
      return editing ? updateGeoNode(level, node!.id, payload) : createGeoNode(level, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-tree'] });
      qc.invalidateQueries({ queryKey: ['geo'] });
      toast({ title: editing ? `${LEVEL_LABEL[level]} updated` : `${LEVEL_LABEL[level]} added`, variant: 'success' });
      onClose();
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  const valid = fields.filter((f) => f.required).every((f) => (values[f.name] ?? '').trim().length > 0);

  return (
    <Dialog open={state.open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${LEVEL_LABEL[level].toLowerCase()}` : `Add ${LEVEL_LABEL[level].toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}{f.required ? ' *' : ''}</Label>
              <Input
                id={f.name}
                type={f.type === 'number' ? 'number' : 'text'}
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
