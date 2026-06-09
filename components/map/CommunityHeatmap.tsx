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
  orgs: { org: string; count: number }[];
  total: number;
};

const ORG_HEX: Record<string, string> = {
  hec:        '#7c3aed',
  sciencespo: '#e11d48',
  escp:       '#0284c7',
  insead:     '#059669',
  lbs:        '#475569',
  lse:        '#dc2626',
  ucl:        '#4f46e5',
  imperial:   '#52525b',
  other:      '#0d9488',
};

const ALL_ORGS = Object.keys(ORG_LABEL);

function buildGlowIcon(size: number, color: string, label: string): L.DivIcon {
  const half = Math.round(size / 2);
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        transform: translate(-${half}px, -${half}px);
      ">
        <div style="
          position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle, ${color}ee 0%, ${color}88 35%, ${color}33 60%, transparent 80%);
          filter: blur(3px);
        "></div>
        <div style="
          position: absolute; inset: ${Math.round(size * 0.3)}px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 ${Math.round(size * 0.4)}px ${color}cc;
          display: flex; align-items: center; justify-content: center;
        ">
          <span style="
            color: white; font-size: ${Math.max(9, Math.round(size * 0.18))}px;
            font-weight: 700; white-space: nowrap;
          ">${label}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [0, 0],
    className: '',
  });
}

function CityMarkers({
  cities,
  filterOrg,
  onCityClick,
}: {
  cities: CityStats[];
  filterOrg: string | null;
  onCityClick: (c: CityStats) => void;
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    cities.forEach((city) => {
      const count = filterOrg
        ? (city.orgs.find((o) => o.org === filterOrg)?.count ?? 0)
        : city.total;

      if (count === 0) return;

      const color = filterOrg ? (ORG_HEX[filterOrg] ?? '#7c3aed') : '#a78bfa';
      const maxCount = Math.max(...cities.map((c) => c.total), 1);
      const size = Math.round(40 + (count / maxCount) * 80);

      const icon = buildGlowIcon(size, color, String(count));
      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
      marker.on('click', () => onCityClick(city));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
    };
  }, [cities, filterOrg, map, onCityClick]);

  return null;
}

function FitAll({ cities }: { cities: CityStats[] }) {
  const map = useMap();
  useEffect(() => {
    if (cities.length > 1) {
      const bounds = L.latLngBounds(cities.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [80, 80] });
    } else if (cities.length === 1) {
      map.setView([cities[0].lat, cities[0].lng], 5);
    }
  }, []);
  return null;
}

export default function CommunityHeatmap({ cities }: { cities: CityStats[] }) {
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
        {/* Dark CartoDB tiles for that Strava aesthetic */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <CityMarkers cities={cities} filterOrg={filterOrg} onCityClick={setActiveCity} />
        <FitAll cities={cities} />
      </MapContainer>

      {/* School filter chips — top overlay */}
      <div className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-black/60 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => setFilterOrg(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filterOrg === null
                ? 'bg-white text-black'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Alle
          </button>
          {activeOrgs.map((org) => (
            <button
              key={org}
              onClick={() => setFilterOrg(filterOrg === org ? null : org)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                filterOrg === org
                  ? 'text-white ring-2 ring-white'
                  : 'text-white/70 hover:text-white'
              }`}
              style={filterOrg === org ? { backgroundColor: ORG_HEX[org] } : {}}
            >
              {ORG_LABEL[org]}
            </button>
          ))}
        </div>
      </div>

      {/* City popup */}
      {activeCity && (
        <div className="absolute bottom-6 left-1/2 z-[1000] w-80 -translate-x-1/2 rounded-2xl bg-black/80 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-white">{activeCity.name}</h3>
            <button onClick={() => setActiveCity(null)} className="text-white/50 hover:text-white">✕</button>
          </div>
          <p className="mb-4 text-xs text-white/60">{activeCity.total} Mitglieder aktiv</p>
          <div className="space-y-2">
            {activeCity.orgs
              .filter((o) => o.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((o) => (
                <div key={o.org} className="flex items-center gap-3">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: ORG_HEX[o.org] ?? '#888',
                      width: `${Math.round((o.count / activeCity.total) * 100)}%`,
                      minWidth: 8,
                    }}
                  />
                  <span className="shrink-0 text-xs text-white/80">
                    {ORG_LABEL[o.org] ?? o.org} ({o.count})
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-[1000] rounded-xl bg-black/60 px-4 py-3 backdrop-blur-sm text-xs text-white/60">
        <p className="mb-1 font-semibold text-white/80">Aktivität</p>
        <div className="flex items-end gap-2">
          {[20, 40, 70].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div
                style={{
                  width: s / 3,
                  height: s / 3,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #a78bfa88 0%, #a78bfa22 70%)',
                  boxShadow: '0 0 8px #a78bfa66',
                }}
              />
              <span>{s === 20 ? 'wenig' : s === 70 ? 'viel' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
