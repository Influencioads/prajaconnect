'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Layers } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { fetchGrievancePoints, fetchMandalSummary } from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CENTER: [number, number] = [16.43, 80.55];

const STATUS_COLORS: Record<string, string> = {
  Open: '#ef4444',
  Assigned: '#f59e0b',
  InProgress: '#3b82f6',
  Escalated: '#a855f7',
  Resolved: '#22c55e',
  Closed: '#64748b',
};

function useLeaflet() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) {
      setReady(true);
      return;
    }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);
  return ready;
}

export default function GisPage() {
  const ready = useLeaflet();
  const mapRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = React.useRef<any>(null);
  const [mode, setMode] = React.useState<'points' | 'heatmap'>('points');

  const { data: points } = useQuery({ queryKey: ['gis-grievances'], queryFn: fetchGrievancePoints });
  const { data: mandals } = useQuery({ queryKey: ['gis-mandals'], queryFn: fetchMandalSummary });

  React.useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const map = L.map(mapRef.current).setView(CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, [ready]);

  React.useEffect(() => {
    if (!ready || !mapInstance.current || !layerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const layer = layerRef.current;
    layer.clearLayers();

    if (mode === 'points' && points) {
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], {
          radius: 7,
          color: STATUS_COLORS[p.status] ?? '#64748b',
          fillColor: STATUS_COLORS[p.status] ?? '#64748b',
          fillOpacity: 0.7,
          weight: 1,
        })
          .bindPopup(
            `<strong>${p.code}</strong><br/>${p.title}<br/><span style="color:#64748b">${p.status} · ${p.priority}${p.mandal ? ' · ' + p.mandal : ''}</span>`,
          )
          .addTo(layer);
      }
    }

    if (mode === 'heatmap' && mandals) {
      const max = Math.max(1, ...mandals.map((m) => m.openGrievances));
      for (const m of mandals) {
        if (m.lat == null || m.lng == null) continue;
        const intensity = m.openGrievances / max;
        L.circle([m.lat, m.lng], {
          radius: 400 + intensity * 1800,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15 + intensity * 0.4,
          weight: 0,
        })
          .bindPopup(`<strong>${m.name}</strong><br/>${m.openGrievances} open grievances`)
          .addTo(layer);
      }
    }
  }, [ready, mode, points, mandals]);

  return (
    <>
      <PageHeader title="GIS Map" description="Constituency grievance map and mandal density heatmap." />

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4" /> Map layers
              </div>
              <div className="flex gap-2">
                <Button variant={mode === 'points' ? 'default' : 'outline'} size="sm" onClick={() => setMode('points')}>
                  Grievance points
                </Button>
                <Button variant={mode === 'heatmap' ? 'default' : 'outline'} size="sm" onClick={() => setMode('heatmap')}>
                  Density heatmap
                </Button>
              </div>
            </div>
            <div className="relative">
              {!ready && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60">
                  <Spinner />
                </div>
              )}
              <div ref={mapRef} className="h-[560px] w-full rounded-b-xl" style={{ zIndex: 0 }} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mode === 'points' ? (
                Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    {status}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Circle size and opacity scale with open grievance density per mandal. Full grid heatmap coming soon.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Mandal summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!mandals ? (
                <Spinner />
              ) : (
                mandals.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b pb-1.5 text-sm last:border-0">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.openGrievances} open · {formatNumber(m.citizens)} citizens
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
