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

function relativeDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, company, location, type, description, apply_url, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1.5 text-sm text-muted">
            Stellenanzeigen aus dem Netzwerk — nur für Mitglieder.
          </p>
        </div>
        <Link
          href="/jobs/neu"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} /> Job posten
        </Link>
      </div>

      {(jobs ?? []).length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          Noch keine Stellenanzeigen. Sei der Erste!
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {(jobs ?? []).map((job, i) => (
            <div
              key={job.id}
              className={`bg-surface px-6 py-5 transition-colors hover:bg-zinc-50 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {job.type && (
                      <span className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted">
                        {TYPE_LABEL[job.type] ?? job.type}
                      </span>
                    )}
                    <span className="text-xs text-muted">{relativeDate(job.created_at)}</span>
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-foreground">{job.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Briefcase size={11} /> {job.company}</span>
                    {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
                  </div>
                </div>
                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-zinc-50"
                  >
                    Bewerben
                  </a>
                )}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{job.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
