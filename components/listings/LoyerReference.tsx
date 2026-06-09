'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, Minus, Map } from 'lucide-react';
import type { LoyerData, RentRow } from '@/lib/loyer-types';

const ReferenceRentMap = dynamic(() => import('./ReferenceRentMap'), { ssr: false });

type Props = {
  arrondissement: number;
  rooms: number | null;
  furnished: boolean | null;
  kaltmiete: number;
  sizeSqm: number | null;
};

function avgRef(rows: RentRow[], pieces: number, meuble: boolean) {
  const f = rows.filter(r => r.pieces === pieces && r.meuble === meuble);
  if (!f.length) return null;
  return {
    ref:     f.reduce((s, r) => s + r.ref, 0) / f.length,
    ref_maj: f.reduce((s, r) => s + r.ref_maj, 0) / f.length,
    ref_min: f.reduce((s, r) => s + r.ref_min, 0) / f.length,
  };
}

export default function LoyerReference({ arrondissement, rooms, furnished, kaltmiete, sizeSqm }: Props) {
  const [data, setData] = useState<LoyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/loyer-reference').then(r => r.json()),
      fetch('/paris-arrondissements.geojson').then(r => r.json()),
    ])
      .then(([rents, geoJson]) => {
        if (rents.error) { setError(rents.error); } else { setData({ ...rents, geoJson }); }
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="h-3 w-40 animate-pulse rounded bg-border" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-border" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
      Loyer de référence konnte nicht geladen werden: {error}
    </div>
  );

  if (!data) return null;

  const pieces = Math.min(rooms ?? 1, 4);
  const meuble = furnished ?? true;
  const arrRows = data.byArrondissement[arrondissement];
  if (!arrRows) return null;

  const ref = avgRef(arrRows, pieces, meuble);
  if (!ref || ref.ref === 0) return null;

  let comparison: { pct: number; status: 'above' | 'below' | 'at' } | null = null;
  if (sizeSqm && sizeSqm > 0) {
    const pct = ((kaltmiete / sizeSqm - ref.ref) / ref.ref) * 100;
    comparison = {
      pct: Math.round(Math.abs(pct)),
      status: pct > 5 ? 'above' : pct < -5 ? 'below' : 'at',
    };
  }

  return (
    <>
      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Loyer de référence légal
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Paris {arrondissement}e · T{pieces} · {meuble ? 'Meublé' : 'Non meublé'} · {data.year}
            </p>
          </div>
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground hover:text-foreground"
          >
            <Map size={12} /> Carte Paris
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Minoré', value: ref.ref_min, highlight: false },
            { label: 'Référence', value: ref.ref, highlight: true },
            { label: 'Majoré', value: ref.ref_maj, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`rounded-xl p-3 text-center ${highlight ? 'bg-purple-50 ring-1 ring-purple-200' : 'bg-background'}`}
            >
              <p className={`mb-1 text-[10px] uppercase tracking-wider ${highlight ? 'font-semibold text-purple-600' : 'text-muted'}`}>
                {label}
              </p>
              <p className="font-serif text-lg font-semibold text-foreground">{value.toFixed(1)}</p>
              <p className="text-[10px] text-muted">€/m²</p>
            </div>
          ))}
        </div>

        {comparison && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 ${
            comparison.status === 'above' ? 'bg-red-50 text-red-700' :
            comparison.status === 'below' ? 'bg-green-50 text-green-700' :
            'bg-zinc-50 text-zinc-600'
          }`}>
            {comparison.status === 'above' ? <TrendingUp size={14} /> :
             comparison.status === 'below' ? <TrendingDown size={14} /> :
             <Minus size={14} />}
            <span className="text-xs font-medium">
              {comparison.status === 'above'
                ? `${comparison.pct}% über dem Referenzloyer`
                : comparison.status === 'below'
                ? `${comparison.pct}% unter dem Referenzloyer`
                : 'Entspricht dem Referenzloyer'}
            </span>
          </div>
        )}

        <p className="mt-3 text-[10px] text-muted">
          Moy. des époques · Source: DRIHL / data.gouv.fr
        </p>
      </div>

      {showMap && (
        <ReferenceRentMap
          data={data}
          highlightArrondissement={arrondissement}
          defaultPieces={pieces}
          defaultMeuble={meuble}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}
