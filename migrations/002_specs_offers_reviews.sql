-- =========================================================================
-- MIGRATION: Product Specifications, Offers & Reviews
-- Run this in Supabase SQL Editor
-- =========================================================================

-- 1. Add specifications JSONB column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}';

-- 2. Add offer/coupon fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_enabled boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_details jsonb DEFAULT '{}';

-- 3. Add product_id and extra fields to coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applicable_on text DEFAULT 'All Orders';

-- 4. Create reviews table for real customer reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL DEFAULT 'Customer',
  rating numeric(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 1 AND rating <= 5),
  comment text,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS for reviews (public read, authenticated write)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS for coupons (public read for validation)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coupons are publicly readable" ON public.coupons;
CREATE POLICY "Coupons are publicly readable"
  ON public.coupons FOR SELECT
  USING (true);
