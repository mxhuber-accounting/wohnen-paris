'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { Send, Mail, Plus, X, MessageSquare, Home } from 'lucide-react';

const LISTING_KEYWORDS = [
  'vermiete', 'vermieten', 'zu vermieten', 'zimmer frei', 'wohnung frei',
  'wg-zimmer', 'wg zimmer', 'untervermiete', 'untermiete', 'zwischenmiete',
  'available', 'for rent', 'room available', 'flat available',
  'loue', 'sous-loue', 'chambre libre', 'appartement libre',
];

function detectsListing(text: string): boolean {
  const lower = text.toLowerCase();
  return LISTING_KEYWORDS.some((kw) => lower.includes(kw));
}

export type CommunityPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string;
  city_name: string | null;
  city_slug: string | null;
  organization: string | null;
  channel_id: string | null;
};

export type City = { id: string; name: string; slug: string };

export type Channel = {
  id: string;
  name: string;
  slug: string;
  city_id: string | null;
  is_system: boolean;
  creator_id: string | null;
};

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

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function PostCard({ post, currentUserId }: { post: CommunityPost; currentUserId: string }) {
  return (
    <div className="flex gap-3 border-b border-border bg-surface px-5 py-4 last:border-b-0">
      <a href={`/profil/${post.user_id}`} className="mt-0.5 shrink-0 transition-opacity hover:opacity-70">
        <img src={dicebear(post.user_id)} alt="" className="h-7 w-7 rounded-full bg-zinc-100 object-cover" />
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function CommunityFeed({
  initialPosts,
  cities,
  channels,
  currentUser,
  activeOrg,
  activeCityId,
  activeChannelId,
}: {
  initialPosts: CommunityPost[];
  cities: City[];
  channels: Channel[];
  currentUser: { id: string; display_name: string };
  activeOrg: string | null;
  activeCityId: string | null;
  activeChannelId: string | null;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [body, setBody] = useState('');
  const [postOrg, setPostOrg] = useState<string>(activeOrg ?? '');
  const [sending, setSending] = useState(false);
  const [listingPrompt, setListingPrompt] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('community_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async (payload) => {
        const row = payload.new as {
          id: string; user_id: string; body: string;
          created_at: string; city_id: string | null;
          organization: string | null; channel_id: string | null;
        };
        if (row.user_id === currentUser.id) return;
        if (activeCityId && row.city_id !== activeCityId) return;
        if (activeChannelId && row.channel_id !== activeChannelId) return;
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
          channel_id: row.channel_id,
        }, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id, activeCityId, activeChannelId, activeOrg]);

  async function submit() {
    if (!body.trim() || sending) return;
    setSending(true);

    const city = cities.find((c) => c.id === activeCityId) ?? null;
    const optimistic: CommunityPost = {
      id: `opt-${Date.now()}`,
      user_id: currentUser.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
      display_name: currentUser.display_name,
      city_name: city?.name ?? null,
      city_slug: city?.slug ?? null,
      organization: postOrg || null,
      channel_id: activeChannelId,
    };

    setPosts((prev) => [optimistic, ...prev]);
    const detectedListing = detectsListing(body.trim());
    setBody('');
    setListingPrompt(detectedListing);
    textareaRef.current?.focus();

    await supabase.from('community_posts').insert({
      user_id: currentUser.id,
      city_id: activeCityId,
      channel_id: activeChannelId,
      body: optimistic.body,
      organization: postOrg || null,
    });
    setSending(false);
  }

  async function createChannel() {
    if (!channelName.trim() || creating) return;
    setCreating(true);
    setCreateError('');

    const slug = slugify(channelName);
    const { error } = await supabase.from('channels').insert({
      name: channelName.trim(),
      slug,
      city_id: activeCityId,
      description: channelDesc.trim() || null,
      creator_id: currentUser.id,
      is_system: false,
    });

    if (error) {
      setCreateError(error.message.includes('unique') ? 'Ein Kanal mit diesem Namen existiert bereits.' : error.message);
      setCreating(false);
      return;
    }

    // Reload page to show new channel in sidebar
    const url = new URL(window.location.href);
    url.searchParams.set('channel', slug);
    window.location.href = url.toString();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  const selectClass = "rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-foreground focus:outline-none";

  return (
    <div>
      {/* WhatsApp banner */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <MessageSquare size={16} className="shrink-0 text-green-700" />
        <p className="flex-1 text-xs text-green-800">
          Community-Nachrichten können per WhatsApp benachrichtigt werden.{' '}
          <a href="/profil" className="font-semibold underline">WhatsApp einrichten →</a>
        </p>
      </div>

      {/* Create channel button */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateChannel(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:border-foreground hover:text-foreground"
        >
          <Plus size={12} /> Kanal erstellen
        </button>
      </div>

      {/* Create channel modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowCreateChannel(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-foreground">Neuer Kanal</h2>
              <button type="button" onClick={() => setShowCreateChannel(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="z. B. 11. Arrondissement"
                  maxLength={60}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Beschreibung (optional)</label>
                <input
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="Worum geht es hier?"
                  maxLength={200}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none"
                />
              </div>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <button
                type="button"
                onClick={createChannel}
                disabled={!channelName.trim() || creating}
                className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
              >
                {creating ? 'Erstellen…' : 'Kanal erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-2">
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

      {/* Listing detection prompt */}
      {listingPrompt && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Home size={15} className="shrink-0 text-blue-700" />
            <p className="text-sm text-blue-800">
              Klingt nach einem Wohnungsangebot!{' '}
              <a href="/anzeige-aufgeben" className="font-semibold underline">Anzeige aufgeben →</a>
            </p>
          </div>
          <button type="button" onClick={() => setListingPrompt(false)} className="text-blue-400 hover:text-blue-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Feed */}
      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Noch keine Nachrichten in diesem Kanal. Sei der Erste!</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUser.id} />
          ))}
        </div>
      )}
    </div>
  );
}
