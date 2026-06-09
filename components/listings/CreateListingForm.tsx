'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const LISTING_TYPES = ['ganze_wohnung', 'wg_zimmer', 'zwischenmiete'] as const;

export default function CreateListingForm({
  userId,
  cityId,
}: {
  userId: string;
  cityId: string;
}) {
  const t = useTranslations('listings');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'ganze_wohnung' as (typeof LISTING_TYPES)[number],
    title: '',
    description: '',
    kaltmiete: '',
    nebenkosten: '',
    kaution: '',
    size_sqm: '',
    rooms: '',
    furnished: false,
    available_from: '',
    available_to: '',
    arrondissement: '',
    quartier: '',
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('listings')
      .insert({
        user_id: userId,
        city_id: cityId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        kaltmiete: parseInt(form.kaltmiete),
        nebenkosten: form.nebenkosten ? parseInt(form.nebenkosten) : null,
        kaution: form.kaution ? parseInt(form.kaution) : null,
        size_sqm: form.size_sqm ? parseFloat(form.size_sqm) : null,
        rooms: form.rooms ? parseFloat(form.rooms) : null,
        furnished: form.furnished,
        available_from: form.available_from,
        available_to: form.available_to || null,
        arrondissement: parseInt(form.arrondissement),
        quartier: form.quartier.trim() || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (err || !data) {
      setError(err?.message ?? 'Unknown error');
      setLoading(false);
      return;
    }

    router.push(`/anzeigen/${data.id}`);
  }

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const labelClass = 'block text-sm font-medium text-stone-700';
  const hintClass = 'mt-1 text-xs text-stone-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type */}
      <div>
        <label className={labelClass}>{t('create.type')}</label>
        <div className="mt-1.5 flex gap-2 flex-wrap">
          {LISTING_TYPES.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => set('type', tp)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                form.type === tp
                  ? 'border-accent bg-accent text-white'
                  : 'border-stone-300 text-stone-700 hover:border-stone-400'
              }`}
            >
              {t(`types.${tp}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>{t('create.listingTitle')}</label>
        <input
          id="title"
          type="text"
          required
          maxLength={120}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputClass}
        />
        <p className={hintClass}>{t('create.listingTitleHint')}</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>{t('create.description')}</label>
        <textarea
          id="description"
          required
          rows={6}
          maxLength={3000}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={inputClass}
        />
        <p className={hintClass}>{t('create.descriptionHint')}</p>
      </div>

      {/* Price row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="kaltmiete" className={labelClass}>{t('create.price')}</label>
          <input
            id="kaltmiete"
            type="number"
            required
            min={1}
            max={99999}
            value={form.kaltmiete}
            onChange={(e) => set('kaltmiete', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="nebenkosten" className={labelClass}>{t('create.extras')}</label>
          <input
            id="nebenkosten"
            type="number"
            min={0}
            max={9999}
            value={form.nebenkosten}
            onChange={(e) => set('nebenkosten', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="kaution" className={labelClass}>{t('create.deposit')}</label>
          <input
            id="kaution"
            type="number"
            min={0}
            max={99999}
            value={form.kaution}
            onChange={(e) => set('kaution', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Size / rooms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="size_sqm" className={labelClass}>{t('create.size')}</label>
          <input
            id="size_sqm"
            type="number"
            min={5}
            max={999}
            step={0.5}
            value={form.size_sqm}
            onChange={(e) => set('size_sqm', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="rooms" className={labelClass}>{t('create.rooms')}</label>
          <input
            id="rooms"
            type="number"
            min={1}
            max={20}
            step={0.5}
            value={form.rooms}
            onChange={(e) => set('rooms', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Furnished */}
      <div className="flex items-center gap-3">
        <input
          id="furnished"
          type="checkbox"
          checked={form.furnished}
          onChange={(e) => set('furnished', e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-accent focus:ring-accent"
        />
        <label htmlFor="furnished" className={labelClass}>{t('create.furnished')}</label>
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="available_from" className={labelClass}>{t('create.availableFrom')}</label>
          <input
            id="available_from"
            type="date"
            required
            value={form.available_from}
            onChange={(e) => set('available_from', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="available_to" className={labelClass}>{t('create.availableTo')}</label>
          <input
            id="available_to"
            type="date"
            value={form.available_to}
            onChange={(e) => set('available_to', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="arrondissement" className={labelClass}>{t('create.arrondissement')}</label>
          <input
            id="arrondissement"
            type="number"
            required
            min={1}
            max={20}
            value={form.arrondissement}
            onChange={(e) => set('arrondissement', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="quartier" className={labelClass}>{t('create.quartier')}</label>
          <input
            id="quartier"
            type="text"
            maxLength={80}
            value={form.quartier}
            onChange={(e) => set('quartier', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? t('create.submitting') : t('create.submit')}
      </button>
    </form>
  );
}
