import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import GesucheBoard from '@/components/listings/GesucheBoard';

export async function generateMetadata() {
  return { title: 'Gesuche — Wohnen Abroad' };
}

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

export default async function GesuchePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { city: citySlug } = await searchParams;

  const { data: cities } = await supabase.from('cities').select('id, name, slug').order('name');

  let query = supabase
    .from('looking_posts')
    .select('id, user_id, title, description, budget_max, rooms_min, available_from, available_until, created_at, city_id, cities!city_id ( name, slug )')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (citySlug) {
    const { data: city } = await supabase.from('cities').select('id').eq('slug', citySlug).single();
    if (city) query = query.eq('city_id', city.id);
  }

  const { data: raw } = await query;

  const userIds = [...new Set((raw ?? []).map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name, organization').in('id', userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const posts: LookingPost[] = (raw ?? []).map((r) => {
    const cityObj = r.cities as unknown as { name: string; slug: string } | null;
    const poster = profileMap.get(r.user_id);
    return {
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      budget_max: r.budget_max,
      rooms_min: r.rooms_min,
      available_from: r.available_from,
      available_until: r.available_until,
      city_name: cityObj?.name ?? null,
      city_slug: cityObj?.slug ?? null,
      poster_name: poster?.display_name ?? null,
      poster_org: poster?.organization ?? null,
      created_at: r.created_at,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Gesuche</h1>
          <p className="mt-1 text-sm text-muted">
            Mitglieder, die aktiv eine Wohnung suchen — melde dich direkt.
          </p>
        </div>
        {user && (
          <Link
            href="/gesuche/neu"
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Gesuch aufgeben
          </Link>
        )}
      </div>

      {/* City filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <a
          href="/gesuche"
          className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !citySlug ? 'border-foreground bg-accent text-white' : 'border-border bg-surface text-muted hover:border-zinc-400 hover:text-foreground'
          }`}
        >
          Alle Städte
        </a>
        {(cities ?? []).map((c) => (
          <a
            key={c.id}
            href={`/gesuche?city=${c.slug}`}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              citySlug === c.slug ? 'border-foreground bg-accent text-white' : 'border-border bg-surface text-muted hover:border-zinc-400 hover:text-foreground'
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

      <GesucheBoard posts={posts} currentUserId={user?.id ?? null} />
    </div>
  );
}
