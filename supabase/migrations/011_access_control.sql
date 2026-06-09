-- 011_access_control.sql
-- Adds user_type to profiles and broadens the community_posts org constraint

-- user_type: controls access level
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'student'
  CHECK (user_type IN ('student', 'landlord', 'admin'));

-- Drop the old narrow constraint on community_posts.organization
-- (was limited to 'hec' and 'sciencespo' only)
ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_organization_check;

-- Allow all supported orgs + null
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_organization_check
  CHECK (organization IN (
    'hec', 'essec', 'sciencespo', 'escp', 'insead',
    'lbs', 'lse', 'ucl', 'imperial', 'other'
  ));
