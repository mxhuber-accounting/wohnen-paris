'use client';

import { useState, useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { isAllowedEmail } from '@/lib/auth/allowed-domains';
import { requestAccess } from '@/app/actions/request-access';

type Stage = 'email' | 'code' | 'request';

export default function LoginForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [requestState, requestAction, requesting] = useActionState(requestAccess, null);

  // ── Step 1: send the OTP code ────────────────────────────────────────────
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isAllowedEmail(email)) {
      setStage('request');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setStage('code');
  }

  // ── Step 2: verify the 6-digit code ─────────────────────────────────────
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);

    if (err) {
      setError('Ungültiger oder abgelaufener Code. Bitte neu anfordern.');
      return;
    }
    // Session is set — reload so server components pick it up
    window.location.href = '/';
  }

  // ── Access request success ───────────────────────────────────────────────
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

  // ── Access request form ──────────────────────────────────────────────────
  if (stage === 'request') {
    return (
      <div>
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bitte verwende deine Uni-E-Mail (z.&nbsp;B. @hec.edu). Für externen Zugang kannst du
          unten einen Antrag stellen.
        </div>
        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div>
            <label className="block text-sm font-medium text-stone-700">E-Mail</label>
            <input type="email" value={email} readOnly
              className="mt-1.5 block w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-500" />
          </div>
          <div>
            <label htmlFor="req-name" className="block text-sm font-medium text-stone-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input id="req-name" name="name" type="text" required placeholder="Vorname Nachname"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="req-org" className="block text-sm font-medium text-stone-700">
              Organisation <span className="text-red-500">*</span>
            </label>
            <input id="req-org" name="organization" type="text" required
              placeholder="z. B. Sciences Po, LBS, LSE …"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="req-msg" className="block text-sm font-medium text-stone-700">
              Kurze Vorstellung <span className="text-stone-400">(optional)</span>
            </label>
            <textarea id="req-msg" name="message" rows={2}
              placeholder="Wer bist du und warum möchtest du Zugang?"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          {requestState?.error && <p className="text-sm text-red-600">{requestState.error}</p>}
          <button type="submit" disabled={requesting}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {requesting ? 'Wird gesendet…' : 'Zugriffsantrag stellen'}
          </button>
          <button type="button" onClick={() => setStage('email')}
            className="w-full text-center text-sm text-stone-400 hover:text-stone-600">
            ← Zurück
          </button>
        </form>
      </div>
    );
  }

  // ── Code entry ───────────────────────────────────────────────────────────
  if (stage === 'code') {
    return (
      <div>
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center">
          <p className="text-2xl">📬</p>
          <p className="mt-2 font-medium text-green-800">Code verschickt!</p>
          <p className="mt-1 text-sm text-green-700">
            Wir haben einen 6-stelligen Code an <strong>{email}</strong> geschickt.
          </p>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label htmlFor="otp-code" className="block text-sm font-medium text-stone-700">
              6-stelliger Code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-4 py-3 text-center text-2xl font-mono tracking-widest text-stone-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {loading ? 'Wird geprüft…' : 'Anmelden'}
          </button>

          <button type="button" onClick={() => { setStage('email'); setCode(''); setError(''); }}
            className="w-full text-center text-sm text-stone-400 hover:text-stone-600">
            ← Andere E-Mail verwenden
          </button>
        </form>
      </div>
    );
  }

  // ── Email entry ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={sendCode} className="space-y-4">
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

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
        {loading ? 'Wird gesendet…' : 'Code senden'}
      </button>

      <p className="text-center text-xs text-stone-400">Kein Passwort nötig — wir schicken dir einen Code.</p>
    </form>
  );
}
