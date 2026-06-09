'use client';

import { useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { City } from '@/lib/loyer-types';

type CityPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  hasData: boolean;
  dataCity?: City;
};

const CITIES: CityPin[] = [
  { id: 'paris',       name: 'Paris',       lat: 48.856, lng: 2.352,  hasData: true,  dataCity: 'paris' },
  { id: 'lyon',        name: 'Lyon',        lat: 45.748, lng: 4.847,  hasData: true,  dataCity: 'lyon'  },
  { id: 'marseille',   name: 'Marseille',   lat: 43.297, lng: 5.381,  hasData: false },
  { id: 'toulouse',    name: 'Toulouse',    lat: 43.605, lng: 1.444,  hasData: false },
  { id: 'nice',        name: 'Nice',        lat: 43.710, lng: 7.262,  hasData: false },
  { id: 'nantes',      name: 'Nantes',      lat: 47.218, lng: -1.554, hasData: false },
  { id: 'montpellier', name: 'Montpellier', lat: 43.611, lng: 3.877,  hasData: false },
  { id: 'strasbourg',  name: 'Strasbourg',  lat: 48.573, lng: 7.752,  hasData: false },
  { id: 'bordeaux',    name: 'Bordeaux',    lat: 44.838, lng: -0.579, hasData: false },
  { id: 'lille',       name: 'Lille',       lat: 50.629, lng: 3.057,  hasData: false },
  { id: 'rennes',      name: 'Rennes',      lat: 48.117, lng: -1.678, hasData: false },
  { id: 'grenoble',    name: 'Grenoble',    lat: 45.188, lng: 5.724,  hasData: false },
];

type Props = {
  onSelectCity: (city: City) => void;
};

export default function FranceMap({ onSelectCity }: Props) {
  const handleClick = useCallback((pin: CityPin) => {
    if (pin.hasData && pin.dataCity) {
      onSelectCity(pin.dataCity);
    }
  }, [onSelectCity]);

  return (
    <div className="relative h-full">
      <MapContainer
        center={[46.6, 2.3]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
        />
        {CITIES.map(pin => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={pin.hasData ? 9 : 6}
            pathOptions={{
              color: pin.hasData ? '#7c3aed' : '#9ca3af',
              fillColor: pin.hasData ? '#a855f7' : '#d1d5db',
              fillOpacity: 0.85,
              weight: pin.hasData ? 2 : 1.5,
            }}
            eventHandlers={{ click: () => handleClick(pin) }}
          >
            <Tooltip
              permanent={pin.hasData}
              direction="top"
              offset={[0, -8]}
              className={`loyer-tooltip ${pin.hasData ? 'loyer-tooltip--active' : 'loyer-tooltip--muted'}`}
            >
              <span className="text-xs font-semibold">{pin.name}</span>
              {pin.hasData
                ? <span className="block text-[10px] text-purple-500">Cliquer pour explorer →</span>
                : <span className="block text-[10px] text-zinc-400">Bientôt disponible</span>
              }
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-border bg-white/95 p-4 shadow backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold text-foreground">Encadrement des loyers</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="h-3 w-3 rounded-full border-2 border-purple-600 bg-purple-400" />
            Données disponibles
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2.5 w-2.5 rounded-full border border-zinc-400 bg-zinc-200" />
            Pas d'encadrement / bientôt
          </div>
        </div>
      </div>
    </div>
  );
}
