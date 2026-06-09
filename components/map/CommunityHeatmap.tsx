'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ORG_LABEL } from '@/lib/orgs';

export type CityStats = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  // activity broken down by type and school
  listings: { org: string; count: number }[];
  listingsTotal: number;
  posts: { org: string; count: number }[];
  postsTotal: number;
  gesuche: { org: string; count: number }[];
  gesucheTotal: number;
  total: number;
  orgs: { org: string; count: number }[]; // combined, for popup
};

export type MapLayer = 'general' | 'listings' | 'school';

const ORG_HEX: Record<string, string> = {
  hec:        '#7c3aed',
  sciencespo: '#e11d48',
  escp:       '#0284c7',
  insead:     '#059669',
  lbs:        '#475569',
  lse:        '#dc2626',
  ucl:        '#4f46e5',
  imperial:   '#52525b',
  other:      '#6b7280',
};

const LAYER_COLOR: Record<MapLayer, string> = {
  general:  '#a78bfa',
  listings: '#34d399',
  school:   '#fb923c',
};

const ALL_ORGS = Object.keys(ORG_LABEL);

function buildGlowIcon(size: number, color: string, label: string): L.DivIcon {
  const half = Math.round(size / 2);
  const dotSize = Math.round(size * 0.38);
  const dotInset = Math.round((size - dotSize) / 2);
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;transform:translate(-${half}px,-${half}px)">
        <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,${color}55 0%,${color}22 50%,transparent 75%);filter:blur(1px)"></div>
        <div style="position:absolute;top:${dotInset}px;left:${dotInset}px;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color}dd;box-shadow:0 0 6px ${color}88;display:flex;align-items:center;justify-content:center">
          <span style="color:white;font-size:${Math.max(8, Math.round(dotSize * 0.38))}px;font-weight:700;line-height:1">${label}</span>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [0, 0],
    className: '',
  });
}

function CityMarkers({
  cities,
  layer,
  filterOrg,
  onCityClick,
}: {
  cities: CityStats[];
  layer: MapLayer;
  filterOrg: string | null;
  onCityClick: (c: CityStats) => void;
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    cities.forEach((city) => {
      let count = 0;
      let color = LAYER_COLOR[layer];

      if (layer === 'listings') {
        count = filterOrg
          ? (city.listings.find((o) => o.org === filterOrg)?.count ?? 0)
          : city.listingsTotal;
        color = filterOrg ? (ORG_HEX[filterOrg] ?? LAYER_COLOR.listings) : LAYER_COLOR.listings;
      } else if (layer === 'school') {
        if (!filterOrg) {
          count = city.total;
          color = LAYER_COLOR.school;
        } else {
          count = city.orgs.find((o) => o.org === filterOrg)?.count ?? 0;
          color = ORG_HEX[filterOrg] ?? LAYER_COLOR.school;
        }
      } else {
        // general: all activity combined
        count = filterOrg
          ? (city.orgs.find((o) => o.org === filterOrg)?.count ?? 0)
          : city.total;
        color = filterOrg ? (ORG_HEX[filterOrg] ?? LAYER_COLOR.general) : LAYER_COLOR.general;
      }

      if (count === 0) return;

      const maxCount = Math.max(...cities.map((c) => {
        if (layer === 'listings') return filterOrg ? (c.listings.find(o => o.org === filterOrg)?.count ?? 0) : c.listingsTotal;
        if (layer === 'school') return filterOrg ? (c.orgs.find(o => o.org === filterOrg)?.count ?? 0) : c.total;
        return filterOrg ? (c.orgs.find(o => o.org === filterOrg)?.count ?? 0) : c.total;
      }), 1);

      const size = Math.round(28 + (count / maxCount) * 28);
      const icon = buildGlowIcon(size, color, String(count));
      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
      marker.on('click', () => onCityClick(city));
      markersRef.current.push(marker);
    });

    return () => { markersRef.current.forEach((m) => m.remove()); };
  }, [cities, layer, filterOrg, map, onCityClick]);

  return null;
}

