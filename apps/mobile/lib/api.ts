import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const ACCESS_KEY = 'praja_access_token';
const REFRESH_KEY = 'praja_refresh_token';

export const tokenStore = {
  async get() {
    return AsyncStorage.getItem(ACCESS_KEY);
  },
  async getRefresh() {
    return AsyncStorage.getItem(REFRESH_KEY);
  },
  async set(access: string, refresh: string) {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, access],
      [REFRESH_KEY, refresh],
    ]);
  },
  async clear() {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Notified when the session can no longer be recovered (refresh failed / missing).
// AuthProvider registers a handler that clears the user and routes to /login.
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

// A single shared refresh so N concurrent 401s trigger ONE /auth/refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) return null;
  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
  await tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        // De-dupe concurrent refreshes: the first 401 starts the refresh,
        // every other in-flight 401 awaits the same promise.
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        // refresh request itself failed — fall through to logout
      }
      // No refresh token, or refresh failed: end the session explicitly so the
      // user is sent to /login instead of being stuck making failing calls.
      await tokenStore.clear();
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    return e.message;
  }
  return 'Something went wrong';
}
