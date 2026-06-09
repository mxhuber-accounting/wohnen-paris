import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations('listings');
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, type, title, description,
      kaltmiete, nebenkosten, kaution,
      size_sqm, rooms, furnished,
      available_from, available_to,
      arrondissement, quartier,
      status, created_at,
      profiles ( display_name )
    `)
    .eq('id', id)
    .single();

  if (!listing || listing.status === 'removed') notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const typeLabelMap: Record<string, string> = {
    ganze_wohnung: t('types.ganze_wohnung'),
    wg_zimmer: t('types.wg_zimmer'),
    zwischenmiete: t('types.zwischenmiete'),
  };

  const profile = listing.profiles as unknown as { display_name: string | null } | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/anzeigen"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft size={14} /> {t('detail.back')}
      </Link>

      <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {typeLabelMap[listing.type]}
            </span>
            <h1 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {listing.arrondissement != null
                ? `${listing.arrondissement}. Arr.${listing.quartier ? ` · ${listing.quartier}` : ''}`
                : (listing.quartier ?? '')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif text-2xl font-semibold text-stone-900">
              {listing.kaltmiete.toLocaleString('de-DE')} €
            </p>
            <p className="text-xs text-stone-400">{t('detail.perMonth')}</p>
          </div>
        </div>

        {/* Description */}
        <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
          {listing.description}
        </p>

        {/* Details grid */}
        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 sm:grid-cols-3">
          {listing.nebenkosten != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.extras')}</dt>
              <dd className="mt-0.5 text-sm text-stone-800">{listing.nebenkosten} €</dd>
            </div>
          )}
          {listing.kaution != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.deposit')}</dt>
              <dd className="mt-0.5 text-sm text-stone-800">{listing.kaution} €</dd>
            </div>
          )}
          {listing.size_sqm != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.size')}</dt>
              <dd className="mt-0.5 text-sm text-stone-800">{listing.size_sqm} m²</dd>
            </div>
          )}
          {listing.rooms != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.rooms')}</dt>
              <dd className="mt-0.5 text-sm text-stone-800">{listing.rooms}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.furnished')}</dt>
            <dd className="mt-0.5 text-sm text-stone-800">
              {listing.furnished ? t('detail.furnished') : t('detail.unfurnished')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.availableFrom')}</dt>
            <dd className="mt-0.5 text-sm text-stone-800">{fmt(listing.available_from)}</dd>
          </div>
          {listing.available_to && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('detail.availableTo')}</dt>
              <dd className="mt-0.5 text-sm text-stone-800">{fmt(listing.available_to)}</dd>
            </div>
          )}
        </dl>

        {/* Poster */}
        {profile?.display_name && (
          <p className="mt-6 text-xs text-stone-400">
            {t('detail.postedBy')}: <span className="text-stone-600">{profile.display_name}</span>
          </p>
        )}

        {/* CTA */}
        <div className="mt-8 border-t border-stone-100 pt-6">
          {user ? (
            <Link
              href={`/nachrichten/neu?listing=${listing.id}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              {t('detail.contact')}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              {t('detail.contact')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
