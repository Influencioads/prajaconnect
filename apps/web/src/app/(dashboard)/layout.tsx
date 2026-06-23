'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/ui/spinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasModule } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <PageLoader label="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <AppShell
      user={{ name: user.name, roleLabel: user.roleLabel, email: user.email }}
      onLogout={logout}
      allowed={hasModule}
    >
      {children}
    </AppShell>
  );
}
