-- Drop if partially created from a previous attempt
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- ── Conversations ─────────────────────────────────────────────────────────────
CREATE TABLE public.conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_a, participant_b),
  CHECK (participant_a < participant_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_select"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conv_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conv_update"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_select"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

CREATE POLICY "msg_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

CREATE POLICY "msg_update"
  ON public.messages FOR UPDATE
  USING (
    sender_id <> auth.uid()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

CREATE INDEX messages_conv_idx ON public.messages (conversation_id, created_at);
