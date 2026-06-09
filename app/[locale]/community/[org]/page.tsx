import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { ORG_LABEL, ORG_COLOR, ORG_GRADIENT, ORG_EMOJI } from '@/lib/orgs';
import { MessageSquare, Home, Users, ArrowLeft } from 'lucide-react';

const ORG_TAGLINE: Record<string, string> = {
  hec:        'Dein Raum als HEC-Student — Paris & London.',
  essec:      'Die ESSEC-Community für Wohnen im Ausland.',
  sciencespo: 'Die Sciences Po Community für Wohnen im Ausland.',
  escp:       'ESCP-Studierende helfen ESCP-Studierenden.',
  insead:     'Global denken. Lokal wohnen. INSEAD-Community.',
  lbs:        'LBS MBA & MiM — Wohnen in London & Paris.',
  lse:        'LSE-Studierende finden hier ihr Zuhause.',
  ucl:        'UCL Community für internationale Studierende.',
  imperial:   'Imperial College — Wohnen & Netzwerken.',
  other:      'Für alle internationalen Studierenden.',
};

const TYPE_LABEL: Record<string, string> = {
  ganze_wohnung: 'Wohnung', wg_zimmer: 'WG-Zimmer', zwischenmiete: 'Zwischenmiete',
};
const TYPE_COLOR: Record<string, string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer: 'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

