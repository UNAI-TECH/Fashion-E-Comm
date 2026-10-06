-- =========================================================================
-- FIX: Add INSERT/UPDATE policies for coupons table
-- Run this in Supabase SQL Editor
-- =========================================================================

-- Allow authenticated users (admin) to insert coupons
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.coupons;
CREATE POLICY "Authenticated users can insert coupons"
  ON public.coupons FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users (admin) to update coupons
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;
CREATE POLICY "Authenticated users can update coupons"
  ON public.coupons FOR UPDATE
  USING (true);

-- Allow authenticated users (admin) to delete coupons
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON public.coupons;
CREATE POLICY "Authenticated users can delete coupons"
  ON public.coupons FOR DELETE
  USING (true);
