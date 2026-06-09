import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/listings/ListingCard';
import BrowseFilters from '@/components/listings/BrowseFilters';

export async function generateMetadata() {
  const t = await getTranslations('listings');
  return { title: t('pageTitle') };
}

type SearchParams = {
  type?: string;
  arr?: string;
  maxPrice?: string;
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const t = await getTranslations('listings');
  const supabase = await createClient();

  let query = supabase
    .from('listings')
    .select('id, type, title, kaltmiete, nebenkosten, size_sqm, rooms, furnished, available_from, arrondissement, quartier')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (params.type && ['ganze_wohnung', 'wg_zimmer', 'zwischenmiete'].includes(params.type)) {
    query = query.eq('type', params.type);
  }
  if (params.arr) {
    const arr = parseInt(params.arr);
    if (arr >= 1 && arr <= 20) query = query.eq('arrondissement', arr);
  }
  if (params.maxPrice) {
    const max = parseInt(params.maxPrice);
    if (max > 0) query = query.lte('kaltmiete', max);
  }

  const { data: listings } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-stone-900">
        {t('pageTitle')}
      </h1>

      <BrowseFilters current={params} />

      {!listings || listings.length === 0 ? (
        <p className="mt-12 text-center text-stone-500">{t('noResults')}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
