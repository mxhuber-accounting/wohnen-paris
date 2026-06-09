-- ── Access requests (external users asking to join) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.access_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL,
  name         text        NOT NULL,
  organization text        NOT NULL,
  message      text,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit access request"
  ON public.access_requests FOR INSERT WITH CHECK (true);

-- ── Organization column on community_posts ───────────────────────────────────
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS organization text
  CHECK (organization IN ('hec', 'sciencespo'));

-- ── Organization column on profiles ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization text;

-- ── Job postings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_postings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  company     text        NOT NULL,
  location    text,
  type        text        CHECK (type IN ('fulltime', 'internship', 'parttime', 'freelance')),
  description text        NOT NULL,
  apply_url   text,
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view jobs"
  ON public.job_postings FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');
CREATE POLICY "Authenticated users can post jobs"
  ON public.job_postings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own jobs"
  ON public.job_postings FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Sample job postings (uses the demo user from migration 002) ───────────────
INSERT INTO public.job_postings (user_id, title, company, location, type, description, apply_url)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Working Student — Strategy & Operations',
    'Blinkist',
    'Berlin (Hybrid)',
    'parttime',
    'Wir suchen einen motivierten Werkstudenten für unser Strategy & Operations Team. Du arbeitest direkt mit dem Senior Management an strategischen Initiativen und Wachstumsprojekten.

- 15–20 Std./Woche, flexibel um Vorlesungszeiten
- Einblick in alle Unternehmensbereiche
- Netzwerk in der Berliner Startup-Szene
- Vergütung: 16 €/Std.',
    'mailto:jobs@blinkist.com'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Summer Internship — Investment Banking (M&A)',
    'Deutsche Bank',
    'London, Großbritannien',
    'internship',
    'Deutsche Bank sucht ambitionierte Praktikanten für das M&A-Team in London. Ideal für Studierende kurz vor dem Abschluss mit starkem Interesse an Corporate Finance.

- Dauer: 8–10 Wochen (Juni–August)
- Vollzeit, 40 Std./Woche
- Intensive Ausbildung durch Senior Bankers
- Möglichkeit zur Übernahme ins Analyst-Programm
- Bewerbungsschluss: 15. März',
    'https://careers.db.com'
  );
