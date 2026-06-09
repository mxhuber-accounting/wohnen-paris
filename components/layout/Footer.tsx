import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-serif text-lg font-semibold text-stone-900">Wohnen Abroad</p>
            <p className="mt-2 text-sm text-stone-500">{t('tagline')}</p>
            <p className="mt-1 text-xs text-stone-400">{t('hecByline')}</p>
          </div>

          {/* Nav links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('links')}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/anzeigen" className="text-sm text-stone-600 hover:text-stone-900">
                  {t('browse')}
                </Link>
              </li>
              <li>
                <Link href="/anzeige-aufgeben" className="text-sm text-stone-600 hover:text-stone-900">
                  {t('post')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t('legal')}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/impressum" className="text-sm text-stone-600 hover:text-stone-900">
                  {t('impressum')}
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-sm text-stone-600 hover:text-stone-900">
                  {t('datenschutz')}
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-sm text-stone-600 hover:text-stone-900">
                  {t('agb')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-200 pt-6">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
