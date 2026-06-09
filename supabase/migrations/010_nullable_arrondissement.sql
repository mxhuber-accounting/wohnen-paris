-- Allow listings outside Paris (arrondissement becomes optional)
-- The existing CHECK still validates 1-20 for Paris; NULL is allowed for other cities
ALTER TABLE public.listings ALTER COLUMN arrondissement DROP NOT NULL;
