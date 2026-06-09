import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import JobPostingForm from '@/components/jobs/JobPostingForm';

export async function generateMetadata() {
  return { title: 'Job posten — Wohnen Abroad' };
}

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Job posten</h1>
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <JobPostingForm userId={user.id} />
      </div>
    </div>
  );
}
