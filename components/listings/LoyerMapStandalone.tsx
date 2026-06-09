'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Globe, ArrowLeft } from 'lucide-react';
import type { LoyerData, City } from '@/lib/loyer-types';
import { CITY_CONFIG } from '@/lib/loyer-types';

const ReferenceRentMap = dynamic(() => import('./ReferenceRentMap'), { ssr: false });
const FranceMap = dynamic(() => import('./FranceMap'), { ssr: false });

export default function LoyerMapStandalone() {
  const [city, setCity] = useState<City | null>(null);
  const [data, setData] = useState<LoyerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;

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

  const backButton = (
    <button
      onClick={() => { setCity(null); setData(null); setError(null); }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft size={12} /> France
    </button>
  );

  // ── France overview ──────────────────────────────────────────────────────
  if (!city) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <Globe size={15} className="text-purple-500" />
          <h1 className="font-serif text-sm font-semibold text-foreground">
            Encadrement des loyers — France
          </h1>
          <span className="text-xs text-muted">Sélectionnez une ville</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <FranceMap onSelectCity={setCity} />
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading || (!data && !error)) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {backButton}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Globe size={28} className="animate-pulse text-purple-400" />
          <p className="text-sm text-muted">Chargement de {CITY_CONFIG[city].label}…</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {backButton}
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          Erreur: {error}
        </div>
      </div>
    );
  }

  // ── City choropleth ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-56px)]">
      <ReferenceRentMap
        data={data!}
        inline
        headerExtra={backButton}
        onClose={() => { setCity(null); setData(null); }}
      />
    </div>
  );
}
