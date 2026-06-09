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
};

export default async function MapPage() {
  const supabase = await createClient();

  // Fetch city slugs + names
  const { data: citiesRaw } = await supabase
    .from('cities')
    .select('id, slug, name');

  // Fetch activity: count active listings per city per poster org
  const { data: listingActivity } = await supabase
    .from('listings')
    .select('city_id, profiles!user_id ( organization )')
    .eq('status', 'active');

  // Fetch looking posts per city per org
  const { data: gesuchActivity } = await supabase
    .from('looking_posts')
    .select('city_id, profiles!user_id ( organization )');

  // Fetch community posts per city per org
  const { data: postActivity } = await supabase
    .from('community_posts')
    .select('city_id, organization');

  const cityIdToSlug = Object.fromEntries((citiesRaw ?? []).map((c) => [c.id, c.slug]));
  const cityIdToName = Object.fromEntries((citiesRaw ?? []).map((c) => [c.id, c.name]));

  // Aggregate: citySlug → org → count
  const stats: Record<string, Record<string, number>> = {};

  function tally(cityId: string | null, org: string | null | undefined) {
    if (!cityId) return;
    const slug = cityIdToSlug[cityId];
    if (!slug) return;
    const o = org ?? 'other';
    stats[slug] ??= {};
    stats[slug][o] = (stats[slug][o] ?? 0) + 1;
  }

  for (const row of listingActivity ?? []) {
    const p = row.profiles as unknown as { organization: string | null } | null;
    tally(row.city_id, p?.organization);
  }
  for (const row of gesuchActivity ?? []) {
    const p = row.profiles as unknown as { organization: string | null } | null;
    tally(row.city_id, p?.organization);
  }
  for (const row of postActivity ?? []) {
    tally(row.city_id, row.organization);
  }

  const cityStats: CityStats[] = Object.entries(stats)
    .map(([slug, orgMap]) => {
      const [lat, lng] = CITY_COORDS[slug] ?? [0, 0];
      const orgs = Object.entries(orgMap).map(([org, count]) => ({ org, count }));
      const total = orgs.reduce((s, o) => s + o.count, 0);
      const name = (citiesRaw ?? []).find((c) => c.slug === slug)?.name ?? slug;
      return { slug, name, lat, lng, orgs, total };
    })
    .filter((c) => c.lat !== 0 && c.total > 0);

  // If no real data yet, show placeholder cities so the map looks good
  if (cityStats.length === 0) {
    cityStats.push(
      { slug: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, orgs: [{ org: 'hec', count: 0 }], total: 0 },
      { slug: 'london', name: 'London', lat: 51.5074, lng: -0.1278, orgs: [{ org: 'lbs', count: 0 }], total: 0 }
    );
  }

  const totalActivity = cityStats.reduce((s, c) => s + c.total, 0);
  const topCity = cityStats.sort((a, b) => b.total - a.total)[0];

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Top bar */}
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
          <span><span className="font-semibold text-white">{cityStats.length}</span> Städte</span>
          {topCity && topCity.total > 0 && (
            <span>Top: <span className="font-semibold text-white">{topCity.name}</span></span>
          )}
        </div>
      </div>

      {/* Full-height map */}
      <div className="relative flex-1 overflow-hidden">
        <HeatmapLoader cities={cityStats} />
      </div>
    </div>
  );
}
