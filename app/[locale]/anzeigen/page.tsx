import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ListingCard, { type Listing } from '@/components/listings/ListingCard';
import BrowseFilters, { type FilterParams } from '@/components/listings/BrowseFilters';
import type { MapListing } from '@/components/listings/ListingMap';
import MapWrapper from '@/components/listings/MapWrapper';

export async function generateMetadata() {
  const t = await getTranslations('listings');
  return { title: t('pageTitle') };
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  const params = await searchParams;
  const t = await getTranslations('listings');
  const supabase = await createClient();

  let query = supabase
    .from('listings')
    .select(`
      id, type, title, kaltmiete, nebenkosten, size_sqm, rooms,
      furnished, available_from, arrondissement, quartier, lat, lng,
      cities!city_id ( name )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // City filter (resolve slug → id)
  if (params.city) {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', params.city)
      .single();
    if (city) query = query.eq('city_id', city.id);
  }

  // Area filters
  if (params.arr) {
    const arr = parseInt(params.arr);
    if (arr >= 1 && arr <= 20) query = query.eq('arrondissement', arr);
  }
  if (params.area) {
    query = query.ilike('quartier', `%${params.area}%`);
  }

  // Price / size / furnished / availability
  if (params.maxPrice) {
    const max = parseInt(params.maxPrice);
    if (max > 0) query = query.lte('kaltmiete', max);
  }
  if (params.minSize) {
    const min = parseInt(params.minSize);
    if (min > 0) query = query.gte('size_sqm', min);
  }
  if (params.furnished === 'true') {
    query = query.eq('furnished', true);
  }
  if (params.availableFrom) {
    query = query.lte('available_from', params.availableFrom);
  }

  // Type filter
  if (params.type && ['ganze_wohnung', 'wg_zimmer', 'zwischenmiete'].includes(params.type)) {
    query = query.eq('type', params.type as Listing['type']);
  }

  const { data: raw } = await query;

  // Normalise the joined `cities` shape Supabase returns
  const listings: Listing[] = (raw ?? []).map((r) => {
    const cityObj = r.cities as unknown as { name: string } | null;
    return {
      id: r.id,
      type: r.type as Listing['type'],
      title: r.title,
      kaltmiete: r.kaltmiete,
      nebenkosten: r.nebenkosten,
      size_sqm: r.size_sqm,
      rooms: r.rooms,
      furnished: r.furnished,
      available_from: r.available_from,
      arrondissement: r.arrondissement,
      quartier: r.quartier,
      lat: r.lat,
      lng: r.lng,
      city_name: cityObj?.name,
    };
  });

  const mapListings: MapListing[] = listings.filter(
    (l): l is Listing & { lat: number; lng: number } => l.lat != null && l.lng != null,
  );

  const count = listings.length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      {/* Header row */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
          {t('pageTitle')}
        </h1>
        {count > 0 && (
          <p className="shrink-0 text-sm text-stone-500">
            {count === 1
              ? t('resultCount', { count })
              : t('resultCountPlural', { count })}
          </p>
        )}
      </div>

      {/* Filters */}
      <BrowseFilters current={params} />

      {count === 0 ? (
        <p className="mt-16 text-center text-stone-500">{t('noResults')}</p>
      ) : (
        <div className="mt-6 lg:grid lg:grid-cols-[1fr_440px] lg:gap-6">
          {/* Listing grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Sticky map — desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-[4.5rem] h-[calc(100vh-5.5rem)] overflow-hidden rounded-xl border border-stone-200">
              <MapWrapper listings={mapListings} city={params.city} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
