'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import type { LoyerData } from '@/lib/loyer-types';

const ReferenceRentMap = dynamic(() => import('./ReferenceRentMap'), { ssr: false });

export default function LoyerMapStandalone() {
  const [data, setData] = useState<LoyerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch('/api/loyer-reference');
        const t1 = await r1.text();
        let rents: any;
        try { rents = JSON.parse(t1); } catch { setError(`API parse fail (${r1.status}): ${t1.slice(0, 200)}`); return; }
        if (rents.error) { setError(`API error: ${rents.error}`); return; }

        const r2 = await fetch('/paris-arrondissements.json');
        const t2 = await r2.text();
        let geoJson: any;
        try { geoJson = JSON.parse(t2); } catch { setError(`GeoJSON parse fail (${r2.status}): ${t2.slice(0, 200)}`); return; }

        setData({ ...rents, geoJson });
      } catch (e) {
        setError(`Fetch error: ${String(e)}`);
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center text-sm text-muted">
        Daten konnten nicht geladen werden: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col items-center justify-center gap-3">
        <Globe size={28} className="animate-pulse text-purple-400" />
        <p className="text-sm text-muted">Loyers werden geladen…</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)]">
      <ReferenceRentMap data={data} onClose={() => window.history.back()} />
    </div>
  );
}
