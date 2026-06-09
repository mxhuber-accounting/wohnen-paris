import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { ORG_LABEL, ORG_COLOR, ORG_GRADIENT, ORG_EMOJI } from '@/lib/orgs';
import { Users, Home, MessageSquare, ChevronRight } from 'lucide-react';

function dicebear(userId: string) {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export default async function SchulenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch member counts per org
  const { data: memberRows } = await supabase
    .from('profiles')
    .select('id, organization, display_name, avatar_url, occupation');

  // Fetch listing counts per poster org
  const { data: listingRows } = await supabase
    .from('listings')
    .select('user_id')
    .eq('status', 'active');

  // Build lookup: org → members
  type MemberRow = { id: string; organization: string | null; display_name: string | null; avatar_url: string | null; occupation: string | null };
  const byOrg: Record<string, MemberRow[]> = {};
  for (const m of memberRows ?? []) {
    const o = m.organization ?? 'other';
    byOrg[o] ??= [];
    byOrg[o].push(m);
  }

  // Build listing count per user
  const listingsByUser: Record<string, number> = {};
  for (const l of listingRows ?? []) {
    listingsByUser[l.user_id] = (listingsByUser[l.user_id] ?? 0) + 1;
  }

  // Listing count per org
  const listingsByOrg: Record<string, number> = {};
  for (const m of memberRows ?? []) {
    const o = m.organization ?? 'other';
    listingsByOrg[o] = (listingsByOrg[o] ?? 0) + (listingsByUser[m.id] ?? 0);
  }

  const schools = Object.keys(ORG_LABEL).filter((k) => k !== 'other');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">Schulen & Communities</h1>
        <p className="mt-2 text-muted">Alle Hochschulen auf Wohnen Abroad — jede mit ihrer eigenen Community.</p>
      </div>

      {/* School cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((org) => {
          const members = byOrg[org] ?? [];
          const count = members.length;
          const listings = listingsByOrg[org] ?? 0;
          const gradient = ORG_GRADIENT[org] ?? 'from-zinc-600 to-zinc-800';
          const preview = members.slice(0, 4);

          return (
            <Link
              key={org}
              href={`/community/${org}` as any}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-zinc-300 hover:shadow-md"
            >
              {/* Gradient banner */}
              <div className={`bg-gradient-to-br ${gradient} px-5 py-6`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ORG_EMOJI[org] ?? '🏫'}</span>
                  <div>
                    <h2 className="font-serif text-base font-semibold text-white leading-tight">
                      {ORG_LABEL[org]}
                    </h2>
                    <p className="mt-0.5 text-xs text-white/60">
                      {count} {count === 1 ? 'Mitglied' : 'Mitglieder'}
                    </p>
                  </div>
                </div>
                {/* Member avatar strip */}
                {preview.length > 0 && (
                  <div className="mt-4 flex -space-x-2">
                    {preview.map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar_url ?? dicebear(m.id)}
                        alt=""
                        className="h-8 w-8 rounded-full border-2 border-white/30 bg-white/10 object-cover"
                      />
                    ))}
                    {count > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-[10px] font-semibold text-white">
                        +{count - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats footer */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home size={11} /> {listings}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-accent group-hover:underline">
                  Community ansehen <ChevronRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Divider + "other" schools note */}
      <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-8 text-center">
        <p className="text-sm text-muted">
          Deine Schule fehlt?{' '}
          {user ? (
            <Link href="/profil" className="font-medium text-accent hover:underline">
              Profil bearbeiten →
            </Link>
          ) : (
            <Link href="/login" className="font-medium text-accent hover:underline">
              Jetzt anmelden →
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
