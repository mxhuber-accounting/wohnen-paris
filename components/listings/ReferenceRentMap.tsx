'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import type { LoyerData, RentRow, City } from '@/lib/loyer-types';
import { CITY_CONFIG } from '@/lib/loyer-types';

type Props = {
  data: LoyerData;
  highlightZone?: number;
  defaultPieces?: number;
  defaultMeuble?: boolean;
  onClose: () => void;
  /** When true, renders as a flex-1 block instead of fixed fullscreen overlay */
  inline?: boolean;
  /** Optional extra controls to render in the header (e.g. city selector) */
  headerExtra?: React.ReactNode;
};

function lerp(t: number): string {
  const r = Math.round(237 + t * (91 - 237));
  const g = Math.round(233 + t * (33 - 233));
  const b = Math.round(254 + t * (182 - 254));
  return `rgb(${r},${g},${b})`;
}

function avgRef(rows: RentRow[], pieces: number, meuble: boolean): number {
  const f = rows.filter(r => r.pieces === pieces && r.meuble === meuble);
  return f.length ? f.reduce((s, r) => s + r.ref, 0) / f.length : 0;
}

function FitCity({ city }: { city: City }) {
  const map = useMap();
  const cfg = CITY_CONFIG[city];
  useEffect(() => { map.setView(cfg.center, cfg.zoom); }, [city]);
  return null;
}

export default function ReferenceRentMap({
  data,
  highlightZone,
  defaultPieces = 2,
  defaultMeuble = true,
  onClose,
  inline = false,
  headerExtra,
}: Props) {
  const [pieces, setPieces] = useState(defaultPieces);
  const [meuble, setMeuble] = useState(defaultMeuble);
  const [selected, setSelected] = useState<{ zone: number; label: string } | null>(null);

  const cfg = CITY_CONFIG[data.city];

  const values = Object.values(data.byZone)
    .map(rows => avgRef(rows, pieces, meuble))
    .filter(v => v > 0);
  const minVal = values.length ? Math.min(...values) : 10;
  const maxVal = values.length ? Math.max(...values) : 35;

  const geoStyle = useCallback((feature: any) => {
    const zone = feature?.properties?.id_zone as number;
    const avg = avgRef(data.byZone[zone] ?? [], pieces, meuble);
    const t = avg > 0 ? Math.max(0, Math.min(1, (avg - minVal) / (maxVal - minVal))) : -1;
    return {
      fillColor: t >= 0 ? lerp(t) : '#e5e7eb',
      fillOpacity: 0.85,
      color: zone === highlightZone ? '#7c3aed' : '#fff',
      weight: zone === highlightZone ? 3 : 1,
    };
  }, [data, pieces, meuble, minVal, maxVal, highlightZone]);

  const onEach = useCallback((feature: any, layer: L.Layer) => {
    const zone = feature?.properties?.id_zone as number;
    const label = feature?.properties?.nom_quartier
      ?? feature?.properties?.commune
      ?? `Zone ${zone}`;
    const path = layer as L.Path;
    path.on({
      click: () => setSelected({ zone, label }),
      mouseover() { path.setStyle({ weight: 2, color: '#7c3aed', fillOpacity: 1 }); },
      mouseout() { path.setStyle(geoStyle(feature)); },
    });
  }, [geoStyle]);

  const selRows = selected ? (data.byZone[selected.zone] ?? []) : [];

  return (
    <div className={inline ? 'flex h-full flex-col bg-white' : 'fixed inset-0 z-[9000] flex flex-col bg-white'}>
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {headerExtra}
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">
              Encadrement des loyers — {cfg.label}
            </h2>
            <p className="text-xs text-muted">DRIHL · data.gouv.fr · {data.year}</p>
          </div>
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

      <div className="relative flex-1 overflow-hidden">
        <MapContainer center={cfg.center} zoom={cfg.zoom} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            subdomains="abcd"
          />
          <GeoJSON key={`${data.city}-${pieces}-${meuble}`} data={data.geoJson} style={geoStyle} onEachFeature={onEach} />
          <FitCity city={data.city} />
        </MapContainer>

        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-border bg-white/90 p-3 text-xs shadow backdrop-blur-sm">
          <p className="mb-1.5 font-semibold text-foreground">€/m² · Loyer de référence</p>
          <div className="flex items-center gap-2">
            <span className="text-muted">{minVal.toFixed(0)}</span>
            <div className="h-3 w-28 rounded-full" style={{ background: `linear-gradient(to right, ${lerp(0)}, ${lerp(1)})` }} />
            <span className="text-muted">{maxVal.toFixed(0)}</span>
          </div>
          {highlightZone && (
            <p className="mt-1.5 flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2 w-3 rounded-sm border-2 border-purple-600" />
              Zone {highlightZone} · ce logement
            </p>
          )}
        </div>

        {selected && (
          <div className="absolute bottom-4 right-4 z-[1000] w-68 rounded-2xl border border-border bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-serif text-sm font-semibold text-foreground">{selected.label}</h3>
                <p className="text-xs text-muted">{meuble ? 'Meublé' : 'Non meublé'} · Zone {selected.zone}</p>
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
            <p className="mt-3 text-[10px] text-muted">Moy. des époques · Source: DRIHL</p>
          </div>
        )}
      </div>
    </div>
  );
}
