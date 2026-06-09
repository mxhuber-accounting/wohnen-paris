'use client';

import { useState, useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAllowedEmail } from '@/lib/auth/allowed-domains';
import { requestAccess } from '@/app/actions/request-access';

type Stage = 'login' | 'signup' | 'request';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<Stage>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [requestState, requestAction, requesting] = useActionState(requestAccess, null);

  function switchStage(next: Stage) { setStage(next); setError(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isAllowedEmail(email)) { setStage('request'); return; }
    setLoading(true);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message.toLowerCase().includes('invalid login credentials')
        ? 'E-Mail oder Passwort falsch. Noch kein Konto? Unten registrieren.'
        : err.message);
      return;
    }
    window.location.href = '/';
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isAllowedEmail(email)) { setStage('request'); return; }
    setLoading(true);
    const { data, error: err } = await createClient().auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      if (err.message.toLowerCase().includes('user already registered')) {
        setError('Diese E-Mail ist bereits registriert. Bitte melde dich an.');
        switchStage('login');
      } else { setError(err.message); }
      return;
    }
    if (data.user && !data.session) {
      setError('Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.');
      return;
    }
    window.location.href = '/';
  }

  const inputClass = 'mt-1.5 block w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground';
  const labelClass = 'block text-sm font-medium text-foreground';

  if (requestState?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 font-medium text-green-800">Anfrage eingegangen!</p>
        <p className="mt-1 text-sm text-green-700">Wir prüfen deinen Antrag und melden uns per E-Mail.</p>
      </div>
    );
  }

  if (stage === 'request') {
    return (
      <div>
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Für externen Zugang kannst du unten einen Antrag stellen.
        </div>
        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div>
            <label className={labelClass}>E-Mail</label>
            <input type="email" value={email} readOnly className={`${inputClass} bg-zinc-50 text-muted`} />
          </div>
          <div>
            <label htmlFor="req-name" className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input id="req-name" name="name" type="text" required placeholder="Vorname Nachname" className={inputClass} />
          </div>
          <div>
            <label htmlFor="req-org" className={labelClass}>Organisation <span className="text-red-500">*</span></label>
            <input id="req-org" name="organization" type="text" required placeholder="z. B. Sciences Po, LBS …" className={inputClass} />
          </div>
          <div>
            <label htmlFor="req-msg" className={labelClass}>Kurze Vorstellung <span className="text-muted">(optional)</span></label>
            <textarea id="req-msg" name="message" rows={2} placeholder="Wer bist du und warum möchtest du Zugang?" className={`${inputClass} resize-none`} />
          </div>
          {requestState?.error && <p className="text-sm text-red-600">{requestState.error}</p>}
          <button type="submit" disabled={requesting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {requesting ? 'Wird gesendet…' : 'Zugriffsantrag stellen'}
          </button>
          <button type="button" onClick={() => switchStage('login')}
            className="w-full text-center text-sm text-muted hover:text-foreground">← Zurück</button>
        </form>
      </div>
    );
  }

  if (stage === 'signup') {
    return (
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className={labelClass}>E-Mail-Adresse</label>
          <input id="signup-email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="du@hec.edu" className={inputClass} />
        </div>
        <div>
          <label htmlFor="signup-password" className={labelClass}>
            Passwort <span className="font-normal text-muted">(mind. 8 Zeichen)</span>
          </label>
          <input id="signup-password" type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
          {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
        </button>
        <p className="text-center text-sm text-muted">
          Schon ein Konto?{' '}
          <button type="button" onClick={() => switchStage('login')} className="font-medium text-accent hover:underline">Anmelden</button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>E-Mail-Adresse</label>
        <input id="email" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="du@hec.edu" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Passwort</label>
        <input id="password" type="password" required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
        {loading ? 'Wird angemeldet…' : 'Anmelden'}
      </button>
      <p className="text-center text-sm text-muted">
        Noch kein Konto?{' '}
        <button type="button" onClick={() => switchStage('signup')} className="font-medium text-accent hover:underline">Registrieren</button>
      </p>
    </form>
  );
}
