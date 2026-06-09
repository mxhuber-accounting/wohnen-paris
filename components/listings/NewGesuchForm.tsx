'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type City = { id: string; name: string; slug: string };

export default function NewGesuchForm({ userId, cities }: { userId: string; cities: City[] }) {
  const [form, setForm] = useState({
    city_id: cities.find((c) => c.slug === 'paris')?.id ?? cities[0]?.id ?? '',
    title: '',
    description: '',
    budget_max: '',
    rooms_min: '',
    available_from: '',
    available_until: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('looking_posts').insert({
      user_id: userId,
      city_id: form.city_id || null,
      title: form.title.trim(),
      description: form.description.trim(),
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      rooms_min: form.rooms_min ? parseFloat(form.rooms_min) : null,
      available_from: form.available_from || null,
      available_until: form.available_until || null,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    window.location.href = '/gesuche';
  }

  const labelClass = 'block text-xs font-medium text-muted mb-1';
  const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelClass}>Stadt</label>
        <select value={form.city_id} onChange={(e) => set('city_id', e.target.value)} className={inputClass}>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Titel *</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="z. B. Suche WG-Zimmer im 11. Arr. ab Oktober"
          maxLength={100}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Beschreibung *</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Was genau suchst du? Erzähl etwas über dich und was du dir vorstellst."
          maxLength={1000}
          rows={4}
          required
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Max. Budget (€/Mo.)</label>
          <input
            type="number"
            value={form.budget_max}
            onChange={(e) => set('budget_max', e.target.value)}
            placeholder="z. B. 900"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Min. Zimmer</label>
          <input
            type="number"
            value={form.rooms_min}
            onChange={(e) => set('rooms_min', e.target.value)}
            placeholder="z. B. 1"
            min={0}
            step={0.5}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Frei ab</label>
          <input
            type="date"
            value={form.available_from}
            onChange={(e) => set('available_from', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Frei bis</label>
          <input
            type="date"
            value={form.available_until}
            onChange={(e) => set('available_until', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || !form.title.trim() || !form.description.trim()}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {saving ? 'Speichern…' : 'Gesuch veröffentlichen'}
      </button>
    </form>
  );
}
