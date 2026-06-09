import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/profile/ProfileForm';

export async function generateMetadata() {
  const t = await getTranslations('profile');
  return { title: t('pageTitle') };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  const t = await getTranslations('profile');

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-serif text-3xl font-semibold text-stone-900">{t('title')}</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-6 border-b border-stone-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('email')}</p>
          <p className="mt-1 text-sm text-stone-700">{user.email}</p>
          <p className="mt-3 text-xs text-stone-400">
            {t('memberSince', {
              date: new Date(profile?.created_at ?? user.created_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }),
            })}
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
        />
      </div>
    </div>
  );
}
