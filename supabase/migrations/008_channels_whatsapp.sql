-- ── User-created Channels ────────────────────────────────────────────────────
CREATE TABLE public.channels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  slug        text        NOT NULL,
  city_id     uuid        REFERENCES public.cities(id) ON DELETE CASCADE,
  description text,
  creator_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_system   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channels_select" ON public.channels FOR SELECT USING (true);
CREATE POLICY "channels_insert" ON public.channels FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND NOT is_system);

-- Seed default system channels for each city
INSERT INTO public.channels (name, slug, city_id, is_system)
SELECT 'Allgemein', 'allgemein', id, true FROM public.cities;

INSERT INTO public.channels (name, slug, city_id, is_system)
SELECT 'Wohnungssuche', 'wohnungssuche', id, true FROM public.cities;

INSERT INTO public.channels (name, slug, city_id, is_system)
SELECT 'Tipps & Empfehlungen', 'tipps', id, true FROM public.cities;

-- ── Add channel_id to community_posts ────────────────────────────────────────
ALTER TABLE public.community_posts
  ADD COLUMN channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL;

-- ── WhatsApp opt-in subscriptions ─────────────────────────────────────────────
CREATE TABLE public.whatsapp_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_e164  text        NOT NULL CHECK (phone_e164 ~ '^\+[1-9]\d{6,14}$'),
  active      boolean     NOT NULL DEFAULT true,
  city_ids    uuid[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_select" ON public.whatsapp_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "wa_insert" ON public.whatsapp_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wa_update" ON public.whatsapp_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "wa_delete" ON public.whatsapp_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role needs full access for the Edge Function
CREATE POLICY "wa_service_select" ON public.whatsapp_subscriptions FOR SELECT
  TO service_role USING (true);
