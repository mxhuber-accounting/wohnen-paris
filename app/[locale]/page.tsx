import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, CheckCircle, Clock, Lock, MessageSquare, Shield, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FaqAccordion from '@/components/landing/FaqAccordion';
import PartnersBanner from '@/components/landing/PartnersBanner';
import { SCHOOL_DOMAINS } from '@/lib/auth/allowed-domains';
import { ORG_LABEL, ORG_EMOJI, ORG_COLOR } from '@/lib/orgs';

const COMING_SOON_ORGS = ['essec', 'sciencespo', 'lbs', 'lse', 'escp', 'insead', 'ucl', 'imperial'];

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const supabase = await createClient();

  const activeOrgs = Object.values(SCHOOL_DOMAINS);

  const { count: totalListings } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: cities } = await supabase.from('cities').select('id, name, slug');
  const parisCity = cities?.find((c) => c.slug === 'paris');

  const { count: parisCount } = parisCity
    ? await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('city_id', parisCity.id)
    : { count: 0 };

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-surface px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1 text-xs font-medium text-muted">
            Von Studierenden, für Studierende
          </p>
          <h1 className="font-serif text-5xl font-semibold italic leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t('hero.title')}
            <br />
            <span className="not-italic">{t('hero.titleAccent')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/anzeigen"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              {t('hero.ctaBrowse')} <ArrowRight size={14} />
            </Link>
            <Link
              href="/anzeige-aufgeben"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 sm:w-auto"
            >
              {t('hero.ctaPost')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-3xl grid-cols-3 divide-x divide-border text-center">
          {[
            { value: `${totalListings ?? 0}+`, label: t('stats.listings') },
            { value: '2', label: t('stats.cities') },
            { value: '0 €', label: t('stats.free') },
          ].map(({ value, label }) => (
            <div key={label} className="px-4 py-2">
              <p className="font-serif text-3xl font-semibold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <PartnersBanner />

      {/* Verification / Trust */}
      <section className="border-b border-border bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
              <Lock size={15} className="text-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Verifizierte Community
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Wohnen Abroad ist eine geschlossene Plattform — Zugang nur mit
                verifizierter Hochschul-E-Mail. So bleibt die Community
                vertrauenswürdig: Vermieter wissen, mit echten Studierenden zu
                kommunizieren, und Studierende wissen, wer ihre Anfragen liest.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {/* Active schools */}
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Jetzt verfügbar
              </p>
              <div className="space-y-2.5">
                {activeOrgs.map((org) => (
                  <div key={org} className="flex items-center gap-2.5">
                    <CheckCircle size={14} className="shrink-0 text-green-500" />
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ORG_COLOR[org]}`}>
                      {ORG_EMOJI[org]} {ORG_LABEL[org]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming soon */}
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Demnächst
              </p>
              <div className="space-y-2.5">
                {COMING_SOON_ORGS.slice(0, 6).map((org) => (
                  <div key={org} className="flex items-center gap-2.5 opacity-50">
                    <Clock size={14} className="shrink-0 text-muted" />
                    <span className="text-xs text-muted">
                      {ORG_EMOJI[org]} {ORG_LABEL[org]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted">
            Deine Hochschule fehlt?{' '}
            <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
              Hier anfragen
            </Link>
            {' '}— wir fügen neue Schulen schrittweise hinzu.
          </p>
        </div>
      </section>

      {/* Cities */}
      <section className="border-b border-border bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {t('cities.title')}
          </h2>
          <p className="mt-1 mb-8 text-sm text-muted">Verfügbare Standorte auf der Plattform</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/anzeigen?city=paris"
              className="group flex items-center justify-between rounded-xl border border-border bg-background p-6 transition-all hover:border-foreground"
            >
              <div>
                <p className="font-serif text-xl font-semibold text-foreground">Paris</p>
                <p className="mt-0.5 text-sm text-muted">{parisCount ?? 0} aktive Anzeigen</p>
              </div>
              <ArrowRight size={15} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background p-6 opacity-40 cursor-default">
              <div>
                <p className="font-serif text-xl font-semibold text-foreground">London</p>
                <p className="mt-0.5 text-sm text-muted">{t('cities.londonSoon')}</p>
              </div>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">Bald</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-b border-border bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground">{t('values.title')}</h2>
          <p className="mt-1 mb-10 text-sm text-muted">Warum Wohnen Abroad anders ist</p>
          <div className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-3">
            {[
              { Icon: Users, title: t('values.v1Title'), desc: t('values.v1Desc') },
              { Icon: MessageSquare, title: t('values.v2Title'), desc: t('values.v2Desc') },
              { Icon: Shield, title: t('values.v3Title'), desc: t('values.v3Desc') },
            ].map(({ Icon, title, desc }, i) => (
              <div key={title} className={`bg-surface p-6 ${i > 0 ? 'border-t border-border sm:border-t-0 sm:border-l' : ''}`}>
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon size={15} className="text-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground">{t('howItWorks.title')}</h2>
          <p className="mt-1 mb-10 text-sm text-muted">In drei Schritten zur Wohnung</p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { n: '01', title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc') },
              { n: '02', title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc') },
              { n: '03', title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc') },
            ].map(({ n, title, desc }) => (
              <div key={n}>
                <p className="font-serif text-4xl font-semibold text-border">{n}</p>
                <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground">{t('faq.title')}</h2>
          <p className="mt-1 mb-8 text-sm text-muted">Häufig gestellte Fragen</p>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold italic text-white">{t('cta.title')}</h2>
          <p className="mt-3 text-sm text-zinc-400">{t('cta.subtitle')}</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100"
          >
            {t('cta.button')} <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
