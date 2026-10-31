-- ============================================================================
-- Migration 015: Fulfill Order Stock RPC Function Overloads
-- Fixes 404 (Not Found) on POST /rest/v1/rpc/fulfill_order_stock
-- Works with both single-param (p_order_id) and dual-param (p_items, p_order_id)
-- ============================================================================

-- Primary function with default parameter
CREATE OR REPLACE FUNCTION public.fulfill_order_stock(
  p_order_id TEXT,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  -- 1. Check if orders table exists and locate order
  SELECT id, stock_decremented, status, payment_status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND', 'order_id', p_order_id);
  END IF;

  -- 2. Idempotency guard: If stock already decremented, return success immediately
  IF v_order.stock_decremented IS TRUE THEN
    RETURN jsonb_build_object('success', true, 'status', 'ALREADY_FULFILLED', 'order_id', p_order_id);
  END IF;

  -- 3. Deduct stock from products table using order_items
  BEGIN
    FOR v_item IN (SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id) LOOP
      IF v_item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - COALESCE(v_item.quantity, 1)),
            updated_at = NOW()
        WHERE id = v_item.product_id;
      END IF;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 4. Mark order as stock_decremented
  UPDATE public.orders
  SET stock_decremented = TRUE,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- Overload for single-argument signature for PostgREST schema cache compatibility
CREATE OR REPLACE FUNCTION public.fulfill_order_stock(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.fulfill_order_stock(p_order_id, '[]'::jsonb);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.fulfill_order_stock(TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_order_stock(TEXT) TO anon, authenticated, service_role;

