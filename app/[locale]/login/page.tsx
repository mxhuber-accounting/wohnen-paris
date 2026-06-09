import { getTranslations } from 'next-intl/server';
import LoginForm from '@/components/auth/LoginForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('pageTitle') };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations('auth');
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-stone-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('subtitle')}</p>
        </div>

        {(error === 'auth' || error === 'otp_expired' || error === 'access_denied') && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error === 'otp_expired' || error === 'access_denied'
              ? t('linkExpired')
              : t('error')}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
