'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  photos?: string[];
};

const CITY_CENTERS: Record<string, [number, number]> = {
  paris:  [48.8566, 2.3522],
  london: [51.5074, -0.1278],
};
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ganze_wohnung: { bg: '#2563eb', text: '#fff', label: 'Wohnung' },
  wg_zimmer:     { bg: '#16a34a', text: '#fff', label: 'WG' },
  zwischenmiete: { bg: '#d97706', text: '#fff', label: 'Zwischen' },
};

function createPriceIcon(price: number, type: string, active = false) {
  const c = TYPE_COLORS[type] ?? { bg: '#18181b', text: '#fff' };
  const scale = active ? 'scale(1.15)' : 'scale(1)';
  const shadow = active
    ? '0 4px 16px rgba(0,0,0,0.35)'
    : '0 2px 6px rgba(0,0,0,0.22)';
  return L.divIcon({
    html: `<div style="
      background:${c.bg};
      color:${c.text};
      padding:5px 10px;
      border-radius:20px;
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
      box-shadow:${shadow};
      border:2px solid white;
      transform:${scale};
      transition:transform 0.15s,box-shadow 0.15s;
      cursor:pointer;
      user-select:none;
    ">${price.toLocaleString('de-DE')} €</div>`,
    className: '',
    iconAnchor: [28, 16],
    iconSize: [56, 28],
  });
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    if (listings.length === 1) {
      map.setView([listings[0].lat, listings[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [listings.map((l) => l.id).join(',')]);
  return null;
}

function RecenterOnCity({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center[0], center[1], zoom]);
  return null;
}

export default function ListingMap({
  listings,
  city,
  activeId,
  onHover,
}: {
  listings: MapListing[];
  city?: string;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const center = city ? (CITY_CENTERS[city] ?? DEFAULT_CENTER) : DEFAULT_CENTER;
  const zoom = city === 'london' ? 11 : 12;
  const hasListings = listings.length > 0;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      {/* CartoDB Positron — minimal, elegant, no attribution clutter */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />

      {hasListings ? (
        <FitBounds listings={listings} />
      ) : (
        <RecenterOnCity center={center} zoom={zoom} />
      )}

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={createPriceIcon(listing.kaltmiete, listing.type, activeId === listing.id)}
          eventHandlers={{
            mouseover: () => onHover?.(listing.id),
            mouseout:  () => onHover?.(null),
          }}
        >
          <Popup
            offset={[0, -8]}
            className="listing-popup"
          >
            <a
              href={`/anzeigen/${listing.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: 220 }}
            >
              {listing.photos?.[0] && (
                <img
                  src={listing.photos[0]}
                  alt={listing.title}
                  style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block', marginBottom: 8 }}
                />
              )}
              <div style={{ padding: listing.photos?.[0] ? '0 4px 4px' : '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12,
                    background: TYPE_COLORS[listing.type]?.bg ?? '#18181b',
                    color: '#fff',
                  }}>
                    {TYPE_COLORS[listing.type]?.label ?? listing.type}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
                    {listing.kaltmiete.toLocaleString('de-DE')} €
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 3px', lineHeight: 1.35 }}>
                  {listing.title}
                </p>
                <p style={{ fontSize: 11, color: '#737373', margin: 0 }}>
                  {listing.arrondissement != null
                    ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
                    : (listing.quartier ?? '')}
                </p>
                <p style={{ fontSize: 11, color: '#2563eb', marginTop: 6, fontWeight: 600 }}>
                  Zum Inserat →
                </p>
              </div>
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
