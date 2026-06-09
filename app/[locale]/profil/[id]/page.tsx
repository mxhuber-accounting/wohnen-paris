import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Globe, Languages, Briefcase, ArrowUpRight } from 'lucide-react';
import type { Listing } from '@/components/listings/ListingCard';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const TYPE_BADGE: Record<string, string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer: 'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};
const TYPE_LABEL: Record<string, string> = {
  ganze_wohnung: 'Ganze Wohnung',
  wg_zimmer: 'WG-Zimmer',
  zwischenmiete: 'Zwischenmiete',
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
      {children}
    </span>
  );
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations('profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, bio, nationality, occupation, languages, places_lived, instagram, website, created_at')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  const { data: listings } = await supabase
    .from('listings')
    .select('id, type, title, kaltmiete, available_from, arrondissement, quartier')
    .eq('user_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: posts } = await supabase
    .from('community_posts')
    .select('id, body, created_at, cities!city_id ( name, slug )')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const initial = (profile.display_name ?? 'A')[0].toUpperCase();
  const memberYear = new Date(profile.created_at).getFullYear();

  const languageTags: string[] = profile.languages
    ?.split(',')
    .map((s: string) => s.trim())
    .filter(Boolean) ?? [];

  const placeTags: string[] = profile.places_lived
    ?.split(',')
    .map((s: string) => s.trim())
    .filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? ''}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-stone-100 shrink-0"
            />
          ) : (
            <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold ring-4 ring-stone-100 ${avatarColor(id)}`}>
              {initial}
            </div>
          )}

          {/* Name + meta */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-serif text-2xl font-semibold text-stone-900">
              {profile.display_name ?? 'Anonym'}
            </h1>
            <div className="mt-1 flex flex-wrap justify-center gap-3 text-sm text-stone-500 sm:justify-start">
              {profile.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase size={13} /> {profile.occupation}
                </span>
              )}
              {profile.nationality && (
                <span className="flex items-center gap-1">
                  <Globe size={13} /> {profile.nationality}
                </span>
              )}
              <span className="text-stone-400">Mitglied seit {memberYear}</span>
            </div>

            {/* Languages */}
            {languageTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Languages size={13} className="mt-0.5 shrink-0 text-stone-400" />
                {languageTags.map((l) => <Tag key={l}>{l}</Tag>)}
              </div>
            )}

            {/* Social links */}
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
                >
                  @ {profile.instagram}
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
                >
                  <Globe size={13} /> Website <ArrowUpRight size={11} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-6 border-t border-stone-100 pt-5 text-sm leading-relaxed text-stone-700">
            {profile.bio}
          </p>
        )}

        {/* Places lived */}
        {placeTags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <MapPin size={12} /> Gelebt in:
            </span>
            {placeTags.map((p, i) => (
              <span key={p} className="text-sm text-stone-600">
                {p}{i < placeTags.length - 1 ? ' →' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Their active listings */}
      {listings && listings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-stone-900">
            {t('activeListings')} ({listings.length})
          </h2>
          <div className="space-y-3">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/anzeigen/${l.id}` as any}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"
              >
                <div>
                  <span className={`mb-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[l.type] ?? 'bg-stone-100 text-stone-600'}`}>
                    {TYPE_LABEL[l.type]}
                  </span>
                  <p className="text-sm font-semibold text-stone-900">{l.title}</p>
                  <p className="text-xs text-stone-500">
                    {l.arrondissement != null ? `${l.arrondissement}. Arr.` : ''}{l.quartier ? ` · ${l.quartier}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-serif text-lg font-semibold text-stone-900">
                  {l.kaltmiete.toLocaleString('de-DE')} €
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Their community posts */}
      {posts && posts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-stone-900">
            {t('communityPosts')}
          </h2>
          <div className="space-y-3">
            {posts.map((p) => {
              const cityObj = p.cities as unknown as { name: string; slug: string } | null;
              const CITY_BADGE: Record<string, string> = {
                paris: 'bg-blue-50 text-blue-700',
                london: 'bg-red-50 text-red-700',
              };
              return (
                <div key={p.id} className="rounded-xl border border-stone-200 bg-white px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    {cityObj && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${CITY_BADGE[cityObj.slug] ?? 'bg-stone-100 text-stone-500'}`}>
                        {cityObj.name}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-stone-400">
                      {new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 line-clamp-3">{p.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
