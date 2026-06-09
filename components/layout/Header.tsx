'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, User, LogOut, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    window.location.href = '/';
  }

  const links = [
    { href: '/anzeigen', label: t('browse') },
    { href: '/community', label: 'Community' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/anzeige-aufgeben', label: t('post') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Wohnen Abroad
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-zinc-100 hover:text-foreground"
            >
              {label}
            </Link>
          ))}

          <div className="ml-3 flex items-center gap-1.5 border-l border-border pl-3">
            {user ? (
              <>
                <Link
                  href="/nachrichten"
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-zinc-100 hover:text-foreground"
                  title="Nachrichten"
                >
                  <MessageSquare size={16} />
                </Link>
                <Link
                  href="/profil"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-zinc-100 hover:text-foreground"
                >
                  <User size={14} />
                  <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-zinc-100 hover:text-foreground"
                  title="Abmelden"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-1.5 text-muted hover:bg-zinc-100 md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-surface px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-zinc-100"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="my-1 border-t border-border" />
            {user ? (
              <>
                <Link href="/nachrichten" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-zinc-100" onClick={() => setOpen(false)}>
                  <MessageSquare size={14} /> Nachrichten
                </Link>
                <Link href="/profil" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-zinc-100" onClick={() => setOpen(false)}>
                  <User size={14} /> Mein Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted hover:bg-zinc-100">
                  <LogOut size={14} /> Abmelden
                </button>
              </>
            ) : (
              <Link href="/login" className="mt-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-white" onClick={() => setOpen(false)}>
                {t('login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
