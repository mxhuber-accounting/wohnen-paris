import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MessageThread from '@/components/messages/MessageThread';
import type { Message } from '@/components/messages/MessageThread';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single();
  return { title: `${profile?.display_name ?? 'Nachricht'} — Wohnen Abroad` };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherUserId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.id === otherUserId) redirect('/nachrichten');

  // Load other user's profile
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', otherUserId)
    .single();

  if (!otherProfile) notFound();

  // Canonical ordering: smaller UUID is participant_a
  const [participantA, participantB] = [user.id, otherUserId].sort();

  // Find or create conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .single();

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ participant_a: participantA, participant_b: participantB })
      .select('id')
      .single();

    if (error || !created) {
      // Race condition — another request created it; fetch again
      const { data: retry } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_a', participantA)
        .eq('participant_b', participantB)
        .single();
      if (!retry) notFound();
      conversationId = retry.id;
    } else {
      conversationId = created.id;
    }
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherUserName={otherProfile.display_name ?? otherUserId.slice(0, 8)}
      initialMessages={(messages ?? []) as Message[]}
    />
  );
}
