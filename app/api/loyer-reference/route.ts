import { NextResponse } from 'next/server';
import type { LoyerData, RentRow } from '@/lib/loyer-types';
import geoJson from '@/lib/data/paris-arrondissements.json';
import loyersRaw from '@/lib/data/paris-loyers.json';

export async function GET() {
  const byArrondissement: Record<number, RentRow[]> = {};

  for (const row of loyersRaw as any[]) {
    const arr: number = row.id_zone;
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

  const data: LoyerData = { geoJson, byArrondissement, year: 2022 };
  return NextResponse.json(data);
}
