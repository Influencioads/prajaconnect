import * as React from 'react';
import { router } from 'expo-router';
import type { AuthUser } from '@praja/types';
import { api, tokenStore, setAuthFailureHandler } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Access level the signed-in user has for a module key, or 'none'. */
  accessLevel: (module: string) => string;
  /** Whether the user can see/use a module at all (accessLevel !== 'none'). */
  hasModule: (module: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // When a token refresh fails (or there's nothing to refresh), end the session
  // and send the user to login from wherever they are in the navigation tree.
  React.useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      router.replace('/login');
    });
    return () => setAuthFailureHandler(null);
  }, []);

  React.useEffect(() => {
    (async () => {
      const token = await tokenStore.get();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        setUser(data);
      } catch {
        await tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifier: string, password: string) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    await tokenStore.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    const refreshToken = await tokenStore.getRefresh();
    api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    await tokenStore.clear();
    setUser(null);
  };

  // Mirror the web admin: navigation/modules are gated by the user's
  // per-module permission. A module with 'none' (or absent) is hidden.
  const accessLevel = React.useCallback(
    (module: string) => user?.permissions?.find((p) => p.module === module)?.accessLevel ?? 'none',
    [user],
  );
  const hasModule = React.useCallback((module: string) => accessLevel(module) !== 'none', [accessLevel]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, accessLevel, hasModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
