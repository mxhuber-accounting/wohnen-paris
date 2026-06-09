'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function ProfileForm({
  userId,
  initialDisplayName,
}: {
  userId: string;
  initialDisplayName: string;
}) {
  const t = useTranslations('profile');
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-stone-700">
          {t('displayName')}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-stone-400">{t('displayNameHint')}</p>
      </div>

      <div className="flex items-center gap-3">
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
