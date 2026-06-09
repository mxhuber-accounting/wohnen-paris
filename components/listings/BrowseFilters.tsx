'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const PRICE_OPTIONS = [500, 800, 1000, 1200, 1500, 2000, 2500];

export default function BrowseFilters({
  current,
}: {
  current: { type?: string; arr?: string; maxPrice?: string };
}) {
  const t = useTranslations('listings');
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    if (current.type) params.set('type', current.type);
    if (current.arr) params.set('arr', current.arr);
    if (current.maxPrice) params.set('maxPrice', current.maxPrice);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

  return (
    <div className="flex flex-wrap gap-3">
      {/* Type */}
      <select
        value={current.type ?? ''}
        onChange={(e) => update('type', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allTypes')}</option>
        <option value="ganze_wohnung">{t('types.ganze_wohnung')}</option>
        <option value="wg_zimmer">{t('types.wg_zimmer')}</option>
        <option value="zwischenmiete">{t('types.zwischenmiete')}</option>
      </select>

      {/* Arrondissement */}
      <select
        value={current.arr ?? ''}
        onChange={(e) => update('arr', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allArr')}</option>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}. Arr.</option>
        ))}
      </select>

      {/* Max price */}
      <select
        value={current.maxPrice ?? ''}
        onChange={(e) => update('maxPrice', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.noPriceLimit')}</option>
        {PRICE_OPTIONS.map((p) => (
          <option key={p} value={p}>max. {p.toLocaleString('de-DE')} €</option>
        ))}
      </select>
    </div>
  );
}
