import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Globe } from 'lucide-react';
import HeatmapLoader from '@/components/map/HeatmapLoader';
import type { CityStats } from '@/components/map/CommunityHeatmap';

const CITY_COORDS: Record<string, [number, number]> = {
  paris:     [48.8566, 2.3522],
  london:    [51.5074, -0.1278],
  berlin:    [52.5200, 13.4050],
  amsterdam: [52.3676, 4.9041],
  madrid:    [40.4168, -3.7038],
  milan:     [45.4642, 9.1900],
  zurich:    [47.3769, 8.5417],
  singapore: [1.3521, 103.8198],
  new_york:  [40.7128, -74.0060],
  hong_kong: [22.3193, 114.1694],
  barcelona: [41.3851, 2.1734],
  munich:    [48.1351, 11.5820],
  vienna:    [48.2082, 16.3738],
  stockholm: [59.3293, 18.0686],
};

type OrgCount = { org: string; count: number };
type CityAgg = {
  listings: Record<string, number>;
  gesuche: Record<string, number>;
  posts: Record<string, number>;
};

export default async function MapPage() {
  const supabase = await createClient();

  const [
    { data: citiesRaw },
    { data: listingRows },
    { data: gesuchRows },
    { data: postRows },
  ] = await Promise.all([
    supabase.from('cities').select('id, slug, name'),
    supabase.from('listings').select('city_id, user_id').eq('status', 'active'),
    supabase.from('looking_posts').select('city_id, user_id'),
    supabase.from('community_posts').select('city_id, user_id, organization'),
  ]);

  // Batch-fetch all profiles in one query
  const allUserIds = Array.from(new Set([
    ...(listingRows ?? []).map((r) => r.user_id),
    ...(gesuchRows ?? []).map((r) => r.user_id),
    ...(postRows ?? []).map((r) => r.user_id),
  ])).filter(Boolean);

  const { data: profiles } = allUserIds.length > 0
    ? await supabase.from('profiles').select('id, organization').in('id', allUserIds)
    : { data: [] };

  const orgByUser = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.organization ?? 'other']));
  const cityIdToSlug = Object.fromEntries((citiesRaw ?? []).map((c) => [c.id, c.slug]));

  // Aggregate per city per layer
  const agg: Record<string, CityAgg> = {};

  function init(slug: string) {
    agg[slug] ??= { listings: {}, gesuche: {}, posts: {} };
  }
  function inc(slug: string, layer: keyof CityAgg, org: string) {
    init(slug);
    agg[slug][layer][org] = (agg[slug][layer][org] ?? 0) + 1;
  }

  for (const row of listingRows ?? []) {
    const slug = cityIdToSlug[row.city_id];
    if (slug) inc(slug, 'listings', orgByUser[row.user_id] ?? 'other');
  }
  for (const row of gesuchRows ?? []) {
    const slug = cityIdToSlug[row.city_id];
    if (slug) inc(slug, 'gesuche', orgByUser[row.user_id] ?? 'other');
  }
  for (const row of postRows ?? []) {
    const slug = cityIdToSlug[row.city_id ?? ''];
    if (slug) {
      const org = row.organization ?? orgByUser[row.user_id] ?? 'other';
      inc(slug, 'posts', org);
    }
  }

  function toOrgCounts(map: Record<string, number>): OrgCount[] {
    return Object.entries(map).map(([org, count]) => ({ org, count }));
  }

  const cityStats: CityStats[] = Object.entries(agg).map(([slug, data]) => {
    const [lat, lng] = CITY_COORDS[slug] ?? [0, 0];
    const name = (citiesRaw ?? []).find((c) => c.slug === slug)?.name ?? slug;

    const listings = toOrgCounts(data.listings);
    const gesuche = toOrgCounts(data.gesuche);
    const posts = toOrgCounts(data.posts);
    const listingsTotal = listings.reduce((s, o) => s + o.count, 0);
    const gesucheTotal = gesuche.reduce((s, o) => s + o.count, 0);
    const postsTotal = posts.reduce((s, o) => s + o.count, 0);

    // Combined org totals for popup
    const orgTotals: Record<string, number> = {};
    for (const layer of [data.listings, data.gesuche, data.posts]) {
      for (const [org, n] of Object.entries(layer)) {
        orgTotals[org] = (orgTotals[org] ?? 0) + n;
      }
    }

    return {
      slug, name, lat, lng,
      listings, listingsTotal,
      gesuche, gesucheTotal,
      posts, postsTotal,
      orgs: toOrgCounts(orgTotals),
      total: listingsTotal + gesucheTotal + postsTotal,
    };
  }).filter((c) => c.lat !== 0 && c.total > 0);

  // Placeholders so the map shows at least Paris + London even before any content
  if (cityStats.length === 0) {
    const empty = (slug: string, name: string, lat: number, lng: number): CityStats => ({
      slug, name, lat, lng,
      listings: [], listingsTotal: 0,
      gesuche: [], gesucheTotal: 0,
      posts: [], postsTotal: 0,
      orgs: [], total: 0,
    });
    cityStats.push(
      empty('paris', 'Paris', 48.8566, 2.3522),
      empty('london', 'London', 51.5074, -0.1278),
    );
  }

  const totalActivity = cityStats.reduce((s, c) => s + c.total, 0);
  const topCity = [...cityStats].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex items-center justify-between border-b border-border bg-zinc-950 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/feed" className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
            <ArrowLeft size={14} /> Feed
          </Link>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-purple-400" />
            <span className="font-serif text-sm font-semibold text-white">Community Weltkarte</span>
          </div>
        </div>
        <div className="hidden items-center gap-6 text-xs text-white/50 sm:flex">
          <span><span className="font-semibold text-white">{totalActivity}</span> Aktivitäten</span>
          <span><span className="font-semibold text-white">{cityStats.filter(c => c.total > 0).length}</span> Städte</span>
          {topCity && topCity.total > 0 && (
            <span>Top: <span className="font-semibold text-white">{topCity.name}</span></span>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <HeatmapLoader cities={cityStats} />
      </div>
    </div>
  );
}
