-- ============================================================
-- 002_multi_city_and_samples.sql
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Make arrondissement nullable (required for London listings)
ALTER TABLE listings ALTER COLUMN arrondissement DROP NOT NULL;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_arrondissement_check;
ALTER TABLE listings ADD CONSTRAINT listings_arrondissement_check
  CHECK (arrondissement IS NULL OR (arrondissement BETWEEN 1 AND 20));

-- Add London
INSERT INTO cities (name, slug, country)
VALUES ('London', 'london', 'GB')
ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────
-- Demo user for sample listings
-- ────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'demo@wohnen-abroad.com', '',
  now(), now(), now(),
  '{"display_name": "Wohnen Abroad Team"}',
  '{"provider": "email", "providers": ["email"]}',
  false, '', ''
) ON CONFLICT (id) DO NOTHING;

-- Ensure profile exists for demo user
INSERT INTO profiles (id, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Wohnen Abroad Team')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────
-- Sample Paris listings
-- ────────────────────────────────────────────────

-- 1. WG-Zimmer, 11. Arr. (République)
INSERT INTO listings (
  user_id, city_id, type, title, description,
  kaltmiete, nebenkosten, kaution,
  size_sqm, rooms, furnished,
  available_from,
  arrondissement, quartier, lat, lng, status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM cities WHERE slug = 'paris'),
  'wg_zimmer',
  'Helles WG-Zimmer nahe Place de la République',
  'Schönes, lichtdurchflutetes Zimmer in einer 4er-WG direkt neben der Place de la République. Die Wohnung ist vollständig möbliert und die Küche voll ausgestattet. Die Mitbewohner sind internationale Studenten und Berufstätige zwischen 22 und 30 Jahren. Très bonne ambiance. Métro 3, 5, 8, 9 und 11 in direkter Nähe.',
  750, 80, 1500,
  16.0, 1.0, true,
  '2026-07-01',
  11, 'République', 48.8638, 2.3636, 'active'
);

-- 2. Ganze Wohnung, 16. Arr. (Passy)
INSERT INTO listings (
  user_id, city_id, type, title, description,
  kaltmiete, nebenkosten, kaution,
  size_sqm, rooms, furnished,
  available_from,
  arrondissement, quartier, lat, lng, status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM cities WHERE slug = 'paris'),
  'ganze_wohnung',
  'Gepflegte 2-Zimmer-Wohnung in Passy, 16. Arr.',
  'Ruhige, gut gepflegte 2-Zimmer-Wohnung im begehrten Viertel Passy. Dritte Etage mit Fahrstuhl, Parkett, hohe Decken. Ideal für ein Paar oder für Homeoffice-Nutzung. Zwei Gehminuten bis zur Métro 9 (Ranelagh). Alle Läden und Restaurants des 16. sind fußläufig erreichbar.',
  1650, 120, 3300,
  52.0, 2.0, false,
  '2026-07-15',
  16, 'Passy', 48.8559, 2.2827, 'active'
);

-- 3. Zwischenmiete, 6. Arr. (Saint-Germain)
INSERT INTO listings (
  user_id, city_id, type, title, description,
  kaltmiete, nebenkosten, kaution,
  size_sqm, rooms, furnished,
  available_from, available_to,
  arrondissement, quartier, lat, lng, status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM cities WHERE slug = 'paris'),
  'zwischenmiete',
  'Möbliertes Studio in Saint-Germain-des-Prés — 3 Monate',
  'Wunderschönes möbliertes Studio im Herzen von Saint-Germain-des-Prés für 3 Monate (Juli bis September). Perfekt für Praktikanten, Sommerstudierende oder längere Besuche. Alles vorhanden — sofort einzugsbereit. Lebhaftes Viertel, tolle Restaurants, Cafés und Buchläden direkt vor der Tür.',
  1200, 60, 2400,
  35.0, 1.0, true,
  '2026-07-01', '2026-09-30',
  6, 'Saint-Germain-des-Prés', 48.8534, 2.3327, 'active'
);

-- 4. WG-Zimmer, 18. Arr. (Montmartre)
INSERT INTO listings (
  user_id, city_id, type, title, description,
  kaltmiete, nebenkosten, kaution,
  size_sqm, rooms, furnished,
  available_from,
  arrondissement, quartier, lat, lng, status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM cities WHERE slug = 'paris'),
  'wg_zimmer',
  'Gemütliches Zimmer in Montmartre-WG, toller Ausblick',
  'Wir suchen eine nette Person für unser ruhiges Zimmer in einer 3er-WG auf dem Montmartre-Hügel. Dachfenster mit traumhaftem Blick über Paris. Die WG besteht aus zwei deutschen Studierenden und einer Französin — wir sprechen untereinander meist Deutsch oder Englisch. Métro 12 (Abbesses) 5 Minuten zu Fuß.',
  650, 70, 1300,
  14.0, 1.0, true,
  '2026-07-01',
  18, 'Montmartre', 48.8867, 2.3431, 'active'
);
