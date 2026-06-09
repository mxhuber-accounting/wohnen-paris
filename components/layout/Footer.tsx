import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-serif text-base font-semibold text-foreground">Wohnen Abroad</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t('tagline')}</p>
            <p className="mt-1 text-xs text-muted opacity-60">{t('hecByline')}</p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t('links')}</p>
            <ul className="space-y-2">
              {[
                { href: '/anzeigen', label: t('browse') },
                { href: '/community', label: 'Community' },
                { href: '/jobs', label: 'Jobs' },
                { href: '/anzeige-aufgeben', label: t('post') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-muted transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t('legal')}</p>
            <ul className="space-y-2">
              {[
                { href: '/impressum', label: t('impressum') },
                { href: '/datenschutz', label: t('datenschutz') },
                { href: '/agb', label: t('agb') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-muted transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Konto</p>
            <ul className="space-y-2">
              {[
                { href: '/login', label: 'Anmelden' },
                { href: '/profil', label: 'Profil' },
                { href: '/nachrichten', label: 'Nachrichten' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-muted transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <p className="text-xs text-muted">© {new Date().getFullYear()} {t('copyright')}</p>
          <p className="text-xs text-muted opacity-50">Wohnen Abroad</p>
        </div>
      </div>
    </footer>
  );
}
