'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} Std.`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MessageThread({
  conversationId,
  currentUserId,
  otherUserName,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    const unread = initialMessages
      .filter((m) => m.sender_id !== currentUserId && !m.read_at)
      .map((m) => m.id);

    if (unread.length > 0) {
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread)
        .then(() => {});
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === currentUserId) return; // already optimistic
          setMessages((prev) => [...prev, msg]);

          // Mark as read immediately
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', msg.id)
            .then(() => {});
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  async function sendMessage() {
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setBody('');

    // Optimistic insert
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: text,
    });

    // Update last_message_at on conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group messages by date
  type DateGroup = { date: string; messages: Message[] };
  const groups: DateGroup[] = [];
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
    const last = groups[groups.length - 1];
    if (last?.date === date) {
      last.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Link href="/nachrichten" className="rounded-md p-1 text-muted hover:bg-zinc-100 hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-foreground">
          {otherUserName[0].toUpperCase()}
        </div>
        <p className="font-semibold text-sm text-foreground">{otherUserName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {groups.length === 0 ? (
          <p className="text-center text-sm text-muted">Noch keine Nachrichten. Sag Hallo!</p>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <p className="text-xs text-muted">{group.date}</p>
                <div className="flex-1 border-t border-border" />
              </div>

              <div className="space-y-1.5">
                {group.messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'rounded-br-sm bg-accent text-white' : 'rounded-bl-sm bg-zinc-100 text-foreground'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <p className={`mt-1 text-right text-[10px] ${isMine ? 'text-zinc-400' : 'text-muted'}`}>
                          {relativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht…"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <button
            onClick={sendMessage}
            disabled={!body.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">Enter senden · Shift+Enter Zeilenumbruch</p>
      </div>
    </div>
  );
}
