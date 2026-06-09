import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { MessageSquare, ArrowRight } from 'lucide-react';

export async function generateMetadata() {
  return { title: 'Nachrichten — Wohnen Abroad' };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function avatarLetter(name: string) {
  return (name ?? 'A')[0].toUpperCase();
}

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all conversations the user is in
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b, last_message_at')
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (!conversations || conversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Nachrichten</h1>
          <p className="mt-1.5 text-sm text-muted">Deine privaten Unterhaltungen</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
          <MessageSquare size={28} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm font-medium text-foreground">Noch keine Nachrichten</p>
          <p className="mt-1 text-sm text-muted">Schreibe jemanden aus der Community an.</p>
          <Link
            href="/community"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Zur Community <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  // Get the other participant's IDs
  const otherIds = conversations.map((c) =>
    c.participant_a === user.id ? c.participant_b : c.participant_a,
  );

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', otherIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Fetch last message per conversation
  const convIds = conversations.map((c) => c.id);
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('conversation_id, body, sender_id, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  const lastMessageMap = new Map<string, { body: string; sender_id: string; created_at: string }>();
  for (const msg of lastMessages ?? []) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg);
    }
  }

  // Unread count per conversation
  const { data: unreadRows } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convIds)
    .neq('sender_id', user.id)
    .is('read_at', null);

  const unreadMap = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    unreadMap.set(row.conversation_id, (unreadMap.get(row.conversation_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Nachrichten</h1>
        <p className="mt-1.5 text-sm text-muted">Deine privaten Unterhaltungen</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {conversations.map((conv, i) => {
          const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
          const profile = profileMap.get(otherId);
          const name = profile?.display_name ?? 'Unbekannt';
          const lastMsg = lastMessageMap.get(conv.id);
          const unread = unreadMap.get(conv.id) ?? 0;

          return (
            <Link
              key={conv.id}
              href={`/nachrichten/${otherId}` as any}
              className={`flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-zinc-50 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-foreground">
                {avatarLetter(name)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  {lastMsg && (
                    <p className="shrink-0 text-xs text-muted">{relativeTime(lastMsg.created_at)}</p>
                  )}
                </div>
                {lastMsg ? (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {lastMsg.sender_id === user.id ? 'Du: ' : ''}{lastMsg.body}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">Noch keine Nachrichten</p>
                )}
              </div>

              {/* Unread badge */}
              {unread > 0 && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {unread}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
