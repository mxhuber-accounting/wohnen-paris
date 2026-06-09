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

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* City selector bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <span className="text-xs font-medium text-muted">Ville :</span>
        <div className="flex gap-1">
          {CITIES.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                city === c
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-muted hover:bg-zinc-100 hover:text-foreground'
              }`}
            >
              {CITY_CONFIG[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        {(loading || !data) && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
            <Globe size={28} className="animate-pulse text-purple-400" />
            <p className="text-sm text-muted">Chargement de {CITY_CONFIG[city].label}…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Erreur: {error}
          </div>
        )}
        {data && !loading && (
          <ReferenceRentMap data={data} onClose={() => window.history.back()} />
        )}
      </div>
    </div>
  );
}
