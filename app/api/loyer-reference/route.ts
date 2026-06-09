import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { LoyerData, RentRow } from '@/lib/loyer-types';


function parseCsv(text: string): Record<string, string>[] {
  const sep = text.split('\n')[0].includes(';') ? ';' : ',';
  const lines = text.trim().split('\n').filter(Boolean);
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function toNum(s: string) {
  return parseFloat((s || '0').replace(',', '.')) || 0;
}

export async function GET() {
  try {
    // Both files bundled statically — no external fetches at runtime
    const geoJson = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'paris-arrondissements.geojson'), 'utf-8')
    );
    const rows = parseCsv(
      readFileSync(join(process.cwd(), 'public', 'paris-loyers.csv'), 'utf-8')
    );

    const byArrondissement: Record<number, RentRow[]> = {};

    for (const row of rows) {
      const idZone = parseInt(row['id_zone'] ?? '');
      const arr = !isNaN(idZone) && idZone >= 1 && idZone <= 20 ? idZone : 0;
      if (!arr) continue;

      const pieces = Math.min(parseInt(row['piece'] ?? '0') || 0, 4);
      if (!pieces) continue;

      const meubleTxt = (row['meuble_txt'] ?? '').toLowerCase();
      const meuble = meubleTxt.includes('meublé') || meubleTxt.includes('meuble');

      byArrondissement[arr] ??= [];
      byArrondissement[arr].push({
        pieces,
        meuble,
        epoque: row['epoque'] ?? '',
        ref:     toNum(row['ref']),
        ref_maj: toNum(row['max']),
        ref_min: toNum(row['min']),
      });
    }

    const year = 2022;
    const data: LoyerData = { geoJson, byArrondissement, year };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
    });
  } catch (err) {
    console.error('[loyer-reference]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