export default async function OrgCommunityPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  if (!ORG_LABEL[org]) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch members first so we can use their IDs for listings/gesuche
  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, occupation, created_at')
    .eq('organization', org)
    .order('created_at', { ascending: false })
    .limit(12);

  const memberIds = members?.map((m) => m.id) ?? [PLACEHOLDER_ID];

  // Now fetch everything in parallel — no profile joins (FKs point to auth.users, not profiles)
  const [{ data: recentPosts }, { data: listings }, { data: gesuche }] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, body, user_id, created_at')
      .eq('organization', org)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('listings')
      .select('id, title, type, kaltmiete, photos, city_id')
      .eq('status', 'active')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('looking_posts')
      .select('id, title, budget_max, user_id, city_id')
      .eq('status', 'active')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  // Batch-fetch cities for listings and gesuche
  const cityIds = Array.from(new Set([
    ...(listings ?? []).map((l) => l.city_id).filter(Boolean),
    ...(gesuche ?? []).map((g) => g.city_id).filter(Boolean),
  ])) as string[];
  const { data: orgCities } = cityIds.length > 0
    ? await supabase.from('cities').select('id, name').in('id', cityIds)
    : { data: [] };
  const orgCityMap = Object.fromEntries((orgCities ?? []).map((c) => [c.id, c]));

  const heroEmoji = ORG_EMOJI[org] ?? '🏫';
  const heroTagline = ORG_TAGLINE[org] ?? 'Willkommen in deiner Community.';
  const gradient = ORG_GRADIENT[org] ?? 'from-zinc-600 to-zinc-800';
  const memberCount = members?.length ?? 0;

  return (
    <div>
      {/* Hero banner */}
      <div className={`bg-gradient-to-br ${gradient} px-4 pb-12 pt-10 sm:px-6`}>
        <div className="mx-auto max-w-5xl">
          <Link
            href="/feed"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft size={14} /> Zurück zum Feed
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{heroEmoji}</span>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
                {ORG_LABEL[org]}
              </h1>
              <p className="mt-1 text-white/70">{heroTagline}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
              <Users size={14} /> {memberCount} Mitglieder
            </span>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
            >
              <MessageSquare size={14} /> Community Chat
            </Link>
            {user && (
              <Link
                href="/anzeige-aufgeben"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white/90 transition-colors"
              >
                <Home size={14} /> Wohnung inserieren
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">

          {/* Main */}
          <div className="space-y-10">

            {/* Listings */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">Aktuelle Anzeigen</h2>
                <Link href="/anzeigen" className="text-sm text-muted hover:text-foreground">Alle →</Link>
              </div>
              {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {listings.map((l) => {
                    const city = l.city_id ? orgCityMap[l.city_id] ?? null : null;
                    const photos = l.photos as string[] | null;
                    const photo = photos?.[0];
                    return (
                      <Link
                        key={l.id}
                        href={`/anzeigen/${l.id}` as any}
                        className="group overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-zinc-300 hover:shadow-sm"
                      >
                        {photo ? (
                          <img src={photo} alt={l.title} className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="aspect-[16/9] w-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center text-3xl text-zinc-300">🏠</div>
                        )}
                        <div className="p-4">
                          <div className="mb-2 flex gap-2">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_COLOR[l.type] ?? 'bg-zinc-100 text-zinc-600'}`}>
                              {TYPE_LABEL[l.type] ?? l.type}
                            </span>
                            {city && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{city.name}</span>}
                          </div>
                          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{l.title}</h3>
                          <p className="mt-1 font-serif text-base font-semibold text-foreground">
                            {l.kaltmiete.toLocaleString('de-DE')} €
                            <span className="font-sans text-xs font-normal text-muted"> /Mo.</span>
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-sm text-muted">Noch keine Anzeigen von {ORG_LABEL[org]}-Studierenden.</p>
                  {user && (
                    <Link href="/anzeige-aufgeben" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                      Erste Anzeige aufgeben →
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Recent posts */}
            {recentPosts && recentPosts.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold text-foreground">Letzte Community-Posts</h2>
                  <Link href="/community" className="text-sm text-muted hover:text-foreground">Im Chat →</Link>
                </div>
                <div className="space-y-3">
                  {recentPosts.map((p) => {
                    const postProfile = members?.find((m) => m.id === p.user_id);
                    return (
                      <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
                        <img src={dicebear(p.user_id)} alt="" className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/profil/${p.user_id}` as any} className="text-sm font-semibold text-foreground hover:underline">
                              {postProfile?.display_name ?? 'Mitglied'}
                            </Link>
                            <span className="text-xs text-muted">
                              {new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted">{p.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Gesuche */}
            {gesuche && gesuche.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold text-foreground">Gesuche</h2>
                  <Link href="/gesuche" className="text-sm text-muted hover:text-foreground">Alle →</Link>
                </div>
                <div className="space-y-3">
                  {gesuche.map((g) => {
                    const gProfile = members?.find((m) => m.id === g.user_id);
                    const city = g.city_id ? orgCityMap[g.city_id] ?? null : null;
                    return (
                      <div key={g.id} className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={dicebear(g.user_id)} alt="" className="h-8 w-8 shrink-0 rounded-full bg-amber-100 object-cover" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                            <p className="text-xs text-muted">
                              {gProfile?.display_name ?? 'Mitglied'}
                              {city ? ` · ${city.name}` : ''}
                              {g.budget_max ? ` · bis ${g.budget_max.toLocaleString('de-DE')} €` : ''}
                            </p>
                          </div>
                        </div>
                        {user && user.id !== g.user_id && (
                          <Link
                            href={`/nachrichten/${g.user_id}` as any}
                            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
                          >
                            Schreiben
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar: Members */}
          <aside>
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                  Mitglieder{memberCount > 0 ? ` (${memberCount})` : ''}
                </p>
                {members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((m) => (
                      <Link
                        key={m.id}
                        href={`/profil/${m.id}` as any}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50"
                      >
                        <img
                          src={m.avatar_url ?? dicebear(m.id)}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full bg-zinc-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{m.display_name ?? 'Mitglied'}</p>
                          {m.occupation && (
                            <p className="truncate text-xs text-muted">{m.occupation}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                    {memberCount >= 12 && (
                      <p className="pt-1 text-center text-xs text-muted">und weitere…</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Noch keine Mitglieder.</p>
                )}
              </div>

              {!user && (
                <div className="rounded-2xl border border-border bg-surface p-5 text-center">
                  <p className="mb-3 text-sm text-muted">Melde dich an um Teil dieser Community zu werden.</p>
                  <Link
                    href="/login"
                    className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    Anmelden
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
