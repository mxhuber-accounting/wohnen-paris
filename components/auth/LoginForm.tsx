'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground';
const labelClass = 'block text-sm font-medium text-foreground';

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      router.push('/feed');
      router.refresh();
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed` },
      });
      if (err) { setError(err.message); setLoading(false); return; }
      // Supabase sends a confirmation email — sign in directly if confirmations are off
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) {
        router.push('/feed');
        router.refresh();
      } else {
        setError('Bitte bestätige deine E-Mail und melde dich dann an.');
        setLoading(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>E-Mail</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="du@example.com"
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>Passwort</label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mindestens 6 Zeichen"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading
          ? '…'
          : mode === 'signin' ? 'Anmelden' : 'Registrieren'}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === 'signin' ? (
          <>Noch kein Konto?{' '}
            <button type="button" onClick={() => { setMode('signup'); setError(''); }}
              className="font-medium text-foreground hover:underline">
              Registrieren
            </button>
          </>
        ) : (
          <>Bereits registriert?{' '}
            <button type="button" onClick={() => { setMode('signin'); setError(''); }}
              className="font-medium text-foreground hover:underline">
              Anmelden
            </button>
          </>
        )}
      </p>
    </form>
  );
}
