-- =========================================================================
-- MIGRATION: Multi-Color Product Variants
-- Run this in Supabase SQL Editor
-- =========================================================================

-- 1. Add variant columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_group_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_color text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material_type text DEFAULT '';

-- 2. Index for fast variant lookup
CREATE INDEX IF NOT EXISTS idx_products_variant_group 
  ON public.products(variant_group_id) WHERE variant_group_id IS NOT NULL;
