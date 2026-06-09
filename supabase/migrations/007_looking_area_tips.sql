-- ── "Ich suche" / Wanted posts ───────────────────────────────────────────────
CREATE TABLE public.looking_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id       uuid        REFERENCES public.cities(id),
  title         text        NOT NULL,
  description   text        NOT NULL,
  budget_max    int,
  rooms_min     numeric,
  available_from date,
  available_until date,
  status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filled')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.looking_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_select" ON public.looking_posts FOR SELECT USING (status = 'active');
CREATE POLICY "lp_insert" ON public.looking_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lp_update" ON public.looking_posts FOR UPDATE USING (auth.uid() = user_id);

-- ── Neighbourhood insider tips ────────────────────────────────────────────────
CREATE TABLE public.area_tips (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arrondissement int         NOT NULL,
  category       text        NOT NULL DEFAULT 'general'
                             CHECK (category IN ('food','transport','shopping','nightlife','general')),
  tip            text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.area_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "at_select" ON public.area_tips FOR SELECT USING (true);
CREATE POLICY "at_insert" ON public.area_tips FOR INSERT WITH CHECK (auth.uid() = user_id);
