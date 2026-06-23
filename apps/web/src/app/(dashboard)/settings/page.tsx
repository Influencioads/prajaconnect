'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Shield, Trash2, UserX, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  deactivateUser,
  deleteRole,
  fetchAdminRoles,
  fetchAdminSettings,
  fetchAdminUsers,
  settingLabel,
  updateAdminSettings,
  type AdminRole,
  type AdminUser,
  type AppSetting,
} from '@/lib/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchGeoOptions } from '@/lib/crm';
import { BrandingTab } from '@/components/settings/branding-tab';
import { LocalizationTab } from '@/components/settings/localization-tab';
import { LocationsTab } from '@/components/settings/locations-tab';
import { RoleFormDialog } from '@/components/settings/role-form-dialog';
import { UserFormDialog } from '@/components/settings/user-form-dialog';

export default function SettingsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('admin'));
  const canDelete = accessLevel('admin') === 'full';

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization configuration, branding, users and role permissions."
      />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding &amp; Party</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralSettings canEdit={canEdit} /></TabsContent>
        <TabsContent value="branding"><BrandingTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="users"><UsersTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="roles"><RolesTab canEdit={canEdit} canDelete={canDelete} /></TabsContent>
        <TabsContent value="locations"><LocationsTab canEdit={canEdit} canDelete={canDelete} /></TabsContent>
        <TabsContent value="localization"><LocalizationTab canEdit={canEdit} /></TabsContent>
      </Tabs>
    </>
  );
}

const GENERAL_CATEGORIES = ['general', 'org'];

function GeneralSettings({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (data?.settings) {
      setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => {
      const keys = (data?.settings ?? [])
        .filter((s) => GENERAL_CATEGORIES.includes(s.category))
        .map((s) => s.key);
      return updateAdminSettings(keys.map((key) => ({ key, value: values[key] ?? '' })));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['branding'] });
      toast({ title: 'Settings saved', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const settings = data?.settings ?? [];
  if (!settings.length) {
    return <EmptyState title="No settings" description="Organization settings have not been configured yet." />;
  }

  const categories = GENERAL_CATEGORIES.filter((c) => (data?.grouped?.[c]?.length ?? 0) > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {(data?.grouped[category] ?? []).map((setting: AppSetting) => (
                <div key={setting.key} className="space-y-1.5">
                  <Label htmlFor={setting.key}>{settingLabel(setting.key)}</Label>
                  {setting.key === 'default_constituency' ? (
                    <Select
                      value={values[setting.key] ?? ''}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [setting.key]: v }))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger id={setting.key}>
                        <SelectValue placeholder="Select a constituency" />
                      </SelectTrigger>
                      <SelectContent>
                        {(geo?.constituencies ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={setting.key}
                      value={values[setting.key] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      disabled={!canEdit}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {canEdit && (
          <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function UsersTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUser | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, debounced],
    queryFn: () => fetchAdminUsers({ page, limit: 20, search: debounced || undefined }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User deactivated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Action failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Platform users</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add user
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email or mobile…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data?.data.length ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.designation && <p className="text-xs text-muted-foreground">{user.designation}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.role.label}</Badge></TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(user); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.status === 'Active' && (
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm(`Deactivate ${user.name}?`)) deactivateMut.mutate(user.id); }}>
                            <UserX className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
          </>
        )}
      </CardContent>
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
    </Card>
  );
}

function RolesTab({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: fetchAdminRoles });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminRole | null>(null);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      toast({ title: 'Role deleted', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Delete failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Create role
          </Button>
        </div>
      )}

      {!data?.length ? (
        <EmptyState title="No roles configured" />
      ) : (
        data.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  {role.label}
                  {role.isSystem && <Badge variant="muted" className="text-[10px]">Built-in</Badge>}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="muted">{role.userCount} users</Badge>
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(role); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && !role.isSystem && (
                    <Button variant="ghost" size="icon"
                      onClick={() => { if (confirm(`Delete role "${role.label}"?`)) delMut.mutate(role.id); }}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {role.permissions
                  .filter((p) => p.accessLevel !== 'none')
                  .map((perm) => (
                    <Badge key={perm.module} variant="outline" className="text-xs">
                      {perm.label}: {perm.accessLevel}
                    </Badge>
                  ))}
                {role.permissions.filter((p) => p.accessLevel !== 'none').length === 0 && (
                  <span className="text-xs text-muted-foreground">No module access granted.</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editing} />
    </div>
  );
}
