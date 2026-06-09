-- ============================================================
-- 003_community_posts.sql
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE community_posts (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id    uuid REFERENCES cities(id) ON DELETE SET NULL,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts are public" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime so the feed updates live for all users
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
