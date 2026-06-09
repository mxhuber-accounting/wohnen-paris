-- 012_test_listings_loyer.sql
-- Seed 3 Paris listings with arrondissement set to test the loyer de référence feature.
-- Each shows a different price scenario: above / at / below the legal reference rent.

DO $$
DECLARE
  v_paris_id uuid;
BEGIN
  SELECT id INTO v_paris_id FROM public.cities WHERE slug = 'paris' LIMIT 1;
  IF v_paris_id IS NULL THEN RAISE EXCEPTION 'Paris city not found'; END IF;

  -- 1. Above reference — 16e, T2 meublé, 45 m², 1 650 € → ~36.7 €/m²
  --    Reference for 16e T2 meublé ≈ 27 €/m² → ~35% above → red indicator
  INSERT INTO public.listings (
    user_id, city_id, type, title, description,
    kaltmiete, nebenkosten, kaution,
    size_sqm, rooms, furnished,
    arrondissement, quartier, available_from, status
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_paris_id,
    'ganze_wohnung',
    'Helle 2-Zimmer-Wohnung — Passy / 16e',
    'Schöne möblierte Wohnung in ruhiger Lage in Passy. Großes Wohnzimmer, modernes Badezimmer, gut ausgestattete Küche. Nähe Métro Ligne 9 (Ranelagh). Ideal für ein Semester an der HEC.',
    1650, 120, 3300,
    45, 2, true,
    16, 'Passy',
    CURRENT_DATE, 'active'
  );

  -- 2. At reference — 11e, T2 meublé, 40 m², 1 100 € → ~27.5 €/m²
  --    Reference for 11e T2 meublé ≈ 27 €/m² → roughly at reference → neutral indicator
  INSERT INTO public.listings (
    user_id, city_id, type, title, description,
    kaltmiete, nebenkosten, kaution,
    size_sqm, rooms, furnished,
    arrondissement, quartier, available_from, status
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_paris_id,
    'zwischenmiete',
    'Zwischenmiete 3 Monate — Oberkampf / 11e',
    'Gemütliches möbliertes Apartment im 11. direkt am Oberkampf. Alle Möbel inklusive, schnelles WLAN. Perfekt für ein kurzes Austauschsemester. Métro Oberkampf (Ligne 5/9) vor der Tür.',
    1100, 80, 2200,
    40, 2, true,
    11, 'Oberkampf',
    CURRENT_DATE, 'active'
  );

  -- 3. Below reference — 14e, T1 meublé, 28 m², 680 € → ~24.3 €/m²
  --    Reference for 14e T1 meublé ≈ 29 €/m² → ~16% below → green indicator
  INSERT INTO public.listings (
    user_id, city_id, type, title, description,
    kaltmiete, nebenkosten, kaution,
    size_sqm, rooms, furnished,
    arrondissement, quartier, available_from, status
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_paris_id,
    'wg_zimmer',
    'WG-Zimmer in großer Studentenwohnung — Montparnasse / 14e',
    'Möbliertes Zimmer in einer 4er-WG direkt bei Montparnasse. Große Gemeinschaftsküche, schnelles WLAN. Mitbewohner sind alle internationale Studierende. Métro Gaîté (Ligne 13).',
    680, 60, 1360,
    28, 1, true,
    14, 'Montparnasse',
    CURRENT_DATE, 'active'
  );

END $$;
