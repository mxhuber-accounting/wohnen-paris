'use client';

import { Link } from '@/i18n/navigation';
import { ORG_LABEL } from '@/lib/orgs';

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
  poster_name?: string | null;
  poster_id?: string | null;
  poster_org?: string | null;
  photos?: string[];
};

const TYPE_BADGE: Record<Listing['type'], string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer:     'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};

const TYPE_LABEL: Record<Listing['type'], string> = {
  ganze_wohnung: 'Wohnung',
  wg_zimmer:     'WG-Zimmer',
  zwischenmiete: 'Zwischenmiete',
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];

function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const date = new Date(listing.available_from).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const location =
    listing.arrondissement != null
      ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
      : (listing.quartier ?? '');

  const coverPhoto = listing.photos?.[0];

  return (
    <Link
      href={`/anzeigen/${listing.id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface transition-all hover:border-zinc-300 hover:shadow-sm overflow-hidden"
    >
      {/* Cover photo */}
      {coverPhoto ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          <img
            src={coverPhoto}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center">
          <span className="text-3xl text-zinc-300">🏠</span>
        </div>
      )}

      {/* Main content */}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[listing.type]}`}>
              {TYPE_LABEL[listing.type]}
            </span>
            {listing.city_name && (
              <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
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
        {location && <p className="mt-1 text-xs text-muted">{location}</p>}

        <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted">
          {listing.rooms != null && <span>{listing.rooms} Zi.</span>}
          {listing.size_sqm != null && <span>{listing.size_sqm} m²</span>}
          {listing.furnished && <span>Möbliert</span>}
          <span className="ml-auto">Ab {date}</span>
        </div>
      </div>

      {/* Poster strip */}
      {listing.poster_id && (
        <div className="flex items-center gap-2 border-t border-border px-5 py-3">
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColor(listing.poster_id)}`}>
            {(listing.poster_name ?? 'A')[0].toUpperCase()}
          </div>
          <span className="truncate text-xs text-muted">
            {listing.poster_name ?? 'Mitglied'}
          </span>
          {listing.poster_org && (
            <span className="ml-auto shrink-0 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
              {ORG_LABEL[listing.poster_org] ?? listing.poster_org}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
