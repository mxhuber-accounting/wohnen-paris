'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Page Error]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="mb-2 font-serif text-2xl font-semibold text-foreground">Etwas ist schiefgelaufen</p>
      <p className="mb-6 text-sm text-muted">{error.message || 'Unbekannter Fehler'}</p>
      {error.digest && (
        <p className="mb-6 font-mono text-xs text-muted">Fehlercode: {error.digest}</p>
      )}
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-zinc-50"
        >
          Erneut versuchen
        </button>
        <Link href="/" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
