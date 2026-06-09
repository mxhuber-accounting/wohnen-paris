'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Euro, BedDouble, Calendar, Home, MessageSquare, ExternalLink } from 'lucide-react';
import { ORG_LABEL, ORG_COLOR } from '@/lib/orgs';

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d}d`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export type ListingFeedItem = {
  kind: 'listing';
  id: string;
  title: string;
  type: 'ganze_wohnung' | 'wg_zimmer' | 'zwischenmiete';
  kaltmiete: number;
  photos: string[];
  arrondissement: number | null;
  quartier: string | null;
  city_name: string | null;
  poster_id: string;
  poster_name: string | null;
  poster_org: string | null;
  created_at: string;
};

export type PostFeedItem = {
  kind: 'post';
  id: string;
  body: string;
  user_id: string;
  display_name: string;
  city_name: string | null;
  organization: string | null;
  created_at: string;
};

export type GesuchFeedItem = {
  kind: 'gesuch';
  id: string;
  title: string;
  description: string;
  budget_max: number | null;
  rooms_min: number | null;
  available_from: string | null;
  city_name: string | null;
  user_id: string;
  poster_name: string | null;
  poster_org: string | null;
  created_at: string;
};

export type FeedItem = ListingFeedItem | PostFeedItem | GesuchFeedItem;

const TYPE_LABEL: Record<string, string> = {
  ganze_wohnung: 'Wohnung',
  wg_zimmer: 'WG-Zimmer',
  zwischenmiete: 'Zwischenmiete',
};
const TYPE_COLOR: Record<string, string> = {
  ganze_wohnung: 'bg-blue-50 text-blue-700',
  wg_zimmer: 'bg-green-50 text-green-700',
  zwischenmiete: 'bg-amber-50 text-amber-700',
};

function ListingCard({ item, currentUserId }: { item: ListingFeedItem; currentUserId: string | null }) {
  const hasPhoto = item.photos?.length > 0;
  const location = item.arrondissement != null
    ? `${item.arrondissement}. Arr.${item.quartier ? ` · ${item.quartier}` : ''}`
    : item.quartier ?? item.city_name ?? '';

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-zinc-300 hover:shadow-md">
      {hasPhoto && (
        <Link href={`/anzeigen/${item.id}` as any} className="block overflow-hidden">
          <img
            src={item.photos[0]}
            alt={item.title}
            className="aspect-[16/7] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>
      )}
      <div className={`flex items-start gap-5 p-5 ${!hasPhoto ? 'border-l-4 border-l-blue-400' : ''}`}>
        {!hasPhoto && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
            🏠
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[item.type] ?? 'bg-zinc-100 text-zinc-600'}`}>
              {TYPE_LABEL[item.type]}
            </span>
            {item.city_name && (
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{item.city_name}</span>
            )}
            <span className="ml-auto text-xs text-muted">{relTime(item.created_at)}</span>
          </div>
          <Link href={`/anzeigen/${item.id}` as any} className="group/title">
            <h3 className="line-clamp-2 font-serif text-base font-semibold text-foreground group-hover/title:text-accent">
              {item.title}
            </h3>
          </Link>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} /> {location}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link href={`/profil/${item.poster_id}` as any} className="flex items-center gap-2">
              <img src={dicebear(item.poster_id)} alt="" className="h-6 w-6 rounded-full bg-zinc-100 object-cover" />
              <span className="text-xs text-muted">{item.poster_name ?? 'Mitglied'}</span>
              {item.poster_org && (
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${ORG_COLOR[item.poster_org] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                  {ORG_LABEL[item.poster_org] ?? item.poster_org}
                </span>
              )}
            </Link>
            <p className="font-serif text-lg font-semibold text-foreground">
              {item.kaltmiete.toLocaleString('de-DE')} €
              <span className="font-sans text-xs font-normal text-muted"> /Mo.</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostCard({ item, currentUserId }: { item: PostFeedItem; currentUserId: string | null }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex gap-3">
        <Link href={`/profil/${item.user_id}` as any} className="mt-0.5 shrink-0">
          <img src={dicebear(item.user_id)} alt="" className="h-9 w-9 rounded-full bg-zinc-100 object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profil/${item.user_id}` as any} className="text-sm font-semibold text-foreground hover:underline">
              {item.display_name}
            </Link>
            {item.organization && (
              <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${ORG_COLOR[item.organization] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                {ORG_LABEL[item.organization] ?? item.organization}
              </span>
            )}
            {item.city_name && (
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">{item.city_name}</span>
            )}
            <span className="ml-auto shrink-0 text-xs text-muted">{relTime(item.created_at)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.body}</p>
          {currentUserId && currentUserId !== item.user_id && (
            <div className="mt-3 flex gap-3">
              <Link
                href={`/nachrichten/${item.user_id}` as any}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
              >
                <MessageSquare size={11} /> Anschreiben
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
              >
                <ExternalLink size={11} /> Im Chat antworten
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function GesuchCard({ item, currentUserId }: { item: GesuchFeedItem; currentUserId: string | null }) {
  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Gesuch</span>
            {item.city_name && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">{item.city_name}</span>
            )}
            <span className="ml-auto text-xs text-amber-600/70">{relTime(item.created_at)}</span>
          </div>
          <Link href={`/profil/${item.user_id}` as any} className="mb-2 flex items-center gap-2">
            <img src={dicebear(item.user_id)} alt="" className="h-7 w-7 rounded-full bg-amber-100 object-cover" />
            <span className="text-sm font-semibold text-foreground">{item.poster_name ?? 'Mitglied'}</span>
            {item.poster_org && (
              <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${ORG_COLOR[item.poster_org] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                {ORG_LABEL[item.poster_org] ?? item.poster_org}
              </span>
            )}
          </Link>
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-amber-700">
            {item.budget_max && (
              <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5">
                <Euro size={10} /> bis {item.budget_max.toLocaleString('de-DE')} €/Mo.
              </span>
            )}
            {item.rooms_min && (
              <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5">
                <BedDouble size={10} /> min. {item.rooms_min} Zi.
              </span>
            )}
            {item.available_from && (
              <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5">
                <Calendar size={10} /> {new Date(item.available_from).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        {currentUserId && currentUserId !== item.user_id && (
          <Link
            href={`/nachrichten/${item.user_id}` as any}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 hover:border-amber-400 hover:bg-amber-50"
          >
            <MessageSquare size={12} /> Schreiben
          </Link>
        )}
      </div>
    </article>
  );
}

export default function ActivityFeed({
  initialItems,
  currentUserId,
  cities,
}: {
  initialItems: FeedItem[];
  currentUserId: string | null;
  cities: { id: string; name: string }[];
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [filterKind, setFilterKind] = useState<'all' | 'listing' | 'post' | 'gesuch'>('all');
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('activity_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        async (payload) => {
          const row = payload.new as {
            id: string; user_id: string; body: string;
            created_at: string; city_id: string | null; organization: string | null;
          };
          if (row.user_id === currentUserId) return;
          const { data: profile } = await supabase
            .from('profiles').select('display_name').eq('id', row.user_id).single();
          const city = cities.find((c) => c.id === row.city_id) ?? null;
          const newItem: PostFeedItem = {
            kind: 'post',
            id: row.id,
            body: row.body,
            user_id: row.user_id,
            display_name: profile?.display_name ?? 'Mitglied',
            city_name: city?.name ?? null,
            organization: row.organization,
            created_at: row.created_at,
          };
          setItems((prev) => [newItem, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const visible = filterKind === 'all' ? items : items.filter((i) => i.kind === filterKind);

  const filterBtn = (kind: typeof filterKind, label: string) => (
    <button
      onClick={() => setFilterKind(kind)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterKind === kind ? 'bg-foreground text-background' : 'border border-border text-muted hover:border-foreground hover:text-foreground'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        {filterBtn('all', 'Alles')}
        {filterBtn('listing', 'Anzeigen')}
        {filterBtn('post', 'Community')}
        {filterBtn('gesuch', 'Gesuche')}
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="py-24 text-center text-sm text-muted">Noch keine Aktivität.</div>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => {
            if (item.kind === 'listing') return <ListingCard key={`l-${item.id}`} item={item} currentUserId={currentUserId} />;
            if (item.kind === 'post') return <PostCard key={`p-${item.id}`} item={item} currentUserId={currentUserId} />;
            return <GesuchCard key={`g-${item.id}`} item={item} currentUserId={currentUserId} />;
          })}
        </div>
      )}
    </div>
  );
}
