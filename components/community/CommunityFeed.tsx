'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { Send, Mail } from 'lucide-react';

export type CommunityPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string;
  city_name: string | null;
  city_slug: string | null;
  organization: string | null;
};

export type City = { id: string; name: string; slug: string };

const ORG_LABELS: Record<string, string> = { hec: 'HEC Paris', sciencespo: 'Sciences Po' };

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

const AVATAR_COLORS = ['bg-zinc-200', 'bg-stone-200', 'bg-neutral-200', 'bg-slate-200'];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PostCard({ post, currentUserId }: { post: CommunityPost; currentUserId: string }) {
  const initial = (post.display_name ?? 'A')[0].toUpperCase();
  return (
    <div className="flex gap-3 border-b border-border bg-surface px-5 py-4 last:border-b-0">
      <a href={`/profil/${post.user_id}`} className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground transition-opacity hover:opacity-70 ${avatarColor(post.user_id)}`}>
        {initial}
      </a>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/profil/${post.user_id}`} className="text-sm font-semibold text-foreground hover:underline">
            {post.display_name}
          </a>
          {post.organization && (
            <span className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted">
              {ORG_LABELS[post.organization] ?? post.organization}
            </span>
          )}
          {post.city_name && (
            <span className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted">
              {post.city_name}
            </span>
          )}
          <span className="ml-auto shrink-0 text-xs text-muted">{relativeTime(post.created_at)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.body}</p>
        {post.user_id !== currentUserId && (
          <Link
            href={`/nachrichten/${post.user_id}` as any}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <Mail size={11} /> Anschreiben
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CommunityFeed({
  initialPosts,
  cities,
  currentUser,
  activeOrg,
}: {
  initialPosts: CommunityPost[];
  cities: City[];
  currentUser: { id: string; display_name: string };
  activeOrg: string | null;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [body, setBody] = useState('');
  const [cityId, setCityId] = useState(
    cities.find((c) => c.slug === 'paris')?.id ?? cities[0]?.id ?? '',
  );
  const [postOrg, setPostOrg] = useState<string>(activeOrg ?? '');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('community_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async (payload) => {
        const row = payload.new as {
          id: string; user_id: string; body: string;
          created_at: string; city_id: string | null; organization: string | null;
        };
        if (row.user_id === currentUser.id) return;
        if (activeOrg && row.organization !== activeOrg) return;

        const { data: profile } = await supabase
          .from('profiles').select('display_name').eq('id', row.user_id).single();
        const city = cities.find((c) => c.id === row.city_id) ?? null;
        setPosts((prev) => [{
          id: row.id, user_id: row.user_id, body: row.body,
          created_at: row.created_at,
          display_name: profile?.display_name ?? 'Anonym',
          city_name: city?.name ?? null, city_slug: city?.slug ?? null,
          organization: row.organization,
        }, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id, activeOrg]);

  async function submit() {
    if (!body.trim() || sending) return;
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
      organization: postOrg || null,
    };

    setPosts((prev) => [optimistic, ...prev]);
    setBody('');
    textareaRef.current?.focus();

    await supabase.from('community_posts').insert({
      user_id: currentUser.id,
      city_id: cityId || null,
      body: optimistic.body,
      organization: postOrg || null,
    });
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  const selectClass = "rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-foreground focus:outline-none";

  return (
    <div>
      {/* Composer */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={selectClass}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={postOrg} onChange={(e) => setPostOrg(e.target.value)} className={selectClass}>
            <option value="">Allgemein</option>
            <option value="hec">HEC Paris</option>
            <option value="sciencespo">Sciences Po</option>
          </select>
        </div>
        <div className="flex gap-2.5 items-end">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben…"
            maxLength={1000}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || sending}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Enter senden · Shift+Enter Zeilenumbruch</p>
      </div>

      {/* Feed */}
      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Noch keine Nachrichten. Sei der Erste!</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUser.id} />)}
        </div>
      )}
    </div>
  );
}
