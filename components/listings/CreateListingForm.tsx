'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { ImagePlus, X } from 'lucide-react';

const LISTING_TYPES = ['ganze_wohnung', 'wg_zimmer', 'zwischenmiete'] as const;

type City = { id: string; slug: string; name: string };

export default function CreateListingForm({
  userId,
  cities,
}: {
  userId: string;
  cities: City[];
}) {
  const t = useTranslations('listings');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCity = cities.find((c) => c.slug === 'paris') ?? cities[0];

  const [form, setForm] = useState({
    cityId: defaultCity?.id ?? '',
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

  const selectedCity = cities.find((c) => c.id === form.cityId);
  const isParis = selectedCity?.slug === 'paris';

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 8 - photos.length);
    setPhotos((prev) => [...prev, ...files].slice(0, 8));
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string].slice(0, 8));
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const photoUrls: string[] = [];
    if (photos.length > 0) {
      setUploading(true);
      for (const file of photos) {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, file);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }
      setUploading(false);
    }

    const { data, error: err } = await supabase
      .from('listings')
      .insert({
        user_id: userId,
        city_id: form.cityId,
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
        arrondissement: isParis && form.arrondissement ? parseInt(form.arrondissement) : null,
        quartier: form.quartier.trim() || null,
        photos: photoUrls,
        status: 'active',
      })
      .select('id')
      .single();

    if (err || !data) {
      setError(err?.message ?? 'Unbekannter Fehler');
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

      {/* City */}
      <div>
        <label htmlFor="city" className={labelClass}>Stadt</label>
        <select
          id="city"
          value={form.cityId}
          onChange={(e) => {
            set('cityId', e.target.value);
            set('arrondissement', '');
          }}
          className={inputClass}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className={labelClass}>{t('create.type')}</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
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
          <input id="kaltmiete" type="number" required min={1} max={99999}
            value={form.kaltmiete} onChange={(e) => set('kaltmiete', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="nebenkosten" className={labelClass}>{t('create.extras')}</label>
          <input id="nebenkosten" type="number" min={0} max={9999}
            value={form.nebenkosten} onChange={(e) => set('nebenkosten', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="kaution" className={labelClass}>{t('create.deposit')}</label>
          <input id="kaution" type="number" min={0} max={99999}
            value={form.kaution} onChange={(e) => set('kaution', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Size / rooms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="size_sqm" className={labelClass}>{t('create.size')}</label>
          <input id="size_sqm" type="number" min={5} max={999} step={0.5}
            value={form.size_sqm} onChange={(e) => set('size_sqm', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="rooms" className={labelClass}>{t('create.rooms')}</label>
          <input id="rooms" type="number" min={1} max={20} step={0.5}
            value={form.rooms} onChange={(e) => set('rooms', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Furnished */}
      <div className="flex items-center gap-3">
        <input id="furnished" type="checkbox" checked={form.furnished}
          onChange={(e) => set('furnished', e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-accent focus:ring-accent" />
        <label htmlFor="furnished" className={labelClass}>{t('create.furnished')}</label>
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="available_from" className={labelClass}>{t('create.availableFrom')}</label>
          <input id="available_from" type="date" required value={form.available_from}
            onChange={(e) => set('available_from', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="available_to" className={labelClass}>{t('create.availableTo')}</label>
          <input id="available_to" type="date" value={form.available_to}
            onChange={(e) => set('available_to', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isParis && (
          <div>
            <label htmlFor="arrondissement" className={labelClass}>{t('create.arrondissement')}</label>
            <input id="arrondissement" type="number" min={1} max={20}
              value={form.arrondissement} onChange={(e) => set('arrondissement', e.target.value)}
              placeholder="1 – 20" className={inputClass} />
          </div>
        )}
        <div className={isParis ? '' : 'sm:col-span-2'}>
          <label htmlFor="quartier" className={labelClass}>
            {isParis ? t('create.quartier') : 'Viertel / Stadtteil'}
          </label>
          <input id="quartier" type="text" maxLength={80}
            placeholder={isParis ? 'z. B. Marais' : 'z. B. Notting Hill, Mitte, Eixample'}
            value={form.quartier} onChange={(e) => set('quartier', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className={labelClass}>
          Fotos <span className="font-normal text-stone-400">(bis zu 8)</span>
        </label>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          multiple className="hidden" onChange={handlePhotoSelect} />

        {photoPreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square">
                <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white hover:bg-red-600">
                  <X size={10} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">Titelbild</span>
                )}
              </div>
            ))}
          </div>
        )}

        {photos.length < 8 && (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted hover:border-foreground hover:text-foreground">
            <ImagePlus size={15} /> Foto hinzufügen
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={loading || uploading}
        className="w-full rounded-lg bg-accent px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
        {uploading ? 'Fotos werden hochgeladen…' : loading ? t('create.submitting') : t('create.submit')}
      </button>
    </form>
  );
}
