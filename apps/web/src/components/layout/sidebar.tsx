'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUP_ORDER, type NavItem } from '@/lib/nav';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

export function Sidebar({
  allowed,
  onNavigate,
}: {
  allowed?: (item: NavItem) => boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = allowed ? NAV_ITEMS.filter(allowed) : NAV_ITEMS;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUP_ORDER.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (!groupItems.length) return null;
          return (
            <div key={group}>
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group}
              </p>
              <div className="space-y-0.5">
                {groupItems.map((item) =>
                  item.children?.length ? (
                    <NavGroupItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                  ) : (
                    <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-[10px] text-muted-foreground">v1.0 · TDP Governance Suite</p>
      </div>
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-navy text-white shadow-sm dark:bg-gold dark:text-navy'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavGroupItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const childActive = (item.children ?? []).some((c) => isActive(pathname, c.href));
  const parentActive = pathname === item.href;
  const [open, setOpen] = React.useState(childActive || parentActive);

  React.useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          childActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-3">
          {item.children!.map((child) => {
            const active = isActive(pathname, child.href);
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-navy text-white shadow-sm dark:bg-gold dark:text-navy'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <ChildIcon className="h-4 w-4 shrink-0" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
