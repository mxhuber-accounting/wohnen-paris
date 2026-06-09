'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import type { LoyerData, RentRow } from '@/lib/loyer-types';

type Props = {
  data: LoyerData;
  highlightArrondissement?: number;
  defaultPieces?: number;
  defaultMeuble?: boolean;
  onClose: () => void;
};

function lerp(t: number): string {
  // light purple → dark purple: #ede9fe → #5b21b6
  const r = Math.round(237 + t * (91 - 237));
  const g = Math.round(233 + t * (33 - 233));
  const b = Math.round(254 + t * (182 - 254));
  return `rgb(${r},${g},${b})`;
}

function avgField(rows: RentRow[], pieces: number, meuble: boolean, field: keyof RentRow): number {
  const f = rows.filter(r => r.pieces === pieces && r.meuble === meuble);
  return f.length ? f.reduce((s, r) => s + (r[field] as number), 0) / f.length : 0;
}

function FitParis() {
  const map = useMap();
  useEffect(() => { map.setView([48.8566, 2.3522], 12); }, []);
  return null;
}

export default function ReferenceRentMap({
  data,
  highlightArrondissement,
  defaultPieces = 2,
  defaultMeuble = true,
  onClose,
}: Props) {
  const [pieces, setPieces] = useState(defaultPieces);
  const [meuble, setMeuble] = useState(defaultMeuble);
  const [selected, setSelected] = useState<{ arrNum: number; name: string } | null>(null);

  const values = Object.values(data.byArrondissement)
    .map(rows => avgField(rows, pieces, meuble, 'ref'))
    .filter(v => v > 0);
  const minVal = values.length ? Math.min(...values) : 20;
  const maxVal = values.length ? Math.max(...values) : 35;

  const geoStyle = useCallback((feature: any) => {
    const n = feature?.properties?.c_ar as number;
    const avg = avgField(data.byArrondissement[n] ?? [], pieces, meuble, 'ref');
    const t = avg > 0 ? Math.max(0, Math.min(1, (avg - minVal) / (maxVal - minVal))) : -1;
    return {
      fillColor: t >= 0 ? lerp(t) : '#e5e7eb',
      fillOpacity: 0.85,
      color: n === highlightArrondissement ? '#7c3aed' : '#fff',
      weight: n === highlightArrondissement ? 3 : 1.5,
    };
  }, [data, pieces, meuble, minVal, maxVal, highlightArrondissement]);

  const onEach = useCallback((feature: any, layer: L.Layer) => {
    const n = feature?.properties?.c_ar as number;
    const name = feature?.properties?.l_ar ?? `Paris ${n}e`;
    const path = layer as L.Path;
    path.on({
      click: () => setSelected({ arrNum: n, name }),
      mouseover() { path.setStyle({ weight: 3, color: '#7c3aed', fillOpacity: 1 }); },
      mouseout() { path.setStyle(geoStyle(feature)); },
    });
  }, [geoStyle]);

  const selRows = selected ? (data.byArrondissement[selected.arrNum] ?? []) : [];

  return (
    <div className="fixed inset-0 z-[9000] flex flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-foreground">
            Encadrement des loyers — Paris
          </h2>
          <p className="text-xs text-muted">DRIHL · data.gouv.fr · {data.year}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border text-xs">
            {([1, 2, 3, 4] as const).map(n => (
              <button
                key={n}
                onClick={() => setPieces(n)}
                className={`px-2.5 py-1.5 font-medium transition-colors ${pieces === n ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-zinc-50'}`}
              >
                T{n}{n === 4 ? '+' : ''}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-border text-xs">
            {([true, false] as const).map(m => (
              <button
                key={String(m)}
                onClick={() => setMeuble(m)}
                className={`px-2.5 py-1.5 font-medium transition-colors ${meuble === m ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-zinc-50'}`}
              >
                {m ? 'Meublé' : 'Non meublé'}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            <X size={13} /> Fermer
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 overflow-hidden">
        <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            subdomains="abcd"
          />
          <GeoJSON key={`${pieces}-${meuble}`} data={data.geoJson} style={geoStyle} onEachFeature={onEach} />
          <FitParis />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-border bg-white/90 p-3 text-xs shadow backdrop-blur-sm">
          <p className="mb-1.5 font-semibold text-foreground">€/m² · Loyer de référence</p>
          <div className="flex items-center gap-2">
            <span className="text-muted">{minVal.toFixed(0)}</span>
            <div
              className="h-3 w-28 rounded-full"
              style={{ background: `linear-gradient(to right, ${lerp(0)}, ${lerp(1)})` }}
            />
            <span className="text-muted">{maxVal.toFixed(0)}</span>
          </div>
          {highlightArrondissement && (
            <p className="mt-1.5 flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2 w-3 rounded-sm border-2 border-purple-600" />
              Paris {highlightArrondissement}e · ce logement
            </p>
          )}
        </div>

        {/* Arrondissement detail popup */}
        {selected && (
          <div className="absolute bottom-4 right-4 z-[1000] w-68 rounded-2xl border border-border bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-serif text-sm font-semibold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted">{meuble ? 'Meublé' : 'Non meublé'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {([1, 2, 3, 4] as const).map(p => {
                const rows = selRows.filter(r => r.pieces === p && r.meuble === meuble);
                if (!rows.length) return null;
                const ref = rows.reduce((s, r) => s + r.ref, 0) / rows.length;
                const maj = rows.reduce((s, r) => s + r.ref_maj, 0) / rows.length;
                const min = rows.reduce((s, r) => s + r.ref_min, 0) / rows.length;
                return (
                  <div key={p} className={`rounded-lg p-2.5 ${p === pieces ? 'bg-purple-50 ring-1 ring-purple-200' : 'bg-zinc-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">T{p}{p === 4 ? '+' : ''}</span>
                      <span className="font-serif text-sm font-semibold text-foreground">{ref.toFixed(1)} €/m²</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-[10px] text-muted">
                      <span>Min: {min.toFixed(1)}</span>
                      <span>Max: {maj.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-muted">Moy. des époques de construction</p>
          </div>
        )}
      </div>
    </div>
  );
}
