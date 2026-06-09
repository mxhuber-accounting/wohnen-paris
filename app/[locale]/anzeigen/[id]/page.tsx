import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, MessageSquare, MapPin, Calendar, Sofa, Layers } from 'lucide-react';
import AreaTipsSection from '@/components/listings/AreaTipsSection';
import LoyerReference from '@/components/listings/LoyerReference';
import { ORG_LABEL, ORG_COLOR } from '@/lib/orgs';

const TYPE_BADGE: Record<string, string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer:     'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
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
      arrondissement, quartier, photos,
      status, created_at, user_id
    `)
    .eq('id', id)
    .single();

  if (!listing || listing.status === 'removed') notFound();

  const [
    { data: poster },
    { data: { user } },
    { data: areaTips },
    { data: posterListingCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, organization, occupation, created_at')
      .eq('id', listing.user_id)
      .single(),
    supabase.auth.getUser(),
    listing.arrondissement != null
      ? supabase
          .from('area_tips')
          .select('id, user_id, category, tip, created_at, profiles!user_id ( display_name )')
          .eq('arrondissement', listing.arrondissement)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    supabase
      .from('listings')
      .select('id')
      .eq('user_id', listing.user_id)
      .eq('status', 'active'),
  ]);

  const isLoggedIn = !!user;
  const isOwner = user?.id === listing.user_id;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const typeLabelMap: Record<string, string> = {
    ganze_wohnung: t('types.ganze_wohnung'),
    wg_zimmer:     t('types.wg_zimmer'),
    zwischenmiete: t('types.zwischenmiete'),
  };

  const memberYear = poster?.created_at ? new Date(poster.created_at).getFullYear() : null;
  const posterAvatarSrc = `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(listing.user_id)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/anzeigen"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> {t('detail.back')}
      </Link>

      {/* ── Photo gallery ───────────────────────────────────────────────────── */}
      {listing.photos && listing.photos.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          {listing.photos.length === 1 ? (
            <img src={listing.photos[0]} alt={listing.title} className="aspect-[16/9] w-full object-cover" />
          ) : (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: listing.photos.length >= 3 ? '2fr 1fr' : '1fr 1fr' }}>
              <img src={listing.photos[0]} alt="" className="aspect-[4/3] w-full rounded-l-2xl object-cover" />
              <div className={`grid gap-1.5 ${listing.photos.length >= 4 ? 'grid-rows-2' : 'grid-rows-1'}`}>
                {listing.photos.slice(1, listing.photos.length >= 4 ? 3 : 2).map((src: string, i: number) => (
                  <img key={i} src={src} alt=""
                    className={`w-full object-cover ${i === 0 && listing.photos.length >= 3 ? 'rounded-tr-2xl' : ''} ${i === 1 || listing.photos.length < 3 ? 'rounded-br-2xl' : ''}`}
                    style={{ aspectRatio: listing.photos.length >= 4 ? 'auto' : '4/3', height: listing.photos.length >= 4 ? '100%' : undefined }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main listing card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className={`mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[listing.type] ?? 'bg-zinc-100 text-zinc-600'}`}>
              {typeLabelMap[listing.type]}
            </span>
            <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              {listing.title}
            </h1>
            {(listing.arrondissement != null || listing.quartier) && (
              <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
                <MapPin size={13} />
                {listing.arrondissement != null ? `${listing.arrondissement}. Arrondissement` : ''}
                {listing.quartier ? ` · ${listing.quartier}` : ''}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-serif text-2xl font-semibold text-foreground">
              {listing.kaltmiete.toLocaleString('de-DE')} €
            </p>
            <p className="text-xs text-muted">{t('detail.perMonth')}</p>
          </div>
        </div>

        {/* Description */}
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {listing.description}
        </p>

        {/* Details grid */}
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-3">
          {listing.nebenkosten != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t('detail.extras')}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{listing.nebenkosten} €</dd>
            </div>
          )}
          {listing.kaution != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t('detail.deposit')}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{listing.kaution} €</dd>
            </div>
          )}
          {listing.size_sqm != null && (
            <div>
              <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
                <Layers size={11} /> {t('detail.size')}
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">{listing.size_sqm} m²</dd>
            </div>
          )}
          {listing.rooms != null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t('detail.rooms')}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{listing.rooms} Zimmer</dd>
            </div>
          )}
          <div>
            <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
              <Sofa size={11} /> Einrichtung
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {listing.furnished ? 'Möbliert' : 'Unmöbliert'}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
              <Calendar size={11} /> {t('detail.availableFrom')}
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{fmt(listing.available_from)}</dd>
          </div>
          {listing.available_to && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t('detail.availableTo')}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{fmt(listing.available_to)}</dd>
            </div>
          )}
        </dl>

        {/* CTA */}
        <div className="mt-8 border-t border-border pt-6">
          {isOwner ? (
            <p className="text-sm text-muted">Das ist deine eigene Anzeige.</p>
          ) : (
            <Link
              href={isLoggedIn ? (`/nachrichten/${listing.user_id}` as any) : '/login'}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <MessageSquare size={15} /> {t('detail.contact')}
            </Link>
          )}
        </div>
      </div>

      {/* ── Loyer de référence ──────────────────────────────────────────────── */}
      {listing.arrondissement != null && (
        <LoyerReference
          arrondissement={listing.arrondissement}
          rooms={listing.rooms}
          furnished={listing.furnished}
          kaltmiete={listing.kaltmiete}
          sizeSqm={listing.size_sqm}
        />
      )}

      {/* ── Poster profile card ─────────────────────────────────────────────── */}
      {poster && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Inseriert von</p>
          <div className="flex items-start gap-4">
            <a href={`/profil/${poster.id}`} className="shrink-0">
              <img src={posterAvatarSrc} alt="" className="h-12 w-12 rounded-full bg-zinc-100 object-cover" />
            </a>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <a href={`/profil/${poster.id}`} className="font-serif text-base font-semibold text-foreground hover:underline">
                  {poster.display_name ?? 'Mitglied'}
                </a>
                {poster.organization && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ORG_COLOR[poster.organization] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                    {ORG_LABEL[poster.organization] ?? poster.organization}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted">
                {poster.occupation && <span>{poster.occupation}</span>}
                {memberYear && <span>Mitglied seit {memberYear}</span>}
                {(posterListingCount?.length ?? 0) > 0 && (
                  <span>{posterListingCount?.length} aktive Anzeige{posterListingCount?.length === 1 ? '' : 'n'}</span>
                )}
              </div>
              {poster.bio && (
                <p className="mt-2 text-sm text-muted line-clamp-2">{poster.bio}</p>
              )}
            </div>
            {isLoggedIn && !isOwner && (
              <Link
                href={`/nachrichten/${poster.id}` as any}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted hover:border-foreground hover:text-foreground"
              >
                <MessageSquare size={12} /> Schreiben
              </Link>
            )}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <a
              href={`/profil/${poster.id}`}
              className="text-xs text-muted hover:text-foreground hover:underline"
            >
              Vollständiges Profil ansehen →
            </a>
          </div>
        </div>
      )}

      {/* ── Neighbourhood insider tips ─────────────────────────────────────── */}
      {listing.arrondissement != null && (
        <AreaTipsSection
          arrondissement={listing.arrondissement}
          initialTips={(areaTips ?? []).map((tip) => {
            const p = tip.profiles as unknown as { display_name: string | null } | null;
            return {
              id: tip.id,
              user_id: tip.user_id,
              category: tip.category,
              tip: tip.tip,
              created_at: tip.created_at,
              display_name: p?.display_name ?? 'Anonym',
            };
          })}
          currentUserId={user?.id ?? null}
        />
      )}
    </div>
  );
}
