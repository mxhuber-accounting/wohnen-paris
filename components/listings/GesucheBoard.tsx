'use client';

import { Link } from '@/i18n/navigation';
import { MessageSquare, Euro, Calendar, BedDouble } from 'lucide-react';
import { ORG_LABEL, ORG_COLOR } from '@/lib/orgs';

type LookingPost = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_max: number | null;
  rooms_min: number | null;
  available_from: string | null;
  available_until: string | null;
  city_name: string | null;
  city_slug: string | null;
  poster_name: string | null;
  poster_org: string | null;
  created_at: string;
};

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

function relativeTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return 'heute';
  if (d === 1) return 'gestern';
  if (d < 7) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default function GesucheBoard({
  posts,
  currentUserId,
}: {
  posts: LookingPost[];
  currentUserId: string | null;
}) {
  if (posts.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted">Noch keine Gesuche — sei der Erste!</p>
        {currentUserId && (
          <Link
            href="/gesuche/neu"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Gesuch aufgeben
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => {
        const initial = (p.poster_name ?? 'A')[0].toUpperCase();
        return (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <a href={`/profil/${p.user_id}`} className="flex items-center gap-2 group">
                    <img src={dicebear(p.user_id)} alt="" className="h-7 w-7 shrink-0 rounded-full bg-zinc-100 object-cover" />
                    <span className="text-sm font-semibold text-foreground group-hover:underline">
                      {p.poster_name ?? 'Mitglied'}
                    </span>
                  </a>
                  {p.poster_org && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ORG_COLOR[p.poster_org] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                      {ORG_LABEL[p.poster_org] ?? p.poster_org}
                    </span>
                  )}
                  {p.city_name && (
                    <span className="rounded border border-border bg-background px-2 py-0.5 text-xs text-muted">
                      {p.city_name}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted">{relativeTime(p.created_at)}</span>
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-foreground">{p.title}</p>

                {/* Description */}
                <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-3">{p.description}</p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  {p.budget_max && (
                    <span className="flex items-center gap-1">
                      <Euro size={11} /> bis {p.budget_max.toLocaleString('de-DE')} €/Mo.
                    </span>
                  )}
                  {p.rooms_min && (
                    <span className="flex items-center gap-1">
                      <BedDouble size={11} /> min. {p.rooms_min} Zi.
                    </span>
                  )}
                  {(p.available_from || p.available_until) && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(p.available_from)}
                      {p.available_until ? ` – ${formatDate(p.available_until)}` : '+'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              {currentUserId && currentUserId !== p.user_id && (
                <Link
                  href={`/nachrichten/${p.user_id}` as any}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted hover:border-foreground hover:text-foreground"
                >
                  <MessageSquare size={12} /> Schreiben
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
