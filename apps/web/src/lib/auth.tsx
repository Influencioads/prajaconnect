'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@praja/types';
import { api, tokenStore, userStore } from './api';
import type { NavItem } from './nav';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithTokens: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasModule: (item: NavItem) => boolean;
  accessLevel: (module: string) => string;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const hydrate = React.useCallback(async () => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    // Render immediately from the cached user (no network wait), so protected
    // pages mount and fire their own queries in parallel with revalidation.
    const cached = userStore.get<AuthUser>();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      setUser(data);
      userStore.set(data);
    } catch {
      // Only hard-fail if we had nothing to show; a transient error keeps the
      // cached session rather than bouncing the user to /login.
      if (!cached) {
        tokenStore.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (identifier: string, password: string) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    tokenStore.set(data.accessToken, data.refreshToken);
    userStore.set(data.user);
    setUser(data.user);
  };

  const loginWithTokens = (u: AuthUser, accessToken: string, refreshToken: string) => {
    tokenStore.set(accessToken, refreshToken);
    userStore.set(u);
    setUser(u);
  };

  const logout = React.useCallback(() => {
    const refreshToken = tokenStore.refresh;
    api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    tokenStore.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = async () => {
    const { data } = await api.get<AuthUser>('/auth/me');
    userStore.set(data);
    setUser(data);
  };

  const accessLevel = React.useCallback(
    (module: string) => {
      const perm = user?.permissions?.find((p) => p.module === module);
      return perm?.accessLevel ?? 'none';
    },
    [user],
  );

  const hasModule = React.useCallback(
    (item: NavItem) => {
      if (!user) return false;
      const lvl = accessLevel(item.module);
      return lvl !== 'none';
    },
    [user, accessLevel],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithTokens, logout, refreshUser, hasModule, accessLevel }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
