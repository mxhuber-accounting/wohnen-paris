import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Anmelden — Wohnen Abroad' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="mb-1 font-serif text-3xl font-semibold text-foreground">Anmelden</h1>
      <p className="mb-8 text-sm text-muted">Wohnen Abroad — Wohnungen für Studierende</p>

      {error === 'auth' && (
        <div className="mb-5 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Anmeldung fehlgeschlagen. Bitte versuche es erneut.
        </div>
      )}

      <LoginForm />
    </div>
  );
}
