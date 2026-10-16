-- ============================================================
-- Migration 008: Create decrement_stock RPC function
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Create inventory_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID DEFAULT NULL,
  change_qty INTEGER NOT NULL,
  reason TEXT DEFAULT 'purchase',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Atomic stock deduction function — prevents race conditions & overselling
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Atomic update with concurrency-safe WHERE clause
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id AND stock_quantity >= p_qty
  RETURNING stock_quantity INTO v_current_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Item is no longer available in the requested quantity.';
  END IF;

  -- Record audit trail (non-critical, wrapped in exception handler)
  BEGIN
    INSERT INTO public.inventory_transactions (product_id, change_qty, reason)
    VALUES (p_product_id, -p_qty, 'purchase');
  EXCEPTION WHEN OTHERS THEN
    -- If inventory_transactions table doesn't exist or has issues, skip silently
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO service_role;
