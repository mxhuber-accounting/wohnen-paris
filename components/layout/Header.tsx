'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const navLinks = (
    <>
      <Link
        href="/anzeigen"
        className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        onClick={() => setOpen(false)}
      >
        {t('browse')}
      </Link>
      <Link
        href="/community"
        className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        onClick={() => setOpen(false)}
      >
        {t('community')}
      </Link>
      <Link
        href="/jobs"
        className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        onClick={() => setOpen(false)}
      >
        Jobs
      </Link>
      <Link
        href="/anzeige-aufgeben"
        className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        onClick={() => setOpen(false)}
      >
        {t('post')}
      </Link>
    </>
  );

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
          {navLinks}

          {user ? (
            <div className="ml-2 flex items-center gap-1">
              <Link
                href="/profil"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                <User size={15} />
                <span className="max-w-[120px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                title="Abmelden"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {t('login')}
            </Link>
          )}
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
            {navLinks}

            {user ? (
              <>
                <Link
                  href="/profil"
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  onClick={() => setOpen(false)}
                >
                  <User size={15} />
                  Mein Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-100"
                >
                  <LogOut size={15} />
                  Abmelden
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="mt-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                {t('login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
