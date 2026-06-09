'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JobPostingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'internship',
    description: '', apply_url: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.from('job_postings').insert({
      user_id: userId,
      title: form.title,
      company: form.company,
      location: form.location || null,
      type: form.type,
      description: form.description,
      apply_url: form.apply_url || null,
    });

    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/jobs');
  }

  const inputClass = 'mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const labelClass = 'block text-sm font-medium text-stone-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Titel *</label>
          <input required value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Working Student — Strategy" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Unternehmen *</label>
          <input required value={form.company} onChange={(e) => set('company', e.target.value)}
            placeholder="Firma GmbH" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Standort</label>
          <input value={form.location} onChange={(e) => set('location', e.target.value)}
            placeholder="Berlin (Hybrid)" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Art der Stelle</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}
            className={inputClass}>
            <option value="internship">Praktikum</option>
            <option value="parttime">Werkstudent</option>
            <option value="fulltime">Vollzeit</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Beschreibung *</label>
        <textarea required rows={6} value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Aufgaben, Anforderungen, Konditionen…"
          className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Bewerbungslink / E-Mail</label>
        <input value={form.apply_url} onChange={(e) => set('apply_url', e.target.value)}
          placeholder="https://... oder mailto:jobs@firma.de" className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
        {loading ? 'Wird veröffentlicht…' : 'Job veröffentlichen'}
      </button>
    </form>
  );
}
