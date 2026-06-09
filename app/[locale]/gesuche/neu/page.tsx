import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewGesuchForm from '@/components/listings/NewGesuchForm';

export async function generateMetadata() {
  return { title: 'Gesuch aufgeben — Wohnen Abroad' };
}

export default async function NewGesuchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cities } = await supabase.from('cities').select('id, name, slug').order('name');

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Gesuch aufgeben</h1>
      <div className="rounded-xl border border-border bg-surface p-6">
        <NewGesuchForm userId={user.id} cities={cities ?? []} />
      </div>
    </div>
  );
}
