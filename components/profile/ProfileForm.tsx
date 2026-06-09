'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Camera } from 'lucide-react';

type ProfileData = {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  nationality: string | null;
  occupation: string | null;
  organization: string | null;
  languages: string | null;
  places_lived: string | null;
  instagram: string | null;
  website: string | null;
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: ProfileData;
}) {
  const t = useTranslations('profile');
  const [form, setForm] = useState(initial);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        display_name: form.display_name,
        bio: form.bio || null,
        nationality: form.nationality || null,
        occupation: form.occupation || null,
        organization: form.organization || null,
        languages: form.languages || null,
        places_lived: form.places_lived || null,
        instagram: form.instagram || null,
        website: form.website || null,
      })
      .eq('id', userId);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const labelClass = 'block text-sm font-medium text-stone-700';
  const hintClass = 'mt-1 text-xs text-stone-400';
  const initial_char = (form.display_name || 'A')[0].toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-stone-200"
            />
          ) : (
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold ${avatarColor(userId)}`}>
              {initial_char}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-stone-700 text-white transition-colors hover:bg-stone-900 disabled:opacity-60"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-900">{form.display_name || 'Dein Name'}</p>
          <p className="text-xs text-stone-400">{uploading ? 'Wird hochgeladen…' : 'Foto ändern'}</p>
        </div>
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className={labelClass}>{t('displayName')}</label>
        <input
          id="displayName"
          type="text"
          value={form.display_name}
          onChange={(e) => set('display_name', e.target.value)}
          maxLength={60}
          className={inputClass}
        />
        <p className={hintClass}>{t('displayNameHint')}</p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>{t('bio')}</label>
        <textarea
          id="bio"
          rows={3}
          maxLength={500}
          value={form.bio ?? ''}
          onChange={(e) => set('bio', e.target.value)}
          placeholder={t('bioPlaceholder')}
          className={inputClass}
        />
        <p className={hintClass}>{(form.bio?.length ?? 0)}/500</p>
      </div>

      {/* 2-col: nationality + occupation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nationality" className={labelClass}>{t('nationality')}</label>
          <input
            id="nationality"
            type="text"
            value={form.nationality ?? ''}
            onChange={(e) => set('nationality', e.target.value)}
            placeholder="Deutsch"
            maxLength={60}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="occupation" className={labelClass}>{t('occupation')}</label>
          <input
            id="occupation"
            type="text"
            value={form.occupation ?? ''}
            onChange={(e) => set('occupation', e.target.value)}
            placeholder={t('occupationPlaceholder')}
            maxLength={80}
            className={inputClass}
          />
        </div>
      </div>

      {/* Organization */}
      <div>
        <label htmlFor="organization" className={labelClass}>Organisation / Schule</label>
        <select
          id="organization"
          value={form.organization ?? ''}
          onChange={(e) => set('organization', e.target.value)}
          className={inputClass}
        >
          <option value="">— Keine Angabe —</option>
          <option value="hec">HEC Paris</option>
          <option value="sciencespo">Sciences Po</option>
          <option value="escp">ESCP Business School</option>
          <option value="insead">INSEAD</option>
          <option value="lbs">London Business School</option>
          <option value="lse">LSE</option>
          <option value="ucl">UCL</option>
          <option value="imperial">Imperial College London</option>
          <option value="other">Andere</option>
        </select>
      </div>

      {/* Languages */}
      <div>
        <label htmlFor="languages" className={labelClass}>{t('languages')}</label>
        <input
          id="languages"
          type="text"
          value={form.languages ?? ''}
          onChange={(e) => set('languages', e.target.value)}
          placeholder="Deutsch, Englisch, Französisch"
          maxLength={120}
          className={inputClass}
        />
        <p className={hintClass}>{t('commaSeparated')}</p>
      </div>

      {/* Places lived */}
      <div>
        <label htmlFor="places_lived" className={labelClass}>{t('placesLived')}</label>
        <input
          id="places_lived"
          type="text"
          value={form.places_lived ?? ''}
          onChange={(e) => set('places_lived', e.target.value)}
          placeholder="München, Berlin, Paris"
          maxLength={200}
          className={inputClass}
        />
        <p className={hintClass}>{t('commaSeparated')}</p>
      </div>

      {/* Social */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className={labelClass}>Instagram</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">@</span>
            <input
              id="instagram"
              type="text"
              value={form.instagram ?? ''}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder="deinHandle"
              maxLength={60}
              className="block w-full rounded-lg border border-stone-300 py-2.5 pl-7 pr-4 text-sm text-stone-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        <div>
          <label htmlFor="website" className={labelClass}>{t('website')}</label>
          <input
            id="website"
            type="url"
            value={form.website ?? ''}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://..."
            maxLength={200}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? t('saving') : t('save')}
        </button>
        {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
      </div>
    </form>
  );
}
