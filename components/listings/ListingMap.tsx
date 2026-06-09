'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

export type MapListing = {
  id: string;
  title: string;
  kaltmiete: number;
  type: 'ganze_wohnung' | 'wg_zimmer' | 'zwischenmiete';
  arrondissement: number | null;
  quartier: string | null;
  lat: number;
  lng: number;
};

const CITY_CENTERS: Record<string, [number, number]> = {
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
};
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];

const TYPE_COLORS = {
  ganze_wohnung: '#2563eb',
  wg_zimmer: '#16a34a',
  zwischenmiete: '#d97706',
};

function createPriceIcon(price: number, type: MapListing['type']) {
  const color = TYPE_COLORS[type];
  const label = `${price.toLocaleString('de-DE')} €`;
  return L.divIcon({
    html: `<div style="
      background: ${color};
      color: white;
      padding: 4px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 2px solid white;
      cursor: pointer;
    ">${label}</div>`,
    className: '',
    iconAnchor: [0, 0],
  });
}

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function ListingMap({
  listings,
  city,
}: {
  listings: MapListing[];
  city?: string;
}) {
  const center = city ? (CITY_CENTERS[city] ?? DEFAULT_CENTER) : DEFAULT_CENTER;
  const zoom = city === 'london' ? 11 : 12;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <RecenterOnChange center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={createPriceIcon(listing.kaltmiete, listing.type)}
        >
          <Popup>
            <div style={{ minWidth: '180px', fontFamily: 'inherit' }}>
              <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', lineHeight: '1.4' }}>
                {listing.title}
              </p>
              <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>
                {listing.arrondissement != null
                  ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
                  : (listing.quartier ?? '')}
              </p>
              <a
                href={`/anzeigen/${listing.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                }}
              >
                Zum Inserat →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
