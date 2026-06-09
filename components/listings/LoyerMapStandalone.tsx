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
    Promise.all([
      fetch('/api/loyer-reference').then(r => r.json()),
      fetch('/paris-arrondissements.json').then(r => r.json()),
    ])
      .then(([rents, geoJson]) => {
        if (rents.error) { setError(rents.error); return; }
        setData({ ...rents, geoJson });
      })
      .catch(e => setError(String(e)));
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
