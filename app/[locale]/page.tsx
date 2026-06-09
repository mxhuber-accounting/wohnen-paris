import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, MessageSquare, MapPin, Search, Shield } from 'lucide-react';
import FaqAccordion from '@/components/landing/FaqAccordion';

export default async function LandingPage() {
  const t = await getTranslations('landing');

  return (
    <>
      {/* Hero */}
      <section className="bg-white px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            {t('hero.title')}
            <br />
            <span className="text-accent">{t('hero.titleAccent')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-500">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/anzeigen"
              className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              {t('hero.ctaBrowse')}
            </Link>
            <Link
              href="/anzeige-aufgeben"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-6 py-3.5 text-base font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 sm:w-auto"
            >
              {t('hero.ctaPost')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-stone-200 bg-stone-50 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-serif text-3xl font-semibold text-stone-900">150+</p>
            <p className="mt-1 text-sm text-stone-500">{t('stats.listings')}</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-semibold text-stone-900">20</p>
            <p className="mt-1 text-sm text-stone-500">{t('stats.arrondissements')}</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-semibold text-stone-900">0 €</p>
            <p className="mt-1 text-sm text-stone-500">{t('stats.free')}</p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-semibold text-stone-900">
            {t('values.title')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-100 p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-accent">
                <MessageSquare size={22} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">{t('values.v1Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{t('values.v1Desc')}</p>
            </div>
            <div className="rounded-xl border border-stone-100 p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-accent">
                <MapPin size={22} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">{t('values.v2Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{t('values.v2Desc')}</p>
            </div>
            <div className="rounded-xl border border-stone-100 p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-accent">
                <Shield size={22} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">{t('values.v3Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{t('values.v3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-semibold text-stone-900">
            {t('howItWorks.title')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {(
              [
                { num: t('howItWorks.step1Num'), title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc'), icon: Search },
                { num: t('howItWorks.step2Num'), title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc'), icon: MessageSquare },
                { num: t('howItWorks.step3Num'), title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc'), icon: MapPin },
              ] as const
            ).map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col items-start">
                <span className="mb-4 font-serif text-5xl font-semibold text-stone-200">{num}</span>
                <h3 className="font-serif text-lg font-semibold text-stone-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center font-serif text-3xl font-semibold text-stone-900">
            {t('faq.title')}
          </h2>
          <FaqAccordion />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-accent px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-white">
            {t('cta.title')}
          </h2>
          <p className="mt-3 text-blue-100">{t('cta.subtitle')}</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-medium text-accent transition-colors hover:bg-blue-50"
          >
            {t('cta.button')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
