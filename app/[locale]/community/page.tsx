import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CommunityFeed from '@/components/community/CommunityFeed';
import type { CommunityPost, City } from '@/components/community/CommunityFeed';

export async function generateMetadata() {
  return { title: 'Community — Wohnen Abroad' };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { org } = await searchParams;
  const activeOrg = org === 'hec' || org === 'sciencespo' ? org : null;

  let query = supabase
    .from('community_posts')
    .select('id, user_id, body, created_at, city_id, organization, cities!city_id ( name, slug )')
    .order('created_at', { ascending: false })
    .limit(100);

  if (activeOrg) {
    query = query.eq('organization', activeOrg);
  }

  const { data: rawPosts } = await query;

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug')
    .order('name');

  const userIds = [...new Set((rawPosts ?? []).map((p) => p.user_id))];
  const { data: profiles } =
    userIds.length > 0
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
    };
  });

  const currentUser = {
    id: user.id,
    display_name:
      profileMap.get(user.id)?.display_name ?? user.email?.split('@')[0] ?? 'Anonym',
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-stone-900">Community</h1>
        <p className="mt-2 text-sm text-stone-500">
          Deutschsprachiger Austausch — Wohnungsangebote, Gesuche, Tipps.
        </p>
      </div>

      {/* Org channel tabs */}
      <div className="mb-6 flex gap-1.5 flex-wrap">
        {[
          { label: 'Alle', value: null },
          { label: 'HEC Paris', value: 'hec' },
          { label: 'Sciences Po', value: 'sciencespo' },
        ].map(({ label, value }) => {
          const isActive = activeOrg === value;
          const href = value ? `/community?org=${value}` : '/community';
          return (
            <a
              key={label}
              href={href}
              className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-foreground bg-accent text-white'
                  : 'border-border bg-surface text-muted hover:border-zinc-400 hover:text-foreground'
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <CommunityFeed
        initialPosts={posts}
        cities={(cities ?? []) as City[]}
        currentUser={currentUser}
        activeOrg={activeOrg}
      />
    </div>
  );
}
