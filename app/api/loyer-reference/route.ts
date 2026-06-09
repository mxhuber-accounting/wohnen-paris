import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
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

const fetchLoyerData = unstable_cache(async (): Promise<LoyerData> => {
  // Dataset ID: "Encadrement des loyers de Paris" on data.gouv.fr
  const DATASET_ID = '62a7243912f22dbff558476d';

  const [geoRes, metaRes] = await Promise.all([
    fetch('https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arrondissements/exports/geojson?lang=fr'),
    fetch(`https://www.data.gouv.fr/api/1/datasets/${DATASET_ID}/`),
  ]);

  if (!geoRes.ok) throw new Error(`GeoJSON: ${geoRes.status}`);
  if (!metaRes.ok) throw new Error(`data.gouv.fr: ${metaRes.status}`);

  const [geoJson, meta] = await Promise.all([geoRes.json(), metaRes.json()]);

  const resources: any[] = meta.resources ?? [];
  const csv = resources
    .filter(r => (r.format ?? '').toLowerCase() === 'csv')
    .sort((a, b) => new Date(b.last_modified ?? 0).getTime() - new Date(a.last_modified ?? 0).getTime())[0];

  if (!csv?.url) throw new Error('No CSV found in dataset');

  const csvRes = await fetch(csv.url);
  if (!csvRes.ok) throw new Error(`CSV: ${csvRes.status}`);
  const rows = parseCsv(await csvRes.text());

  const byArrondissement: Record<number, RentRow[]> = {};

  for (const row of rows) {
    let arr = 0;

    const idZone = parseInt(row['id_zone'] ?? row['num_zone'] ?? '');
    if (!isNaN(idZone) && idZone >= 1 && idZone <= 20) {
      arr = idZone;
    } else {
      const name = row['nom_quartier'] ?? row['libelle'] ?? row['zone'] ?? '';
      const m1 = name.match(/paris\s+(\d{1,2})/i);
      if (m1) arr = parseInt(m1[1]);
      else {
        const m2 = name.match(/75(\d{3})/);
        if (m2) arr = parseInt(m2[1]);
      }
    }

    if (arr < 1 || arr > 20) continue;

    const pieces = Math.min(parseInt(row['piece'] ?? row['nb_piece'] ?? '0') || 0, 4);
    if (pieces === 0) continue;

    const meubleTxt = (row['meuble_txt'] ?? row['meuble'] ?? '').toLowerCase();
    const meuble = meubleTxt.includes('meublé') || meubleTxt.includes('meuble') || meubleTxt === '1';

    byArrondissement[arr] ??= [];
    byArrondissement[arr].push({
      pieces,
      meuble,
      epoque: row['epoque'] ?? '',
      ref:     toNum(row['ref'] ?? ''),
      ref_maj: toNum(row['max'] ?? row['ref_max'] ?? row['ref_maj'] ?? ''),
      ref_min: toNum(row['min'] ?? row['ref_min'] ?? ''),
    });
  }

  const year = new Date(csv.last_modified ?? Date.now()).getFullYear();
  return { geoJson, byArrondissement, year };
}, ['loyer-reference-v2'], { revalidate: 86400 });

export async function GET() {
  try {
    return NextResponse.json(await fetchLoyerData());
  } catch (err) {
    console.error('[loyer-reference]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
