'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import type { AssetGisPoint } from '@/lib/crm';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const DEFAULT_CENTER: [number, number] = [16.43, 80.55];

const STATUS_COLORS: Record<string, string> = {
  Active: '#22c55e',
  Inactive: '#64748b',
  UnderMaintenance: '#f59e0b',
  UnderDevelopment: '#3b82f6',
  Decommissioned: '#ef4444',
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

export function AssetMap({
  points,
  height = 480,
  center,
  zoom = 11,
}: {
  points: AssetGisPoint[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}) {
  const ready = useLeaflet();
  const mapRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const map = L.map(mapRef.current).setView(center ?? DEFAULT_CENTER, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, [ready, center, zoom]);

  React.useEffect(() => {
    if (!ready || !mapInstance.current || !layerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const layer = layerRef.current;
    layer.clearLayers();
    const valid = points.filter((p) => p.lat != null && p.lng != null);
    for (const p of valid) {
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: STATUS_COLORS[p.status] ?? '#64748b',
        fillColor: STATUS_COLORS[p.status] ?? '#64748b',
        fillOpacity: 0.75,
        weight: 1,
      })
        .bindPopup(
          `<strong>${p.code}</strong><br/>${p.name}<br/><span style="color:#64748b">${p.status}${p.mandal ? ' · ' + p.mandal : ''}</span>`,
        )
        .addTo(layer);
    }
    if (valid.length === 1) {
      mapInstance.current.setView([valid[0].lat, valid[0].lng], 14);
    } else if (valid.length > 1) {
      const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [ready, points]);

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60">
          <Spinner />
        </div>
      )}
      <div ref={mapRef} className="w-full rounded-xl" style={{ height, zIndex: 0 }} />
    </div>
  );
}
