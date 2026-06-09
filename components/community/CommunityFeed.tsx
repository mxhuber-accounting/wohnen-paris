'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { Send } from 'lucide-react';

export type CommunityPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string;
  city_name: string | null;
  city_slug: string | null;
};

export type City = { id: string; name: string; slug: string };

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 30) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

const CITY_BADGE: Record<string, string> = {
  paris: 'bg-blue-50 text-blue-700',
  london: 'bg-red-50 text-red-700',
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PostCard({ post }: { post: CommunityPost }) {
  const initial = (post.display_name ?? 'A')[0].toUpperCase();
  return (
    <div className="flex gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(post.user_id)}`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/profil/${post.user_id}`} className="text-sm font-semibold text-stone-900 hover:text-accent hover:underline">
                {post.display_name}
              </a>
          {post.city_slug && (
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${CITY_BADGE[post.city_slug] ?? 'bg-stone-100 text-stone-500'}`}>
              {post.city_name}
            </span>
          )}
          <span className="ml-auto shrink-0 text-xs text-stone-400">{relativeTime(post.created_at)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{post.body}</p>
      </div>
    </div>
  );
}

export default function CommunityFeed({
  initialPosts,
  cities,
  currentUser,
}: {
  initialPosts: CommunityPost[];
  cities: City[];
  currentUser: { id: string; display_name: string } | null;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [body, setBody] = useState('');
  const [cityId, setCityId] = useState(
    cities.find((c) => c.slug === 'paris')?.id ?? cities[0]?.id ?? '',
  );
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('community_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        async (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            body: string;
            created_at: string;
            city_id: string | null;
          };
          // Skip own posts — already added optimistically
          if (currentUser && row.user_id === currentUser.id) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', row.user_id)
            .single();

          const city = cities.find((c) => c.id === row.city_id) ?? null;
          setPosts((prev) => [
            {
              id: row.id,
              user_id: row.user_id,
              body: row.body,
              created_at: row.created_at,
              display_name: profile?.display_name ?? 'Anonym',
              city_name: city?.name ?? null,
              city_slug: city?.slug ?? null,
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  async function submit() {
    if (!body.trim() || !currentUser || sending) return;
    setSending(true);

    const city = cities.find((c) => c.id === cityId) ?? null;
    const optimistic: CommunityPost = {
      id: `opt-${Date.now()}`,
      user_id: currentUser.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
      display_name: currentUser.display_name,
      city_name: city?.name ?? null,
      city_slug: city?.slug ?? null,
    };

    setPosts((prev) => [optimistic, ...prev]);
    setBody('');
    textareaRef.current?.focus();

    await supabase.from('community_posts').insert({
      user_id: currentUser.id,
      city_id: cityId || null,
      body: optimistic.body,
    });

    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div>
      {/* Feed */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-stone-400">
            Noch keine Nachrichten. Sei der Erste!
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Input */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        {currentUser ? (
          <>
            <div className="flex gap-2.5 items-end">
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht eingeben — oder WhatsApp-Text einfügen…"
                maxLength={1000}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />

              <button
                type="button"
                onClick={submit}
                disabled={!body.trim() || sending}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                <Send size={14} />
                Senden
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Enter zum Senden · Shift+Enter für neue Zeile · max. 1.000 Zeichen
            </p>
          </>
        ) : (
          <p className="py-2 text-center text-sm text-stone-500">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Anmelden
            </Link>{' '}
            um Nachrichten zu posten.
          </p>
        )}
      </div>
    </div>
  );
}
