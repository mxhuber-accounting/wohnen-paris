import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/profile/ProfileForm';
import WhatsAppOptIn from '@/components/profile/WhatsAppOptIn';
import { ExternalLink } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('profile');
  return { title: t('pageTitle') };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: waSub }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, avatar_url, bio, nationality, occupation, organization, languages, places_lived, instagram, website, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('whatsapp_subscriptions')
      .select('phone_e164, active')
      .eq('user_id', user.id)
      .single(),
  ]);

  const t = await getTranslations('profile');

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-stone-900">{t('title')}</h1>
        <Link
          href={`/profil/${user.id}` as any}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
        >
          <ExternalLink size={14} />
          {t('viewPublic')}
        </Link>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-6 border-b border-stone-100 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('email')}</p>
          <p className="mt-1 text-sm text-stone-700">{user.email}</p>
          <p className="mt-2 text-xs text-stone-400">
            {t('memberSince', {
              date: new Date(profile?.created_at ?? user.created_at).toLocaleDateString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              }),
            })}
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          initial={{
            display_name: profile?.display_name ?? '',
            avatar_url: profile?.avatar_url ?? null,
            bio: profile?.bio ?? null,
            nationality: profile?.nationality ?? null,
            occupation: profile?.occupation ?? null,
            organization: profile?.organization ?? null,
            languages: profile?.languages ?? null,
            places_lived: profile?.places_lived ?? null,
            instagram: profile?.instagram ?? null,
            website: profile?.website ?? null,
          }}
        />
      </div>

      <WhatsAppOptIn
        userId={user.id}
        initial={waSub ? { phone_e164: waSub.phone_e164, active: waSub.active } : null}
      />
    </div>
  );
}
