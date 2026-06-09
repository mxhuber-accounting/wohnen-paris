'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import type { LoyerData, City } from '@/lib/loyer-types';
import { CITY_CONFIG } from '@/lib/loyer-types';

const ReferenceRentMap = dynamic(() => import('./ReferenceRentMap'), { ssr: false });

const CITIES = Object.keys(CITY_CONFIG) as City[];

export default function LoyerMapStandalone() {
  const [city, setCity] = useState<City>('paris');
  const [data, setData] = useState<LoyerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    (async () => {
      try {
        const cfg = CITY_CONFIG[city];
        const [rentsRes, geoRes] = await Promise.all([
          fetch(`/api/loyer-reference?city=${city}`),
          fetch(cfg.geoJsonPath),
        ]);

        if (!rentsRes.ok) throw new Error(`API ${rentsRes.status}`);
        if (!geoRes.ok) throw new Error(`GeoJSON ${geoRes.status}`);

        const [rents, geoJson] = await Promise.all([rentsRes.json(), geoRes.json()]);
        if (rents.error) throw new Error(rents.error);

        if (!cancelled) setData({ ...rents, geoJson });
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [city]);

  const citySelector = (
    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
      {CITIES.map(c => (
        <button
          key={c}
          onClick={() => setCity(c)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            city === c
              ? 'bg-purple-600 text-white'
              : 'text-muted hover:bg-zinc-100 hover:text-foreground'
          }`}
        >
          {CITY_CONFIG[c].label}
        </button>
      ))}
    </div>
  );

  if (loading || (!data && !error)) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {citySelector}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Globe size={28} className="animate-pulse text-purple-400" />
          <p className="text-sm text-muted">Chargement de {CITY_CONFIG[city].label}…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {citySelector}
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)]">
      <ReferenceRentMap
        data={data!}
        inline
        headerExtra={citySelector}
        onClose={() => window.history.back()}
      />
    </div>
  );
}
