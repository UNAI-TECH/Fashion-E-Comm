-- ============================================================================
-- Migration: Add 'Razorpay' and 'Online' to orders_payment_method_check constraint
-- Run this in your Supabase SQL Editor if you want 'Razorpay' stored directly in DB
-- ============================================================================

DO $$ 
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('COD', 'Card', 'UPI', 'Net Banking', 'Cash on Delivery', 'Google Pay', 'Razorpay', 'Online'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
