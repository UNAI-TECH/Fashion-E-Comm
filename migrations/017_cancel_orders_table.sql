-- Relax orders status check constraint to include 'Cancellation Requested'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status = ANY (ARRAY[
    'Pending'::text,
    'Order Placed'::text,
    'Confirmed'::text,
    'Processing'::text,
    'Packed'::text,
    'Shipped'::text,
    'Delivered'::text,
    'Cancelled'::text,
    'Refunded'::text,
    'Cancellation Requested'::text
  ])
);

-- Create cancel_orders table
CREATE TABLE IF NOT EXISTS public.cancel_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  user_id uuid,
  product_id uuid,
  product_name text,
  product_image text,
  quantity integer DEFAULT 1,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_status text,
  customer_name text,
  customer_phone text,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reason text DEFAULT 'Customer requested cancellation',
  refund_status text DEFAULT '5-7 working days',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and policies
ALTER TABLE public.cancel_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert cancel_orders" ON public.cancel_orders;
CREATE POLICY "Anyone can insert cancel_orders" ON public.cancel_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can select cancel_orders" ON public.cancel_orders;
CREATE POLICY "Anyone can select cancel_orders" ON public.cancel_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update cancel_orders" ON public.cancel_orders;
CREATE POLICY "Anyone can update cancel_orders" ON public.cancel_orders FOR UPDATE USING (true);

