'use client';

import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import type { CityStats } from './CommunityHeatmap';

const CommunityHeatmap = dynamic(
  () => import('./CommunityHeatmap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Globe size={32} className="mx-auto mb-3 animate-pulse text-purple-400" />
          <p className="text-sm text-white/50">Karte wird geladen…</p>
        </div>
      </div>
    ),
  }
);

export default function HeatmapLoader({ cities }: { cities: CityStats[] }) {
  return <CommunityHeatmap cities={cities} />;
}
