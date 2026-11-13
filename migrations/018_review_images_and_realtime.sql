-- =========================================================================
-- MIGRATION 018: Customer Review Images, Status & Supabase Realtime
-- Run this in the Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Add images array column to reviews table if not exists
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'Customer';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'Approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean DEFAULT false;

-- 2. Enable Realtime replication on reviews table for instant cross-client updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
END $$;

-- 3. Row Level Security (RLS) policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
CREATE POLICY "Public can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete reviews" ON public.reviews;
CREATE POLICY "Allow delete reviews"
  ON public.reviews FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow update reviews" ON public.reviews;
CREATE POLICY "Allow update reviews"
  ON public.reviews FOR UPDATE
  USING (true);

