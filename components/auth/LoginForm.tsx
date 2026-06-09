'use client';

import { useState, useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getOrgFromEmail, looksLikeStudentEmail } from '@/lib/auth/allowed-domains';
import { requestAccess } from '@/app/actions/request-access';
import { Mail, Building2, CheckCircle, ArrowLeft } from 'lucide-react';

type Stage = 'email' | 'sent' | 'school-request' | 'landlord';

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground';
const labelClass = 'block text-sm font-medium text-foreground';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [requestState, requestAction, requesting] = useActionState(requestAccess, null);

  const domain = email.split('@')[1]?.toLowerCase() ?? '';

  function back() {
    setStage('email');
    setError('');
  }

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const org = getOrgFromEmail(email);
    if (!org) {
      setStage(looksLikeStudentEmail(email) ? 'school-request' : 'landlord');
      return;
    }

    setLoading(true);
    const { error: err } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
      },
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setStage('sent');
  }

  // Request submitted successfully
  if (requestState?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <CheckCircle className="mx-auto mb-3 text-green-600" size={28} />
        <p className="font-semibold text-green-800">Anfrage eingegangen!</p>
        <p className="mt-1 text-sm text-green-700">
          Wir melden uns per E-Mail, sobald dein Zugang freigeschaltet ist.
        </p>
      </div>
    );
  }

  // Magic link sent
  if (stage === 'sent') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Mail size={24} className="text-accent" />
        </div>
        <p className="font-serif text-lg font-semibold text-foreground">Prüfe dein Postfach</p>
        <p className="mt-2 text-sm text-muted">
          Wir haben einen Magic Link an{' '}
          <span className="font-medium text-foreground">{email}</span> gesendet.
        </p>
        <p className="mt-1 text-xs text-muted">
          Kein Passwort nötig — einfach auf den Link klicken.
        </p>
        <p className="mt-1 text-xs text-muted">Der Link ist 24 Stunden gültig.</p>
        <button onClick={back} className="mt-6 text-sm text-muted hover:text-foreground">
          Andere E-Mail verwenden
        </button>
      </div>
    );
  }

  // School not yet supported
  if (stage === 'school-request') {
    return (
      <div>
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Deine Schule ist noch nicht dabei.</strong>
          <br />
          Stell eine kurze Anfrage — wir fügen sie schnellstmöglich hinzu.
        </div>
        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="organization" value={`school:${domain}`} />
          <div>
            <label className={labelClass}>E-Mail</label>
            <input type="email" value={email} readOnly className={`${inputClass} bg-zinc-50 text-muted`} />
          </div>
          <div>
            <label htmlFor="sr-name" className={labelClass}>
              Dein Name <span className="text-red-500">*</span>
            </label>
            <input id="sr-name" name="name" type="text" required placeholder="Vorname Nachname" className={inputClass} />
          </div>
          <div>
            <label htmlFor="sr-msg" className={labelClass}>
              Deine Schule <span className="text-muted">(optional)</span>
            </label>
            <input id="sr-msg" name="message" type="text" placeholder="z. B. London Business School" className={inputClass} />
          </div>
          {requestState?.error && <p className="text-sm text-red-600">{requestState.error}</p>}
          <button type="submit" disabled={requesting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {requesting ? 'Wird gesendet…' : 'Schule anfragen →'}
          </button>
          <button type="button" onClick={back}
            className="flex w-full items-center justify-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft size={13} /> Zurück
          </button>
        </form>
      </div>
    );
  }

  // Landlord access request
  if (stage === 'landlord') {
    return (
      <div>
        <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <Building2 size={14} className="mb-0.5 mr-1 inline text-zinc-500" />
          <strong>Vermieter-Zugang</strong> ist nur auf Anfrage verfügbar.
          <br />
          Wir prüfen deinen Antrag und melden uns per E-Mail.
        </div>
        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="organization" value="vermieter" />
          <div>
            <label className={labelClass}>E-Mail</label>
            <input type="email" value={email} readOnly className={`${inputClass} bg-zinc-50 text-muted`} />
          </div>
          <div>
            <label htmlFor="ll-name" className={labelClass}>
              Dein Name <span className="text-red-500">*</span>
            </label>
            <input id="ll-name" name="name" type="text" required placeholder="Vorname Nachname" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ll-msg" className={labelClass}>
              Kurze Beschreibung <span className="text-muted">(optional)</span>
            </label>
            <textarea id="ll-msg" name="message" rows={2}
              placeholder="Welche Wohnungen bietest du an? In welcher Stadt?"
              className={`${inputClass} resize-none`} />
          </div>
          {requestState?.error && <p className="text-sm text-red-600">{requestState.error}</p>}
          <button type="submit" disabled={requesting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {requesting ? 'Wird gesendet…' : 'Zugang beantragen'}
          </button>
          <button type="button" onClick={back}
            className="flex w-full items-center justify-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft size={13} /> Zurück
          </button>
        </form>
      </div>
    );
  }

  // Default: email input
  return (
    <form onSubmit={handleSubmitEmail} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>Deine Hochschul-E-Mail</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@hec.edu"
          className={inputClass}
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
        {loading ? 'Magic Link wird gesendet…' : 'Weiter →'}
      </button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] text-muted">
            Kein Passwort · Nur verifizierte Hochschuladressen
          </span>
        </div>
      </div>

      <button type="button" onClick={() => setStage('landlord')}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground">
        <Building2 size={14} />
        Ich bin Vermieter — Zugang beantragen
      </button>
    </form>
  );
}
