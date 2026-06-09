import { NextResponse } from 'next/server';
import type { RentRow } from '@/lib/loyer-types';

// Pre-parsed rent data — bundled at build time, no external fetches
const RAW: { id_zone: number; piece: number; epoque: string; min: number; ref: number; max: number; meuble: boolean }[] =
  // @ts-ignore — generated from paris-loyers.csv
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/data/paris-loyers.json');

export async function GET() {
  const byArrondissement: Record<number, RentRow[]> = {};

  for (const row of RAW) {
    const arr = row.id_zone;
    if (arr < 1 || arr > 20) continue;
    byArrondissement[arr] ??= [];
    byArrondissement[arr].push({
      pieces:  row.piece,
      meuble:  row.meuble,
      epoque:  row.epoque,
      ref:     row.ref,
      ref_maj: row.max,
      ref_min: row.min,
    });
  }

  return NextResponse.json({ byArrondissement, year: 2022 });
}
