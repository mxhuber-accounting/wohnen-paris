'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, LogOut, MessageSquare, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ORG_LABEL, ORG_COLOR_PLAIN as ORG_COLOR } from '@/lib/orgs';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; organization: string | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, organization')
          .eq('id', data.user.id)
          .single();
        setProfile(p);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
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
    { href: '/gesuche', label: 'Gesuche' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/anzeige-aufgeben', label: t('post') },
  ];

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Wohnen Abroad
        </Link>

        {/* Desktop nav */}
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

                {/* Profile button with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-zinc-100"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(user.id)}`}>
                        {initial}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    {profile?.organization && ORG_LABEL[profile.organization] && (
                      <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium lg:inline ${ORG_COLOR[profile.organization]}`}>
                        {ORG_LABEL[profile.organization]}
                      </span>
                    )}
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                        <Link
                          href={`/profil/${user.id}` as any}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-zinc-50"
                        >
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColor(user.id)}`}>
                            {initial}
                          </div>
                          Mein Profil
                        </Link>
                        <Link
                          href="/profil"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-muted hover:bg-zinc-50"
                        >
                          <Settings size={13} /> Einstellungen
                        </Link>
                        <div className="border-t border-border" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted hover:bg-zinc-50"
                        >
                          <LogOut size={13} /> Abmelden
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                {/* Profile preview in mobile */}
                <Link
                  href={`/profil/${user.id}` as any}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-zinc-100"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(user.id)}`}>
                      {initial}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    {profile?.organization && ORG_LABEL[profile.organization] && (
                      <p className="text-xs text-muted">{ORG_LABEL[profile.organization]}</p>
                    )}
                  </div>
                </Link>
                <Link href="/nachrichten" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-zinc-100" onClick={() => setOpen(false)}>
                  <MessageSquare size={14} /> Nachrichten
                </Link>
                <Link href="/profil" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted hover:bg-zinc-100" onClick={() => setOpen(false)}>
                  <Settings size={14} /> Einstellungen
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
