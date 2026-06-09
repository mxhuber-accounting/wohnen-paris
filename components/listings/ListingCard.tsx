'use client';

import { Link } from '@/i18n/navigation';
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

const TYPE_LABEL: Record<Listing['type'], string> = {
  ganze_wohnung: 'Wohnung',
  wg_zimmer: 'WG-Zimmer',
  zwischenmiete: 'Zwischenmiete',
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const t = useTranslations('listings');

  const date = new Date(listing.available_from).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const location =
    listing.arrondissement != null
      ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
      : (listing.quartier ?? '');

  return (
    <Link
      href={`/anzeigen/${listing.id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-all hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted">
            {TYPE_LABEL[listing.type]}
          </span>
          {listing.city_name && (
            <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted">
              {listing.city_name}
            </span>
          )}
        </div>
        <span className="shrink-0 font-serif text-lg font-semibold text-foreground">
          {listing.kaltmiete.toLocaleString('de-DE')} €
          <span className="font-sans text-xs font-normal text-muted"> /Mo.</span>
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
        {listing.title}
      </h3>

      {location && (
        <p className="mt-1 text-xs text-muted">{location}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-3 mt-3 text-xs text-muted">
        {listing.rooms != null && <span>{listing.rooms} Zi.</span>}
        {listing.size_sqm != null && <span>{listing.size_sqm} m²</span>}
        {listing.furnished && <span>Möbliert</span>}
        <span className="ml-auto">Ab {date}</span>
      </div>
    </Link>
  );
}
