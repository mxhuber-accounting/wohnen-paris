import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import CreateListingForm from '@/components/listings/CreateListingForm';
import Link from 'next/link';

export async function generateMetadata() {
  const t = await getTranslations('listings');
  return { title: t('create.pageTitle') };
}

export default async function PostListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const t = await getTranslations('listings');

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
        <p className="text-stone-600">{t('create.loginRequired')}</p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {t('create.loginLink')}
        </Link>
      </div>
    );
  }

  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'paris')
    .single();

  if (!city) redirect('/');

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-serif text-3xl font-semibold text-stone-900">
        {t('create.title')}
      </h1>
      <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
        <CreateListingForm userId={user.id} cityId={city.id} />
      </div>
    </div>
  );
}
