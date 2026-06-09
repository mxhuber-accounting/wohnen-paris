'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lightbulb, Plus } from 'lucide-react';

type AreaTip = {
  id: string;
  user_id: string;
  category: string;
  tip: string;
  created_at: string;
  display_name: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  food:       'Essen & Trinken',
  transport:  'Verkehr',
  shopping:   'Einkaufen',
  nightlife:  'Nightlife',
  general:    'Allgemein',
};

const CATEGORY_COLOR: Record<string, string> = {
  food:      'bg-orange-50 text-orange-700',
  transport: 'bg-blue-50 text-blue-700',
  shopping:  'bg-pink-50 text-pink-700',
  nightlife: 'bg-purple-50 text-purple-700',
  general:   'bg-zinc-100 text-zinc-600',
};

function relativeTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return 'heute';
  if (d < 7) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  if (d < 30) return `vor ${Math.floor(d / 7)} Woche${Math.floor(d / 7) === 1 ? '' : 'n'}`;
  return new Date(iso).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

export default function AreaTipsSection({
  arrondissement,
  initialTips,
  currentUserId,
}: {
  arrondissement: number;
  initialTips: AreaTip[];
  currentUserId: string | null;
}) {
  const [tips, setTips] = useState<AreaTip[]>(initialTips);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('general');
  const [tipText, setTipText] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipText.trim() || saving) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('area_tips')
      .insert({
        arrondissement,
        category,
        tip: tipText.trim(),
        user_id: currentUserId,
      })
      .select('id, user_id, category, tip, created_at')
      .single();

    if (!error && data) {
      setTips((prev) => [{ ...data, display_name: 'Du' }, ...prev]);
      setTipText('');
      setShowForm(false);
    }
    setSaving(false);
  }

  const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none';

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Insider-Tipps: {arrondissement}. Arrondissement
          </h2>
        </div>
        {currentUserId && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:border-foreground hover:text-foreground"
          >
            <Plus size={12} /> Tipp hinzufügen
          </button>
        )}
      </div>

      {/* Add tip form */}
      {showForm && currentUserId && (
        <form onSubmit={submit} className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-amber-900">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-foreground focus:border-amber-400 focus:outline-none"
            >
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-amber-900">Dein Tipp</label>
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              placeholder="Was sollte man im 11. Arr. unbedingt wissen?"
              maxLength={500}
              rows={3}
              required
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!tipText.trim() || saving}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40"
            >
              {saving ? 'Speichern…' : 'Tipp teilen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {tips.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-muted">
            Noch keine Tipps für das {arrondissement}. Arrondissement.
          </p>
          {currentUserId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-muted underline hover:text-foreground"
            >
              Ersten Tipp teilen
            </button>
          )}
          {!currentUserId && (
            <p className="mt-2 text-xs text-muted">
              <a href="/login" className="underline hover:text-foreground">Anmelden</a> um Tipps zu hinterlassen.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {tips.map((tip, i) => (
            <div key={tip.id} className={`bg-surface px-5 py-4 ${i > 0 ? 'border-t border-border' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[tip.category] ?? CATEGORY_COLOR.general}`}>
                      {CATEGORY_LABEL[tip.category] ?? tip.category}
                    </span>
                    <a href={`/profil/${tip.user_id}`} className="text-xs font-semibold text-foreground hover:underline">
                      {tip.display_name}
                    </a>
                    <span className="text-xs text-muted">{relativeTime(tip.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{tip.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
