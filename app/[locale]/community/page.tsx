import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import CommunityFeed from '@/components/community/CommunityFeed';
import type { CommunityPost, City } from '@/components/community/CommunityFeed';

export async function generateMetadata() {
  return { title: 'Community — Wohnen Abroad' };
}

export default async function CommunityPage() {
  const supabase = await createClient();

  // Initial posts (newest first)
  const { data: rawPosts } = await supabase
    .from('community_posts')
    .select('id, user_id, body, created_at, city_id, cities!city_id ( name, slug )')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug')
    .order('name');

  // Batch-fetch profiles for all authors
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
    };
  });

  // Current user for the input
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: { id: string; display_name: string } | null = null;
  if (user) {
    currentUser = {
      id: user.id,
      display_name:
        profileMap.get(user.id)?.display_name ??
        user.email?.split('@')[0] ??
        'Anonym',
    };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-stone-900">Community</h1>
        <p className="mt-2 text-sm text-stone-500">
          Deutschsprachiger Austausch für Paris &amp; London — Wohnungsangebote, Gesuche, Tipps.
          Einfach WhatsApp-Text einfügen und senden.
        </p>
      </div>

      <CommunityFeed
        initialPosts={posts}
        cities={(cities ?? []) as City[]}
        currentUser={currentUser}
      />
    </div>
  );
}
