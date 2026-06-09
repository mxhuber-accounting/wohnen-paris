import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Globe, Languages, Briefcase, ArrowUpRight, MessageSquare, Lock } from 'lucide-react';
import { ORG_LABEL, ORG_COLOR } from '@/lib/orgs';

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const TYPE_BADGE: Record<string, string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer:     'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};
const TYPE_LABEL: Record<string, string> = {
  ganze_wohnung: 'Wohnung',
  wg_zimmer:     'WG-Zimmer',
  zwischenmiete: 'Zwischenmiete',
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, bio, nationality, occupation, organization, languages, places_lived, instagram, website, created_at')
    .eq('id', id)
    .single();

  if (!profile) {
    // If it's the logged-in user's own profile, send them to the edit page
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === id) {
      const { redirect } = await import('next/navigation');
      redirect('/profil');
    }
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const isOwnProfile = user?.id === id;

  const [{ data: listings }, { data: posts }, { data: lookingPost }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, type, title, kaltmiete, available_from, arrondissement, quartier')
      .eq('user_id', id).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(3),
    supabase
      .from('community_posts')
      .select('id, body, created_at, cities!city_id ( name, slug )')
      .eq('user_id', id)
      .order('created_at', { ascending: false }).limit(3),
    supabase
      .from('looking_posts')
      .select('id, title, description, budget_max, available_from, available_until')
      .eq('user_id', id).eq('status', 'active')
      .single(),
  ]);

  const memberYear = new Date(profile.created_at).getFullYear();
  const languageTags = profile.languages?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [];
  const placeTags = profile.places_lived?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Top band */}
        <div className="h-24 bg-gradient-to-r from-zinc-100 to-zinc-50" />

        <div className="px-6 pb-6">
          {/* Avatar — overlaps the band */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative">
              <img
                src={profile.avatar_url ?? dicebear(id)}
                alt={profile.display_name ?? ''}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-surface bg-zinc-100"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isLoggedIn && !isOwnProfile ? (
                <Link
                  href={`/nachrichten/${id}` as any}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  <MessageSquare size={14} /> Nachricht
                </Link>
              ) : !isLoggedIn ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted hover:border-foreground hover:text-foreground"
                >
                  <Lock size={13} /> Anmelden zum Schreiben
                </Link>
              ) : null}
              {isOwnProfile && (
                <Link
                  href="/profil"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                >
                  Bearbeiten
                </Link>
              )}
            </div>
          </div>

          {/* Name + org */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              {profile.display_name ?? 'Anonym'}
            </h1>
            {profile.organization && (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ORG_COLOR[profile.organization] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                {ORG_LABEL[profile.organization] ?? profile.organization}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
            {profile.occupation && (
              <span className="flex items-center gap-1"><Briefcase size={13} /> {profile.occupation}</span>
            )}
            {profile.nationality && (
              <span className="flex items-center gap-1"><Globe size={13} /> {profile.nationality}</span>
            )}
            <span>Mitglied seit {memberYear}</span>
          </div>

          {/* Languages */}
          {languageTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Languages size={13} className="shrink-0 text-muted" />
              {languageTags.map((l: string) => (
                <span key={l} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Places lived */}
          {placeTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <MapPin size={13} className="shrink-0" />
              {placeTags.map((p: string, i: number) => (
                <span key={p}>{p}{i < placeTags.length - 1 ? ' →' : ''}</span>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-foreground">
              {profile.bio}
            </p>
          )}

          {/* Social — blurred for logged-out */}
          {(profile.instagram || profile.website) && (
            <div className={`mt-4 flex flex-wrap gap-3 ${!isLoggedIn ? 'pointer-events-none select-none blur-sm' : ''}`}>
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
                  @{profile.instagram}
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
                  <Globe size={12} /> Website <ArrowUpRight size={10} />
                </a>
              )}
            </div>
          )}
          {(profile.instagram || profile.website) && !isLoggedIn && (
            <p className="mt-1 text-xs text-muted">
              <Link href="/login" className="underline hover:text-foreground">Anmelden</Link> um Kontaktdaten zu sehen
            </p>
          )}
        </div>
      </div>

      {/* ── Currently looking ─────────────────────────────────────────────── */}
      {lookingPost && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700">Sucht aktiv</p>
          <p className="text-sm font-semibold text-foreground">{lookingPost.title}</p>
          <p className="mt-1 text-sm text-muted line-clamp-2">{lookingPost.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-amber-700">
            {lookingPost.budget_max && <span>Budget: bis {lookingPost.budget_max} €/Mo.</span>}
            {lookingPost.available_from && (
              <span>Ab {new Date(lookingPost.available_from).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Active listings ────────────────────────────────────────────────── */}
      {listings && listings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Aktive Anzeigen
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            {listings.map((l, i) => (
              <Link
                key={l.id}
                href={`/anzeigen/${l.id}` as any}
                className={`flex items-center justify-between bg-surface px-5 py-4 transition-colors hover:bg-zinc-50 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div>
                  <span className={`mb-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[l.type] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {TYPE_LABEL[l.type]}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{l.title}</p>
                  <p className="text-xs text-muted">
                    {l.arrondissement != null ? `${l.arrondissement}. Arr.` : ''}{l.quartier ? ` · ${l.quartier}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-serif text-lg font-semibold text-foreground">
                  {l.kaltmiete.toLocaleString('de-DE')} €
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Community posts ────────────────────────────────────────────────── */}
      {posts && posts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Im Community-Chat
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            {posts.map((p, i) => {
              const cityObj = p.cities as unknown as { name: string; slug: string } | null;
              return (
                <div key={p.id} className={`bg-surface px-5 py-4 ${i > 0 ? 'border-t border-border' : ''} ${!isLoggedIn ? 'blur-sm select-none pointer-events-none' : ''}`}>
                  {cityObj && (
                    <span className="mb-1.5 inline-block rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted">
                      {cityObj.name}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed text-foreground line-clamp-2">{p.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
          {!isLoggedIn && (
            <p className="mt-2 text-center text-xs text-muted">
              <Link href="/login" className="underline hover:text-foreground">Anmelden</Link> um Beiträge zu lesen
            </p>
          )}
        </section>
      )}
    </div>
  );
}
