'use client';

import { useState, useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { isAllowedEmail } from '@/lib/auth/allowed-domains';
import { requestAccess } from '@/app/actions/request-access';

export default function LoginForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [showRequest, setShowRequest] = useState(false);

  const [requestState, requestAction, requesting] = useActionState(requestAccess, null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isAllowedEmail(email)) {
      setShowRequest(true);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (otpError) setError(otpError.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-2xl">📬</p>
        <p className="mt-3 font-medium text-green-800">{t('sentTitle')}</p>
        <p className="mt-1 text-sm text-green-700">{t('sentDesc', { email })}</p>
      </div>
    );
  }

  if (requestState?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 font-medium text-green-800">Anfrage eingegangen!</p>
        <p className="mt-1 text-sm text-green-700">
          Wir prüfen deinen Antrag und melden uns per E-Mail.
        </p>
      </div>
    );
  }

  if (showRequest) {
    return (
      <div>
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bitte verwende deine Organisations-E-Mail. Für externe Zugänge kannst du unten einen
          Antrag stellen.
        </div>

        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />

          <div>
            <label className="block text-sm font-medium text-stone-700">E-Mail</label>
            <input
              type="email"
              value={email}
              readOnly
              className="mt-1.5 block w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-500"
            />
          </div>

          <div>
            <label htmlFor="req-name" className="block text-sm font-medium text-stone-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="req-name"
              name="name"
              type="text"
              required
              placeholder="Vorname Nachname"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="req-org" className="block text-sm font-medium text-stone-700">
              Organisation <span className="text-red-500">*</span>
            </label>
            <input
              id="req-org"
              name="organization"
              type="text"
              required
              placeholder="z. B. Sciences Po, LBS, LSE …"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="req-msg" className="block text-sm font-medium text-stone-700">
              Kurze Vorstellung <span className="text-stone-400">(optional)</span>
            </label>
            <textarea
              id="req-msg"
              name="message"
              rows={2}
              placeholder="Wer bist du und warum möchtest du Zugang?"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {requestState?.error && (
            <p className="text-sm text-red-600">{requestState.error}</p>
          )}

          <button
            type="submit"
            disabled={requesting}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {requesting ? 'Wird gesendet…' : 'Zugriffsantrag stellen'}
          </button>

          <button
            type="button"
            onClick={() => setShowRequest(false)}
            className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
          >
            ← Zurück
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@hec.edu"
          className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? t('sending') : t('submit')}
      </button>

      <p className="text-center text-xs text-stone-400">{t('noPassword')}</p>
    </form>
  );
}
