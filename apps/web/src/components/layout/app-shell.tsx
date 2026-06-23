'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar, type TopbarUser } from './topbar';
import { pageTitle } from '@/lib/nav';
import type { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  user,
  onLogout,
  allowed,
}: {
  children: React.ReactNode;
  user?: TopbarUser;
  onLogout?: () => void;
  allowed?: (item: NavItem) => boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const title = pageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas dark:bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar allowed={allowed} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className={cn('absolute left-0 top-0 h-full animate-in slide-in-from-left')}>
            <Sidebar allowed={allowed} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          user={user}
          onLogout={onLogout}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