function FitAll({ cities }: { cities: CityStats[] }) {
  const map = useMap();
  useEffect(() => {
    const active = cities.filter((c) => c.total > 0);
    if (active.length > 1) {
      map.fitBounds(L.latLngBounds(active.map((c) => [c.lat, c.lng])), { padding: [80, 80] });
    } else if (active.length === 1) {
      map.setView([active[0].lat, active[0].lng], 5);
    }
  }, []);
  return null;
}

const LAYER_LABELS: Record<MapLayer, string> = {
  general:  'Gesamtaktivität',
  listings: 'Wohnungsanzeigen',
  school:   'Schulaktivität',
};

export default function CommunityHeatmap({ cities }: { cities: CityStats[] }) {
  const [layer, setLayer] = useState<MapLayer>('general');
  const [filterOrg, setFilterOrg] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<CityStats | null>(null);

  const activeOrgs = ALL_ORGS.filter((org) =>
    cities.some((c) => c.orgs.some((o) => o.org === org && o.count > 0))
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[51.0, 10.0]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <CityMarkers cities={cities} layer={layer} filterOrg={filterOrg} onCityClick={setActiveCity} />
        <FitAll cities={cities} />
      </MapContainer>

      {/* Layer switcher — top left */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="flex flex-col gap-1 rounded-2xl bg-black/60 px-3 py-3 backdrop-blur-sm">
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Ansicht</p>
          {(Object.keys(LAYER_LABELS) as MapLayer[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLayer(l); setFilterOrg(null); }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition-all ${
                layer === l ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: layer === l ? LAYER_COLOR[l] : '#ffffff33' }}
              />
              {LAYER_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* School filter chips — top center (only on school/general layers) */}
      {activeOrgs.length > 0 && (
        <div className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-black/60 px-3 py-2.5 backdrop-blur-sm">
            <button
              onClick={() => setFilterOrg(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                filterOrg === null ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Alle
            </button>
            {activeOrgs.map((org) => (
              <button
                key={org}
                onClick={() => setFilterOrg(filterOrg === org ? null : org)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  filterOrg === org ? 'text-white ring-1 ring-white/50' : 'text-white/60 hover:text-white'
                }`}
                style={filterOrg === org ? { backgroundColor: ORG_HEX[org] } : {}}
              >
                {ORG_LABEL[org]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City popup */}
      {activeCity && (
        <div className="absolute bottom-6 left-1/2 z-[1000] w-72 -translate-x-1/2 rounded-2xl bg-black/80 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-semibold text-white">{activeCity.name}</h3>
              <p className="text-xs text-white/50">{activeCity.total} Aktivitäten gesamt</p>
            </div>
            <button onClick={() => setActiveCity(null)} className="text-white/30 hover:text-white">✕</button>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2 border-b border-white/10 pb-3 text-center text-xs">
            <div>
              <p className="font-semibold text-emerald-400">{activeCity.listingsTotal}</p>
              <p className="text-white/40">Anzeigen</p>
            </div>
            <div>
              <p className="font-semibold text-orange-400">{activeCity.gesucheTotal}</p>
              <p className="text-white/40">Gesuche</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400">{activeCity.postsTotal}</p>
              <p className="text-white/40">Posts</p>
            </div>
          </div>
          <div className="space-y-2">
            {activeCity.orgs
              .filter((o) => o.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((o) => (
                <div key={o.org} className="flex items-center gap-3">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor: ORG_HEX[o.org] ?? '#888',
                      width: `${Math.round((o.count / activeCity.total) * 100)}%`,
                      minWidth: 6,
                    }}
                  />
                  <span className="shrink-0 text-xs text-white/70">
                    {ORG_LABEL[o.org] ?? o.org} ({o.count})
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-[1000] rounded-xl bg-black/60 px-3 py-2.5 backdrop-blur-sm text-xs text-white/50">
        <p className="mb-1.5 font-semibold text-white/70">{LAYER_LABELS[layer]}</p>
        <div className="flex items-end gap-3">
          {[8, 14, 20].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div style={{ width: s, height: s, borderRadius: '50%', background: LAYER_COLOR[layer] + 'cc', boxShadow: `0 0 4px ${LAYER_COLOR[layer]}66` }} />
              <span>{i === 0 ? 'wenig' : i === 2 ? 'viel' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
