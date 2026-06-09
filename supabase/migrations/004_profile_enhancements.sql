-- ============================================================
-- 004_profile_enhancements.sql
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Richer profile fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio         TEXT CHECK (char_length(bio) <= 500),
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS occupation  TEXT,
  ADD COLUMN IF NOT EXISTS languages   TEXT,   -- e.g. "Deutsch, Englisch, Französisch"
  ADD COLUMN IF NOT EXISTS places_lived TEXT,  -- e.g. "München, Berlin, Paris"
  ADD COLUMN IF NOT EXISTS instagram   TEXT,
  ADD COLUMN IF NOT EXISTS website     TEXT;

-- Storage bucket for avatars (public read, owner write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
