import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { Briefcase, MapPin, Plus } from 'lucide-react';

export async function generateMetadata() {
  return { title: 'Jobs — Wohnen Abroad' };
}

const TYPE_LABEL: Record<string, string> = {
  fulltime: 'Vollzeit',
  internship: 'Praktikum',
  parttime: 'Werkstudent',
  freelance: 'Freelance',
};
const TYPE_BADGE: Record<string, string> = {
  fulltime: 'bg-blue-50 text-blue-700',
  internship: 'bg-green-50 text-green-700',
  parttime: 'bg-amber-50 text-amber-700',
  freelance: 'bg-purple-50 text-purple-700',
};

function relativeDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, company, location, type, description, apply_url, created_at, user_id')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Jobs</h1>
          <p className="mt-2 text-sm text-stone-500">
            Stellenanzeigen aus dem deutschsprachigen Netzwerk — nur für Mitglieder.
          </p>
        </div>
        <Link
          href="/jobs/neu"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} /> Job posten
        </Link>
      </div>

      <div className="space-y-4">
        {(jobs ?? []).length === 0 ? (
          <p className="py-16 text-center text-stone-400">
            Noch keine Stellenanzeigen. Sei der Erste!
          </p>
        ) : (
          (jobs ?? []).map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-stone-200 bg-white px-6 py-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {job.type && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[job.type] ?? 'bg-stone-100 text-stone-600'}`}>
                        {TYPE_LABEL[job.type] ?? job.type}
                      </span>
                    )}
                    <span className="text-xs text-stone-400">{relativeDate(job.created_at)}</span>
                  </div>
                  <h2 className="mt-1.5 font-serif text-lg font-semibold text-stone-900">
                    {job.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} /> {job.company}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {job.location}
                      </span>
                    )}
                  </div>
                </div>
                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    Bewerben
                  </a>
                )}
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                {job.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
