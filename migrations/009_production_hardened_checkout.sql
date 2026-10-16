-- ============================================================================
-- Migration 009: Production Hardening for Razorpay Checkout & Stock Fulfillment
-- Idempotent, safe migration for Aanya Fashions
-- ============================================================================

-- 1. Ensure orders table has necessary columns for Razorpay & Stock Tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_decremented BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- 2. Relax payment_method check constraint to accept Razorpay, UPI, COD, etc.
DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('COD', 'Card', 'UPI', 'Net Banking', 'Cash on Delivery', 'Google Pay', 'Razorpay', 'Online'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Relax status check constraint to support e-commerce lifecycle
DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Relax payment_status check constraint
DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('Pending', 'Completed', 'Success', 'Failed', 'Refunded', 'Pending Verification'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 5. Ensure inventory_transactions table exists with proper schema
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID DEFAULT NULL,
  change_qty INTEGER NOT NULL,
  reason TEXT DEFAULT 'purchase',
  reference_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Ensure payments table exists
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT DEFAULT 'Razorpay',
    gateway_txn_id TEXT,
    payment_id TEXT,
    payer_vpa TEXT,
    status TEXT NOT NULL DEFAULT 'Initiated',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Atomic Single Product Stock Decrement Function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: Quantity must be greater than zero.';
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id AND stock_quantity >= p_qty
  RETURNING stock_quantity INTO v_current_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Item is no longer available in the requested quantity.';
  END IF;

  BEGIN
    INSERT INTO public.inventory_transactions (product_id, change_qty, reason)
    VALUES (p_product_id, -p_qty, 'purchase');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic Order Fulfillment & Stock Deduction Function
-- Ensures stock is deducted EXACTLY ONCE per order, even with duplicate webhooks / callbacks
CREATE OR REPLACE FUNCTION public.fulfill_order_stock(p_order_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_decremented BOOLEAN;
  v_insufficient_items JSONB := '[]'::jsonb;
  v_success_count INTEGER := 0;
BEGIN
  -- 1. Fetch order and check if stock was already decremented
  SELECT id, stock_decremented, status, payment_status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  IF v_order.stock_decremented = TRUE THEN
    RETURN jsonb_build_object('success', true, 'message', 'ALREADY_FULFILLED', 'decremented', false);
  END IF;

  -- 2. Decrement stock for each item in order_items
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.quantity > 0 THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
          updated_at = timezone('utc'::text, now())
      WHERE id = v_item.product_id AND stock_quantity >= v_item.quantity;

      IF FOUND THEN
        v_success_count := v_success_count + 1;
        BEGIN
          INSERT INTO public.inventory_transactions (product_id, change_qty, reason, reference_id)
          VALUES (v_item.product_id, -v_item.quantity, 'purchase', p_order_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSE
        -- Stock shortage detected
        v_insufficient_items := v_insufficient_items || jsonb_build_object(
          'product_id', v_item.product_id,
          'requested_quantity', v_item.quantity
        );
      END IF;
    END IF;
  END LOOP;

  -- 3. Mark order as stock_decremented
  UPDATE public.orders
  SET stock_decremented = TRUE,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'fulfilled_items', v_success_count,
    'insufficient_items', v_insufficient_items,
    'decremented', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Permissions
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_order_stock(TEXT) TO anon, authenticated, service_role;

-- 10. Performance Indexes for Orders and Inventory
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_stock_decremented ON public.orders(stock_decremented);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_product ON public.inventory_transactions(product_id);
