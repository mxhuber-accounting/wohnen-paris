'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Check } from 'lucide-react';

export default function WhatsAppOptIn({
  userId,
  initial,
}: {
  userId: string;
  initial: { phone_e164: string | null; active: boolean } | null;
}) {
  const [phone, setPhone] = useState(initial?.phone_e164 ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    if (!phone.trim()) {
      // Delete subscription
      await supabase.from('whatsapp_subscriptions').delete().eq('user_id', userId);
      setSaved(true);
      setSaving(false);
      return;
    }

    const normalized = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(normalized)) {
      setError('Bitte gib eine gültige internationale Nummer an, z. B. +4915123456789');
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from('whatsapp_subscriptions').upsert(
      { user_id: userId, phone_e164: normalized, active, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={16} className="text-green-700" />
        <h3 className="text-sm font-semibold text-green-900">WhatsApp-Benachrichtigungen</h3>
      </div>
      <p className="mb-4 text-xs text-green-800 leading-relaxed">
        Erhalte eine WhatsApp-Nachricht, wenn jemand im Community-Chat postet.
        Deine Nummer wird nur für Benachrichtigungen verwendet und nicht angezeigt.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-green-900">
            Handynummer (international)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+4915123456789"
            className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-foreground placeholder-muted focus:border-green-500 focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-green-900">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-green-300 text-green-600 focus:ring-green-500"
          />
          Benachrichtigungen aktiviert
        </label>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-40"
        >
          {saved ? <><Check size={13} /> Gespeichert</> : saving ? 'Speichern…' : 'Einstellungen speichern'}
        </button>

        {!phone.trim() && initial?.phone_e164 && (
          <p className="text-xs text-green-700">Feld leeren und speichern um WhatsApp zu deaktivieren.</p>
        )}
      </div>
    </div>
  );
}
