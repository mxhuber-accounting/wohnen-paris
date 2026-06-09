'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-serif text-xl font-semibold tracking-tight text-stone-900">
            Wohnen Abroad
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/anzeigen"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            {t('browse')}
          </Link>
          <Link
            href="/community"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            {t('community')}
          </Link>
          <Link
            href="/jobs"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            Jobs
          </Link>
          <Link
            href="/anzeige-aufgeben"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            {t('post')}
          </Link>
          <Link
            href="/login"
            className="ml-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('login')}
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menü öffnen"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/anzeigen"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              onClick={() => setOpen(false)}
            >
              {t('browse')}
            </Link>
            <Link
              href="/community"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              onClick={() => setOpen(false)}
            >
              {t('community')}
            </Link>
            <Link
              href="/jobs"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              onClick={() => setOpen(false)}
            >
              Jobs
            </Link>
            <Link
              href="/anzeige-aufgeben"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              onClick={() => setOpen(false)}
            >
              {t('post')}
            </Link>
            <Link
              href="/login"
              className="mt-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {t('login')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
