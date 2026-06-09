'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export type Listing = {
  id: string;
  type: 'ganze_wohnung' | 'wg_zimmer' | 'zwischenmiete';
  title: string;
  kaltmiete: number;
  nebenkosten: number | null;
  size_sqm: number | null;
  rooms: number | null;
  furnished: boolean;
  available_from: string;
  arrondissement: number | null;
  quartier: string | null;
  lat: number | null;
  lng: number | null;
  city_name?: string;
};

const typeBadgeClass: Record<Listing['type'], string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer: 'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const t = useTranslations('listings');

  const date = new Date(listing.available_from).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const locationLine =
    listing.arrondissement != null
      ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
      : (listing.quartier ?? '');

  return (
    <Link
      href={`/anzeigen/${listing.id}`}
      className="flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClass[listing.type]}`}>
            {t(`types.${listing.type}`)}
          </span>
          {listing.city_name && (
            <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
              {listing.city_name}
            </span>
          )}
        </div>
        <span className="text-right font-serif text-lg font-semibold text-stone-900 whitespace-nowrap">
          {listing.kaltmiete.toLocaleString('de-DE')} €
          <span className="font-sans text-xs font-normal text-stone-400"> /Mo.</span>
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-stone-900">{listing.title}</h3>

      {locationLine && (
        <p className="mt-1 text-xs text-stone-500">{locationLine}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500">
        {listing.rooms != null && (
          <span>{t('card.rooms', { n: listing.rooms })}</span>
        )}
        {listing.size_sqm != null && (
          <span>{t('card.sqm', { n: listing.size_sqm })}</span>
        )}
        {listing.furnished && (
          <span className="text-stone-400">{t('card.furnished')}</span>
        )}
        <span className="ml-auto">{t('card.availableFrom', { date })}</span>
      </div>
    </Link>
  );
}
