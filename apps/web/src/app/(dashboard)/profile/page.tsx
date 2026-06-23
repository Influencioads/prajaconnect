'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth';
import { api, apiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = React.useState(user?.name ?? '');
  const [designation, setDesignation] = React.useState(user?.designation ?? '');
  const [language, setLanguage] = React.useState(user?.language ?? 'en');
  const [saving, setSaving] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [pwSaving, setPwSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setDesignation(user.designation ?? '');
      setLanguage(user.language);
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { name, designation, language });
      await refreshUser();
      toast({ title: 'Profile updated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Update failed', description: apiError(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwSaving(true);
    try {
      await api.post('/users/me/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast({ title: 'Password changed', variant: 'success' });
    } catch (err) {
      toast({ title: 'Change failed', description: apiError(err), variant: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <PageHeader title="My Profile" description="Manage your account and preferences" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-2xl font-bold text-white">
              {user.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <h3 className="mt-3 font-display text-lg font-bold">{user.name}</h3>
            <Badge variant="gold" className="mt-1">
              {user.roleLabel}
            </Badge>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Mobile</span>
                <span className="font-medium">{user.mobile}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-medium">
                  {user.permissions?.filter((p) => p.accessLevel !== 'none').length ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new">New password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={changePassword}
                disabled={pwSaving || !currentPassword || !newPassword}
              >
                {pwSaving ? 'Updating…' : 'Update password'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
