'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const PRICE_OPTIONS = [500, 800, 1000, 1200, 1500, 2000, 2500, 3000];
const SIZE_OPTIONS = [15, 20, 30, 40, 60, 80];

const PARIS_AREAS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}. Arrondissement`,
}));

const LONDON_AREAS = [
  'Camden', 'Hackney', 'Islington', 'Shoreditch', 'Notting Hill',
  'Kensington', 'Chelsea', 'Battersea', 'Brixton', 'South Bank',
  'Canary Wharf', 'Marylebone', 'Greenwich', 'Bermondsey', 'Peckham',
];

export type FilterParams = {
  type?: string;
  city?: string;
  arr?: string;
  area?: string;
  maxPrice?: string;
  minSize?: string;
  furnished?: string;
  availableFrom?: string;
};

export default function BrowseFilters({ current }: { current: FilterParams }) {
  const t = useTranslations('listings');
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    if (current.type) params.set('type', current.type);
    if (current.city) params.set('city', current.city);
    if (current.arr) params.set('arr', current.arr);
    if (current.area) params.set('area', current.area);
    if (current.maxPrice) params.set('maxPrice', current.maxPrice);
    if (current.minSize) params.set('minSize', current.minSize);
    if (current.furnished) params.set('furnished', current.furnished);
    if (current.availableFrom) params.set('availableFrom', current.availableFrom);

    // Reset area/arr when city changes
    if (key === 'city') {
      params.delete('arr');
      params.delete('area');
    }

    if (value) params.set(key, value);
    else params.delete(key);

    router.push(`${pathname}?${params.toString()}`);
  }

  const isLondon = current.city === 'london';

  const selectClass =
    'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

  return (
    <div className="flex flex-wrap gap-2.5">
      {/* City */}
      <select
        value={current.city ?? ''}
        onChange={(e) => update('city', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allCities')}</option>
        <option value="paris">Paris</option>
        <option value="london">London</option>
      </select>

      {/* Area — changes based on city */}
      <select
        value={(isLondon ? current.area : current.arr) ?? ''}
        onChange={(e) => update(isLondon ? 'area' : 'arr', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allAreas')}</option>
        {isLondon
          ? LONDON_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))
          : PARIS_AREAS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
      </select>

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

      {/* Max price */}
      <select
        value={current.maxPrice ?? ''}
        onChange={(e) => update('maxPrice', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.noPriceLimit')}</option>
        {PRICE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            max. {p.toLocaleString('de-DE')} €
          </option>
        ))}
      </select>

      {/* Min size */}
      <select
        value={current.minSize ?? ''}
        onChange={(e) => update('minSize', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.anySize')}</option>
        {SIZE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            min. {s} m²
          </option>
        ))}
      </select>

      {/* Available from */}
      <input
        type="date"
        value={current.availableFrom ?? ''}
        onChange={(e) => update('availableFrom', e.target.value)}
        placeholder={t('filters.availableFrom')}
        className={`${selectClass} text-stone-500`}
      />

      {/* Furnished toggle */}
      <button
        type="button"
        onClick={() => update('furnished', current.furnished ? '' : 'true')}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          current.furnished
            ? 'border-accent bg-accent text-white'
            : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
        }`}
      >
        {t('filters.furnished')}
      </button>
    </div>
  );
}
