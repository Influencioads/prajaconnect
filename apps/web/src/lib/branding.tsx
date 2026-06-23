'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface Branding {
  appName: string;
  party: string;
  partyFullName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

const DEFAULT_BRANDING: Branding = {
  appName: 'Praja Connect',
  party: '',
  partyFullName: '',
  primaryColor: '#003366',
  secondaryColor: '#FFD600',
  accentColor: '#FFD600',
  logoUrl: '',
};

/** Convert "#RRGGBB" to the `"H S% L%"` triplet used by the Tailwind CSS variables. */
export function hexToHsl(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Relative luminance → pick a readable foreground (white or near-navy) for a brand color. */
function readableForeground(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return '0 0% 100%';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '213 100% 14%' : '0 0% 100%';
}

function applyTheme(b: Branding) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const set = (cssVar: string, hex: string) => {
    const hsl = hexToHsl(hex);
    if (hsl) root.style.setProperty(cssVar, hsl);
  };
  set('--primary', b.primaryColor);
  set('--secondary', b.secondaryColor);
  set('--accent', b.accentColor);
  const primaryFg = readableForeground(b.primaryColor);
  root.style.setProperty('--primary-foreground', primaryFg);
  root.style.setProperty('--ring', hexToHsl(b.primaryColor) ?? '213 100% 20%');
  root.style.setProperty('--secondary-foreground', readableForeground(b.secondaryColor));
  root.style.setProperty('--accent-foreground', readableForeground(b.accentColor));
}

interface BrandingContextValue {
  branding: Branding;
  isLoading: boolean;
}

const BrandingContext = React.createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isLoading: false,
});

export async function fetchBranding(): Promise<Branding> {
  const { data } = await api.get('/branding');
  return { ...DEFAULT_BRANDING, ...(data as Partial<Branding>) };
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: fetchBranding,
    staleTime: 5 * 60_000,
  });

  const branding = data ?? DEFAULT_BRANDING;

  React.useEffect(() => {
    applyTheme(branding);
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading }}>{children}</BrandingContext.Provider>
  );
}

export function useBranding() {
  return React.useContext(BrandingContext);
}
