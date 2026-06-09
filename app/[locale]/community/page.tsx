import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CommunityFeed from '@/components/community/CommunityFeed';
import type { CommunityPost, City, Channel } from '@/components/community/CommunityFeed';

export async function generateMetadata() {
  return { title: 'Community — Wohnen Abroad' };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; channel?: string; org?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { city: citySlug, channel: channelSlug, org } = await searchParams;
  const activeOrg = org === 'hec' || org === 'sciencespo' ? org : null;

  // Fetch cities + channels in parallel
  const [{ data: cities }, { data: allChannels }] = await Promise.all([
    supabase.from('cities').select('id, name, slug').order('name'),
    supabase
      .from('channels')
      .select('id, name, slug, city_id, is_system, creator_id')
      .order('is_system', { ascending: false })
      .order('name'),
  ]);

  // Resolve active city
  const activeCity = citySlug
    ? (cities ?? []).find((c) => c.slug === citySlug) ?? (cities ?? [])[0]
    : (cities ?? []).find((c) => c.slug === 'paris') ?? (cities ?? [])[0];

  // Channels for active city
  const cityChannels = (allChannels ?? []).filter(
    (ch) => ch.city_id === activeCity?.id || ch.city_id === null,
  );
  const activeChannel = channelSlug
    ? cityChannels.find((ch) => ch.slug === channelSlug) ?? cityChannels[0]
    : cityChannels[0];

  // Build posts query
  let query = supabase
    .from('community_posts')
    .select('id, user_id, body, created_at, city_id, organization, channel_id, cities!city_id ( name, slug )')
    .order('created_at', { ascending: false })
    .limit(100);

  if (activeCity) query = query.eq('city_id', activeCity.id);
  if (activeChannel) query = query.eq('channel_id', activeChannel.id);
  if (activeOrg) query = query.eq('organization', activeOrg);

  const { data: rawPosts } = await query;

  const userIds = [...new Set((rawPosts ?? []).map((p) => p.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const posts: CommunityPost[] = (rawPosts ?? []).map((p) => {
    const cityObj = p.cities as unknown as { name: string; slug: string } | null;
    return {
      id: p.id,
      user_id: p.user_id,
      body: p.body,
      created_at: p.created_at,
      display_name: profileMap.get(p.user_id)?.display_name ?? 'Anonym',
      city_name: cityObj?.name ?? null,
      city_slug: cityObj?.slug ?? null,
      organization: (p.organization as string | null) ?? null,
      channel_id: p.channel_id ?? null,
    };
  });

  const currentUser = {
    id: user.id,
    display_name:
      profileMap.get(user.id)?.display_name ?? user.email?.split('@')[0] ?? 'Anonym',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Community</h1>
        <p className="mt-1 text-sm text-muted">
          Deutschsprachiger Austausch — Wohnungsangebote, Gesuche, Tipps.
        </p>
      </div>

      {/* City tabs */}
      <div className="mb-6 flex gap-1.5 flex-wrap">
        {(cities ?? []).map((c) => {
          const isActive = c.id === activeCity?.id;
          return (
            <a
              key={c.id}
              href={`/community?city=${c.slug}`}
              className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-foreground bg-accent text-white'
                  : 'border-border bg-surface text-muted hover:border-zinc-400 hover:text-foreground'
              }`}
            >
              {c.name}
            </a>
          );
        })}
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Channel sidebar */}
        <aside>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Kanäle</p>
            </div>
            <nav>
              {cityChannels.map((ch) => {
                const isActive = ch.id === activeChannel?.id;
                const href = `/community?city=${activeCity?.slug ?? ''}&channel=${ch.slug}`;
                return (
                  <a
                    key={ch.id}
                    href={href}
                    className={`flex items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 transition-colors ${
                      isActive
                        ? 'bg-zinc-50 font-semibold text-foreground'
                        : 'text-muted hover:bg-zinc-50 hover:text-foreground'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? 'bg-accent' : 'bg-zinc-300'}`} />
                    {ch.name}
                    {!ch.is_system && (
                      <span className="ml-auto text-[10px] text-zinc-400">Community</span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Feed */}
        <div>
          <CommunityFeed
            initialPosts={posts}
            cities={(cities ?? []) as City[]}
            channels={cityChannels as Channel[]}
            currentUser={currentUser}
            activeOrg={activeOrg}
            activeCityId={activeCity?.id ?? null}
            activeChannelId={activeChannel?.id ?? null}
          />
        </div>
      </div>
    </div>
  );
}
