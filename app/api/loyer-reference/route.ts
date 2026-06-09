import { NextResponse } from 'next/server';
import type { LoyerData, RentRow } from '@/lib/loyer-types';

const DATASET_ID = '62a7243912f22dbff558476d';

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
    const [geoRes, metaRes] = await Promise.all([
      fetch('https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arrondissements/exports/geojson?lang=fr', { cache: 'force-cache' }),
      fetch(`https://www.data.gouv.fr/api/1/datasets/${DATASET_ID}/`, { cache: 'force-cache' }),
    ]);

    if (!geoRes.ok) throw new Error(`GeoJSON: ${geoRes.status}`);
    if (!metaRes.ok) throw new Error(`data.gouv.fr: ${metaRes.status}`);

    const [geoJson, meta] = await Promise.all([geoRes.json(), metaRes.json()]);

    const resources: any[] = meta.resources ?? [];
    const csv = resources
      .filter(r => (r.format ?? '').toLowerCase() === 'csv')
      .sort((a, b) => new Date(b.last_modified ?? 0).getTime() - new Date(a.last_modified ?? 0).getTime())[0];

    if (!csv?.url) throw new Error('No CSV found in dataset');

    const csvRes = await fetch(csv.url, { cache: 'force-cache' });
    if (!csvRes.ok) throw new Error(`CSV: ${csvRes.status}`);
    const rows = parseCsv(await csvRes.text());

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

    const year = new Date(csv.last_modified ?? Date.now()).getFullYear();
    const data: LoyerData = { geoJson, byArrondissement, year };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
    });
  } catch (err) {
    console.error('[loyer-reference]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
