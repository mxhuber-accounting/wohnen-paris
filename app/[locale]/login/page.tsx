import { getTranslations } from 'next-intl/server';
import LoginForm from '@/components/auth/LoginForm';
import { SCHOOL_DOMAINS } from '@/lib/auth/allowed-domains';
import { ORG_LABEL, ORG_EMOJI } from '@/lib/orgs';
import { CheckCircle, Clock } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('pageTitle') };
}

const COMING_SOON = ['essec', 'sciencespo', 'lbs', 'lse', 'escp', 'insead', 'ucl', 'imperial'];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const activeOrgs = Object.values(SCHOOL_DOMAINS);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">

        {/* Left: school info */}
        <div className="hidden lg:block">
          <h1 className="font-serif text-3xl font-semibold text-foreground leading-tight">
            Wohnen für
            <br />
            verifizierte Studierende
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Wohnen Abroad ist eine geschlossene Plattform. Zugang erhältst du
            automatisch mit deiner verifizierten Hochschul-E-Mail.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Jetzt verfügbar</p>
            {activeOrgs.map((org) => (
              <div key={org} className="flex items-center gap-3">
                <CheckCircle size={15} className="shrink-0 text-green-500" />
                <span className="text-sm font-medium text-foreground">
                  {ORG_EMOJI[org]} {ORG_LABEL[org]}
                </span>
                <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Aktiv
                </span>
              </div>
            ))}

            <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-muted">Demnächst</p>
            {COMING_SOON.map((org) => (
              <div key={org} className="flex items-center gap-3 opacity-50">
                <Clock size={15} className="shrink-0 text-muted" />
                <span className="text-sm text-muted">
                  {ORG_EMOJI[org]} {ORG_LABEL[org]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            <strong className="text-foreground">Vermieter?</strong> Zugang ist auf Anfrage verfügbar.
            Nutze das Formular rechts.
          </div>
        </div>

        {/* Right: form */}
        <div>
          <div className="mb-8 lg:hidden">
            <h1 className="font-serif text-3xl font-semibold text-foreground">Anmelden</h1>
            <p className="mt-2 text-sm text-muted">Nur für verifizierte Hochschuladressen.</p>
          </div>

          {error === 'not_approved' && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Diese E-Mail-Adresse ist nicht freigeschaltet. Bitte beantrage
              unten Zugang oder warte auf die Freischaltung.
            </div>
          )}
          {(error === 'auth' || error === 'otp_expired' || error === 'access_denied') && (
            <div className="mb-5 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              {error === 'otp_expired' || error === 'access_denied'
                ? 'Dein Magic Link ist abgelaufen. Bitte beantrage einen neuen.'
                : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'}
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
