'use client';

import dynamic from 'next/dynamic';
import type { MapListing } from './ListingMap';

const ListingMap = dynamic(() => import('./ListingMap'), { ssr: false });

export default function MapWrapper({
  listings,
  city,
}: {
  listings: MapListing[];
  city?: string;
}) {
  return <ListingMap listings={listings} city={city} />;
}
