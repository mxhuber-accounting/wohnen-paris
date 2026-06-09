import { NextResponse } from 'next/server';
import { PARIS_LOYERS } from '@/lib/data/paris-loyers-data';
import type { RentRow } from '@/lib/loyer-types';

// [id_zone, piece, epoque, min, ref, max, meuble(1/0)]
export async function GET() {
  const byArrondissement: Record<number, RentRow[]> = {};

  for (const [arr, piece, epoque, min, ref, max, meuble] of PARIS_LOYERS) {
    if (arr < 1 || arr > 20) continue;
    byArrondissement[arr] ??= [];
    byArrondissement[arr].push({
      pieces:  piece,
      meuble:  meuble === 1,
      epoque:  epoque as string,
      ref,
      ref_maj: max,
      ref_min: min,
    });
  }

  return NextResponse.json({ byArrondissement, year: 2022 });
}
