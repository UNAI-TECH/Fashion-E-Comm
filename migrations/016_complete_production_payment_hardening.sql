-- ============================================================================
-- Migration 016: Complete Production Payment & Order Synchronization Hardening
-- Aanya Fashions — Safe, idempotent, idempotent constraints & fulfillment RPC
-- ============================================================================

-- 1. Ensure all payment columns exist on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_decremented BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_result JSONB;

-- 2. Relax orders check constraints to accept all production frontend/backend values
DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('Pending', 'Completed', 'Success', 'Paid', 'Failed', 'Refunded', 'Pending Verification'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('COD', 'Card', 'UPI', 'Net Banking', 'Cash on Delivery', 'Google Pay', 'Razorpay', 'Online', 'Online Payment (Razorpay)'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('Pending', 'Order Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Ensure public.webhook_events idempotency table exists
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'razorpay',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Service role full access on webhook_events'
  ) THEN
    CREATE POLICY "Service role full access on webhook_events"
      ON public.webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Ensure payments audit table exists
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT DEFAULT 'Razorpay',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    gateway_txn_id TEXT,
    payment_id TEXT,
    payer_vpa TEXT,
    status TEXT NOT NULL DEFAULT 'Initiated',
    gateway_response JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Service role full access on payments'
  ) THEN
    CREATE POLICY "Service role full access on payments"
      ON public.payments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Authenticated users can view their own payments'
  ) THEN
    CREATE POLICY "Authenticated users can view their own payments"
      ON public.payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Stored Procedure fulfill_order_stock (Both Overloads)
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
  v_prod RECORD;
  v_decremented_count INT := 0;
BEGIN
  -- 1. Fetch order
  SELECT id, stock_decremented, payment_status, status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order not found: ' || p_order_id);
  END IF;

  IF v_order.stock_decremented = TRUE THEN
    RETURN jsonb_build_object('success', true, 'message', 'Stock already decremented', 'order_id', p_order_id, 'count', 0);
  END IF;

  -- 2. Deduct stock from order_items if available
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(0, stock_quantity - COALESCE(v_item.quantity, 1)),
          updated_at = NOW()
      WHERE id = v_item.product_id;
      v_decremented_count := v_decremented_count + 1;
    END IF;
  END LOOP;

  -- 3. Mark stock as decremented
  UPDATE public.orders
  SET stock_decremented = TRUE,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Stock fulfillment complete',
    'order_id', p_order_id,
    'items_decremented', v_decremented_count
  );
END;
$$;

-- Single parameter overload: fulfill_order_stock(p_order_id TEXT)
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

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if ever needed):
-- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
-- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
-- DROP FUNCTION IF EXISTS public.fulfill_order_stock(TEXT);
-- DROP FUNCTION IF EXISTS public.fulfill_order_stock(TEXT, JSONB);
-- ============================================================================

