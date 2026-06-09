import { NextRequest, NextResponse } from 'next/server';
import { PARIS_LOYERS_2025 } from '@/lib/data/paris-loyers-2025';
import { LYON_LOYERS } from '@/lib/data/lyon-loyers';
import type { RentRow } from '@/lib/loyer-types';

function buildByZone(data: readonly (readonly [number, number, number, number, number, number])[]): Record<number, RentRow[]> {
  const byZone: Record<number, RentRow[]> = {};
  for (const [zone, piece, meuble, ref, min, max] of data) {
    byZone[zone] ??= [];
    byZone[zone].push({ pieces: piece, meuble: meuble === 1, ref, ref_min: min, ref_maj: max });
  }
  return byZone;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') ?? 'paris';

  if (city === 'lyon') {
    return NextResponse.json({ byZone: buildByZone(LYON_LOYERS), year: '2025-2026', city: 'lyon' });
  }

  // Default: paris
  return NextResponse.json({ byZone: buildByZone(PARIS_LOYERS_2025), year: '2025', city: 'paris' });
}
