import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import ActivityFeed, { type FeedItem } from '@/components/feed/ActivityFeed';
import LiveUserCount from '@/components/ui/LiveUserCount';
import { Home, MessageSquare, Search, Globe, AlertCircle } from 'lucide-react';
import { ORG_LABEL, ORG_COLOR, ORG_EMOJI } from '@/lib/orgs';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  // ── Step 1: fetch raw rows (no profile join — FKs point to auth.users, not profiles)
  const [
    { data: myProfile },
    { data: cities, error: citiesError },
    { data: rawListings, error: listingsError },
    { data: rawPosts, error: postsError },
    { data: rawGesuche, error: gesucheError },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, organization').eq('id', user.id).single(),
    supabase.from('cities').select('id, name, slug'),
    supabase
      .from('listings')
      .select('id, type, title, kaltmiete, photos, arrondissement, quartier, city_id, user_id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('community_posts')
      .select('id, body, user_id, city_id, organization, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('looking_posts')
      .select('id, title, description, budget_max, rooms_min, available_from, city_id, user_id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  // Surface errors in development or show them inline
  const queryErrors = [
    citiesError && `cities: ${citiesError.message}`,
    listingsError && `listings: ${listingsError.message}`,
    postsError && `posts: ${postsError.message}`,
    gesucheError && `gesuche: ${gesucheError.message}`,
  ].filter(Boolean);

  // ── Step 2: batch-fetch all needed profiles in one query
  const allUserIds = Array.from(new Set([
    ...(rawListings ?? []).map((l) => l.user_id).filter(Boolean),
    ...(rawPosts ?? []).map((p) => p.user_id).filter(Boolean),
    ...(rawGesuche ?? []).map((g) => g.user_id).filter(Boolean),
  ])) as string[];

  const { data: profiles } = allUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, display_name, organization')
        .in('id', allUserIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const cityMap = Object.fromEntries((cities ?? []).map((c) => [c.id, c]));

  // ── Step 3: assemble feed items
  const listingItems: FeedItem[] = (rawListings ?? []).map((l) => {
    const p = profileMap[l.user_id];
    const c = l.city_id ? cityMap[l.city_id] : undefined;
    return {
      kind: 'listing',
      id: l.id,
      title: l.title,
      type: l.type as 'ganze_wohnung' | 'wg_zimmer' | 'zwischenmiete',
      kaltmiete: l.kaltmiete,
      photos: (l.photos as string[] | null) ?? [],
      arrondissement: l.arrondissement ?? null,
      quartier: l.quartier ?? null,
      city_name: c?.name ?? null,
      poster_id: l.user_id,
      poster_name: p?.display_name ?? null,
      poster_org: p?.organization ?? null,
      created_at: l.created_at,
    };
  });

  const postItems: FeedItem[] = (rawPosts ?? []).map((p) => {
    const prof = profileMap[p.user_id];
    const c = p.city_id ? cityMap[p.city_id] : undefined;
    return {
      kind: 'post',
      id: p.id,
      body: p.body,
      user_id: p.user_id,
      display_name: prof?.display_name ?? 'Mitglied',
      city_name: c?.name ?? null,
      organization: p.organization ?? null,
      created_at: p.created_at,
    };
  });

  const gesuchItems: FeedItem[] = (rawGesuche ?? []).map((g) => {
    const p = profileMap[g.user_id];
    const c = g.city_id ? cityMap[g.city_id] : undefined;
    return {
      kind: 'gesuch',
      id: g.id,
      title: g.title,
      description: g.description ?? '',
      budget_max: g.budget_max ?? null,
      rooms_min: g.rooms_min ?? null,
      available_from: g.available_from ?? null,
      city_name: c?.name ?? null,
      user_id: g.user_id,
      poster_name: p?.display_name ?? null,
      poster_org: p?.organization ?? null,
      created_at: g.created_at,
    };
  });

  const allItems = [...listingItems, ...postItems, ...gesuchItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const firstName = myProfile?.display_name?.split(' ')[0] ?? 'Hallo';
  const userOrg = myProfile?.organization ?? null;
  const schools = Object.keys(ORG_LABEL).filter((k) => k !== 'other');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Willkommen zurück, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">Was gibt es Neues in deiner Community?</p>
        </div>
        <div className="hidden sm:block">
          <LiveUserCount />
        </div>
      </div>

      {/* Debug: show query errors if any */}
      {queryErrors.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-700">Datenbankfehler</p>
              {queryErrors.map((e, i) => (
                <p key={i} className="mt-1 font-mono text-xs text-red-600">{e}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main feed */}
        <div>
          <ActivityFeed
            initialItems={allItems}
            currentUserId={user.id}
            cities={(cities ?? []).map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">

          <div className="sm:hidden">
            <LiveUserCount />
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Schnelleinstieg</p>
            <div className="space-y-2">
              <Link
                href="/anzeige-aufgeben"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <Home size={16} className="shrink-0 text-blue-600" />
                Wohnung inserieren
              </Link>
              <Link
                href="/gesuche/neu"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <Search size={16} className="shrink-0 text-amber-600" />
                Gesuch aufgeben
              </Link>
              <Link
                href="/community"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <MessageSquare size={16} className="shrink-0 text-green-600" />
                Community Chat
              </Link>
              <Link
                href="/map"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <Globe size={16} className="shrink-0 text-purple-600" />
                Weltkarte
              </Link>
            </div>
          </div>

          {/* School communities */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Communities</p>
            <div className="space-y-2">
              {schools.map((org) => (
                <Link
                  key={org}
                  href={`/community/${org}` as any}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all hover:shadow-sm ${
                    userOrg === org
                      ? ORG_COLOR[org] + ' font-semibold'
                      : 'border-border bg-background text-muted hover:border-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-base">{ORG_EMOJI[org] ?? '🏫'}</span>
                  <span>{ORG_LABEL[org]}</span>
                  {userOrg === org && (
                    <span className="ml-auto rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Du</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Browse links */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Entdecken</p>
            <div className="space-y-2 text-sm">
              <Link href="/anzeigen" className="flex items-center justify-between py-1 text-muted hover:text-foreground">
                Alle Anzeigen <span className="text-xs opacity-60">→</span>
              </Link>
              <Link href="/gesuche" className="flex items-center justify-between py-1 text-muted hover:text-foreground">
                Alle Gesuche <span className="text-xs opacity-60">→</span>
              </Link>
              <Link href="/community" className="flex items-center justify-between py-1 text-muted hover:text-foreground">
                Community Chats <span className="text-xs opacity-60">→</span>
              </Link>
              <Link href="/nachrichten" className="flex items-center justify-between py-1 text-muted hover:text-foreground">
                Meine Nachrichten <span className="text-xs opacity-60">→</span>
              </Link>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
